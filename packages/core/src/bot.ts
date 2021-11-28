import { Sender } from './sender'

export interface Bot {
  send: Sender
}

export class Bot {
  constructor(
    private options: Bot.Options
  ) {
    this.options = options
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
    type?: 'sandbox' | 'production'
  }
}
