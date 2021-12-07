# Api namespace

## `Api`

该类为抽象出来的接口请求处理类，可以用它进行 oop 式的 restful 接口调用。

### 属性

* `$request`
  * 描述：代理了 axios 实例，自动对请求与接收的数据进行 camel 和 snake 转换，复写了一部分方法的范型。
  * 类型: `InnerAxiosInstance`

* `me`
  * 描述：获取机器人自身数据的 Getter。
  * 类型: [`Promise<User>`](#user)

### 方法

该部分方法使用 Proxy 进行了语法糖式的包装，可以参考下面的规则进行借口请求，接口请求均使用 Promise ，故直接支持 async await 语法糖。

```ts
// 将会请求 [get] /users/@me/guilds
await api.guilds
// 将会请求 [get] /guilds/{id}
await api.guild(id)
// 嵌套请求
// 将会请求 [get] /guilds/{id}/members
await api.guild(id).members
// 将会请求 [get] /guilds/{id}/members/{memberId}
await api.guild(id).member(memberId)
// 其他方法
// 将会请求 [post] `body: {data}` /guilds/{id}/roles
await api.guild(id).roles.add(data)
// 将会请求 [delete] /guilds/{id}/roles/{roleId}
await api.guild(id).role(roleId).del()
// 将会请求 [patch] `body: {data}` /guilds/{id}/roles/{roleId}
await api.guild(id).role(roleId).patch(data)
```

如果遇到了接口没有及时定义的情况，可以用下面的方法去扩展

```ts
declare module '@qq-guild-sdk/core' {
  interface Api {
    get foos: Promise<Foo[]>
  }
}
```
