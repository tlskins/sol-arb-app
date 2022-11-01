import { useRef, useState, useEffect } from 'react'
import {
  Button,
  Input,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Stack,
  Text,
  Box,
  FormControl,
  FormLabel,
  useDisclosure,
} from '@chakra-ui/react'
import AsyncCreatableSelect from 'react-select/async-creatable'
import CreatableSelect from 'react-select/creatable'
import { useSession } from "next-auth/react"

import { useGlobalState } from '../services/gloablState'
import { IEntity } from '../types/alpha'
import alphaService from '../services/alpha.service'
import projectRuleService from '../services/projectRule.service'
import { ProjectStat } from '../types/projectRules'

interface TagOption {
  value: string,
  label: string,
  entity: IEntity | null,
  project: ProjectStat | null,
}

interface EntityTypeOption {
  value: string,
  label: string,
  name: string,
  isNew: boolean,
}


const getDefaultEntity = (): IEntity => {
  return {
    id: 0,
    name: "?",
    // type: EntityType.Project,
    entityTypeId: 0,
    projectId: null,
    hyperspaceUrl: null,
    updatedAt: "",
    createdAt: "",
    entityAliases: null,
    messages: null,
  }
}

let searchTimer = undefined as NodeJS.Timer | undefined

const EntityFinder = ({
  entityId,
  isOpen,
  onClose,
  onFindEntity,
}: {
  entityId: number | undefined,
  isOpen: boolean,
  onClose: ()=>void,
  onFindEntity?: (arg1: IEntity) => Promise<void>,
}) => {
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any

  const searchRef = useRef( undefined as NodeJS.Timeout | undefined )
  const [entityTypes, setEntityTypes] = useGlobalState('entityTypes')
  const [entity, setEntity] = useState(undefined as IEntity | undefined)
  console.log('isOpen', isOpen)

  const {
    isOpen: isSearchingEntity,
    onOpen: onSearchingEntity,
    onClose: endSearchingEntity,
  } = useDisclosure()
  const {
    isOpen: isSavingEntity,
    onOpen: onSavingEntity,
    onClose: endSavingEntity,
  } = useDisclosure()

  useEffect(() => {
    if ( sessionData?.token?.id, isOpen ) {
      console.log('loading types...')
      onLoadEntityTypes()
    }
  }, [sessionData?.token?.id, isOpen])


  useEffect(() => {
    if ( entityId ) {
      onLoadEntity( entityId )
    }
  }, [entityId])

  const onLoadEntityTypes = async (): Promise<void> => {
    const newEntityTypes = await alphaService.getEntityTypes()
    if ( newEntityTypes ) {
      setEntityTypes( newEntityTypes.sort((a,b) => a.name > b.name ? 1 : 0) )
    }
  }

  const onLoadEntity = async ( entityId: number ): Promise<void> => {
    const entities = await alphaService.searchEntities({ id: entityId })
    if ( entities && entities.length > 0 ) {
      const entity = entities[0]
      setEntity(entity)
    }
  }


  const getEntityOptions = async (search: string): Promise<TagOption[]> => {
    const entities = await alphaService.searchEntities({
      name: search,
      limit: 20,
      orderBy: "MENTIONS",
      orderDirection: "DESC"
    })
    if ( !entities ) return []
    return entities.map( entity => ({
      label: `Entity: ${entity.name}`,
      value: entity.name,
      entity,
      project: null,
    }))
  }

  const getProjectOptions = async (search: string): Promise<TagOption[]> => {
    const projects = await projectRuleService.searchProjects( search )
    if ( !projects ) return []
    return projects.map( project => ({
      label: `New Project: ${project.project?.display_name || "?"} (FP: ${project?.floor_price?.toFixed(2) || "?"})`,
      value: project.project?.display_name || "?",
      entity: null,
      project,
    }))
  }

  const onSearchEntity = (search: string, callback: (options: TagOption[]) => void): void => {
    const loadEntityOptions = async () => {
      onSearchingEntity()
      const allOptsPromise = await Promise.all([getEntityOptions(search), getProjectOptions(search)])
      endSearchingEntity()
      callback(allOptsPromise.flat())
    }

    if ( searchRef.current ) {
      clearTimeout( searchRef.current )
    }
    searchRef.current = setTimeout( async () => {
      loadEntityOptions()
    }, 850)
  }

  const onSaveEntity = async () => {
    if ( isSavingEntity || entity === undefined ) return
    onSavingEntity()
    let result = undefined as IEntity | undefined
    if ( entity.id > 0 ) {
      result = await alphaService.updateEntity(entity.id, {
        id: entity.id,
        name: entity.name,
        entityTypeId: entity.entityTypeId,
        newEntityType: entity.newEntityType,
        projectId: entity.projectId,
        hyperspaceUrl: entity?.hyperspaceUrl,
        twitterHandle: entity?.twitterHandle,
      })
    } else {
      result = await alphaService.createEntity({
        name: entity.name,
        entityTypeId: entity.entityTypeId,
        newEntityType: entity.newEntityType,
        projectId: entity.projectId || null,
        hyperspaceUrl: entity.hyperspaceUrl || null,
        twitterHandle: entity.twitterHandle || null,
      })
    }
    endSavingEntity()
    if ( result ) {
      setEntity(undefined)
      onClose()
      onFindEntity && onFindEntity( result )
    }
  }

  console.log('entitytypes', entityTypes)

  return(
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{ (entity?.id || 0) > 0 ? `Update '${ entity?.name || "?" }'` : "Find or Create Entity" } </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack spacing='24px'>
            <Box>
              <FormLabel>Name</FormLabel>
              <FormControl fontSize="sm">
                { isOpen ?
                  <AsyncCreatableSelect
                    loadOptions={onSearchEntity}
                    isLoading={isSearchingEntity}
                    allowCreateWhileLoading={true}
                    createOptionPosition="first"
                    value={{ value: entity?.name || "", label: entity?.name || "" } as TagOption}
                    defaultValue={{ value: "", label: "", entity: null, project: null }}
                    getNewOptionData={(value) => ({
                      label: `New Entity: ${value}`,
                      value,
                      entity: null,
                      project: null
                    } as TagOption)}
                    onChange={opt => {
                      const { value, entity, project } = opt as TagOption
                      let newEntity = getDefaultEntity()
                      if ( entity ) {
                        newEntity = { ...newEntity, ...entity }
                      } else if ( project ) {
                        newEntity = {
                          ...newEntity,
                          projectId: project.project_id,
                          name: project.project?.display_name || "?",
                          entityTypeId: entityTypes.length > 0 ? entityTypes[0].id : 0,
                          type: entityTypes.length > 0 ? entityTypes[0].name : undefined,
                        }
                      } else {
                        newEntity.name = value
                        newEntity.type = entityTypes.length > 0 ? entityTypes[0].name : undefined
                      }
                      if ( entityId ) newEntity.id = entityId
                      setEntity(newEntity)
                    }}
                  />
                  :
                  <FormLabel>?</FormLabel>
                }
              </FormControl>
            </Box>

            <Box>
              <FormLabel>Type</FormLabel>
              <FormControl fontSize="sm">
                { isOpen ?
                  <CreatableSelect
                    createOptionPosition="first"
                    isClearable={true}
                    value={{
                      value: entity?.entityTypeId?.toString() || "",
                      label: entity?.newEntityType || entity?.type || "",
                    } as EntityTypeOption}
                    options={entityTypes.map( type => ({
                      value: type.id.toString(),
                      label: type.name,
                      name: type.name,
                      isNew: false,
                    }))}
                    defaultValue={
                      entityTypes.length > 0 ?
                      { 
                        value: entityTypes[0].id?.toString(),
                        label: entityTypes[0].name,
                        name: entityTypes[0].name,
                        isNew: false
                      }
                      : 
                      {
                        value: "",
                        label: "",
                        name: "",
                        isNew: false,
                      }
                    }
                    getNewOptionData={(value) => ({
                      label: `New Type: ${value}`,
                      value,
                      name: value,
                      isNew: true,
                    } as EntityTypeOption)}
                    onChange={(opt) => {
                      if ( !opt ) {
                        setEntity({
                          ...(entity || getDefaultEntity()),
                          type: undefined,
                          entityTypeId: 0,
                          newEntityType: undefined,
                        })
                      } else {
                        setEntity({
                          ...(entity || getDefaultEntity()),
                          type: opt.name,
                          entityTypeId: opt.isNew ? 0 : parseInt( opt.value ),
                          newEntityType: opt.isNew ? opt.name : undefined,
                        })
                      }
                    }}
                  />
                  :
                  <FormLabel>?</FormLabel>
                }
              </FormControl>
            </Box>

            <Box>
              <FormLabel>Project Id</FormLabel>
              <FormControl fontSize="sm">
                <Text> { entity?.projectId || "None" } </Text>
              </FormControl>
            </Box>

            <Box>
              <FormLabel>Hyperspace URL</FormLabel>
              <FormControl fontSize="sm">
                <Input type="text"
                  value={ entity?.hyperspaceUrl || "" }
                  onChange={ e => setEntity({ ...(entity || getDefaultEntity()), hyperspaceUrl: e.target.value }) }
                />
              </FormControl>
            </Box>

            <Box>
              <FormLabel>Twitter URL</FormLabel>
              <FormControl fontSize="sm">
                <Input type="text"
                  value={ entity?.twitterHandle || "" }
                  onChange={ e => setEntity({ ...(entity || getDefaultEntity()), twitterHandle: e.target.value }) }
                />
              </FormControl>
            </Box>

          </Stack>
        </ModalBody>

        <ModalFooter>
          <Button
            isLoading={isSavingEntity}
            loadingText='Saving...'
            colorScheme='teal'
            variant='solid'
            onClick={onSaveEntity}
          >
            Save
          </Button>

          <Button variant='ghost' onClick={() => {
            onClose()
            setEntity(undefined)
          }}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}


export default EntityFinder