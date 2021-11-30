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
