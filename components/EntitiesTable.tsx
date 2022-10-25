import React from 'react'
import Moment from 'moment-timezone'
import {
  Text,
  IconButton,
  Table,
  TableContainer,
  Thead,
  Th,
  Tr,
  Tbody,
  Td,
  Tfoot,
  Link,
} from '@chakra-ui/react'
import { ChatIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons'

import { IEntity } from '../types/alpha'


const EntitiesTable = ({
  entities,
  onLoadEntityMessages,
  onEditEntity,
} : {
  entities: IEntity[],
  onLoadEntityMessages: (entityId: number) => () => {},
  onEditEntity: (entity: IEntity) => void,
}) => {
  return(
    <TableContainer>
      <Table size='sm'>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th isNumeric>Mentions</Th>
            <Th>Last Mention</Th>
            <Th>Type</Th>
            <Th>Marketplace</Th>
            <Th>Edit</Th>
          </Tr>
        </Thead>
        <Tbody py="4">
          { entities.map( entity => {
            return(
              <>
                <Tr key={entity.id}>
                  <Td>
                    <IconButton
                      icon={<ChatIcon/>}
                      size="xs"
                      aria-label='View messages'
                      colorScheme='teal'
                      variant='solid'
                      mr="1"
                      onClick={onLoadEntityMessages(entity.id)}
                    />
                    { entity.name }
                  </Td>
                  <Td isNumeric>{ entity.mentions }</Td>
                  <Td>{ entity.lastMention ? Moment(entity.lastMention).format('ddd, MMM Do, h:mm a') : 'N/A' }</Td>
                  <Td>
                    <Text>
                      { entity.type }
                    </Text>
                  </Td>
                  <Td>
                    { entity.hyperspaceUrl &&
                      <Link href={entity.hyperspaceUrl} isExternal>
                        <ExternalLinkIcon mx='2px' />
                      </Link>
                    }
                  </Td>
                  <Td>
                    <IconButton
                      icon={<EditIcon/>}
                      size="xs"
                      aria-label='Edit'
                      colorScheme='teal'
                      variant='solid'
                      mr="1"
                      onClick={() => onEditEntity(entity)}
                    />
                  </Td>
                </Tr>
              </>
            )
          })}
        </Tbody>
        <Tfoot>
          <Tr>
            <Th>Total</Th>
            <Th>{ entities.length }</Th>
            <Th />
          </Tr>
        </Tfoot>
      </Table>
    </TableContainer>
  )
}


export default EntitiesTable