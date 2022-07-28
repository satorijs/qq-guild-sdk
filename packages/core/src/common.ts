export interface User {
  id: string
  username: string
  avatar: string
  bot: boolean
}

export interface Role {
  /** 身份组 ID , 默认值可参考 DefaultRoles */
  id: string
  /** 名称 */
  name: string
  /** ARGB 的 HEX 十六进制颜色值转换后的十进制数值 */
  color: number
  /** 是否在成员列表中单独展示: 0-否, 1-是 */
  hoist: number
  /** 人数 */
  number: number
  /** 成员上限 */
  memberLimit: number
}

export enum DefaultRoles {
  /** 全体成员 */
  ALL = 1,
  /** 管理员 */
  ADMIN = 2,
  /** 群主/创建者 */
  OWNER = 4,
  /** 子频道管理员 */
  SUBCHANNEL_ADMIN = 5
}

export interface Member {
  /** 用户基础信息，来自QQ资料，只有成员相关接口中会填充此信息 */
  user: User
  /** 用户在频道内的昵称 */
  nick: string
  /** 用户在频道内的身份组ID, 默认值可参考DefaultRoles */
  roles: string[]
  /** 用户加入频道的时间 */
  joinedAt: Date
}

export interface Guild {
  id: string
  name: string
  icon: string
  owner: boolean
  ownerId?: string
  memberCount?: number
  maxMembers?: number
  description?: number
  joinedAt?: Date
}

export enum ChannelType {
  /** 文字子频道 */
  TEXT = 0,
  /** 语音子频道 */
  VOICE = 2,
  /** 子频道分组 */
  GROUP = 4,
  /** 直播子频道 */
  LIVE = 10005,
  /** 应用子频道 */
  APPLICATION = 10006,
  /** 论坛子频道 */
  FORUM = 10007
}

export enum ChannelSubType {
  /** 闲聊 */
  IDLE = 0,
  /** 公告 */
  ANNOUNCEMENT = 1,
  /** 攻略 */
  STRATEGY = 2,
  /** 开黑 */
  BLACK = 3
}

export interface ChannelPermissions {
  /** 子频道 id */
  channelId: string
  /** 用户 id */
  userId: string
  /** 用户拥有的子频道权限 */
  permissions: string
}

export enum ChannelPrivateType {
  /** 公开频道 */
  PUBLIC = 0,
  /** 群主管理员可见 */
  ADMIN_ONLY = 1,
  /** 群主管理员+指定成员 */
  SELECTED_MEMBERS = 2
}

export enum ChannelSpeakPermission {
  /** 无效类型 */
  INVALID = 0,
  /** 所有人 */
  ALL = 1,
  /** 群主管理员+指定成员 */
  SELECTED_MEMBERS = 2
}

export interface Channel {
  /** 子频道 id */
  id: string
  /** 频道 id */
  guildId: string
  /** 子频道名 */
  name: string
  /** 子频道类型 */
  type: ChannelType
  /** 子频道子类型 */
  subType: ChannelSubType
  /** 排序，必填，而且不能够和其他子频道的值重复 */
  position: number
  /** 分组 id */
  parentId: string
  /** 创建人 id */
  ownerId: string
  /** 子频道私密类型 */
  privateType: ChannelPrivateType,
  /** 子频道发言权限 */
  speakPermission: ChannelSpeakPermission,
  /** 用于标识应用子频道应用类型，仅应用子频道时会使用该字段 */
  applicationId?: string,
  /** 子频道私密类型 */
  permissions: string,
}

export interface MemberWithGuild {
  /** 频道 id */
  guildId: string
  /** 用户基础信息 */
  user: User
  /** 用户在频道内的昵称 */
  nick: string
  /** 用户在频道内的身份 */
  roles: string[]
  /** 用户加入频道的时间 */
  joinedAt: Date
}

/**
 * 公告对象
 */
export interface Announce {
  /** 频道 id */
  guildId: string
  /** 子频道 id */
  channelId: string
  /** 消息 id */
  messageId: string
}

/**
 * 表情表态对象
 */
export interface MessageReaction {
  /** 用户 ID */
  userId: string
  /** 频道 ID */
  guildId: string
  /** 子频道 ID */
  channelId: string
  /** 表态对象 */
  target: ReactionTarget
  /** 表态所用表情 */
  emoji: Emoji
}

/**
 * 表态对象
 */
