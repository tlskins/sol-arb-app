import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
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
} from '@chakra-ui/react'
import { toast } from 'react-toastify'
import { IoMdArrowDropdown, IoMdArrowDropup } from 'react-icons/io'

import ProjectRuleService from '../services/projectRule.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import { UpsertProjectRule } from '../types/projectRules'
import { useGlobalState } from '../services/gloablState'


const Home: NextPage = () => {
  const router = useRouter()
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const [projectRules, setProjectRules] = useGlobalState('projectRules')
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


  const onLoadProjRules = async () => {
    if ( !sessionData ) {
      return
    }
    onRefreshingProjRules()
    const rules = await ProjectRuleService.getProfileStats()
    if ( rules ) {
      setProjectRules( rules.sort((a,b) => ((b.stats?.floor_price || 0) - (a.stats?.floor_price || 0))) )
    }
    onDoneRefreshingProjRules()
  }

  const onChangeProjRule = ( ruleId: string, key: string, value: any ) => {
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
      toast.success('Updated Swap Rule!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onUpdated()
  }

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

        { projectRules && projectRules.length > 0 &&
          <>
            <Accordion minWidth="full" allowMultiple={true} defaultIndex={[]}>
              { projectRules.map( projRule => {
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
                            isChecked={ projRule.active }
                            onChange={ e => onChangeProjRule( projRule._id, 'active', e.target.checked ) }
                            borderRadius="lg"
                            size="lg"
                          />
                        </Stack>

                        <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                          <FormLabel fontSize="sm">Fixed Change</FormLabel>
                          <NumberInput
                            size="sm"
                            step={1.0}
                            defaultValue={ projRule.fixedPriceChange || 0.0 }
                            onBlur={ e => onChangeProjRule( projRule._id, 'fixedPriceChange', parseFloat(e.target.value)) }
                          >
                            <NumberInputField borderRadius="lg" background="white"/>
                          </NumberInput>
                        </Stack>
                      </Stack>

                      <Stack direction="row">
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
