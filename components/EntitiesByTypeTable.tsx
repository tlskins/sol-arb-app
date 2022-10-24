import React, { useEffect, useState } from 'react'
import {
  Button,
  FormLabel,
  Stack,
} from '@chakra-ui/react'

import { IEntity } from '../types/alpha'

interface IEntitiesByType {
  type: string,
  entities: IEntity[],
}

const EntitiesByTypeTable = ({
  entities,
  onSelectEntity,
} : {
  entities: IEntity[],
  onSelectEntity: (entity: IEntity) => void,
}) => {
  const [entitiesByType, setEntitiesByType] = useState([] as IEntitiesByType[])

  useEffect(() => {
    if ( entities ) {
      const newEntitiesByType = [] as IEntitiesByType[]
      entities.forEach( entity => {
        let grouped = newEntitiesByType.find( t => t.type === entity.type )
        if ( !grouped && entity.type ) {
          grouped = { type: entity.type, entities: [] }
          newEntitiesByType.push( grouped )
        }
        if ( grouped ) {
          grouped.entities.push( entity )
        }
      })
      setEntitiesByType(newEntitiesByType)
    }
  }, [entities])

  return(
    <Stack direction="row"
      overflowX="scroll"
      width="full"
      p="2"
    >
      { entitiesByType.map( ({ type, entities }) => {
        return(
          <Stack key={type}
            direction="column"
            alignItems="center"
            alignContent="center"
            p="2"
            borderRight="1px"
            borderColor="gray.200"
          >
            <FormLabel fontSize="sm" fontWeight="bold" textDecoration="underline" borderRadius="md" bg="blue.100" py="1" px="2">
              { type }
            </FormLabel>
            { entities.map( entity => {
              return(
                <Button
                  key={entity.id}
                  size="xs"
                  colorScheme='teal'
                  variant='solid'
                  onClick={() => onSelectEntity(entity)}
                >
                  { entity.name } ({ entity.mentions || 0 })
                </Button>
              )
            })}
          </Stack>
        )
      })}
    </Stack>
  )
}


export default EntitiesByTypeTable