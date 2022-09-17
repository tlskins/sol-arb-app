import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionIcon,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  Box,
  Button,
  Text,
  FormLabel,
  Stack,
  NumberInput,
  NumberInputField,
  Checkbox,
  useDisclosure,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  FormControl,
} from '@chakra-ui/react'
import { toast } from 'react-toastify'
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'
import CreatableSelect from 'react-select/creatable'
import { ActionMeta, OnChangeValue } from 'react-select'
import Select, { OptionsOrGroups, GroupBase } from 'react-select'
import makeAnimated from 'react-select/animated'

import ProjectRuleService from '../services/projectRule.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import { UpsertProjectRule } from '../types/projectRules'
import { useGlobalState } from '../services/gloablState'

interface TagOption {
  value: string,
  label: string,
}

const Home: NextPage = () => {
  const animatedComponents = makeAnimated()
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const [tagsFilter, setTagsFilter] = useState(['landing'])
  const [projectRules, setProjectRules] = useGlobalState('projectRules')
  const [availTags, setAvailTags] = useState([] as string[])
  const [projRuleUpdate, setProjRuleUpdate] = useState({} as UpsertProjectRule)
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
    if ( !sessionData ) {
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

  console.log('nfts', projRuleUpdate )

  return (
    <div className={styles.container}>
      <Head>
        <title>NFADYOR</title>
        <meta name="description" content="notfinancialadvicedoyourownresearch" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>

        <Text fontSize='lg' marginY="4" fontWeight="bold" textDecoration="underline">
          NFT Rules
        </Text>

        <Select
          closeMenuOnSelect={false}
          components={animatedComponents}
          defaultValue={tagsFilter.map( f => ({ value: f, label: f }))}
          onChange={ onChangeTagsFilter }
          options={availTags.map( t => ({ value: t, label: t }))}
          isMulti
        />

        { projectRules && projectRules.length > 0 &&
          <>
            <Accordion minWidth="full" allowMultiple={true} defaultIndex={[]} mt="6">
              { projectRules.map( projRule => {
                const combined = projRule && projRuleUpdate._id === projRule._id ? { ...projRule, ...projRuleUpdate } : projRule
                return(
                  <AccordionItem key={projRule._id}>
                    <AccordionButton _expanded={{ bg: 'blue.500', color: 'white' }} minWidth="full">
                      <Box flex='1' textAlign='left'>
                        { projRule.stats?.project?.display_name || "?" }
                      </Box>
                        { (projRule.stats?.floor_price_1day_change || 0) > 0 ?
                          <IoMdArrowDropup color="green" size="40"/>
                          :
                          <IoMdArrowDropdown color="red" size="40"/>
                        }
                        { projRule.stats?.floor_price?.toFixed(2) || "?" }
                      <AccordionIcon />
                    </AccordionButton>

                    <AccordionPanel minWidth="full" padding="0.5">
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
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Fixed Change</FormLabel>
                          <NumberInput
                            size="sm"
                            step={1.0}
                            defaultValue={ projRule.fixedPriceChange || 0.0 }
                            onBlur={ e => onChangeProjRule( projRule._id, 'fixedPriceChange', e.target.value ? parseFloat(e.target.value) : null) }
                          >
                            <NumberInputField borderRadius="lg" background="white"/>
                          </NumberInput>
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Crit. Fixed Change</FormLabel>
                          <NumberInput
                            size="sm"
                            step={1.0}
                            defaultValue={ projRule.critFixedPriceChange || undefined }
                            onBlur={ e => onChangeProjRule( projRule._id, 'critFixedPriceChange', e.target.value ? parseFloat(e.target.value) : null) }
                          >
                            <NumberInputField borderRadius="lg" background="white"/>
                          </NumberInput>
                        </Stack>
                      </Stack>

                      <Stack direction="row" fontSize="sm" fontWeight="bold">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Floor Below</FormLabel>
                          <NumberInput
                            size="sm"
                            step={1.0}
                            defaultValue={ projRule.floorBelow || undefined }
                            onBlur={ e => onChangeProjRule( projRule._id, 'floorBelow', e.target.value ? parseFloat(e.target.value) : null ) }
                          >
                            <NumberInputField borderRadius="lg" background="white"/>
                          </NumberInput>
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

                      <Stack direction="row" fontSize="sm" fontWeight="bold">
                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Floor Above</FormLabel>
                          <NumberInput
                            size="sm"
                            step={1.0}
                            defaultValue={ combined.floorAbove || undefined }
                            onBlur={ e => onChangeProjRule( projRule._id, 'floorAbove', e.target.value ? parseFloat(e.target.value) : null ) }
                          >
                            <NumberInputField borderRadius="lg" background="white"/>
                          </NumberInput>
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

                      <FormControl>
                        <FormLabel>
                          Tags
                        </FormLabel>
                        <CreatableSelect
                          isMulti
                          onChange={onChangeTags( projRule._id )}
                          defaultValue={(projRule.tags || []).map( t => ({ value: t, label: t }))}
                          options={availTags.map( t => ({ value: t, label: t }))}
                        />
                      </FormControl>

                      <Stack direction="row" py="6">
                        <Stat>
                          <StatLabel>Floor</StatLabel>
                          <StatNumber>{ projRule.stats?.floor_price || "?" }</StatNumber>
                          <StatHelpText>{ projRule.stats?.floor_price_1day_change?.toFixed(2) || "?" } 1 day change</StatHelpText>
                        </Stat>

                        <Stat>
                          <StatLabel>Listed</StatLabel>
                          <StatNumber>{ ((projRule.stats?.percentage_of_token_listed || 0.0) * 100).toFixed(1) }%</StatNumber>
                          <StatHelpText>{ projRule.stats?.num_of_token_listed || "?" } listed</StatHelpText>
                        </Stat>
                      </Stack>

                      <Stack direction="row">
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


                      { projRule._id === projRuleUpdate._id &&
                        <Button
                          isLoading={isUpdating}
                          loadingText='Saving...'
                          marginY="4"
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
          </>
        }

        <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
          <Button
            isLoading={isRefreshingProjRules}
            loadingText='Refreshing...'
            colorScheme="green"
            variant='solid'
            onClick={onLoadProjRules}
          >
            Refresh
          </Button>
        </Stack>
      </main>
    </div>
  )
}

export default Home
