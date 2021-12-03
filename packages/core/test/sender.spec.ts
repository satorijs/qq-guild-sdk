import { Bot, resolveTarget } from '@qq-guild-sdk/core'
import MockAdapter from 'axios-mock-adapter'
import { AxiosInstance } from 'axios'
import { expect } from 'chai'

after(() => {
  process.exit()
})

describe('Sender', function () {
  const bot = new Bot({
    app: { id: '', key: '', token: '' }
  })

  it('should test resolve target function.', () => {
    expect(() => resolveTarget({ type: 'private' }))
      .to.throw('target.ids or target.id is required')
    expect(() => resolveTarget('123'))
      .to.throw('type is required')

    expect(resolveTarget({ type: 'private', id: '123' }).id).to.be.equal('123')

    const t = resolveTarget('123', 'private')
    expect(t.id).to.be.equal('123')
    expect(t.type).to.be.equal('private')
  })

  it('should travel to right path.', async () => {
    const channelId = '123'
    new MockAdapter(bot.$request as AxiosInstance).onPost(
      `/channels/${ channelId }/messages`
    ).replyOnce(
      200, 'send message'
    )

    expect(await bot.send.channel(channelId, ''))
      .to.be.equal('send message')
  })
})
