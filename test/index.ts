import { Bot } from '@qq-guild-sdk/core'

const bot = new Bot({
  sandbox: true,
  app: process.env as any
})

async function main() {
  await bot.startClient(Bot.Intents.GUILD_MESSAGES | Bot.Intents.GUILDS)
  await new Promise<void>(resolve => bot.on('ready', resolve))
  console.log('qq guild bot is ready.')
  bot.on('message', async m => {
    console.log(`[${m.author.username}]: ${m.content}`)
    if (m.content === 'ping') {
      await bot.send.reply(m.id, {
        type: m.channelId ? 'channel' : 'private',
        id: m.channelId
          ? m.channelId
          : m.channelId
      }, 'pong')
    }
  })
  // test reconnect logic
  // setTimeout(() => {
  //   // @ts-ignore
  //   bot.reconnectFuture.res?.()
  // }, 2000)
}

main()
  .then(undefined)
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
