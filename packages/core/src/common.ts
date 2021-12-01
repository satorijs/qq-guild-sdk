export interface User {
  id: string
  username: string
  avatar: string
  bot: boolean
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
