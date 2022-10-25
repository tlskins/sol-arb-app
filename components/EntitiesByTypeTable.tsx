import React, { useEffect, useState } from 'react'
import {
  IconButton,
  Link,
  FormLabel,
  Stack,
  Text,
} from '@chakra-ui/react'
import { ChatIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import Moment from 'moment-timezone'

import { IEntity } from '../types/alpha'
import { ProjectEntityType, ListeningProjectIds } from '../services/helpers'

interface IEntitiesByType {
  label: string,
  type: string,
  entities: IEntity[],
  commonTags: string[],
}

const EntitiesByTypeTable = ({
  entities,
  onLoadEntityMessages,
  onEditEntity,
} : {
  entities: IEntity[],
  onLoadEntityMessages: (entityId: number) => void,
  onEditEntity: (entity: IEntity) => void,
}) => {
  const [entitiesByType, setEntitiesByType] = useState([] as IEntitiesByType[])

  useEffect(() => {
    if ( entities ) {
      const newEntitiesByType = [] as IEntitiesByType[]
      entities.forEach( entity => {
        let label = ListeningProjectIds.includes( entity.id ) ? 'Listening Projects' : entity.type || "?"
        let grouped = newEntitiesByType.find( t => t.label === label )
        if ( !grouped && entity.type ) {
          grouped = { type: entity.type, entities: [], label, commonTags: [] }
          newEntitiesByType.push( grouped )
        }

        if ( grouped ) {
          grouped.entities.push( entity )
        }
      })
      setEntitiesByType(newEntitiesByType.sort((a,b) => {
        return a.type === 'Project' ?
        -1
        :
        (a.entities.length > b.entities.length ? -1 : 1)
      }))
    }
  }, [entities])

  return(
    <Stack
      direction="column"
      width="full"
    >
      { entitiesByType.map( ({ type, label, entities }) => {
        return(
          <Stack key={type}
            direction="row"
            alignItems="center"
            alignContent="center"
            overflowX="scroll"
            pl="1"
            pr="2"
            py="2"
          >
            <Stack direction="column" width="full">
              <FormLabel fontSize="md" fontWeight="bold" textDecoration="underline" borderRadius="md" py="1" px="2">
                { label.toUpperCase() } ({ entities.length })
              </FormLabel>
              <Stack direction="row" width="full" overflowX="scroll">
                { entities.map( entity => {
                  return(
                    <Stack
                      key={entity.id}
                      mx="1"
                      width="32"
                      minWidth="32"
                      maxWidth="32"
                      p="2"
                      borderRadius="md"
                      border="1px"
                      borderColor="gray.100"
                      bg="teal.50"
                      fontSize="sm"
                      spacing="0.5"
                    >
                      <Text fontWeight="bold" textDecoration="underline" size="md" letterSpacing="wide">
                        { entity.hyperspaceUrl ?
                          <Link href={entity.hyperspaceUrl} isExternal>
                            { entity.name }
                            <ExternalLinkIcon mx='2' />
                          </Link>
                          :
                          <Text> { entity.name } </Text>
                        }
                      </Text>
                      <Text fontSize="xx-small">
                        Mentions: { entity.mentions || 0 }
                      </Text>
                      <Text fontSize="xx-small">
                        { Moment( entity.lastMention ).format('ddd, MMM Do, h:mm a') }
                      </Text>

                      <Stack direction="row" py="2">
                        <IconButton
                          icon={<ChatIcon/>}
                          size="xs"
                          aria-label='View messages'
                          colorScheme='teal'
                          variant='solid'
                          mx="2"
                          onClick={() => onLoadEntityMessages(entity.id)}
                        />

                        <IconButton
                          icon={<EditIcon/>}
                          size="xs"
                          aria-label='Edit'
                          colorScheme='teal'
                          variant='solid'
                          mx="2"
                          onClick={() => onEditEntity(entity)}
                        />
                      </Stack>
                    </Stack>
                  )
                })}
              </Stack>
            </Stack>
          </Stack>
        )
      })}
    </Stack>
  )
}


export default EntitiesByTypeTable