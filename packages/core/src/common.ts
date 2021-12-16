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
  joinedAt?: number
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
