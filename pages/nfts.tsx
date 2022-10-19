import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import { useEffect, useState } from 'react'
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
  useColorModeValue,
} from '@chakra-ui/react'
import { FaChartLine } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'
import CreatableSelect from 'react-select/creatable'
import { ActionMeta, OnChangeValue } from 'react-select'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import { ChartRangeFilters } from './nftchart'

import ProjectRuleService from '../services/projectRule.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import { ProjectRule, UpsertProjectRule } from '../types/projectRules'
import { useGlobalState } from '../services/gloablState'
import moment from 'moment-timezone'

interface TagOption {
  value: string,
  label: string,
}

const ActionsMode = 'Actions'
const BulkUpdateStopLoss = 'Bulk Update Stop Loss / Gain %s'
const BulkUpdatePctList = 'Bulk Update % Listings'

const Modes = [
  ActionsMode,
  BulkUpdateStopLoss,
  BulkUpdatePctList,
]

// let numberTimer = undefined as NodeJS.Timeout | undefined

const Home: NextPage = () => {
  const router = useRouter()
  const animatedComponents = makeAnimated()
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const [tagsFilter, setTagsFilter] = useState(['landing'])
  const [projectRules, setProjectRules] = useGlobalState('projectRules')
  const [availTags, setAvailTags] = useGlobalState('tags')
  const [projRuleUpdate, setProjRuleUpdate] = useState({} as UpsertProjectRule)
  const [, setConfirmModal] = useGlobalState('confirmModal')
  const [selectedRules, setSelectedRules] = useState(undefined as {[key: string]: ProjectRule | undefined} | undefined)
  const [selectedMode, setSelectedMode] = useState(ActionsMode as string | undefined)
  const [bulkSupporBreakPct, setBulkSupportBreakPct] = useState(25 as number | null)
  const [bulkStopPct, setBulkStopPct] = useState(5 as number | null)
  const [bulkListPct, setBulkListPct] = useState(5 as number | null)

  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()
  const {
    isOpen: isRefreshingProjRules,
    onOpen: onRefreshingProjRules,
    onClose: onDoneRefreshingProjRules,
  } = useDisclosure()
  const {
    isOpen: isDeleting,
    onOpen: onDeleting,
    onClose: onDeleted,
  } = useDisclosure()
  const {
    isOpen: isBulkStopLoss,
    onOpen: onBulkStopLoss,
    onClose: onDidBulkStopLoss,
  } = useDisclosure()
  const {
    isOpen: isBulkPctList,
    onOpen: onBulkPctList,
    onClose: onDidBulkPctList,
  } = useDisclosure()

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      setAccessToken( sessionData?.token?.access_token )
      onLoadProjRules()
    }
  }, [sessionData?.token?.id])

  useEffect(() => {
    onLoadProjRules()
  }, [tagsFilter])

  const onLoadProjRules = async () => {
    if ( !sessionData || isRefreshingProjRules ) {
      return
    }
    onRefreshingProjRules()
    const resp = await ProjectRuleService.getProfileStats(tagsFilter.join(','))
    if ( resp ) {
      const { profileStats, tags } = resp
      setProjectRules( profileStats.sort((a,b) => ((b.stats?.floor_price || 0) - (a.stats?.floor_price || 0))) )
      setAvailTags( tags )
    }
    onDoneRefreshingProjRules()
  }

  const onChangeProjRule = ( ruleId: string, key: string, value: any ) => {
    console.log('onChangeProjRule', ruleId, key, value )
    const rule = projectRules.find( rule => rule._id === ruleId )
    if ( !rule ) return
    let update = { ...projRuleUpdate }
    if ( projRuleUpdate._id !== rule._id) {
      update = { _id: rule._id }
    }
    // @ts-ignore: dynamic access
    update[key] = value
    setProjRuleUpdate( update )
  }

  const onChangeProjRules = ( ruleId: string, keys: string[], values: any[] ) => {
    console.log('onChangeProjRule', ruleId, keys, values )
    const rule = projectRules.find( rule => rule._id === ruleId )
    if ( !rule ) return
    let update = { ...projRuleUpdate }
    if ( projRuleUpdate._id !== rule._id) {
      update = { _id: rule._id }
    }

    keys.forEach((key,i) => {
      const value = values[i]
      // @ts-ignore: dynamic access
      update[key] = value
    })
    setProjRuleUpdate( update )
  }

  const onUpdateProjRule = async () => {
    if ( !projRuleUpdate._id ) return
    onUpdating()
    const updatedRule = await ProjectRuleService.updateRule(projRuleUpdate._id, projRuleUpdate)
    if ( updatedRule ) {
      onLoadProjRules()
      setProjRuleUpdate({} as UpsertProjectRule)
      toast.success('Updated NFT Rule!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onUpdated()
  }

  const onChangeTags = ( ruleId: string ) => (
    newValue: OnChangeValue<TagOption, true>,
  ) => {
    const rule = projectRules.find( rule => rule._id === ruleId )
    if ( !rule ) return
    onChangeProjRule( ruleId, 'tags', newValue.map( v => v.value ) )
  }

  const onChangeTagsFilter = (
    newValue: unknown,
    actionMeta: ActionMeta<unknown>
  ) => {
    const selected = newValue as TagOption[]
    setTagsFilter([...selected.map( opt => opt.value ) as string[]])
  }

  const onDelete = (projRule: ProjectRule) => () => {
    const projName = projRule.stats?.project?.display_name || "?"
    setConfirmModal({
      message: `Are you sure you want to delete the rule for ${ projName }?`,
      callback: async () => {
        if ( isDeleting ) {
          return
        }
        onDeleting()
        await ProjectRuleService.deleteRule( projRule._id )
        setConfirmModal(undefined)
        onDeleted()
        onLoadProjRules()
      }
    })
  }

  const onSelectMode = (mode: string | undefined) => {
    if ( mode && [BulkUpdateStopLoss as string, BulkUpdatePctList as string].includes( mode )) {
      setSelectedRules({})
    }
    setSelectedMode(mode)
  }

  const onOpenNftChart = (projRule: ProjectRule, filterId: string) => {
    router.push(`nftchart/?projId=${projRule.projectId}&filterId=${filterId}`)
  }

  const onSelectAll = (selected: boolean) => {
    if ( selected ) {
      setSelectedRules(projectRules.reduce((acc, projRule) => {
        acc[projRule._id] = projRule
        return acc
      }, {} as { [key: string]: ProjectRule}))
    } else {
      setSelectedRules({})
    }
  }

  const onBulkUpdateStopLoss = async () => {
    if ( isBulkStopLoss || !selectedRules ) {
      return
    }
    onBulkStopLoss()
    const bulkRules = Object.values( selectedRules )
    for (let i=0; i < bulkRules.length; i++ ) {
      const projRule = bulkRules[i]
      if ( !projRule ) continue
      await ProjectRuleService.updateRule(projRule._id, {
        _id: projRule._id,
        supportBreakPct: bulkSupporBreakPct,
        stopPct: bulkStopPct,
      })
    }
    onDidBulkStopLoss()
    onSelectMode(undefined)
    setSelectedRules(undefined)
    onLoadProjRules()
    onSelectMode(ActionsMode)
  }

  const onBulkUpdatePctList = async () => {
    if ( isBulkPctList || !selectedRules ) {
      return
    }
    onBulkPctList()
    const bulkRules = Object.values( selectedRules )
    for (let i=0; i < bulkRules.length; i++ ) {
      const projRule = bulkRules[i]
      if ( !projRule ) continue
      await ProjectRuleService.updateRule(projRule._id, {
        _id: projRule._id,
        pctListingChange: bulkListPct,
      })
    }
    onDidBulkPctList()
    onSelectMode(undefined)
    setSelectedRules(undefined)
    onLoadProjRules()
    onSelectMode(ActionsMode)
  }

  console.log('nfts', projRuleUpdate )

  return (
    <div className={styles.container}>
      <Head>
        <title>NFADYOR</title>
        <meta name="description" content="notfinancialadvicedoyourownresearch" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main} >

        <Text fontSize='lg' marginY="4" fontWeight="bold" textDecoration="underline">
          NFT Rules
        </Text>

        <Select
          closeMenuOnSelect={false}
          components={animatedComponents}
          value={tagsFilter.map( f => ({ value: f, label: f }))}
          onChange={ onChangeTagsFilter }
          options={availTags.map( t => ({ value: t, label: t }))}
          isMulti
        />

        <SelectOptions
          size="sm"
          mt="4"
          onChange={ e => onSelectMode(e.target.value)} value={selectedMode}
        >
          { Modes.map( mode => (
            <option key={mode} value={mode}> { mode }</option>
          ))}
        </SelectOptions>

        <Stack direction="row" mt="2" alignItems="center" alignContent="center" justifyContent="center">
          { selectedMode === BulkUpdateStopLoss &&
            <>
              <Stack direction="column" alignItems="center" alignContent="center" justifyContent="left" m="2">
                <FormLabel fontSize="xs">Support Break%</FormLabel>
                <NumberInput
                  thousandSeparator={false}
                  value={ bulkSupporBreakPct }
                  onValueChange={ value => setBulkSupportBreakPct(value)}
                />
              </Stack>

              <Stack direction="column" alignItems="center" alignContent="center" justifyContent="left" m="2">
                <FormLabel fontSize="xs">Stop%</FormLabel>
                <NumberInput
                  thousandSeparator={false}
                  value={ bulkStopPct }
                  onValueChange={ value => setBulkStopPct(value)}
                />
              </Stack>

              <Button
                isLoading={isBulkStopLoss}
                loadingText='Updating...'
                marginY="4"
                colorScheme='yellow'
                variant='solid'
                onClick={onBulkUpdateStopLoss}
              >
                Save
              </Button>
            </>
          }

          { selectedMode === BulkUpdatePctList &&
            <>
              <Stack direction="column" alignItems="center" alignContent="center" justifyContent="left" m="2">
                <FormLabel fontSize="xs">Listing % Change</FormLabel>
                <NumberInput
                  thousandSeparator={false}
                  value={ bulkListPct }
                  onValueChange={ value => setBulkListPct(value)}
                />
              </Stack>

              <Button
                isLoading={isBulkPctList}
                loadingText='Updating...'
                marginY="4"
                colorScheme='yellow'
                variant='solid'
                onClick={onBulkUpdatePctList}
              >
                Save
              </Button>
            </>
          }
        </Stack>

        { projectRules && projectRules.length > 0 &&
          <Box mt="6">
            { selectedRules &&
              <Stack direction="row" mt="2" alignItems="center" alignContent="right" justifyContent="right" width="full">
                <FormLabel>
                  Select All
                </FormLabel>
                <Checkbox
                  background="white"
                  isChecked={ Object.keys( selectedRules ).length === projectRules.length }
                  onChange={ e => onSelectAll(e.target.checked) }
                  borderRadius="lg"
                  size="lg"
                />
              </Stack>
            }

            <Accordion minWidth="full" allowMultiple={true} defaultIndex={[]} mt="1">
              { projectRules.map( projRule => {
                const combined = projRule && projRuleUpdate._id === projRule._id ? { ...projRule, ...projRuleUpdate } : projRule
                const projName = projRule.stats?.project?.display_name || "?"
                return(
                  <AccordionItem key={projRule._id}>
                    <AccordionButton _expanded={{ bg: 'blue.500', color: 'white' }} minWidth="full">
                      <Box flex='1' textAlign='left'>
                        { projName }
                      </Box>
                      { (projRule.stats?.floor_price_1day_change || 0) > 0 ?
                        <IoMdArrowDropup color="green" size="35"/>
                        :
                        <IoMdArrowDropdown color="red" size="35"/>
                      }

                      { projRule.stats?.floor_price?.toFixed(2) || "?" } ({ ((projRule.stats?.percentage_of_token_listed || 0.0) * 100).toFixed(1) }%)

                      { selectedRules &&
                        <Checkbox
                          background="white"
                          isChecked={ !!selectedRules[projRule._id] }
                          onChange={ e => setSelectedRules({ ...selectedRules, [projRule._id]: e.target.checked ? projRule : undefined }) }
                          borderRadius="lg"
                          size="lg"
                        />
                      }
                    </AccordionButton>

                    <AccordionPanel minWidth="full" py="3" px="2" bg="blue.100">
                      <Stack direction="row" fontSize="sm" fontWeight="bold">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Active?</FormLabel>
                          <Checkbox
                            background="white"
                            isChecked={ combined.active }
                            onChange={ e => onChangeProjRule( projRule._id, 'active', e.target.checked ) }
                            borderRadius="lg"
                            size="lg"
                          />
                        </Stack>

                        <FormControl fontSize="sm">
                          <SelectOptions
                            size="sm"
                            fontSize="sm"
                            icon={<FaChartLine />}
                            background="white"
                            borderRadius="lg"
                            onChange={ e => onOpenNftChart(projRule, e.target.value) }
                          >
                            <option value="">Chart</option>
                            { ChartRangeFilters.map( ({ id }) => <option
                              key={id}
                              value={id}
                            >
                              { id }
                            </option> )}
                          </SelectOptions>
                        </FormControl>
                      </Stack>

                      <FormControl>
                        <FormLabel>
                          Tags
                        </FormLabel>
                        <CreatableSelect
                          isMulti
                          onChange={onChangeTags( projRule._id )}
                          value={(combined.tags || []).map( t => ({ value: t, label: t }))}
                          options={availTags.map( t => ({ value: t, label: t }))}
                        />
                      </FormControl>

                      <Stack direction="row" mt="2" mb="1">
                        <Stat>
                          <StatLabel>Floor</StatLabel>
                          <StatNumber>{ projRule.stats?.floor_price?.toFixed(2) || "?" }</StatNumber>
                          <StatHelpText>{ projRule.stats?.floor_price_1day_change?.toFixed(2) || "?" } 1 day change</StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Listed ({ ((projRule.stats?.num_of_token_listed || 1) / (projRule.stats?.percentage_of_token_listed || 1)).toFixed() } total)</StatLabel>
                          <StatNumber>{ ((projRule.stats?.percentage_of_token_listed || 0.0) * 100).toFixed(1) }%</StatNumber>
                          <StatHelpText>{ projRule.stats?.num_of_token_listed || "?" } listed | { projRule.stats?.num_of_token_holders || "?" } holders</StatHelpText>
                        </Stat>
                      </Stack>

                      <Stack direction="row" py="1">
                        <Stat>
                          <StatLabel>Vol 1Hr</StatLabel>
                          <StatNumber>{ projRule.stats?.volume_1hr || "?" }</StatNumber>
                        </Stat>

                        <Stat>
                          <StatLabel>Vol 1Day</StatLabel>
                          <StatNumber>{ projRule.stats?.volume_1day }</StatNumber>
                          <StatHelpText>{ ((projRule.stats?.volume_1day_change || 0.0) * 100).toFixed(1) }% change</StatHelpText>
                        </Stat>
                      </Stack>

                      <Stack direction="row" py="1">
                        <Stat>
                          <StatLabel>Last Support</StatLabel>
                          <StatNumber>{ projRule.lastSupport?.toFixed( 2 ) || "N/A" }</StatNumber>
                        </Stat>

                        <Stat>
                          <StatLabel>Low</StatLabel>
                          <StatNumber>{ projRule.newSupportLowTest?.toFixed( 2 ) || "N/A" }</StatNumber>
                        </Stat>

                        <Stat>
                          <StatLabel>High</StatLabel>
                          <StatNumber>{ projRule.newSupportHighTest?.toFixed( 2 ) || "N/A" }</StatNumber>
                        </Stat>
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold" my="2">
                        <Stack direction="column">
                          <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                            <FormLabel fontSize="sm">Support Break%</FormLabel>
                            <NumberInput
                              thousandSeparator={false}
                              value={ combined.supportBreakPct }
                              onValueChange={ value => {
                                const keys = ['supportBreakPct']
                                const values = [value]
                                if ( combined.stopPct == null && value !== null ) {
                                  keys.push('stopPct')
                                  values.push(value * .2)
                                }
                                onChangeProjRules( projRule._id, keys, values )
                              }}
                            />
                          </Stack>

                          <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                            <FormLabel fontSize="sm">Stop%</FormLabel>
                            <NumberInput
                              thousandSeparator={false}
                              value={ combined.stopPct }
                              onValueChange={ value => onChangeProjRule( projRule._id, 'stopPct', value )}
                            />
                          </Stack>
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Custom Support</FormLabel>
                          <NumberInput
                            thousandSeparator={false}
                            value={ combined.customSupport }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'customSupport', value )}
                          />
                        </Stack>
                      </Stack>

                      { (combined.supportHistory?.length || 0) > 0 &&
                        <FormControl fontSize="sm">
                          <SelectOptions size="sm"
                            fontSize="sm"
                            background="white"
                            borderRadius="lg"
                          >
                            <option value="">Support History</option>
                            { (combined?.supportHistory || []).map( ({ timestamp, floor }) => <option
                              key={timestamp}
                            >
                              { floor } @ { moment( timestamp ).format('MMM D hh:mm a') }
                            </option> )}
                          </SelectOptions>
                        </FormControl>
                      }

                      <Stack direction="row" fontSize="sm" fontWeight="bold" my="2">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Fixed Change</FormLabel>
                          <NumberInput
                            thousandSeparator={true}
                            value={ combined.fixedPriceChange }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'fixedPriceChange', value )}
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Crit Change</FormLabel>
                          <NumberInput
                            thousandSeparator={true}
                            value={ combined.critFixedPriceChange }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'critFixedPriceChange', value )}
                          />
                        </Stack>
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold" my="2">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Floor Below</FormLabel>
                          <NumberInput
                            thousandSeparator={true}
                            value={ combined.floorBelow }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'floorBelow', value )}
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">On?</FormLabel>
                          <Checkbox
                            background="white"
                            isChecked={ combined.floorBelowOn }
                            onChange={ e => onChangeProjRule( projRule._id, 'floorBelowOn', e.target.checked ) }
                            borderRadius="lg"
                            size="lg"
                          />
                        </Stack>
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold" my="2">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Floor Above</FormLabel>
                          <NumberInput
                            thousandSeparator={true}
                            value={ combined.floorAbove }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'floorAbove', value )}
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">On?</FormLabel>
                          <Checkbox
                            background="white"
                            isChecked={ combined.floorAboveOn }
                            onChange={ e => onChangeProjRule( projRule._id, 'floorAboveOn', e.target.checked ) }
                            borderRadius="lg"
                            size="lg"
                          />
                        </Stack>
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold" my="2">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Listing % Change</FormLabel>
                          <NumberInput
                            thousandSeparator={true}
                            value={ combined.pctListingChange }
                            onValueChange={ value => onChangeProjRule( projRule._id, 'pctListingChange', value )}
                          />
                        </Stack>
                      </Stack>

                      <Button
                        isLoading={isDeleting}
                        loadingText='Deleting...'
                        marginY="4"
                        colorScheme='red'
                        variant='solid'
                        onClick={onDelete( projRule )}
                      >
                        Delete
                      </Button>

                      { projRule._id === projRuleUpdate._id &&
                        <Button
                          isLoading={isUpdating}
                          loadingText='Saving...'
                          mx="4"
                          colorScheme='teal'
                          variant='solid'
                          onClick={onUpdateProjRule}
                        >
                          Save
                        </Button>
                      }

                    </AccordionPanel>
                  </AccordionItem>
                )
              })}
            </Accordion>
          </Box>
        }
      </main>

      <Box className={styles.footer}>
          <Box position="fixed" zIndex="sticky" bottom="0" bg={useColorModeValue('gray.100', 'gray.900')} width="full" pb="4">
            { sessionData?.token?.id &&
              <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
                <Button
                  isLoading={isRefreshingProjRules}
                  loadingText='Refreshing...'
                  colorScheme="teal"
                  variant='solid'
                  onClick={onLoadProjRules}
                >
                  Refresh
                </Button>
              </Stack>
            }
          </Box>
      </Box>
    </div>
  )
}

export default Home
