import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { camelCaseObjKeys, snakeCaseObjKeys, pluralize } from './utils'
import {
  Announce, APIPermission, APIPermissionDemand, APIPermissionDemandIdentify,
  Channel,
  ChannelPermissions,
  DeleteHistoryMsgDays, DMS,
  Guild,
  Member, MessageSetting,
  Mute, PinsMessage,
  Role,
  Schedule,
  User
} from './common'
import { Message } from './sender'

type TwoParamsMethod = 'get' | 'delete' | 'head' | 'options'
type ThreeParamsMethod = 'post' | 'put' | 'patch'
interface TwoParamsRequest {
  <T, D = any>(url: string, config?: AxiosRequestConfig<D>): Promise<T>
}
interface ThreeParamsRequest {
  <T, D = any>(url: string, data?: D, config?: AxiosRequestConfig<D>): Promise<T>
}
export type InnerAxiosInstance = Omit<AxiosInstance, 'request' | TwoParamsMethod | ThreeParamsMethod> & {
  request<T = any, D = any>(config: AxiosRequestConfig<D>): Promise<T>
} & {
  [K in TwoParamsMethod]: TwoParamsRequest
} & {
  [K in ThreeParamsMethod]: ThreeParamsRequest
}

export type D<T> = {
  info: T
  filter: { [K in keyof T]?: boolean }
}

/**
 * 该接口可以用来扩展 SDK 的调用请求，设计目的是为了更好的让你使用 OOP 的方式进行接口的调用。
 *
 * @example
 * 下面会介绍一下如何去请求一个接口
 * ```ts
 * // 将会请求 [get] /users/@me/guilds
 * await api.guilds
 * // 将会请求 [get] /guilds/{id}
 * await api.guild(id)
 * // 嵌套请求
 * // 将会请求 [get] /guilds/{id}/members
 * await api.guild(id).members
 * // 将会请求 [get] /guilds/{id}/members/{memberId}
 * await api.guild(id).member(memberId)
 * // 其他方法
 * // 将会请求 [post] `body: {data}` /guilds/{id}/roles
 * await api.guild(id).roles.add(data)
 * // 将会请求 [delete] /guilds/{id}/roles/{roleId}
 * await api.guild(id).role(roleId).del()
 * // 将会请求 [patch] `body: {data}` /guilds/{id}/roles/{roleId}
 * await api.guild(id).role(roleId).patch(data)
 * ```
 * 如果遇到了接口没有及时定义的情况，可以用下面的方法去扩展
 * ```ts
 * declare module '@qq-guild-sdk/core' {
 *   interface Api {
 *     get foos: Promise<Foo[]>
 *   }
 * }
 * ```
 */
export interface Api {
  /**
   * 获取用户频道列表
   */
  get guilds(): Promise<Guild[]>

  /**
   * 获取频道详情
   * @param id 指定的频道 ID
   */
  guild(id: string): Promise<Guild> & {
    get announces(): {
      /** 创建频道公告 */
      add(d: Pick<Announce, 'messageId'>): Promise<Announce>
    }
    announce(msgId: string): {
      /** 删除频道公告 */
      del(): Promise<void>
    }
    /** 获取频道可用权限列表 */
    get api_permission(): Promise<APIPermission[]> & {
      demand(): {
        add(d: { channelId: string, apiIdentify: APIPermissionDemandIdentify, desc: string }): Promise<APIPermissionDemand>
      }
    }
    /** 获取子频道列表 */
    get channels(): Promise<Channel[]> & {
      /** 创建子频道 */
      add(d: D<Pick<Channel, 'name' | 'type' | 'subType' | 'position' | 'parentId' | 'privateType' | 'speakPermission' | 'applicationId' >>): Promise<Channel>
    }
    /** 获取频道成员列表 */
    get members(): Promise<Member[]>
    /** 获取成员详情 */
    member(id: string): Promise<Member> & {
      get mute(): {
        upd(d: Mute): Promise<void>
      }
      role(id: string): Promise<Role> & {
        /**
         * 创建频道身份组成员
         * @description 用于将频道 `guildId` 下的用户 `userId` 添加到身份组 `roleId` 。
         * @param d 如果要删除的身份组 ID 是 5-子频道管理员，需要增加 channel 对象来指定具体是哪个子频道。
         */
        put(d: { channel: Partial<Pick<Channel, 'id'>>}): Promise<void>
        /**
         * 删除频道身份组成员
         * @description 用于将 用户 `userId` 从 频道 `guildId` 的 `roleId` 身份组中移除
         * @param d 如果要删除的身份组 ID 是5-子频道管理员，需要增加 channel 对象来指定具体是哪个子频道。
         */
        del(d: { channel: Partial<Pick<Channel, 'id'>>}): Promise<void>
      }
      get message(): {
        get setting(): Promise<MessageSetting>
      }
      /** 删除频道成员 */
      del(d: { addBlacklist: boolean, deleteHistoryMsgDays: DeleteHistoryMsgDays }): Promise<void>
    }
    get mute(): {
      /** 禁言批量成员 (不含 userIds 参数时禁言全员) */
      upd(d: Mute): Promise<void>
    }
    get roles(): Promise<{
      roles: Role[]
      guildId: string
      /** 默认分组上限 */
      roleNumLimit: number
    }> & {
      /** 创建频道身份组 */
      add(d: D<Pick<Role, 'name' | 'color' | 'hoist'>>): Promise<{roleId: string; role: Role}>
    }
    role(id: string): {
      /** 删除频道身份组 */
      del(): Promise<void>
      /** 修改频道身份组 */
      upd(d: D<Partial<Pick<Role, 'name' | 'color' | 'hoist'>>>): Promise<{
        role: Role
        roleId: string
        guildId: string
      }>
      /** 获取频道身份组成员列表 */
      get members(): Promise<Member[]>
    }
  }

