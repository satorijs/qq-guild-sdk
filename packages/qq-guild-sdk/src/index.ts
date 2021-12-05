import merge from 'lodash.merge'
import { Bot } from '@qq-guild-sdk/core'

const defaultOptions = {
  sandbox: true
}

export const createBot = <T extends typeof defaultOptions>(
  options: Omit<Bot.Options, keyof T> & Partial<T>
  // @ts-ignore
) => new Bot(merge(defaultOptions, options))
export * from '@qq-guild-sdk/core'
