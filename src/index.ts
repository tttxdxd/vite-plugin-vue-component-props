import type { Plugin } from 'vite'
import { supportScripProps } from './lib'

export interface ComponentPropsOptions {
  /**
   * Turn on name extension
   * @default true
   */
  enable?: boolean
}

export default (options: ComponentPropsOptions = {}): Plugin => {
  const { enable = true } = options

  return {
    name: 'vite:component-props-support',
    enforce: 'pre',
    async transform(code: string, id: string) {
      if (!enable)
        return null
      if (!(/\.vue$/.test(id)))
        return null

      return supportScripProps(code, id) as any
    },
  }
}