  /**
   * 获取子频道详情
   * @param id 指定的子频道 ID
   */
  channel(id: string): Promise<Channel> & {
    get announces(): {
      /**
       * 创建子频道公告
       * @deprecated 2022年3月15日废弃该接口，请使用 添加精华消息
       */
      add(d: Pick<Announce, 'messageId'>): Promise<Announce>
    }
    announce(msgId: string): {
      /**
       * 删除子频道公告
       * @deprecated 2022年3月15日废弃该接口，请使用 删除精华消息
       */
      del(): Promise<void>
    }
    /** 子频道用户相关 */
    member(id: string): {
      /** 获取子频道用户权限 */
      get permissions(): Promise<ChannelPermissions> & {
        /** 修改子频道权限 */
        put(d: { add: string, remove: string }): Promise<void>
      }
    }
    get messages(): {
      /**
       * 发送消息
       * @description 需要控制发送参数的可以使用这个方法，普通消息可以使用 bot.send
       * @param d 消息发送参数
       */
      add(d: Message.Request): Promise<Message>
    }
    /** 获取指定消息 */
    message(id: string): Promise<Message> & {
      /** 撤回消息 */
      del(): Promise<void>
    }
    /** 获取精华消息 */
    get pins(): Promise<PinsMessage>
    pin(msgId: string): {
      /** 添加精华消息 */
      put(): Promise<PinsMessage>
      /** 删除精华消息 (删除子频道内全部精华消息，请将 messageId 设置为 all) */
      del(): Promise<void>
    }
    /** 获取子频道身份组相关 */
    role(id: string): {
      /** 获取子频道身份组权限 */
      get permissions(): Promise<ChannelPermissions> & {
        /** 修改子频道身份组权限 */
        put(d: { add: string, remove: string }): Promise<void>
      }
    }
    /** 获取频道日程列表 */
    schedules(d?: { since?: number }): Promise<Schedule[]> & {
      /** 创建日程 */
      add(d: Omit<Schedule, 'id'>): Promise<Schedule>
    }
    /** 获取日程详情 */
    schedule(id: string): Promise<Schedule> & {
      /** 修改日程 */
      upd(d: Omit<Schedule, 'id'>): Promise<Schedule>
      /** 删除日程 */
      del(): Promise<void>
    }
    /** 修改子频道 */
    upd(d: D<Partial<Pick<Channel, 'name' | 'position' | 'parentId' | 'privateType' | 'speakPermission' >>>): Promise<Channel>
    /** 删除子频道 */
    del(): Promise<void>
  }

  /**
   * 私信
   * @description 注意私信消息不支持沙盒
   * @param id {string} 创建私信会话时以及私信消息事件中获取的 guildId
   */
  dm(id: string): {
    get messages(): {
      /** 发送私信 */
      add(d: Message.Request): Promise<Message>
    }
    message(id: string): {
      /** 撤回私信 */
      del(): Promise<void>
    }
  }
}

export class Api {
  readonly host: string
  readonly token: string
  $request: InnerAxiosInstance

  constructor(host: string, token: string, isSandbox: boolean) {
    this.host = host
    this.token = token
    if (isSandbox)
      this.host = this.host.replace(/^(https?:\/\/)/, '$1sandbox.')
    this.$request = this.getRequest()
  }

  protected getRequest() {
    const a = axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.token
      }
    })
    a.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        if (config.headers?.['Content-Type'] === 'application/json')
          config.data && (config.data = snakeCaseObjKeys(config.data))
        return config
      },
      (error: any) => Promise.reject(error)
    )
    a.interceptors.response.use((response: AxiosResponse) => {
      if (response.status === 201 || response.status === 202) {
        throw new AxiosError(
          response.data.message,
          response.data.code,
          response.config,
          response.request,
          response
        )
      }
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

  get me() {
    return this.$request.get<User>('/users/@me')
  }

  /** 创建私信会话 */
  dms(d: {recipientId: string, sourceGuildId: string}): Promise<DMS> {
    return this.$request.post<DMS>('/users/@me/dms', d)
  }
}

type promiseMethod = 'then' | 'catch' | 'finally'
const promiseMethods = [ 'then', 'catch', 'finally' ]

const getPromiseProp = (p: Promise<any>, prop: promiseMethod) => p[prop].bind(p)

const requestProxy = (a: Api, path: string, cPath = ''): Function => new Proxy(() => {}, {
  get(_, prop: string) {
    if (promiseMethods.includes(prop))
      return getPromiseProp(
        a.$request.get(path + cPath), prop as promiseMethod)
    else {
      switch (prop as 'add' | 'del' | 'put' | 'upd') {
        case 'add':
          return (d: any) => a.$request.post(path + cPath, d)
        case 'del':
          return () => a.$request.delete(path + cPath)
        case 'put':
          return (d: any) => a.$request.put(path + cPath, d)
        case 'upd':
          return (d: any) => a.$request.patch(path + cPath, d)
      }
      return requestProxy(a, path, `/${prop}`)
    }
  },
  apply(_, __, [id, ..._args]) {
    return requestProxy(a, `${path + pluralize(cPath)}/${id}`)
  }
})

export const attachApi = <T extends Api>(a: T) => new Proxy(a, {
  get(target, path: keyof Api) {
    if (path in target) return target[path]
    return new Proxy(() => {}, {
      get(_, prop: string) {
        if (promiseMethods.includes(prop))
          return getPromiseProp(
            a.$request.get(`/users/@me/${path}`),
            prop as promiseMethod
          )
      },
      apply(_, __, [id, ..._args]) {
        return requestProxy(a, `/${pluralize(path)}/${id}`)
      }
    })
  }
})
