import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Sender } from './sender'
import Utils from './utils'
import camelCaseObjKeys = Utils.camelCaseObjKeys
import { Guild } from './common'

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

  constructor(
    private options: Bot.Options
  ) {
    this.options = options
    this.host = options.host || 'https://api.sgroup.qq.com/'
    if (options.env === 'sandbox')
      this.host = this.host.replace(/^(https?:\/\/)/, '$1sandbox.')

    this.$request = this.getRequest() as InnerAxiosInstance
  }

  private getRequest() {
    const a = axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bot ${ this.options.app.id }.${ this.options.app.token }`
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
}
