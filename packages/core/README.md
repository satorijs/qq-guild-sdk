# QQ Guild SDK core

qq 频道 SDK 核心库，目前还在开发中，如有问题 issue 汇报。

## 安装

```shell
yarn add qq-guild-sdk@core
# or
npm install qq-guild-sdk@core
```

## 使用

```js
import { Bot } from 'qq-guild-sdk@core'
// or
const { Bot } = require('qq-guild-sdk@core/bot')

// 创建 bot
const bot = new Bot({
  app: {
    // 在机器人管理端的 app id
    id: '',
    // 在机器人管理端的 app secret
    key: '',
    // 在机器人管理端的 app token
    token: ''
  }
})

;(async () => {
  // api 请求
  // 获取当前机器人加入的频道列表
  const guilds = await bot.guilds
  console.log(guilds)
  // 启动 wss 连接服务，并设置本次连接权限
  await bot.startClient(Bot.Intents.AT_MESSAGE | Bot.Intents.GUILDS)
  bot.on('ready', () => {
    console.log('Bot is ready.')
  })
  bot.on('message', async (msg) => {
    console.log(msg)
  })
})()
```

## 特点

* 自适应扩展请求 api ，只需要扩展接口即可
```ts
declare module 'qq-guild-sdk@core' {
  interface Api {
    newApi(id: string): Promise<Entity>
  }
}
// 用户可随意扩展该接口
bot.newApi('123')
```
