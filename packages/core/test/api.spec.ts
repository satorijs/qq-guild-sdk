import MockAdapter from 'axios-mock-adapter'
import { AxiosInstance } from 'axios'

import { Api, attachApi } from '@qq-guild-sdk/core'
import { expect } from 'chai'

describe('Api', function () {
  class Foo extends Api {
    bar = 'bar'
    constructor() {
      super('http://www.example.com', '123', false)

      return attachApi(this)
    }
  }
  const foo = new Foo()

  it('should travel simple property and simple method.', async () => {
    const guildId = '123'
    new MockAdapter(foo.$request as AxiosInstance).onGet(
      '/users/@me/guilds'
    ).replyOnce(
      200, 'test await foo.guilds'
    ).onGet(
      `/guilds/${ guildId }`
    ).replyOnce(
      200, 'test await foo.guild(\'123\')'
    )
    // /users/@me/guilds
    expect(await foo.guilds).to.equal('test await foo.guilds')
    // /guild/:guildId
    expect(await foo.guild(guildId)).to.equal('test await foo.guild(\'123\')')
  })

  it('should travel nest property and nest method.', async () => {
    const guildId = '123', memberId = '456', roleId = '789'
    new MockAdapter(foo.$request as AxiosInstance).onGet(
      `/guilds/${ guildId }/members`
    ).replyOnce(
      200, 'test await foo.guild(\'123\').members'
    ).onGet(
      `/guilds/${ guildId }/members/${ memberId }`
    ).replyOnce(
      200, 'test await foo.guild(\'123\').members(\'456\')'
    ).onGet(
      `/guilds/${ guildId }/members/${ memberId }/roles/${ roleId }`
    ).replyOnce(
      200, 'test await foo.guild(\'123\').members(\'456\').roles(\'789\')'
    )
    // /guild/:guildId/members
    expect(await foo.guild(guildId).members).to.equal('test await foo.guild(\'123\').members')
    // /guild/:guildId/members/:memberId
    expect(await foo.guild(guildId).member(memberId)).to.equal('test await foo.guild(\'123\').members(\'456\')')
    // /guild/:guildId/members/:memberId/roles/:roleId
    expect(await foo.guild(guildId).member(memberId).role(roleId)).to.equal('test await foo.guild(\'123\').members(\'456\').roles(\'789\')')
  })
})
