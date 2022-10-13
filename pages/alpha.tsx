import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import Moment from 'moment-timezone'
import {
  Flex,
  Box,
  Button,
  Text,
  FormLabel,
  Stack,
  Checkbox,
  useDisclosure,
  FormControl,
  Drawer,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  IconButton,
  Input,
  DrawerContent,
  DrawerFooter,
  Select,
  Table,
  TableContainer,
  Thead,
  Th,
  Tr,
  Tbody,
  Td,
  Tfoot,
  Link,
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon, ChatIcon, EditIcon, ExternalLinkIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify'
import DatePicker from "react-datepicker"

import { FilterDateRange, DftFilterDateRanges, filterDateToISOString, OrderOption, OrderDirection } from '../services/helpers'
import alphaService, { SearchEntitiesReq } from '../services/alpha.service'
import { EntityType, EntityTypes, IMessage, IEntity } from '../types/alpha'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import MessageList from '../components/MessageList'
import EntityFinder from '../components/EntityFinder'


const searchLimit = 25

const getDefaultSearch = (): SearchEntitiesReq => {
  return {
    limit: searchLimit,
    type: `${EntityType.Alpha},${EntityType.Premint},${EntityType.Project},${EntityType.Trading}`,
    offset: 0,
    after: FilterDateRange.Hours12,
    orderBy: OrderOption.COUNT,
    orderDirection: OrderDirection.DESC,
  }
}

interface IEntityMessagesMap {
  [key: string]: IMessage[] | undefined
}

const Home: NextPage = () => {
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any

  const [refreshSearch, setRefreshSearch] = useState(true)
  const [searchEntity, setSearchEntity] = useState(getDefaultSearch() as SearchEntitiesReq)
  const [entities, setEntities] = useState([] as IEntity[])
  const [editEntity, setEditEntity] = useState(undefined as IEntity | undefined)
  const [entityMessagesMap, setEntityMessagesMap] = useState({} as IEntityMessagesMap)
  const [viewMsgs, setViewMsgs] = useState([] as IMessage[])
  const [viewMsgsTitle, setViewMsgsTitle] = useState("")

  const {
    isOpen: isFilterView,
    onOpen: onFilterView,
    onClose: endFilterView,
  } = useDisclosure()
  const {
    isOpen: isLoadingEntities,
    onOpen: onLoadingEntities,
    onClose: endLoadingEntities,
  } = useDisclosure()
  const {
    isOpen: isViewMsgs,
    onOpen: onViewMsgs,
    onClose: endViewMsgs,
  } = useDisclosure()
  const {
    isOpen: isShowEntityFinder,
    onOpen: onShowEntityFinder,
    onClose: endShowEntityFinder,
  } = useDisclosure()

  useEffect(() => {
    if ( sessionData?.token?.id && refreshSearch) {
      setAccessToken( sessionData?.token?.access_token )
      onLoadEntities()
      setRefreshSearch(false)
    }
  }, [sessionData?.token?.id, refreshSearch])

  const onLoadEntities = async () => {
    if ( !sessionData || isLoadingEntities ) {
      return
    }
    onLoadingEntities()
    const { before, after } = searchEntity
    const resp = await alphaService.searchEntities({
      ...searchEntity,
      before: before && filterDateToISOString( before ),
      after: after && filterDateToISOString( after ),
    })
    endLoadingEntities()
    if ( resp ) {
      setEntities(resp)
    }
  }

  const onUpdateEntity = async (entityId: number, key: string, value: any) => {
    const updatedEntity = await alphaService.updateEntity(entityId, { id: entityId, [key]: value })
    if ( updatedEntity ) {
      replaceEntity( updatedEntity )
      toast.success('Updated Entity!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onLoadEntities()
  }

  const onLoadEntityMessages = (entityId: number) => async () => {
    if ( !sessionData ) {
      return
    }
    const entity = entities.find( entity => entity.id === entityId )
    setViewMsgsTitle(`Messages containing "${ entity?.name || "?" }"`)
    setViewMsgs(entityMessagesMap[entityId] || [])
    onViewMsgs()
    const resp = await alphaService.searchMessages({
      entityIds: entityId.toString(),
      after: searchEntity.after && filterDateToISOString(searchEntity.after),
      before: searchEntity.before && filterDateToISOString(searchEntity.before),
      orderBy: "TIMESTAMP",
      orderDirection: "DESC",
      limit: 10,
    })
    if ( resp ) {
      setEntityMessagesMap({ ...entityMessagesMap, [entityId]: resp })
      setViewMsgs(resp)
    }
  }

  const onReloadEntity = async (entity: IEntity) => {
    const entities = await alphaService.searchEntities({ id: entity.id })
    if ( entities && entities.length > 0 ) {
      replaceEntity(entities[0])
      toast.success('Updated Entity!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
  }

  const replaceEntity = (updatedEntity: IEntity) => {
    const idx = entities.findIndex( entity => entity.id === updatedEntity.id )
    const oldEntity = entities[idx]
    setEntities([
      ...entities.slice(0, idx),
      { ...oldEntity, ...updatedEntity },
      ...entities.slice(idx+1, entities.length),
    ])
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NFADYOR</title>
        <meta name="description" content="notfinancialadvicedoyourownresearch" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <MessageList
        title={viewMsgsTitle}
        rootMessages={viewMsgs}
        isOpen={isViewMsgs}
        onClose={endViewMsgs}
      />

      <EntityFinder
        entityId={editEntity?.id || undefined}
        isOpen={isShowEntityFinder}
        onClose={endShowEntityFinder}
        onFindEntity={onReloadEntity}
      />

      <Drawer
        isOpen={isFilterView}
        placement='right'
        onClose={endFilterView}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth='1px'>
            Entity Filters
          </DrawerHeader>

          <DrawerBody>
            <Stack spacing='24px'>
              <Box>
                <FormLabel fontSize="sm"> Entity Name </FormLabel>
                <FormControl>
                  <Input type="text"
                    value={ searchEntity.name }
                    onChange={ e => setSearchEntity({
                      ...searchEntity,
                      name: e.target.value === "" ? undefined : e.target.value
                    }) }
                  />
                </FormControl>
              </Box>

              <Box>
                <FormLabel>Entity Type</FormLabel>
                <FormControl fontSize="sm">
                  <Select size="sm"
                    fontSize="sm"
                    background="white"
                    borderRadius="lg"
                    onChange={ e => setSearchEntity({
                      ...searchEntity,
                      type: e.target.value === "" ? undefined : e.target.value,
                    }) }
                  >
                    <option value={""}> None </option>
                    { EntityTypes.map( entityType => <option
                      key={entityType}
                      value={entityType}
                    >
                      { entityType }
                    </option> )}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormLabel fontSize="sm"> Before </FormLabel>
                <FormControl>
                  <DatePicker
                    className="filter-calendar full-width"
                    selected={ searchEntity.before ? Moment( searchEntity.before ).toDate() : null }
                    dateFormat="Pp"
                    onChange={ date => setSearchEntity({
                      ...searchEntity,
                      before: date?.toISOString(),
                    })}
                    showTimeSelect
                    timeFormat="HH:mm"
                    timeIntervals={60}
                    timeCaption="time"
                    isClearable
                  />
                </FormControl>
              </Box>

              <Box>
                <FormLabel fontSize="sm"> After </FormLabel>
                <FormControl>
                  <Select size="sm"
                    fontSize="sm"
                    background="white"
                    borderRadius="lg"
                    value={ searchEntity.after }
                    onChange={ e => setSearchEntity({
                      ...searchEntity,
                      after: e.target.value,
                    })}
                  >
                    { DftFilterDateRanges.map( filter => <option value={filter} key={filter}> { filter } </option>) }
                  </Select>
                </FormControl>
              </Box>

              <Stack direction="column">
                <Text> # Mentions </Text>
                <Stack direction="row">
                  <Box>
                    <FormLabel fontSize="sm"> Above </FormLabel>
                    <NumberInput
                      onlyInt={true}
                      maxWidth={50}
                      value={ searchEntity.countAbove }
                      onValueChange={ value => setSearchEntity({ ...searchEntity, countAbove: value == null ? undefined : value }) }
                    />
                  </Box>
                  <Box>
                    <FormLabel fontSize="sm"> Below </FormLabel>
                    <NumberInput
                      onlyInt={true}
                      maxWidth={50}
                      value={ searchEntity.countBelow }
                      onValueChange={ value => setSearchEntity({ ...searchEntity, countBelow: value == null ? undefined : value }) }
                    />
                  </Box>
                </Stack>
              </Stack>

              <Box>
                <FormLabel htmlFor='username'>Order By</FormLabel>
                <FormControl fontSize="sm">
                  <Select size="sm"
                    fontSize="sm"
                    background="white"
                    borderRadius="lg"
                    value={searchEntity.orderBy}
                    onChange={ e => setSearchEntity({ ...searchEntity, orderBy: e.target.value }) }
                  >
                    <option value={OrderOption.COUNT}> # mentions </option>
                    <option value={OrderOption.TIMESTAMP}> last mention </option>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormLabel htmlFor='username'>Order Direction</FormLabel>
                <FormControl fontSize="sm">
                  <Select size="sm"
                    fontSize="sm"
                    background="white"
                    borderRadius="lg"
                    value={searchEntity.orderDirection}
                    onChange={ e => setSearchEntity({ ...searchEntity, orderDirection: e.target.value }) }
                  >
                    <option value={OrderDirection.ASC}> asc </option>
                    <option value={OrderDirection.DESC}> desc </option>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth='1px'>
            <Button variant='outline' mr={3} onClick={endFilterView}>
              Cancel
            </Button>
            <Button colorScheme='blue'
              onClick={() => {
                onLoadEntities()
                endFilterView()
              }}
            >
              Search
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <main className={styles.main}>

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
                      <Td>{ entity.lastMention ? Moment(entity.lastMention).format('MMM D HH:mm a') : 'N/A' }</Td>
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
                          onClick={() => {
                            setEditEntity(entity)
                            onShowEntityFinder()
                          }}
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
        
      </main>

      <Box className={styles.footer}>
        <Box position="fixed" zIndex="sticky" bottom="0" bg={useColorModeValue('gray.100', 'gray.900')} width="full" pb="4">
          <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
            { (searchEntity?.offset || 0) > 0 &&
              <IconButton
                icon={<ChevronLeftIcon/>}
                size="xs"
                aria-label='Prev page'
                colorScheme='teal'
                variant='solid'
                mr="1"
                onClick={() => {
                  setSearchEntity({ ...searchEntity, offset: (searchEntity?.offset || 0) - searchLimit })
                  onLoadEntities()
                }}
              />
            }

            <Button
              isLoading={isLoadingEntities}
              loadingText='Refreshing...'
              colorScheme='teal'
              variant='solid'
              onClick={onLoadEntities}
            >
              Refresh
            </Button>

            <Text color="teal.800" fontWeight="bold">
              Page { (((searchEntity?.offset || 0) / searchLimit) + 1).toFixed(0) }
            </Text>

            <Button
              colorScheme='teal'
              variant='solid'
              onClick={onFilterView}
            >
              Filter
            </Button>

            { (entities.length % searchLimit) === 0 &&
              <IconButton
                icon={<ChevronRightIcon/>}
                size="xs"
                aria-label='Prev page'
                colorScheme='teal'
                variant='solid'
                mr="1"
                onClick={() => {
                  setSearchEntity({ ...searchEntity, offset: (searchEntity?.offset || 0) + searchLimit })
                  setRefreshSearch(true)
                }}
              />
            }
          </Stack>
        </Box>
      </Box>
    </div>
  )
}

export default Home