export interface ReactionTarget {
  /** 表态对象 ID */
  id: string
  /** 表态对象类型 */
  type: ReactionTargetType
}

/**
 * 表态对象类型
 */
export enum ReactionTargetType {
  /** 消息 */
  MESSAGE = 0,
  /** 帖子 */
  POST = 1,
  /** 评论 */
  COMMENT = 2,
  /** 回复 */
  REPLY = 3
}

/**
 * 表情对象
 */
export interface Emoji {
  /**
   * 表情 ID
   * 系统表情使用数字为 ID
   * emoji 使用 emoji 本身为 id
   */
  id: string
  /** 表情类型 */
  type: number
}

/**
 * 表情类型
 */
export enum EmojiType {
  /** 系统表情 */
  SYSTEM = 1,
  /** emoji 表情 */
  DEFAULT = 2
}

/**
 * 日程对象
 */
export interface Schedule {
  /** 日程 id */
  id: string
  /** 日程名称 */
  name: string
  /** 日程描述 */
  description: string
  /** 日程开始时间戳(ms) */
  startTimestamp: Date
  /** 日程结束时间戳(ms) */
  endTimestamp: Date
  /** 创建者 */
  creator: Member
  /** 日程开始时跳转到的子频道 id */
  jumpChannelId: string
  /** 日程提醒类型，取值参考 RemindType */
  remindType: RemindType
}

/**
 * 日程提醒类型
 */
export enum RemindType {
  /** 不提醒 */
  NEVER = '0',
  /** 开始时提醒 */
  START = '1',
  /** 开始前5分钟提醒 */
  BEFORE_5 = '2',
  /** 开始前15分钟提醒 */
  BEFORE_15 = '3',
  /** 开始前30分钟提醒 */
  BEFORE_30 = '4',
  /** 开始前60分钟提醒 */
  BEFORE_60 = '5',
}

export interface Mute {
  /** 禁言到期时间戳，绝对时间戳，单位：秒（与 muteSeconds 字段同时赋值的话，以该字段为准） */
  muteEndTimestamp?: string
  /** 禁言多少秒（两个字段二选一，默认以 muteEndTimestamp 为准） */
  muteSeconds?: number
  /** 禁言成员的user_id列表，即 User 的id */
  userIds?: string[]
}

export enum DeleteHistoryMsgDays {
  ALL = -1,
  NONE = 0,
  DAY_3 = 3,
  DAY_7 = 7,
  DAY_15 = 15,
  DAY_30 = 30,
}

export interface MessageSetting {
  /** 是否允许创建私信 */
  disableCreateDm: string
  /** 是否允许发主动消息 */
  disablePushMsg: string
  /** 子频道 id 数组 */
  channelIds: string
  /** 每个子频道允许主动推送消息最大消息条数 */
  channelPushMaxNum: string
}

/**
 * 创建的私信会话
 */
export interface DMS {
  /** 私信会话关联的频道 id */
  guildId: string
  /** 私信会话关联的子频道 id */
  channelId: string
  /** 创建私信会话时间戳 */
  createTime: string
}

/**
 * 精华消息对象
 */
export interface PinsMessage {
  /** 频道 id */
  guildId: string
  /** 子频道 id */
  channelId: string
  /** 子频道内精华消息 id 数组 */
  messageIds: string[]
}

/**
 * 接口权限对象
 */
export interface APIPermission {
  /** API 接口名，例如 /guilds/{guild_id}/members/{user_id} */
  path: string
  /** 请求方法，例如 GET */
  method: string
  /** API 接口名称，例如 获取频道信息 */
  desc: string
  /** 授权状态，auth_stats 为 1 时已授权 */
  authStatus: number
}

export interface APIPermissionDemandIdentify {
  /** API 接口名，例如 /guilds/{guild_id}/members/{user_id} */
  path: string
  /** 请求方法，例如 GET */
  method: string
}

/**
 * 接口权限需求对象
 */
export interface APIPermissionDemand {
  /** 申请接口权限的频道 id */
  guildId: string
  /** 接口权限需求授权链接发送的子频道 id */
  channelId: string
  /** 权限接口唯一标识 */
  apiIdentify: APIPermissionDemandIdentify
  /** 接口权限链接中的接口权限描述信息 */
  title: string
  /** 接口权限链接中的机器人可使用功能的描述信息 */
  desc: string
}
