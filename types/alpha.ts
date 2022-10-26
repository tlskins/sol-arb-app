
export interface INewEntity {
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
  entityTypeId: number | null,
  newEntityType?: string,
}

export interface IUpdateEntity {
  id: number,
  name?: string,
  projectId?: string | null,
  hyperspaceUrl?: string | null,
  entityTypeId?: number,
  newEntityType?: string,
}

export interface IEntity {
  id: number,
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
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
  lastMention?: string,
  mentions?: number,
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
  lastMention?: string,
  mentions?: number,
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

