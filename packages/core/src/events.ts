import { Message } from './sender'

export class Events {
  private readonly listeners: {
    [key: string]: Function[]
  }

  constructor() {
    this.listeners = {}
  }

  public on<T extends keyof Events.Map>(event: T, listener: Events.Map[T]): void {
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push(listener)
  }

  public emit<T extends keyof Events.Map>(
    event: T, ...args: Parameters<Events.Map[T]>
  ): void {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args))
    }
  }
}

export namespace Events {
  export interface Map {
    'ready': () => void
    'message': (msg: Message) => string | void
  }
}
