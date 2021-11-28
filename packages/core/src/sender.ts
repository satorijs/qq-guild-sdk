import { User } from './user'

export interface Message {
  id: string
  author: User
  content: string
  guildId: string
  channelId: string
  timestamp: Date
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
export type Sender<Type extends Sender.TargetType | undefined = undefined> = SenderDefault<Type> & Type extends undefined
  ? {
    [K in Sender.TargetType]: SenderDefault<K>
  } : {}

export namespace Sender {
  export type TargetType = 'private' | 'channel'
  export type Target<T = undefined> = T extends undefined
    ? ({ id: string } | { ids: string[] }) & { type: TargetType }
    : string
}
