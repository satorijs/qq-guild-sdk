import { Bot } from '@qq-guild-sdk/core'
import { AxiosError } from 'axios'

const bot = new Bot({
  sandbox: true,
  app: process.env as any
})

async function main() {
  await bot.startClient(Bot.Intents.GUILD_MESSAGES | Bot.Intents.GUILDS)
  await new Promise<void>(resolve => {
    bot.on('ready', resolve)
  })
  await new Promise<void>((resolve, reject) => {
    bot.on('message', async m => {
      try {
        await bot.send.channel.reply(m.id, m.channelId, {
          messageReference: m.id,
          content: 'Hello, world!',
          fileImage: require('path').join(__dirname, 'test.png')
        })
        await bot.send.channel.reply(m.id, m.channelId, 'Hello, world!')
        const filepath = require('path').join(__dirname, 'test.png')
        const readStream = require('fs').createReadStream(filepath)
        const buffer = await new Promise<Buffer>((resolve, reject) => {
          const chunks: Buffer[] = []
          readStream.on('data', (chunk: Buffer) => chunks.push(chunk))
          readStream.on('end', () => resolve(Buffer.concat(chunks)))
          readStream.on('error', reject)
        })
        await bot.send.channel.reply(m.id, m.channelId, {
          fileImage: buffer
        })
        await bot.send.channel.reply(m.id, m.channelId, {
          fileImage: require('fs').createReadStream(filepath)
        })
        await bot.send.channel.reply(m.id, m.channelId, {
          fileImage: filepath
        })
        resolve()
      } catch (e) {
        if (e instanceof AxiosError)
          console.error(e.request)
        reject(e)
      }
    })
  })
}

main()
  .then(undefined)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
