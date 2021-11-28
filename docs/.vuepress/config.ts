import { defineUserConfig } from 'vuepress-vite'
import type { DefaultThemeOptions, ViteBundlerOptions } from 'vuepress-vite'

export default defineUserConfig<DefaultThemeOptions, ViteBundlerOptions>({
  lang: 'zh-CN',
  title: 'QQ Guild Sdk',
  description: '这里是 QQ 频道的 SDK 文档。',
  themeConfig: {
    navbar: [
      { text: '指南', link: '/guide' },
      { text: 'API', link: '/api' },
    ],
    docsRepo: 'nwylzw/qq-guild-sdk'
  },
  bundler: '@vuepress/vite',
  bundlerConfig: {
  }
})
