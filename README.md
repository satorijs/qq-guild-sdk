# QQ Guild Sdk

## how to use?

```js
import { createBot } from 'qq-guild-sdk'

const bot = createBot({
  app: {
    id: '你在平台注册的机器人 appid',
    key: '你在平台注册的机器人 appkey',
    token: '你在平台注册的机器人 token',
  }
})

// 监听服务端的消息
bot.on('message', message => {
  console.log(message)
})

// 发送频道消息
bot.send.channel('目标频道 id', 'hello qq guild.')
```
