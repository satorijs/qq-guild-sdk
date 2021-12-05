import merge from 'lodash.merge'
import { Bot } from '@qq-guild-sdk/core'

const defaultOptions: Partial<Bot.Options> = {
  sandbox: true
}

export const createBot = (options: Bot.Options) => new Bot(merge(defaultOptions, options))
export * from '@qq-guild-sdk/core'
