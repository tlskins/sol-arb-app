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
  Select as SelectOptions,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
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
  useColorModeValue,
} from '@chakra-ui/react'
import { ChevronLeftIcon, ChevronRightIcon, ChatIcon, EditIcon, LinkIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify'
import DatePicker from "react-datepicker"
import moment from 'moment-timezone'

import { FilterDateRange, DftFilterDateRanges, filterDateToISOString, OrderOption, OrderDirection } from '../services/helpers'
import alphaService, { SearchAliasesReq } from '../services/alpha.service'
import { EntityType, EntityTypes, IEntityAlias, IMessage, IEntity } from '../types/alpha'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import MessageList from '../components/MessageList'
import EntityFinder from '../components/EntityFinder'


const searchLimit = 25

const getDefaultSearch = (): SearchAliasesReq => {
  return {
    limit: searchLimit,
    offset: 0,
    ignore: false,
    after: FilterDateRange.Hours12,
    orderBy: OrderOption.COUNT,
    orderDirection: OrderDirection.DESC,
  }
}
interface IAliasMessagesMap {
  [key: string]: IMessage[] | undefined
}

const Home: NextPage = () => {
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any

  const [refreshSearch, setRefreshSearch] = useState(true)
  const [searchEntityAlias, setSearchEntityAlias] = useState(getDefaultSearch() as SearchAliasesReq)
  const [entityAliases, setEntityAliases] = useState([] as IEntityAlias[])
  const [aliasMessagesMap, setAliasMessagesMap] = useState({} as IAliasMessagesMap)
  const [viewMsgs, setViewMsgs] = useState([] as IMessage[])
  const [viewMsgsTitle, setViewMsgsTitle] = useState("")
  const [taggingAlias, setTaggingAlias] = useState(undefined as IEntityAlias | undefined)

  const {
    isOpen: isFilterAliasView,
    onOpen: onFilterAliasView,
    onClose: endFilterAliasView,
  } = useDisclosure()
  const {
    isOpen: isLoadingAliases,
    onOpen: onLoadingAliases,
    onClose: endLoadingAliases,
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
      onLoadAliases()
      setRefreshSearch(false)
    }
  }, [sessionData?.token?.id, refreshSearch])

  const onLoadAliases = async () => {
    if ( !sessionData || isLoadingAliases ) {
      return
    }
    onLoadingAliases()
    const { before, after } = searchEntityAlias
    const resp = await alphaService.searchAliases({
      ...searchEntityAlias,
      before: before && filterDateToISOString( before ),
      after: after && filterDateToISOString( after ),
    })
    if ( resp ) {
      setEntityAliases(resp)
    }
    endLoadingAliases()
  }

  const onUpdateAlias = async (aliasId: number, key: string, value: any) => {
    const updatedAlias = await alphaService.updateEntityAlias(aliasId, { [key]: value })
    if ( updatedAlias ) {
      replaceAlias( updatedAlias )
      toast.success('Updated Alias!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onLoadAliases()
  }

  const onLoadAliasMessages = (aliasId: number) => async () => {
    if ( !sessionData ) {
      return
    }
    const alias = entityAliases.find( alias => alias.id === aliasId )
    setViewMsgsTitle(`Messages containing "${ alias?.name || "?" }"`)
    setViewMsgs(aliasMessagesMap[aliasId] || [])
    onViewMsgs()
    const resp = await alphaService.searchMessages({
      aliasIds: aliasId.toString(),
      before: searchEntityAlias.before && filterDateToISOString( searchEntityAlias.before ),
      after: searchEntityAlias.after && filterDateToISOString( searchEntityAlias.after ),
      orderBy: "TIMESTAMP",
      orderDirection: "DESC",
      limit: 10,
    })
    if ( resp ) {
      setAliasMessagesMap({ ...aliasMessagesMap, [aliasId]: resp })
      setViewMsgs(resp)
    }
  }

  const onFoundEntityAndTag = async (entity: IEntity) => {
    if (!taggingAlias) return
    const updatedAlias = await alphaService.updateEntityAlias(taggingAlias.id, { entityId: entity.id })
    setTaggingAlias(undefined)
    if ( updatedAlias ) {
      replaceAlias( updatedAlias )
      toast.success('Updated Alias!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
  }

  const replaceAlias = (updatedAlias: IEntityAlias) => {
    const idx = entityAliases.findIndex( alias => alias.id === updatedAlias.id )
    const oldAlias = entityAliases[idx]
    setEntityAliases([
      ...entityAliases.slice(0, idx),
      { ...oldAlias, ...updatedAlias },
      ...entityAliases.slice(idx+1, entityAliases.length),
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
        entityId={taggingAlias?.entityId || undefined}
        isOpen={isShowEntityFinder}
        onClose={endShowEntityFinder}
        onFindEntity={onFoundEntityAndTag}
      />

      <Drawer
        isOpen={isFilterAliasView}
        placement='right'
        onClose={endFilterAliasView}
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth='1px'>
            Entity Alias Filters
          </DrawerHeader>

          <DrawerBody>
            <Stack spacing='24px'>
              <Box>
                <FormLabel fontSize="sm"> Entity Name </FormLabel>
                <FormControl>
                  <Input type="text"
                    value={ searchEntityAlias.entityAliasNameLike }
                    onChange={ e => setSearchEntityAlias({
                      ...searchEntityAlias,
                      entityAliasNameLike: e.target.value === "" ? undefined : e.target.value
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
                    onChange={ e => setSearchEntityAlias({
                      ...searchEntityAlias,
                      entityType: e.target.value === "" ? undefined : e.target.value,
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
                <FormLabel>Ignore</FormLabel>
                <FormControl fontSize="sm">
                  <Select size="sm"
                    fontSize="sm"
                    background="white"
                    borderRadius="lg"
                    value={searchEntityAlias.ignore === undefined ? "all" : (searchEntityAlias.ignore ? "true" : "false")}
                    onChange={ e => setSearchEntityAlias({
                      ...searchEntityAlias,
                      ignore: e.target.value === "all" ? undefined : e.target.value === "true",
                    }) }
                  >
                    <option value={"all"}> all </option>
                    <option value={"true"}> true </option>
                    <option value={"false"}> false </option>
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <FormLabel fontSize="sm"> Before </FormLabel>
                <FormControl>
                  <DatePicker
                    className="filter-calendar full-width"
                    selected={ searchEntityAlias.before ? Moment( searchEntityAlias.before ).toDate() : null }
                    dateFormat="Pp"
                    onChange={ date => setSearchEntityAlias({
                      ...searchEntityAlias,
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
                    value={ searchEntityAlias.after }
                    onChange={ e => setSearchEntityAlias({
                      ...searchEntityAlias,
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
                      value={ searchEntityAlias.countAbove }
                      onValueChange={ value => setSearchEntityAlias({ ...searchEntityAlias, countAbove: value == null ? undefined : value }) }
                    />
                  </Box>
                  <Box>
                    <FormLabel fontSize="sm"> Below </FormLabel>
                    <NumberInput
                      onlyInt={true}
                      maxWidth={50}
                      value={ searchEntityAlias.countBelow }
                      onValueChange={ value => setSearchEntityAlias({ ...searchEntityAlias, countBelow: value == null ? undefined : value }) }
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
                    value={searchEntityAlias.orderBy}
                    onChange={ e => setSearchEntityAlias({ ...searchEntityAlias, orderBy: e.target.value }) }
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
                    value={searchEntityAlias.orderDirection}
                    onChange={ e => setSearchEntityAlias({ ...searchEntityAlias, orderDirection: e.target.value }) }
                  >
                    <option value={OrderDirection.ASC}> asc </option>
                    <option value={OrderDirection.DESC}> desc </option>
                  </Select>
                </FormControl>
              </Box>
            </Stack>
          </DrawerBody>

          <DrawerFooter borderTopWidth='1px'>
            <Button variant='outline' mr={3} onClick={endFilterAliasView}>
              Cancel
            </Button>
            <Button colorScheme='blue'
              onClick={() => {
                setSearchEntityAlias({ ...searchEntityAlias, offset: 0 })
                setRefreshSearch(true)
                endFilterAliasView()
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
                <Th>Ignore</Th>
                <Th>Tag Entity</Th>
              </Tr>
            </Thead>
            <Tbody py="4">
              { entityAliases.map( alias => {
                return(
                  <>
                    <Tr key={alias.id}>
                      <Td>
                        <IconButton
                          icon={<ChatIcon/>}
                          size="xs"
                          aria-label='View messages'
                          colorScheme='teal'
                          variant='solid'
                          mr="1"
                          onClick={onLoadAliasMessages(alias.id)}
                        />
                        { alias.name }
                      </Td>
                      <Td isNumeric>{ alias.mentions }</Td>
                      <Td>{ alias.lastMention ? Moment(alias.lastMention).format('MMM D HH:mm a') : 'N/A' }</Td>
                      <Td>
                        <Checkbox
                          background="white"
                          isChecked={ !!alias.ignore }
                          onChange={ e => onUpdateAlias( alias.id, "ignore", e.target.checked ) }
                          borderRadius="lg"
                          size="lg"
                        />
                      </Td>
                      <Td>
                        { alias.entityName ?
                          <Button
                            size="xs"
                            aria-label='Update entity'
                            colorScheme='teal'
                            variant='solid'
                            mr="1"
                            onClick={() => {
                              onShowEntityFinder()
                              setTaggingAlias(alias)
                            }}
                          >
                            { alias.entityName }
                          </Button>
                          :
                          <IconButton
                            icon={<LinkIcon/>}
                            size="xs"
                            aria-label='Link entity to alias'
                            colorScheme='teal'
                            variant='solid'
                            mr="1"
                            onClick={() => {
                              onShowEntityFinder()
                              setTaggingAlias(alias)
                            }}
                          />
                        }
                      </Td>
                    </Tr>
                  </>
                )
              })}
            </Tbody>
            <Tfoot>
              <Tr>
                <Th>Total</Th>
                <Th>{ entityAliases.length }</Th>
                <Th />
              </Tr>
            </Tfoot>
          </Table>
        </TableContainer>
        
      </main>

      <Box className={styles.footer}>
        <Box position="fixed" zIndex="sticky" bottom="0" bg={useColorModeValue('gray.100', 'gray.900')} width="full" pb="4">
          <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
            { (searchEntityAlias?.offset || 0) > 0 &&
              <IconButton
                icon={<ChevronLeftIcon/>}
                size="xs"
                aria-label='Prev page'
                colorScheme='teal'
                variant='solid'
                mr="1"
                onClick={() => {
                  setSearchEntityAlias({ ...searchEntityAlias, offset: (searchEntityAlias?.offset || 0) - searchLimit })
                  onLoadAliases()
                }}
              />
            }

            <Button
              isLoading={isLoadingAliases}
              loadingText='Refreshing...'
              colorScheme='teal'
              variant='solid'
              onClick={onLoadAliases}
            >
              Refresh
            </Button>

            <Text color="teal.800" fontWeight="bold">
              Page { (((searchEntityAlias?.offset || 0) / searchLimit) + 1).toFixed(0) }
            </Text>

            <Button
              colorScheme='teal'
              variant='solid'
              onClick={onFilterAliasView}
            >
              Filter
            </Button>

            { (entityAliases.length % searchLimit) === 0 &&
              <IconButton
                icon={<ChevronRightIcon/>}
                size="xs"
                aria-label='Prev page'
                colorScheme='teal'
                variant='solid'
                mr="1"
                onClick={() => {
                  setSearchEntityAlias({ ...searchEntityAlias, offset: (searchEntityAlias?.offset || 0) + searchLimit })
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
