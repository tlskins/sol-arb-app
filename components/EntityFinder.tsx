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
  Select,
  Stack,
  Text,
  Box,
  FormControl,
  FormLabel,
  useDisclosure,
} from '@chakra-ui/react'
import AsyncCreatableSelect from 'react-select/async-creatable'

import { EntityTypes, EntityType, IEntity } from '../types/alpha'
import alphaService from '../services/alpha.service'
import projectRuleService from '../services/projectRule.service'
import { ProjectStat } from '../types/projectRules'

interface TagOption {
  value: string,
  label: string,
  entity: IEntity | null,
  project: ProjectStat | null,
}

const getDefaultEntity = (): IEntity => {
  return {
    id: 0,
    name: "?",
    type: EntityType.Project,
    projectId: null,
    hyperspaceUrl: null,
    updatedAt: "",
    createdAt: "",
    entityAliases: null,
    messages: null,
  }
}

const EntityFinder = ({
  entityId,
  isOpen,
  onClose,
  onFindEntity,
  scrollBehavior,
}: {
  entityId: number | undefined,
  isOpen: boolean,
  onClose: ()=>void,
  onFindEntity: (arg1: IEntity) => Promise<void>,
  scrollBehavior?: string,
}) => {
  const [entity, setEntity] = useState(undefined as IEntity | undefined)

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
    if ( entityId ) {
      onLoadEntity( entityId )
    }
  }, [entityId])

  const onLoadEntity = async ( entityId: number ): Promise<void> => {
    const entities = await alphaService.searchEntities({ id: entityId })
    if ( entities && entities.length > 0 ) {
      const entity = entities[0]
      setEntity(entity)
    }
  }

  const onSearchEntity = async (search: string): Promise<TagOption[]> => {
    const getEntityOptions = async (): Promise<TagOption[]> => {
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
    const getProjectOptions = async (): Promise<TagOption[]> => {
      const projects = await projectRuleService.searchProjects( search )
      if ( !projects ) return []
      return projects.map( project => ({
        label: `New Project: ${project.project?.display_name || "?"} (FP: ${project?.floor_price?.toFixed(2) || "?"})`,
        value: project.project?.display_name || "?",
        entity: null,
        project,
      }))
    }
    onSearchingEntity()
    const allOptsPromise = await Promise.all([getEntityOptions(), getProjectOptions()])
    endSearchingEntity()
    return allOptsPromise.flat()
  }

  const onSaveEntity = async () => {
    if ( isSavingEntity || entity === undefined ) return
    onSavingEntity()
    let result = undefined as IEntity | undefined
    if ( entity.id > 0 ) {
      result = await alphaService.updateEntity(entity.id, {
        id: entity.id,
        name: entity.name,
        type: entity.type,
        projectId: entity.projectId,
        hyperspaceUrl: entity?.hyperspaceUrl,
      })
    } else {
      result = await alphaService.createEntity({
        name: entity.name,
        type: entity.type,
        projectId: entity.projectId || null,
        hyperspaceUrl: entity.hyperspaceUrl || null,
      })
    }
    endSavingEntity()
    if ( result ) {
      setEntity(undefined)
      onClose()
      onFindEntity( result )
    }
  }

  return(
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      // scrollBehavior={scrollBehavior}
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
                { isOpen && 
                  <AsyncCreatableSelect
                    loadOptions={onSearchEntity}
                    isLoading={isSearchingEntity}
                    allowCreateWhileLoading={true}
                    createOptionPosition="first"
                    value={{ value: entity?.name || "", label: entity?.name || "" } as TagOption}
                    defaultValue={{ value: "", label: "", entity: null, project: null }}
                    getNewOptionData={(value) => ({
                      label: `New Tag: ${value}`,
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
                          type: EntityType.Project,
                        }
                      } else {
                        newEntity.name = value
                        newEntity.type = EntityType.Other
                      }
                      console.log('onchange', newEntity)
                      setEntity(newEntity)
                    }}
                  />
                }
              </FormControl>
            </Box>

            <Box>
              <FormLabel>Type</FormLabel>
              <FormControl fontSize="sm">
                <Select size="sm"
                  fontSize="sm"
                  background="white"
                  borderRadius="lg"
                  value={ entity?.type || "" }
                  onChange={ e => setEntity({ ...(entity || getDefaultEntity()), type: e.target.value as EntityType })}
                >
                  { EntityTypes.map( entityType => <option value={entityType} key={entityType}> { entityType } </option>) }
                </Select>
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