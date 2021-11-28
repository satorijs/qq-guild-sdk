import merge from 'lodash.merge'
import { Bot } from '@qq-guild-sdk/core'

// @ts-ignore
const defaultOptions: Options = {
  type: 'sandbox'
}

export const createBot = (options: Bot.Options) => new Bot(merge(defaultOptions))
