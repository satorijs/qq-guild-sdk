import { defineUserConfig } from 'vuepress-vite'
import type { DefaultThemeOptions, ViteBundlerOptions } from 'vuepress-vite'
import { resolve } from 'path'

export default defineUserConfig<DefaultThemeOptions, ViteBundlerOptions>({
  base: '/qq-guild-sdk/',
  lang: 'zh-CN',
  theme: resolve(__dirname, 'theme'),
  title: 'QQ Guild Sdk',
  description: '这里是 QQ 频道的 SDK 文档。',
  themeConfig: {
    search: true,
    logo: '/qq-guild-sdk.png',
    navbar: [
      { text: '指南', link: '/guide' },
      { text: 'API', link: '/api' },
      { text: 'GitHub', link: 'https://github.com/NWYLZW/qq-guild-sdk' },
    ],
    docsRepo: 'nwylzw/qq-guild-sdk'
  },
  bundler: '@vuepress/vite'
})
