import moment from "moment-timezone"

export interface INewEntity {
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
  twitterHandle: string | null,
  entityTypeId: number | null,
  newEntityType?: string,
}

export interface IUpdateEntity {
  id: number,
  name?: string,
  projectId?: string | null,
  hyperspaceUrl?: string | null,
  twitterHandle?: string | null,
  entityTypeId?: number,
  newEntityType?: string,
}

export interface IEntity {
  id: number,
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
  twitterHandle: string | null,
  entityTypeId: number,
  updatedAt: string,
  createdAt: string,
  // update params
  newEntityType?: string,
  // associations
  entityAliases: IEntityAlias[] | null | undefined,
  messages: IMessage[] | null | undefined,
  // dynamic
  type?: string,
  lastDiscordMention?: string,
  lastTweetMention?: string,
  lastMention?: string,
  mentions?: number,
}

export const pEntity = (entity: IEntity): IEntity => {
  let lastMention = entity.lastDiscordMention
  if ( lastMention == null || entity.lastTweetMention && moment( entity.lastTweetMention ).isAfter( moment( entity.lastDiscordMention ))) {
    lastMention = entity.lastTweetMention
  }
  return {
    ...entity,
    lastMention,
  }
}

export interface IEntityType {
  id: number,
  name: string,
  updatedAt: string,
  createdAt: string,
  // associations
  entities: IEntity[] | null | undefined,
  messages: IMessage[] | null | undefined,
}


export interface IEntityAlias {
  id: number,
  name: string,
  entityId: number | null,
  count: number,
  ignore: boolean,
  updatedAt: string,
  createdAt: string,
  // associations
  entity: IEntity | null | undefined,
  messages: IMessage[] | null | undefined,
  // dynamic
  entityName?: string,
  lastDiscordMention?: string,
  lastTweetMention?: string,
  lastMention?: string,
  mentions?: number,
}

export const pEntityAlias = (alias: IEntityAlias): IEntityAlias => {
  let lastMention = alias.lastDiscordMention
  if ( lastMention == null || alias.lastTweetMention && moment( alias.lastTweetMention ).isAfter( moment( alias.lastDiscordMention ))) {
    lastMention = alias.lastTweetMention
  }
  return {
    ...alias,
    lastMention,
  }
}


export interface IUpdateEntityAlias {
  entityId?: number | null,
  ignore?: boolean,
}

export interface IMessage {
  id: number,
  type: number, // https://discord-api-types.dev/api/discord-api-types-v10/enum/MessageType
  tts: false, // Whether or not the message was Text-To-Speech
  timestamp: string, // 2022-09-28T03:06:12.024000+00:00
  referenced_message: IMessage | null, // DiscordMessage
  pinned: boolean,
  nonce: string,
  author: DiscordAuthor,
  mentions: DiscordAuthor[],
  mention_roles: string[],
  mention_everyone: boolean,
  content: string,
  channel_id: string,
  guild_id: string,
  cleaned_content: string,
  message_number: number,
  discord_message_id: string,
  author_id: string,
  referenced_message_id: string | null,
  processed: boolean,
  processed_at: string | null,
  entities: any[] | null, // Entity[]
  entities_count: number | null,
  createdAt: string,
  updatedAt: string,
  // associations
  entityAliases: IEntityAlias[] | null | undefined,
}

interface DiscordAuthor {
  username: string,
  id: string,
  discriminator: string,
  avatar: string,
}

export interface ITweet {
  id: number,
  createdAt: string,
  updatedAt: string,
  authorId: string,
  conversationId: string,
  tweetedAt: string,
  twitterEntities: any,
  geo: any,
  tweetId: string,
  possiblySensitive: boolean,
  retweets: number,
  replies: number,
  likes: number,
  quotes: number,
  replySettings: string,
  source: string,
  text: string,
  referencedTweetId: string | null,
  referencedTweetType: string | null,

  cleanedText: string,
  processed: boolean,
  processedAt: string | null,
  entities: any[] | null, // Entity[]
  entitiesCount: number | null,
  ignore: boolean,
  // associations
  entityAliases: IEntityAlias[] | null | undefined,
}

export interface ITweetConfig {
  id: number,
  createdAt: string,
  updatedAt: string,
  active: boolean,
  authorId: string,
  authorHandle: string,
  entityId: number | null,
  // associations
  entity: IEntity | null | undefined,
}

export type PolyMessage = IMessage | ITweet


export function isDiscordMsg(toBeDetermined: PolyMessage): toBeDetermined is IMessage {
  if((toBeDetermined as IMessage).discord_message_id){
    return true
  }
  return false
}

export function isTweet(toBeDetermined: PolyMessage): toBeDetermined is ITweet {
  if((toBeDetermined as ITweet).tweetId){
    return true
  }
  return false
}