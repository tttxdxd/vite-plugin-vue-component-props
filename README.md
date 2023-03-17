# vite-plugin-vue-component-props

[![NPM version](https://img.shields.io/npm/v/vite-plugin-vue-component-props?color=a1b858&label=)](https://www.npmjs.com/package/vite-plugin-vue-component-props)

## Features

- [x] Make the vue script syntax support the props type imports from other files

## Install

node version: >=12.0.0
vite version: >=2.0.0

```shell
pnpm i vite-plugin-vue-component-props -D
```

or

```shell
npm i vite-plugin-vue-component-props -D
```

or

```shell
yarn add vite-plugin-vue-component-props -D
```

## Usage

- Config plugin in vite.config.ts. In this way, the required functions can be introduced as needed

```ts
import { Plugin, defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueComponentProps from 'vite-plugin-vue-component-props'

export default defineConfig({
  plugins: [vue(), vueComponentProps()],
})
```

- SFC

```ts
export interface Props {
  world: string
}
```

```vue
<script lang="ts" setup name="App">
import type { Props } from './Props'

defineProps<Props>()
</script>

<template>
  <div>hello {{ world }}</div>
</template>
```

## License

[MIT](./LICENSE) License © 2023 [tttxdxd](https://github.com/tttxdxd)
