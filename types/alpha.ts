
export enum EntityType {
  Other = "Other",
  Project = "Project",
  Premint = "Premint",
  Trading = "Trading",
  Alpha = "Alpha",
}

export const EntityTypes = [
  EntityType.Other,
  EntityType.Project,
  EntityType.Premint,
  EntityType.Trading,
  EntityType.Alpha,
]

export interface INewEntity {
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
  type: EntityType,
}

export interface IUpdateEntity {
  id: number,
  name?: string,
  projectId?: string | null,
  hyperspaceUrl?: string | null,
  type?: EntityType,
}

export interface IEntity {
  id: number,
  name: string,
  projectId: string | null,
  hyperspaceUrl: string | null,
  type: EntityType,
  updatedAt: string,
  createdAt: string,
  // associations
  entityAliases: IEntityAlias[] | null | undefined,
  messages: IMessage[] | null | undefined,
  // dynamic
  lastMention?: string,
  mentions?: number,
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

export const ChannelsMap = new Map<string, string>()
ChannelsMap.set("927396163135631397", "Degods Alpha")
ChannelsMap.set("899081166999670814", "Famous Fox Alpha")
ChannelsMap.set("924069784444882964", "Degen Bible Test")
