import merge from 'lodash.merge'
import { Bot } from '@qq-guild-sdk/core'

const defaultOptions = {
  sandbox: true
}

export const createBot = (options: Omit<Bot.Options, keyof typeof defaultOptions>) => new Bot(merge(defaultOptions, options))
export * from '@qq-guild-sdk/core'
