import { Bot } from '@qq-guild-sdk/core'

describe('Bot', () => {
  it('should be able to create a bot', async () => {
    const bot = new Bot({
      app: {
        id: '', key: '', token: ''
      }
    })
    await bot.send.channel('', '')
    await bot.send.channel.reply('', '', '')
  })
})
