import { client as WebSocketClient, connection } from 'websocket'
import { createSender, Message, Sender } from './sender'
import { camelCaseObjKeys, snakeCaseObjKeys } from './utils'
import { User } from './common'
import { Events } from './events'
import { Api, attachApi } from './api'

function genToken(type: Bot.Options['authType'], app: Bot.AppConfig) {
  switch (type) {
    case 'bot':
      return `Bot ${ app.id }.${ app.token }`
    case 'bearer':
      // return `Bearer ${ }`
      throw new Error('Unsupported auth type')
    default:
      throw new Error('Unknown auth type')
  }
}

export class Bot extends Api {
  private client = new WebSocketClient()
  private connection: connection | null = null
  private events = new Events()

  send: Sender
  options: Required<Bot.Options>
  _retryTimes?: number
  _seq: number | null = null
  _interval: NodeJS.Timeout | null = null

  on = this.events.on.bind(this.events)
  emit = this.events.emit.bind(this.events)

  constructor(options: Bot.Options, private logger: Bot.Logger = console) {
    const mergedOpts = Object.assign({
      endpoint: 'https://api.sgroup.qq.com/',
      authType: 'bot',
      retryTimes: 3,
      retryInterval: 3000
    }, options)
    super(mergedOpts.endpoint, genToken(mergedOpts.authType, mergedOpts.app), mergedOpts.sandbox)
    this.logger = logger
    this.options = mergedOpts
    this.send = createSender(this.$request)

    return attachApi(this)
  }

  private initConnection = (
    connection: connection, intents: Bot.Intents | number
  ) => new Promise<void>((resolve, reject) => {
    this.connection = connection
    let sessionId = ''
    this.connection.on('message', message => {
      if (message.type === 'utf8') {
        const payload = camelCaseObjKeys<Bot.Payload>(JSON.parse(message.utf8Data))
        switch (payload.op) {
          case Bot.Opcode.HELLO:
            const p: Bot.Payload = {
              op: Bot.Opcode.IDENTIFY,
              d: {
                token: this.token, intents: 0 | intents
              }
            }
            connection.send(JSON.stringify(p))
            this._interval = setInterval(() => {
              connection.send(JSON.stringify({ op: Bot.Opcode.HEARTBEAT, d: this._seq }))
            }, payload.d.heartbeatInterval)
            this._retryTimes = 0
            resolve()
            break
          case Bot.Opcode.DISPATCH:
            this._seq = payload.s
            switch (payload.t) {
              case 'READY':
                sessionId = payload.d.sessionId
                this.emit('ready')
                break
              case 'MESSAGE_CREATE':
              case 'AT_MESSAGE_CREATE':
                this.emit('message', payload.d)
                break
            }
            break
          case Bot.Opcode.HEARTBEAT_ACK: break
        }
      }
    })
    this.connection.on('error', reject)
    this.connection.on('close', (code: number, desc: string) => {
      this.logger.debug(`[DISCONNECT] ${ code }: ${ desc }`)
      try {
        if (this._retryTimes === undefined)
          throw new Error(`Connection closed with code ${code}: ${desc}`)

        const p = {
          op: Bot.Opcode.RESUME,
          d: {
            sessionId, seq: this._seq,
            token: this.token
          }
        }
        if (this._retryTimes > this.options.retryTimes)
          throw new Error(`Connection closed with code ${code}: ${desc}`)
        setTimeout(() => {
          connection.send(JSON.stringify(snakeCaseObjKeys(p)))
          if (this._retryTimes)
            this._retryTimes++
          else
            this._retryTimes = 1
        }, this.options.retryInterval)
      } catch (e) {
        if (e instanceof Error)
          this.emit('error', e)
        else
          throw e
      }
    })
  })

  async startClient(intents: Bot.Intents | number): Promise<void> {
    const { url } = await this.$request.get<{ url: string }>('/gateway')
    this.client.connect(url)
    return new Promise((resolve, reject) => {
      this.client.on('connect', conn => {
        this.initConnection(conn, intents).then(resolve).catch(reject)
      })
      this.client.on('connectFailed', reject)
    })
  }

  stopClient() {
    this.client.removeAllListeners('connect')
    this._seq = null
    this._interval = null
    this.connection?.close()
    this.connection = null
  }
}

export namespace Bot {
  export type Logger = Pick<Console, 'log' | 'debug' | 'warn' | 'error'>

  export interface AppConfig {
    id: string
    key: string
    token: string
  }

  export interface Options {
    app: AppConfig
    /** 是否开启沙箱模式 */
    sandbox: boolean
    endpoint?: string
    /** 目前还不支持 bearer 验证方式。 */
    authType?: 'bot' | 'bearer'
    /** 重连次数 */
    retryTimes?: number
    /** 重连时间间隔，单位 ms */
    retryInterval?: number
  }

  export enum Intents {
    GUILDS = 1 << 0,
    GUILD_MEMBERS = 1 << 1,
    MESSAGE = 1 << 9,
    DIRECT_MESSAGES = 1 << 12,
    AUDIO_ACTION = 1 << 29,
    AT_MESSAGE = 1 << 30
  }

  export enum Opcode {
    /** 服务端进行消息推送 */
    DISPATCH = 0,
    /** 客户端或服务端发送心跳 */
    HEARTBEAT = 1,
    /** 客户端发送鉴权 */
    IDENTIFY = 2,
    /** 客户端恢复连接 */
    RESUME = 6,
    /** 服务端通知客户端重新连接 */
    RECONNECT = 7,
    /** 当identify或resume的时候，如果参数有错，服务端会返回该消息 */
    INVALID_SESSION = 9,
    /** 当客户端与网关建立ws连接之后，网关下发的第一条消息 */
    HELLO = 10,
    /** 当发送心跳成功之后，就会收到该消息 */
    HEARTBEAT_ACK = 11
  }

  type DispatchPayload = {
    op: Opcode.DISPATCH
    s: number
    t: 'READY'
    d: {
      version: number
      sessionId: string
      user: User
      shard: [number, number]
    }
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'RESUME'
    d: string
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'MESSAGE_CREATE' | 'AT_MESSAGE_CREATE'
    d: Message
  }

  export type Payload = DispatchPayload | {
    op: Opcode.HELLO
    d: {
      heartbeatInterval: number
    }
  } | {
    op: Opcode.IDENTIFY
    d: {
      /** 是创建机器人的时候分配的，格式为Bot {appid}.{app_token} */
      token: string
      /** 是此次连接所需要接收的事件，具体可参考 [Intents](https://bot.q.qq.com/wiki/develop/api/gateway/intents.html) */
      intents: Intents | number
      /**
       * 该参数是用来进行水平分片的。该参数是个拥有两个元素的数组。
       * 例如：[0, 4]，代表分为四个片，当前链接是第 0 个片，业务稍后应该继续建立 shard 为[1, 4],[2, 4],[3, 4]的链接，才能完整接收事件。
       * 更多详细的内容可以参考 [Shard](https://bot.q.qq.com/wiki/develop/api/gateway/shard.html)。
       */
      shard?: [number, number]
      /** 目前无实际作用 */
      properties?: {
      }
    }
  } | {
    op: Opcode.HEARTBEAT
    /** 为客户端收到的最新的消息的 `s`，如果是第一次连接，传 `null`。 */
    d: number
  } | {
    op: Opcode.HEARTBEAT_ACK
  } | {
    op: Opcode.RESUME
    d: {
      token: string
      sessionId: string
      seq: number
    }
  }
}
