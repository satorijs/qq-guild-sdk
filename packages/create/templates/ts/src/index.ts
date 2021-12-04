import { createBot, Bot } from 'qq-guild-sdk'

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      id: string
      key: string
      token: string
    }
  }
}

const bot = createBot({
  app: {
    id: process.env.id,
    key: process.env.key,
    token: process.env.token
  }
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
