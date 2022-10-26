import { Bot } from '@qq-guild-sdk/core'
import { expect } from 'chai'
import { AxiosError } from 'axios'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      id: string
      key: string
      token: string
    }
  }
}

after(() => {
  process.exit()
})

describe('Bot', function () {
  const bot = new Bot({
    sandbox: true, app: process.env
  })

  it('should get guilds and guild for target id.', async () => {
    const guilds = await bot.guilds
    expect(guilds).to.be.an('array')
    expect(guilds[0]).to.be.an('object')
    expect(guilds[0].name).to.be.eq(await bot.guild(guilds[0].id).then(g => g.name))
  })

  it('should get channels and channel for target id.', async () => {
    const guilds = await bot.guilds
    const channels = await bot.guild(guilds[0].id).channels
    expect(channels).to.be.an('array')
    expect(channels[0]).to.be.an('object')
  })

  this.timeout(30000)
  it('should connect server by websocket.', async () => {
    await bot.startClient(Bot.Intents.GUILD_MESSAGES | Bot.Intents.GUILDS)
    await new Promise<void>(resolve => {
      bot.on('ready', resolve)
    })
    await new Promise<void>((resolve, reject) => {
      bot.on('message', async m => {
        try {
          await bot.send.channel.reply(m.id, m.channelId, 'Hello, world!')
          await bot.send.channel.reply(m.id, m.channelId, {
            fileImage: require('fs').createReadStream(require('path').join(__dirname, 'test.png'))
          })
          resolve()
        } catch (e) {
          if (e instanceof AxiosError)
            console.error(e.request)
          reject(e)
        }
      })
    })
  })
})
