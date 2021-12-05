import { createBot, Bot } from 'qq-guild-sdk'

const bot = createBot({
  app: process.env
})

async function main() {
  await bot.startClient(Bot.Intents.AT_MESSAGE | Bot.Intents.GUILDS)
  bot.on('ready', () => {
    console.log('Bot is ready!')
  })
  bot.on('message', async msg => {
    if (msg.content === 'ping') {
      await bot.send.channel.reply(msg.id, msg.channelId, 'pong')
    }
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
