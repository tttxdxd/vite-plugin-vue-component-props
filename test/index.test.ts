import { describe, expect, it } from 'vitest'

import type { ComponentPropsOptions } from '../src'
import plugin from '../src'

function createVitePlugin(options?: ComponentPropsOptions) {
  const { name, transform } = plugin(options)

  return { name, transform: transform as any }
}

describe('plugin test', () => {
  it('plugin name', () => {
    const { name } = createVitePlugin()

    expect(name).toEqual('vite:component-props-support')
  })

  it('not a vue file.', async () => {
    const { transform } = createVitePlugin()
    const ret = await transform('code', 'index.html')

    expect(ret).toBe(null)
  })

  it('disable', async () => {
    const { transform } = createVitePlugin({ enable: false })
    const ret = await transform('code', 'index.vue')

    expect(ret).toBe(null)
  })
})
