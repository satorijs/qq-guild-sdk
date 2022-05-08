# Bot namespace

## `Bot`

该类继承 Api 所以部分方法可以参考 [Api](#api) 的方法。

### 属性

* `send`
  * 描述：该对象代理了发送消息的方法，可以通过该对象发送消息。
  * 类型: [`Sender`](#sender)
* `options`
  * 描述：机器人的配置信息
  * 类型: [`Bot.Options`](#bot-options)

### 方法

* `constructor`
  * 参数:
    * `options`
      * 类型: [`Bot.Options`](#bot-options)
    * `logger`
      * 类型: [`Bot.Logger`](#bot-logger)
      * 默认值: `console`
  * 返回值: [`Bot`](#bot)

* `startClient`

  返回一个 Promise 对象，当 hello 心跳包被接收到时 resolve 。

  * 参数:
    * `intents`
      * 类型: [`Bot.Intents | number`](#bot-intents)
  * 返回值: `Promise<void>`

## `Bot.Logger`

* 类型: `Pick<Console, 'log' | 'debug' | 'warn' | 'error'>`

## `Bot.Options`

* app
  * 类型: [`AppConfig`](#app-config)
* sandbox
  * 描述: 是否开启沙箱模式
  * 类型: `boolean`
* endpoint
  * 描述: api 接口地址
  * 类型: `string`
  * 默认值: `'https://api.sgroup.qq.com/'`
* authType
  * 描述: 验证方式，目前还不支持 bearer 验证方式。
  * 类型: `'bot' | 'bearer'`
  * 默认值: `'bot'`
* retryTimes
  * 描述: 重连次数
  * 类型: `number`
  * 默认值: `3`
* retryInterval
  * 描述: 重连时间间隔，单位 ms
  * 类型: `number`
  * 默认值: `3000`

## `Bot.AppConfig`

* id
  * 描述: 机器人 id
  * 类型: `string`
* key
  * 描述: 机器人 key ，在管理后台又叫 secret
  * 类型: `string`
* token
  * 描述: 机器人 token
  * 类型: `string`

## `Bot.Intents`

枚举类型，用于指定机器人的订阅的事件，使用 `|` 连接用来订阅多种事件。

|   意图类型   |       描述       | 补充 |
|:--------:|:--------------:|------|
| `GUILDS` |      频道事件      |      |
| `GUILD_MEMBERS` |     频道成员事件     |      |
| `GUILD_MESSAGES` |      频道消息事件      |   仅 *私域* 机器人能够设置此 intents。   |
| `GUILD_MESSAGE_REACTIONS` |      频道表情表态事件      |      |
| `DIRECT_MESSAGES` |      私聊消息事件      |      |
| `INTERACTIONS` |      互动事件      |      |
| `MESSAGE_AUDIT` |      消息审核事件      |      |
| `FORUM_EVENT` |      论坛事件      |   仅 *私域* 机器人能够设置此 intents。   |
| `AUDIO_ACTION` |      音频事件      |      |
| `PUBLIC_GUILD_MESSAGES` |     消息事件，此为公域的消息事件     |      |
