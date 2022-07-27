import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { camelCaseObjKeys, snakeCaseObjKeys, pluralize } from './utils'
import { Announce, Channel, Guild, Member, Mute, OpenApiError, Role, Schedule, User } from './common'

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
export class RequestError<T = any> extends Error {
  constructor(message: string, config: AxiosRequestConfig<T>, request?: any, data?: OpenApiError) {
    super(message)
    this.config = config
    this.request = request
    this.data = data
  }
  config: AxiosRequestConfig<T>;
  request?: any;
  data?: OpenApiError;
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
  get guilds(): Promise<Guild[]>
  guild(id: string): Promise<Guild> & {
    get mute(): {
      upd(d: Mute): Promise<void>
    }
    get roles(): Promise<{
      roles: Role[]
      guildId: string
      /** 默认分组上限 */
      roleNumLimit: number
    }> & {
      add(d: D<Pick<Role, 'name' | 'color' | 'hoist'>>): Promise<{roleId: string; role: Role}>
    }
    role(id: string): {
      del(): Promise<void>
      upd(d: D<Partial<Pick<Role, 'name' | 'color' | 'hoist'>>>): Promise<{
        role: Role
        roleId: string
        guildId: string
      }>
    }
    get members(): Promise<Member[]>
    member(id: string): Promise<Member> & {
      get mute(): {
        upd(d: Mute): Promise<void>
      }
      role(id: string): Promise<Role>
    }
    get channels(): Promise<Channel[]>
  }
  channel(id: string): Promise<Channel> & {
    get announces(): {
      add(d: Pick<Announce, 'messageId'>): Promise<Announce>
    }
    announce(msgId: string): {
      del(): Promise<void>
    }
    get schedules(): Promise<Schedule[]> & {
      add(d: Omit<Schedule, 'id'>): Promise<Schedule>
    }
    schedule(id: string): Promise<Schedule> & {
      upd(d: Omit<Schedule, 'id'>): Promise<Schedule>
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
        config.data && (config.data = snakeCaseObjKeys(config.data))
        return config
      },
      (error: any) => Promise.reject(error)
    )
    a.interceptors.response.use((response: AxiosResponse) => {
      if (response.status === 201 || response.status === 202) {
        const err: RequestError = new RequestError<any>(
          response.data.message,
          response.config,
          response.request,
          response.data
        )
        return Promise.reject(err)
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
      switch (prop as 'add' | 'del' | 'upd') {
        case 'add':
          return (d: any) => a.$request.post(path + cPath, d)
        case 'del':
          return () => a.$request.delete(path + cPath)
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
            a.$request.get(`/users/@me/${path}`), prop as promiseMethod)
      },
      apply(_, __, [id, ..._args]) {
        return requestProxy(a, `/${pluralize(path)}/${id}`)
      }
    })
  }
})
