import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { IEntity, INewEntity, IUpdateEntity, EntityType, IEntityAlias, IUpdateEntityAlias, IMessage } from '../types/alpha'

// entity types
export interface SearchEntitiesReq {
  id?: number,
  name?: string,
  projectId?: string,
  type?: string,
  after?: string,
  before?: string,
  countAbove?: number,
  countBelow?: number,
  limit?: number,
  offset?: number,
  orderBy?: string,
  orderDirection?: string,
}

interface EntityResp {
  entity: IEntity
}

interface EntitiesResp {
  results: IEntity[]
}

// alias types

export interface SearchAliasesReq {
  id?: number,
  entityAliasNameLike?: string,
  entityId?: number,
  countAbove?: number,
  countBelow?: number,
  ignore?: boolean,
  entityType?: string,
  after?: string,
  before?: string,
  limit?: number,
  offset?: number,
  orderBy?: string ,
  orderDirection?: string,
}

interface EntityAliasResp {
  entityAlias: IEntityAlias
}

interface EntityAliasesResp {
  results: IEntityAlias[]
}

// message types

export interface SearchMessagesReq {
  entityName?: string,
  entityType?: string,
  entityIds?: string,
  aliasIds?: string,
  channelIds?: string,
  after?: string,
  before?: string,
  projectId?: string,
  ids?: string,
  limit?: number,
  offset?: number,
  orderBy?: string,
  orderDirection?: string,
}

interface MessagesResp {
  results: IMessage[]
}


class AlphaService {

  // Entities

  newEntity = (): INewEntity => {
    return {
      name: "",
      projectId: null,
      hyperspaceUrl: null,
      type: EntityType.Other,
    } as IEntity
  }
  
  searchEntities = async (params: SearchEntitiesReq): Promise<IEntity[] | undefined> => {
    try {
      const resp: IResponse<EntitiesResp> = await http.get( `entity`, { params } )

      return resp.data.results
    } catch( err ) {
      handleError("Error getting entities", err)
    }
  }

  createEntity = async ( req: INewEntity ): Promise<IEntity | undefined> => {
    try {
      const resp: IResponse<EntityResp> = await http.post( `entity`, req )

      return resp.data.entity
    } catch( err ) {
      handleError("Error creating entity", err)
    }
  }

  updateEntity = async ( id: number, req: IUpdateEntity ): Promise<IEntity | undefined> => {
    try {
      const resp: IResponse<EntityResp> = await http.put( `entity/${ id }`, req )

      return resp.data.entity
    } catch( err ) {
      handleError("Error updating entity", err)
    }
  }

  // Entity Aliases

  searchAliases = async (params: SearchAliasesReq): Promise<IEntityAlias[] | undefined> => {
    try {
      console.log('searchAliases', params)
      const resp: IResponse<EntityAliasesResp> = await http.get( `entity-alias`, { params } )

      return resp.data.results
    } catch( err ) {
      handleError("Error getting aliases", err)
    }
  }

  updateEntityAlias = async ( id: number, req: IUpdateEntityAlias ): Promise<IEntityAlias | undefined> => {
    try {
      await http.put( `entity-alias/${ id }`, req )
      const resp: IResponse<EntityAliasesResp> = await http.get( `entity-alias`, { params: { id }} )
      if ( resp.data.results.length === 0 ) return

      return resp.data.results[0]
    } catch( err ) {
      handleError("Error updating alias", err)
    }
  }

  // Messages

  searchMessages = async (params: SearchMessagesReq): Promise<IMessage[] | undefined> => {
    try {
      const resp: IResponse<MessagesResp> = await http.get( `message`, { params } )

      return resp.data.results
    } catch( err ) {
      handleError("Error getting messages", err)
    }
  }
}

export default new AlphaService()
