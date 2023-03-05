import WebSocket from 'ws'
import { createSender, Message, Sender } from './sender'
import { camelCaseObjKeys, snakeCaseObjKeys } from './utils'
import { Channel, Guild, MemberWithGuild, MessageReaction, User } from './common'
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

function getOpt(k: string): 'add' | 'upd' | 'del' {
  const end = k.split('_').slice(-1)[0]
  return (<Record<string, 'add' | 'upd' | 'del'>> {
    'ADD': 'add',
    'CREATE': 'add',
    'UPDATE': 'upd',
    'DELETE': 'del'
  })[end]
}

interface Future<T> extends Promise<T> {
  res: (value: T) => void
  rej: (reason: any) => void
}

const future = <T>(): Future<T> => {
  let res: (value: T) => void
  let rej: (reason: any) => void
  return Object.assign(new Promise<T>((resolve, reject) => {
    res = resolve
    rej = reject
  // @ts-ignore
  }), { res, rej })
}

export class Bot extends Api {
  private client: WebSocket | null = null
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

  private reconnectFuture: Future<void> | null = null

  private initConnection = (
    connection: WebSocket, intents: Bot.Intents | number
  ) => new Promise<void>((resolve, reject) => {
    this.client = connection
    let sessionId = ''
    this.client.on('message', (message, isBinary) => {
      if (isBinary)
        return

      const payload = camelCaseObjKeys<Bot.Payload>(JSON.parse(message.toString()))
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
        case Bot.Opcode.RECONNECT:
          this.reconnectFuture?.res?.()
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
            case 'DIRECT_MESSAGE_CREATE':
              payload.d.timestamp = new Date(payload.d.timestamp)
              payload.d.editedTimestamp = new Date(payload.d.editedTimestamp)
              payload.d.member.joinedAt = new Date(payload.d.member.joinedAt)
              payload.d.isPrivate = true
              this.emit('message', payload.d)
              break
            case 'MESSAGE_REACTION_ADD':
              this.emit('reaction:add', payload.d)
              break
            case 'MESSAGE_REACTION_REMOVE':
              this.emit('reaction:del', payload.d)
              break
            case 'GUILD_CREATE':
            case 'GUILD_UPDATE':
            case 'GUILD_DELETE':
              payload.d.joinedAt = new Date(payload.d?.joinedAt ?? '')
              this.emit(`guild:${ getOpt(payload.t) }`, payload.d)
              break
            case 'CHANNEL_CREATE':
            case 'CHANNEL_UPDATE':
            case 'CHANNEL_DELETE':
              this.emit(`channel:${ getOpt(payload.t) }`, payload.d)
              break
            case 'GUILD_MEMBER_ADD':
            case 'GUILD_MEMBER_UPDATE':
            case 'GUILD_MEMBER_DELETE':
              payload.d.joinedAt = new Date(payload.d?.joinedAt ?? '')
              this.emit(`guild-member:${ getOpt(payload.t) }`, payload.d)
              break
          }
          break
        case Bot.Opcode.HEARTBEAT_ACK: break
      }
    })
    this.client.on('error', reject)
    this.client.on('close', (code: number, desc: string) => {
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
    return new Promise<void>(async (resolve, reject) => {
      try {
        this.client = new WebSocket(url)
        this.client.on('open', () => {
          this.initConnection(this.client!, intents)
            .then(resolve)
            .catch(reject)
        })
        this.client.on('connectFailed', reject)
        await (this.reconnectFuture = future())
        this.client?.close()
        this.client = null
        this.reconnectFuture = null
        await this.startClient(intents)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  stopClient() {
    if (!this.client)
      return

    this.client.removeAllListeners('connect')
    this._seq = null
    this._interval = null
    this.client?.close()
    this.client = null
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
    /**
     * 频道事件
     * - GUILD_CREATE   当机器人加入新guild时
     * - GUILD_UPDATE   当guild资料发生变更时
     * - GUILD_DELETE   当机器人退出guild时
     * - CHANNEL_CREATE 当channel被创建时
     * - CHANNEL_UPDATE 当channel被更新时
     * - CHANNEL_DELETE 当channel被删除时
     */
    GUILDS = 1 << 0,
    /**
     * 频道成员事件
     * - GUILD_MEMBER_ADD    当成员加入时
     * - GUILD_MEMBER_UPDATE 当成员资料变更时
     * - GUILD_MEMBER_REMOVE 当成员被移除时
     */
    GUILD_MEMBERS = 1 << 1,
    /**
     * 消息事件，仅 *私域* 机器人能够设置此 intents。
     * - MESSAGE_CREATE 发送消息事件，代表频道内的全部消息，而不只是 at 机器人的消息。内容与 AT_MESSAGE_CREATE 相同
     * - MESSAGE_DELETE 删除（撤回）消息事件
     */
    GUILD_MESSAGES = 1 << 9,
    /**
     * 频道表情表态事件
     * - MESSAGE_REACTION_ADD    为消息添加表情表态
     * - MESSAGE_REACTION_REMOVE 为消息删除表情表态
     */
    GUILD_MESSAGE_REACTIONS = 1 << 10,
    /**
     * 监听私聊消息事件
     * - DIRECT_MESSAGE_CREATE 当收到用户发给机器人的私信消息时
     * - DIRECT_MESSAGE_DELETE 删除（撤回）消息事件
     */
    DIRECT_MESSAGES = 1 << 12,
    /**
     * - INTERACTION_CREATE 互动事件创建时
     */
    INTERACTIONS = 1 << 26,
    /**
     * - MESSAGE_AUDIT_PASS   消息审核通过
     * - MESSAGE_AUDIT_REJECT 消息审核不通过
     */
    MESSAGE_AUDIT = 1 << 27,
    /**
     * 论坛事件，仅 *私域* 机器人能够设置此 intents。
     * - FORUM_THREAD_CREATE        当用户创建主题时
     * - FORUM_THREAD_UPDATE        当用户更新主题时
     * - FORUM_THREAD_DELETE        当用户删除主题时
     * - FORUM_POST_CREATE          当用户创建帖子时
     * - FORUM_POST_DELETE          当用户删除帖子时
     * - FORUM_REPLY_CREATE         当用户回复评论时
     * - FORUM_REPLY_DELETE         当用户回复评论时
     * - FORUM_PUBLISH_AUDIT_RESULT 当用户发表审核通过时
     */
    FORUM_EVENT = 1 << 28,
    /**
     * 音频相关事件
     * - AUDIO_START   音频开始播放时
     * - AUDIO_FINISH  音频播放结束时
     * - AUDIO_ON_MIC  上麦时
     * - AUDIO_OFF_MIC 下麦时
     */
    AUDIO_ACTION = 1 << 29,
    /**
     * 消息事件，此为公域的消息事件
     * - AT_MESSAGE_CREATE     当收到@机器人的消息时
     * - PUBLIC_MESSAGE_DELETE 当频道的消息被删除时
     */
    PUBLIC_GUILD_MESSAGES = 1 << 30
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
    t: 'MESSAGE_CREATE' | 'AT_MESSAGE_CREATE' | 'DIRECT_MESSAGE_CREATE'
    d: Message
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'MESSAGE_REACTION_ADD' | 'MESSAGE_REACTION_REMOVE'
    d: MessageReaction
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'GUILD_CREATE' | 'GUILD_UPDATE' | 'GUILD_DELETE'
    d: Guild
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'CHANNEL_CREATE' | 'CHANNEL_UPDATE' | 'CHANNEL_DELETE'
    d: Channel
  } | {
    op: Opcode.DISPATCH
    s: number
    t: 'GUILD_MEMBER_ADD' | 'GUILD_MEMBER_UPDATE' | 'GUILD_MEMBER_DELETE'
    d: MemberWithGuild
  }

  export type Payload = DispatchPayload | {
    op: Opcode.HELLO
    d: {
      heartbeatInterval: number
    }
  } | {
    op: Opcode.RECONNECT
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
