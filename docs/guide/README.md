# 指南

## 介绍

该 SDK 为 QQ 频道非官方 SDK，提供了一个简单的指南，以便您快速了解 SDK 的使用方法。
使用 TypeScript 编写，monorepo 架构。

### 特点

* 使用 TypeScript 开发，支持类型检查和自动提示。
* 使用 cli 快速构建项目，支持自定义配置。
* 使用 Proxy 支持了一套 RESTFUL 风格的 api 调用方式，使官方 api 调用方面快捷，能很轻松的自定义扩展自己需要的接口。

## 快速上手

下面将指导如何快速上手，并且提供一些常用的接口。

### 安装

* 使用 cli
```shell
yarn create qq-guild-bot 你的机器人名字
```
* 自主安装
```shell
mkdir 你的机器人名字
cd 你的机器人名字
yarn
yarn install qq-guild-sdk
```

### 编写你的第一段代码

使用 cli 的话这部分代码已经生成，这部分用户可直接阅读下方文档。

* `src/index.js`
```js
import { createBot } from 'qq-guild-sdk'

// 创建一个 bot
const bot = createBot({
  app: {
    // 集成了 dotenv 模块，可以自动读取环境变量
    id: process.env.id,
    key: process.env.key,
    token: process.env.token
  }
})
```

### 启动 wss 监听频道信息

* `src/index.js` 在上一步的后面添加
```js
async function main() {
  // 启动 wss 连接服务，并设置本次连接权限
  await bot.startClient(Bot.Intents.AT_MESSAGE | Bot.Intents.GUILDS)
  bot.on('ready', () => {
    console.log('Bot is ready.')
  })
  bot.on('message', async msg => {
    console.log('received message:', msg.content)
  })
}
// 捕获异常
main().catch(err => {
  console.error(err)
  process.exit(1)
})
```

### 接收并回复指定消息

`ping` `pong`

* `src/index.js`
```js
async function main() {
  // 启动 wss 连接服务，并设置本次连接权限
  await bot.startClient(Bot.Intents.AT_MESSAGE | Bot.Intents.GUILDS)
  bot.on('ready', () => {
    console.log('Bot is ready.')
  })
  bot.on('message', async msg => {
    console.log('received message:', msg.content)
    if (msg.content === 'ping') {
      await bot.send.channel.reply(msg.id, msg.channelId, 'pong')
    }
  })
}
// 捕获异常
main().catch(err => {
  console.error(err)
  process.exit(1)
})
```

### 常见问题

* Q: 如何创建官方机器人?
* A: 使用该 [官方网站](https://bot.q.qq.com/open/#/type?appType=2) 注册。
* Q: 如何登陆管理后台?
* A: [QQ 频道机器人管理后台登陆](https://bot.q.qq.com/open/#/botlogin)
* Q: 如何获取机器人基本数据 [id, token, key]?
* A: [QQ 频道机器人开发设置](https://bot.q.qq.com/#/developer/developer-setting)
* Q: 如何申请测试频道?
* A: [申请测试频道问卷](https://docs.qq.com/form/page/DZVF3RFJnTGF0Y3Nk?_w_tencentdocx_form=1)
* Q: 如何申请测试(私域)频道不校验语料?
* A: [私域频道问卷](https://wj.qq.com/s2/9379748/ed13/)
