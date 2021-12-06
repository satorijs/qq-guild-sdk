import { Message } from './sender'

export class Events {
  private readonly listeners: {
    [key: string]: Function[]
  }

  constructor() {
    this.listeners = {}
  }

  on<T extends keyof Events.Map>(event: T, listener: Events.Map[T]): void {
    this.listeners[event] = this.listeners[event] || []
    this.listeners[event].push(listener)
  }

  async emit<T extends keyof Events.Map>(
    event: T, ...args: Parameters<Events.Map[T]>
  ): Promise<void> {
    const listeners = this.listeners[event]
    if (listeners) {
      for (let i = 0; i < listeners.length; i++) {
        try {
          await listeners[i](...args)
        } catch (e) {
          throw e
        }
      }
    }
  }
}

export namespace Events {
  type Awaitable<T> = [T] extends [Promise<unknown>] ? T : T | Promise<T>

  export interface Map {
    'ready': () => Awaitable<void>
    'error': (error: Error) => Awaitable<void>
    'message': (msg: Message) => Awaitable<string | void>
  }
}
