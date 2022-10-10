import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import React, { useEffect, useState } from 'react'
import Moment from 'moment-timezone'
import { useRouter } from 'next/router'
import {
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
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
  Textarea,
  InputRightAddon,
  InputLeftAddon,
  InputGroup,
} from '@chakra-ui/react'
import { FaChartLine } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'
import CreatableSelect from 'react-select/creatable'
import { ActionMeta, OnChangeValue } from 'react-select'
// import Select, { OptionsOrGroups, GroupBase } from 'react-select'
import makeAnimated from 'react-select/animated'
import DatePicker from "react-datepicker"
import moment from 'moment-timezone'

import { ChartRangeFilters } from './nftchart'
import ProjectRuleService from '../services/projectRule.service'
import alphaService, { SearchAliasesReq } from '../services/alpha.service'
import { EntityType, EntityTypes, IEntityAlias, IUpdateEntityAlias } from '../types/alpha'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import { ProjectRule, UpsertProjectRule } from '../types/projectRules'
import { useGlobalState } from '../services/gloablState'
import NumberInput from '../components/NumberInput'

const getDefaultSearch = (): SearchAliasesReq => {
  return {
    limit: 25,
    ignore: false,
    after: Moment().add(-24, 'hours').toISOString(),
    orderBy: OrderOption.COUNT,
    orderDirection: OrderDirection.DESC,
  }
}

enum OrderOption {
  COUNT = "COUNT",
  TIMESTAMP = "TIMESTAMP",
}
enum OrderDirection {
  ASC = "ASC",
  DESC = "DESC",
}

const Home: NextPage = () => {
  const router = useRouter()
  const animatedComponents = makeAnimated()
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any

  const [searchEntityAlias, setSearchEntityAlias] = useState(getDefaultSearch() as SearchAliasesReq)
  const [entityAliases, setEntityAliases] = useState([] as IEntityAlias[])
  const [updateAlias, setUpdateAlias] = useState({} as IUpdateEntityAlias)

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
    isOpen: isUpdatingAliases,
    onOpen: onUpdatingAliases,
    onClose: endUpdatingAliases,
  } = useDisclosure()


  useEffect(() => {
    if ( sessionData?.token?.id ) {
      setAccessToken( sessionData?.token?.access_token )
      onLoadAliases()
    }
  }, [sessionData?.token?.id])

  const onLoadAliases = async () => {
    if ( !sessionData || isLoadingAliases ) {
      return
    }
    onLoadingAliases()
    const resp = await alphaService.searchAliases(searchEntityAlias)
    if ( resp ) {
      setEntityAliases(resp)
      // setSearchEntityAlias({})
    }
    endLoadingAliases()
  }

  const onUpdateAlias = async (aliasId: number, key: string, value: any) => {
    onUpdatingAliases()
    const updatedAlias = await alphaService.updateEntityAlias(aliasId, { [key]: value })
    if ( updatedAlias ) {
      const idx = entityAliases.findIndex( alias => alias.id === aliasId )
      setEntityAliases([
        ...entityAliases.slice(0, idx),
        updatedAlias,
        ...entityAliases.slice(idx+1, entityAliases.length),
      ])
      setUpdateAlias({})
      toast.success('Updated Alias!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    endUpdatingAliases()
    onLoadAliases()
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>NFADYOR</title>
        <meta name="description" content="notfinancialadvicedoyourownresearch" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

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
                <FormLabel fontSize="sm"> After </FormLabel>
                <FormControl>
                  <DatePicker
                    className="filter-calendar full-width"
                    selected={ searchEntityAlias.after ? Moment( searchEntityAlias.after ).toDate() : null }
                    dateFormat="Pp"
                    onChange={ date => setSearchEntityAlias({
                      ...searchEntityAlias,
                      after: date?.toISOString(),
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
                onLoadAliases()
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
              </Tr>
            </Thead>
            <Tbody py="4">
              { entityAliases.map( alias => {
                return(
                  <Tr key={alias.id}>
                    <Td>{ alias.name }</Td>
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
                  </Tr>
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
        { sessionData?.token?.id &&
          <Box position="fixed" zIndex="sticky" bottom="0" bg="blue.600" width="full" pb="4">
            <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
              <Button
                isLoading={isLoadingAliases}
                loadingText='Refreshing...'
                colorScheme="yellow"
                variant='solid'
                onClick={onLoadingAliases}
              >
                Refresh
              </Button>

              <Button
                colorScheme="yellow"
                variant='solid'
                onClick={onFilterAliasView}
              >
                Filter
              </Button>
            </Stack>
          </Box>
        }

        
      </Box>
    </div>
  )
}

export default Home
