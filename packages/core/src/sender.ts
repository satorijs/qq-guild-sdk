import { Member, User } from './common'
import { isArray, isString } from './utils'
import { InnerAxiosInstance } from './api'

export interface Message {
  /** 消息 id */
  id: string
  /** 消息创建者 */
  author: User
  /** 消息内容 */
  content?: string
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
  /** 消息创建者的 member 信息 */
  member: Member
  /** ark消息 */
  ark?: Message.Ark
  /** 子频道消息 seq，用于消息间的排序，seq 在同一子频道中按从先到后的顺序递增，不同的子频道之间消息无法排序 */
  seqInChannel?: string
  /** 引用消息对象 */
  messageReference?: Message.Reference
  /** 用于私信场景下识别真实的来源频道id */
  srcGuildId?: string
}

export namespace Message {
  export interface Ark {
    /** ark模板id（需要先申请） */
    templateId: number
    /** kv值列表 */
    kv: ArkKv[]
  }
  export interface ArkKv {
    key: string
    value?: string
    /** ark obj类型的列表 */
    obj?: ArkObj[]
  }
  export interface ArkObj {
    /** ark objkv列表 */
    objKv: ArkObjKv[]
  }
  export interface ArkObjKv {
    key: string
    value: string
  }
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
  export interface Markdown {
    /** markdown 模板 id */
    templateId?: number
    /** markdown 模板模板参数 */
    params?: MarkdownParams
    /** 原生 markdown 内容,与 template_id 和 params参数互斥,参数都传值将报错。 */
    content?: string
  }
  export interface MarkdownParams {
    /** markdown 模版 key */
    key: string
    /** markdown 模版 key 对应的 values ，列表长度大小为 1 代表单 value 值，长度大于1则为列表类型的参数 values 传参数 */
    values: string[]
  }
  export interface Reference {
    /** 需要引用回复的消息 id */
    messageId: string
    /** 是否忽略获取引用消息详情错误，默认否 */
    ignoreGetMessageError?: boolean
  }
  export interface Request {
    /** 选填，消息内容，文本内容，支持内嵌格式 */
    content?: string
    /** 选填，embed 消息，一种特殊的 ark*/
    embed?: Embed
    /** 选填，ark 消息 */
    ark?: Ark
    /** 选填，引用消息 */
    messageReference?: Reference
    /** 选填，图片url地址，平台会转存该图片，用于下发图片消息 */
    image?: string
    /** 选填，要回复的消息id(Message.id), 在 AT_CREATE_MESSAGE 事件中获取。 */
    msgId?: string
    /** 选填，要回复的事件id, 在各事件对象中获取。 */
    eventId?: string
    /** 选填，markdown 消息 */
    markdown?: Markdown
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

interface AbsSender<Type extends Sender.TargetType | undefined = undefined> {
  <T extends Sender.Target<Type> | Sender.Target<Type>[], R extends string | Message.Request>(
    target: T, req: R
  ): Promise<T extends Sender.Target<Type>[] ? Message.Response[] : Message.Response>
  reply: <T extends Sender.Target<Type>, R extends string | Message.Request>(
    msgId: string, target: T, req: R extends string ? R : Omit<R, 'msgId'>
  ) => Promise<Message.Response>
}

/**
 * @example 最简单的使用方式
 * ```ts
 * sender.channel('channelId', 'message')
 * sender.channel(['channelId0', 'channelId1'], 'message')
 * ```
 */
export interface Sender<Type extends Sender.TargetType | undefined = undefined> extends AbsSender<Type> {
  private: AbsSender<'private'>
  channel: AbsSender<'channel'>
}

type resolveTargetResult<T> = T extends string ? Sender.Target : T

export const resolveTarget = <
  T extends Sender.Target | string, Target extends T | T[]>(
  target: Target, type?: Sender.TargetType
): resolveTargetResult<typeof target> => {
  if (isArray(target))
    // @ts-ignore
    return target.map(resolveTarget)
  if (isString(target)) {
    if (!type)
      throw new Error('type is required')

    return <resolveTargetResult<Target>> {
      type, id: target
    }
  } else {
    if (target.ids && target.id)
      // @ts-ignore
      target.ids.push(target.id)

    if (!target.ids && !target.id)
      throw new Error('target.ids or target.id is required')
    return <resolveTargetResult<Target>> target
  }
}

const resolveRequest = (req: string | Message.Request) => {
  if (isString(req)) {
    return { content: req }
  } else {
    return req
  }
}

export const createSender = <Type extends Sender.TargetType | undefined = undefined>(
  axiosInstance: InnerAxiosInstance, type?: Type
): Sender => {
  const send = (target: Sender.Target, req: Message.Request) => {
    const pre = {
      channel: 'channels',
      private: 'dms'
    }[target.type]

    if (pre === undefined)
      throw new Error(`target.type ${ target.type } is not supported`)

    const sendT = (id: string) => axiosInstance.post<Message.Response>(`/${ pre }/${ id }/messages`, resolveRequest(req))

    if (target.ids) {
      return target.ids.map(sendT)
    } else {
      return sendT(target.id)
    }
  }
  const sender = ((target, req: Message.Request) => {
    const targets = resolveTarget(target, type)
    req = resolveRequest(req)
    if (Array.isArray(targets)) {
      const sendList: Promise<Message.Response>[] = []
      targets.forEach(t => {
        const p = send(t as Sender.Target, req)
        isArray(p)
          ? sendList.push(...p)
          : sendList.push(p)
      })
      return Promise.all(sendList)
    } else {
      return send(targets, req)
    }
  }) as AbsSender<Type>
  sender.reply = (msgId, t, req) => sender(t, { ...resolveRequest(req), msgId })
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
    ?
    | { type: TargetType; ids: string[]; id?: undefined }
    | { type: TargetType; ids?: undefined; id: string }
    : string
}
