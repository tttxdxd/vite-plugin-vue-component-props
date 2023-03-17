import { dirname, resolve } from 'path'
import { readFile } from 'fs'
import MagicString from 'magic-string'

export async function supportScripProps(code: string, id: string) {
  const { setup, content, contentPos } = compileScript(code)

  if (!setup)
    return null
  if (!content)
    return null

  const props = await getSetupPropsFromScript(content, id, contentPos.start)

  if (!props)
    return null

  const str = new MagicString(code)

  str.remove(props.importPos.start, props.importPos.end)
  str.appendLeft(props.importPos.start, props.content!)

  return {
    map: str.generateMap(),
    code: str.toString(),
  }
}

async function getSetupPropsFromScript(code: string, id: string, start: number) {
  const regexProps = /defineProps<(.+)>/i
  const props = code.match(regexProps)?.[1]

  if (!props)
    return null

  const regexPath = new RegExp(`import +(type +)?(${props}|{ ?(.*?),? ?${props},? ?(.*?) ?}) +from +(["'])(.*?)["'].*?[\n|\r\n]`, 'i')
  const matchPath = code.match(regexPath)
  const importContent = matchPath?.[0]
  const path = matchPath?.[matchPath?.length - 1]

  if (!path)
    return null

  const anotherImport = matchPath?.length === 7 ? `${matchPath[0].replace(matchPath[2], `{ ${[matchPath[3], matchPath[4]].filter(v => v).join(', ')} }`)}\n` : ''
  const importPos = { start: code.indexOf(importContent!) + start, end: code.indexOf(importContent!) + importContent!.length + start }
  const filePath = resolve(dirname(id), `${path}.ts`)
  const fileStr = await new Promise<string>((resolve, reject) => readFile(filePath, { encoding: 'utf-8' }, (err, data) => {
    if (err)
      reject(err)
    else resolve(data)
  }))
  const regexContent = new RegExp(`export +interface +${props} +{([^{}]|{(?:[^{}]|{[^{}]*})*})*}.*?[\n|\r\n]`, 'is')
  const content = anotherImport + trimComment(fileStr.match(regexContent)![0])

  return {
    props,
    path: filePath,
    content,
    importPos,
  }
}

function compileScript(code: string) {
  const result = parseScript(code)

  if (!result)
    return { name: '', lang: '', setup: false, namePos: { start: 0, end: 0 }, scriptPos: { start: 0, end: 0 }, isEmpty: false }

  return {
    name: result.attrs.name,
    lang: result.attrs.lang,
    setup: !!result.attrs.setup,
    namePos: result.namePos,
    scriptPos: result.scriptPos,
    contentPos: result.contentPos,
    isEmpty: result.isEmpty,
    content: result.content,
  }
}

function parseScript(code: string) {
  const regex = /<script([^>]*)>/
  const startMatch = code.match(regex)

  if (!startMatch)
    return ''

  const startTag = startMatch[0]

  const startIndex = code.indexOf(startTag) + startTag.length
  const endIndex = code.indexOf('</script>', startIndex)
  const content = code.slice(startIndex, endIndex)
  const isEmpty = trimComment(content).trim().length === 0
  const contentPos = { start: startIndex, end: endIndex }
  const scriptPos = {
    start: startIndex - startTag.length,
    end: endIndex + '</script>'.length,
  }
  const { attrs, namePos } = parseTag(startMatch[1], scriptPos.start + 7)

  return {
    attrs,
    namePos,
    scriptPos,
    contentPos,
    content,
    isEmpty,
  }
}

function parseTag(tag: string, start = 0) {
  const attrs: Record<string, boolean | string> = {}
  const namePos = { start: 0, end: 0 }
  let key = ''
  let value: undefined | string

  function assign(i: number) {
    if (key === 'name') {
      if (typeof value === 'undefined')
        throw new SyntaxError('The name attribute must be assigned a value.')

      namePos.start = i - value.length - 5
      namePos.end = i

      while (tag[namePos.start - 1] === ' ')
        namePos.start -= 1
    }
    if (key)
      attrs[key] = typeof value === 'undefined' ? true : parseQuotes(value)

    key = ''
    value = undefined
  }

  for (let i = 0, len = tag.length; i < len; i++) {
    const char = tag[i]

    if (char === ' ') {
      assign(i)
      continue
    }
    else if (char === '=') {
      value = ''
      continue
    }

    if (typeof value === 'undefined')
      key += char
    else value += char
  }

  assign(tag.length)

  return {
    attrs,
    namePos: {
      start: namePos.start + start,
      end: namePos.end + start,
    },
  }
}

function parseQuotes(str: string): string {
  if (str.length <= 1)
    return str

  if (['\'', '\"'].includes(str[0]) && str[0] === str[str.length - 1])
    return str.slice(1, -1)

  return str
}

function trimComment(str: string) {
  if (typeof str !== 'string' || str.length === 0)
    return ''

  return str.replace(/\/\/.*/ig, '').replace(/\/\*\*.*?\*\//igs, '')
}
