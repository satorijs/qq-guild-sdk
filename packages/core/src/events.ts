import { Message } from './sender'
import { Channel, Guild, MemberWithGuild, MessageReaction } from './common'

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

  interface GuildEventMap {
    'guild:add': (guild: Guild) => Awaitable<void>
    'guild:upd': (guild: Guild) => Awaitable<void>
    'guild:del': (guild: Guild) => Awaitable<void>
  }

  interface ChannelEventMap {
    'channel:add': (channel: Channel) => Awaitable<void>
    'channel:upd': (channel: Channel) => Awaitable<void>
    'channel:del': (channel: Channel) => Awaitable<void>
  }

  interface GuildMemberEventMap {
    'guild-member:add': (mwg: MemberWithGuild) => Awaitable<void>
    'guild-member:upd': (mwg: MemberWithGuild) => Awaitable<void>
    'guild-member:del': (mwg: MemberWithGuild) => Awaitable<void>
  }

  export interface Map extends GuildEventMap, GuildMemberEventMap, ChannelEventMap {
    'ready': () => Awaitable<void>
    'error': (error: Error) => Awaitable<void>
    'message': (msg: Message) => Awaitable<string | void>
    'reaction:add': (reaction: MessageReaction) => Awaitable<void>
    'reaction:del': (reaction: MessageReaction) => Awaitable<void>
  }
}
