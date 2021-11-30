import { client as WebSocketClient } from 'websocket'
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Message, Sender } from './sender'
import { camelCaseObjKeys, snakeCaseObjKeys } from './utils'
import { Guild, User } from './common'
import { Events } from './events'

export interface Bot {
  send: Sender
}

type TwoParamsMethod = 'get' | 'delete' | 'head' | 'options'
type ThreeParamsMethod = 'post' | 'put' | 'patch'
interface TwoParamsRequest {
  <T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>
}
interface ThreeParamsRequest {
  <T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>
}
type InnerAxiosInstance = Omit<AxiosInstance, 'request' | TwoParamsMethod | ThreeParamsMethod> & {
  request<T = any, D = any>(config: AxiosRequestConfig<D>): Promise<T>
} & {
  [K in TwoParamsMethod]: TwoParamsRequest
} & {
  [K in ThreeParamsMethod]: ThreeParamsRequest
}

export class Bot {
  public $request: InnerAxiosInstance
  private readonly host: string
  private readonly token: string
  private client = new WebSocketClient()
  private events = new Events()

  on = this.events.on.bind(this.events)
  emit = this.events.emit.bind(this.events)

  constructor(
    private options: Bot.Options
  ) {
    this.options = options
    this.host = options.host || 'https://api.sgroup.qq.com/'
    if (options.env === 'sandbox')
      this.host = this.host.replace(/^(https?:\/\/)/, '$1sandbox.')
    this.token = `Bot ${ this.options.app.id }.${ this.options.app.token }`

    this.$request = this.getRequest() as InnerAxiosInstance
  }

  private getRequest() {
    const a = axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token
      }
    })
    a.interceptors.request.use(
      (config: AxiosRequestConfig) => config,
      (error: any) => Promise.reject(error)
    )
    a.interceptors.response.use((response: AxiosResponse) => {
      return camelCaseObjKeys(response.data)
    }, async (error: AxiosError<{}>) => {
      const response = error?.response
      switch (response?.status) {
        case 401:
        case 403:
          break
      }
      throw error
    })
    return a
  }

  get guilds() {
    return this.$request.get<Guild[]>('/users/@me/guilds')
  }

  guild(id: string) {
    return this.$request.get<Guild>(`/guilds/${ id }`)
  }

  async startClient(intents: Bot.Intents | number): Promise<void> {
    const { url } = await this.$request.get<{ url: string }>('/gateway')
    this.client.connect(url)
    return new Promise((resolve, reject) => {
      this.client.on('connect', connection => {
        let sessionId = '', seq: number | null = null
        connection.on('message', message => {
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
                setInterval(() => connection.send(JSON.stringify({ op: Bot.Opcode.HEARTBEAT, d: seq })), payload.d.heartbeatInterval)
                resolve()
                break
              case Bot.Opcode.DISPATCH:
                seq = payload.s
                switch (payload.t) {
                  case 'READY':
                    sessionId = payload.d.sessionId
                    this.emit('ready')
                    break
                  case 'AT_MESSAGE_CREATE':
                    this.emit('message', payload.d)
                    break
                }
                break
              case Bot.Opcode.HEARTBEAT_ACK: break
            }
          }
        })
        connection.on('error', error => {
          console.error(error)
          reject(error)
        })
        connection.on('close', (code: number, desc: string) => {
          console.warn(code, desc)
          const p = {
            op: Bot.Opcode.RESUME,
            d: {
              sessionId, seq,
              token: this.token
            }
          }
          connection.send(JSON.stringify(snakeCaseObjKeys(p)))
        })
      })
      this.client.on('connectFailed', error => {
        reject(error)
      })
    })
  }

  async stopClient() {
  }
}

export namespace Bot {
  export interface AppConfig {
    id: string
    key: string
    token: string
  }

  export interface Options {
    app: AppConfig
    /** 目前还不支持 sandbox 环境，请勿使用。 */
    env?: 'production' | 'sandbox'
    host?: string
    /** 目前还不支持 bearer 验证方式。 */
    authType?: 'bot' | 'bearer'
  }

  export enum Intents {
    GUILDS = 1 << 0,
    GUILD_MEMBERS = 1 << 1,
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
    t: 'AT_MESSAGE_CREATE'
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
