import { User } from './common'
import { InnerAxiosInstance } from './bot'
import { isString } from './utils'

export interface Message {
  /** 消息 id */
  id: string
  /** 消息创建者 */
  author: User
  /** 消息内容 */
  content: string
  /** 频道 id */
  guildId: string
  /** 子频道 id */
  channelId: string
  /** 消息创建时间 */
  timestamp: Date
  /** 消息编辑时间 */
  editedTimestamp: Date
  /** 是否是@全员消息 */
  mentionEveryone: boolean
  // /** 附件 */
  // attachments: Attachment
  /** embed */
  embeds: Message.Embed[]
  /** 消息中@的人 */
  mentions?: User
  // /** 消息创建者的member信息 */
  // member: Member
  // /** ark消息 */
  // ark: Ark

}

export namespace Message {
  export interface EmbedField {
    /** 字段名 */
    name: string
    /** 字段值 */
    value: string
  }
  export interface Embed {
    /** 标题 */
    title: string
    /** 描述 */
    description: string
    /** 消息弹窗内容 */
    prompt:	string
    /** 消息创建时间 */
    timestamp: Date
    /** 对象数组	消息创建时间 */
    fields:	EmbedField
  }
  export interface Request {
    embed?: Embed
    image?: string
    msgId?: string
    content: string
  }
  export interface Response extends Message {
    tts: boolean
    type: number
    flags: number
    pinned: boolean
    embeds: Embed[]
    mentionEveryone: boolean
  }
}

interface SenderDefault<Type extends Sender.TargetType | undefined = undefined> {
  <T extends Sender.Target<Type> | Sender.Target<Type>[], R extends string | Message.Request>(
    target: T, req: R
  ): Promise<T extends Sender.Target<Type>[] ? Message.Response[] : Message.Response>
  reply: <T extends Sender.Target<Type>, R extends string | Message.Request>(
    target: T, msgId: string, req: R extends string ? R : Omit<R, 'msgId'>
  ) => Promise<Message.Response>
}

/**
 * @example 最简单的使用方式
 * ```ts
 * sender.channel('channelId', 'message')
 * sender.channel(['channelId0', 'channelId1'], 'message')
 * ```
 */
export interface Sender<Type extends Sender.TargetType | undefined = undefined> extends SenderDefault<Type> {
  private: SenderDefault<'private'>
  channel: SenderDefault<'channel'>
}

const resolveTarget = (target: Sender.Target | Sender.Target[], type?: Sender.TargetType) => {
  if (Array.isArray(target)) {
    target.forEach(item => resolveTarget(item, type))
  } else {
    if (target.ids && target.id)
      target.ids.push(target.id)

    if (!target.ids && !target.id)
      throw new Error('target.ids or target.id is required')
  }
}

const resolveRequest = (req: string | Message.Request) => {
  if (isString(req)) {
    return { content: req }
  } else {
    return req
  }
}

export const createSender = (axiosInstance: InnerAxiosInstance, type?: Sender.TargetType): Sender => {
  const send = (target: Sender.Target, req: Message.Request) => {
    switch (target.type) {
      case 'channel':
        if (target.ids) {
          return target.ids.map(id => axiosInstance.post<Message.Response>(`/channels/${ id }/messages`, req))
        } else {
          return axiosInstance.post<Message.Response>(`/channels/${ target.id }/messages`, req)
        }
      default:
        throw new Error(`target.type ${ target.type } is not supported`)
    }
  }
  const sender = ((target, req: Message.Request) => {
    resolveTarget(target, type)
    req = resolveRequest(req)
    if (Array.isArray(target)) {
      const sendList: Promise<Message.Response>[] = []
      target.forEach(t => {
        const p = send(t, req)
        Array.isArray(p) ? sendList.push(...p) : sendList.push(p)
      })
      return Promise.all(sendList)
    } else {
      return send(target, req)
    }
  }) as SenderDefault
  sender.reply = (t, msgId, req) => sender(t, { ...resolveRequest(req), msgId })
  return new Proxy(sender, {
    get (target, prop) {
      if (prop === 'reply') {
        return target[prop]
      } else {
        return createSender(axiosInstance, prop as Sender.TargetType)
      }
    }
  }) as any as Sender
}

export namespace Sender {
  export type TargetType = 'private' | 'channel'
  export type Target<T = undefined> = T extends undefined
    ? { type: TargetType; id?: string; ids?: string[] }
    : string
}
