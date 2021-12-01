import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { camelCaseObjKeys, pluralize } from './utils'
import { Guild, Member, Role } from './common'

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

type D<T> = {
  info: T
  filter: { [K in keyof T]?: boolean }
}

export interface Api {
  /**
   * get property will travel `/users/@me/propertyName`
   */
  get guilds(): Promise<Guild[]>
  guild(id: string): Promise<Guild> & {
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
      role(id: string): Promise<Role>
    }
  }
}

export class Api {
  readonly host: string
  readonly token: string
  $request: InnerAxiosInstance

  constructor(host: string | undefined, token: string, isSandbox: boolean) {
    this.token = token
    this.host = host || 'https://api.sgroup.qq.com/'
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
