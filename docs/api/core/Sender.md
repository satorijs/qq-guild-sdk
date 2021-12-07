# Sender namespace

## `Sender`

Sender 类本质上不存在，使用的是 createSender 创建的一个 Proxy 对象，通过 Proxy 的语法糖使你的接口调用更加优雅。

该类继承 AbsSender 所以部分方法可以参考 [AbsSender](#abssender) 的方法。

### 属性

* ~~private~~
  * 描述: 官方目前还未支持，等待使用
  * 类型: `AbsSender<'private'>`
* channel
  * 描述: 发送频道消息，得先连接上 ws 服务器。
  * 类型: `AbsSender<'channel'>`

## `AbsSender`

也是由 createSender 创建的一个 Proxy 对象，不过是 abstract 的 Sender 。

### 类型

自身是一个函数，可以被直接调用来进行消息的发送。

* 参数
  * `target`
    * 描述: 发送目标，可以为数组
    * 类型: [`Sender.Target | Sender.Target[]`](#sender-target)
  * `req`
    * 描述: 发送数据，可以直接为字符串
    * 类型: [`string | Message.Request`](#message-request)
* 返回值
  * 描述: 当 target 为数组的时候返回数组
  * 类型: [`Message.Response | Message.Response[]`](#message-response)

下面是一些示例：
```ts
// 发送频道消息
await send({
  type: 'channel', id: '目标 id'
}, '需要发送的消息')
// 发送其他类型消息，比如回复一条消息
await send({
  type: 'channel', id: '目标 id'
}, {
  msgId: '回复消息 id',
  content: '回复消息内容'
})
```

### 方法

* reply
  * 参数
    * `msgId`
      * 描述: 回复消息 id
      * 类型: `string`
    * `target`
      * 描述: 发送目标，可以为数组
      * 类型: [`Sender.Target | Sender.Target[]`](#sender-target)
    * `req`
      * 描述: 发送数据，可以直接为字符串
      * 类型: [`string | Omit<Message.Request, 'msgId'>`](#message-request)
  * 返回值
    * 描述: 当 target 为数组的时候返回数组
    * 类型: [`Message.Response | Message.Response[]`](#message-response)
