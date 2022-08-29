import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react";
import { useEffect } from 'react'
import {
  Accordion,
  AccordionIcon,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  IconButton,
  Box,
  Button,
  Text,
  FormControl,
  FormLabel,
  Input,
  Stack,
  NumberInput,
  NumberInputField,
  Checkbox,
  useDisclosure,
  SimpleGrid,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify';

import SwapRuleService from '../services/swapRule.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar';
import { ISwapRule, IUpdateSwapRule, ITokenSwapRules } from '../types/swapRules'

import { useState } from 'react'


const Home: NextPage = () => {
  const { data: sessionData, status: sessionStatus } = useSession();
  const [tokenSwapRules, setSwapRules] = useState([] as ITokenSwapRules[])
  const [swapRuleUpdate, setSwapRuleUpdate] = useState({} as IUpdateSwapRule)
  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()

  console.log('index', sessionData, sessionStatus)
  console.log('update', swapRuleUpdate)

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      console.log('setAccessToken', sessionData?.token?.access_token)
      setAccessToken( sessionData?.token?.access_token )
      onLoadSwapRules()
    }
  }, [sessionData?.token?.id])

  const onLoadSwapRules = async () => {
    if ( !sessionData ) {
      return
    }
    const rules = await SwapRuleService.getRulesByDiscord( (sessionData?.token?.id || '') as string )
    if ( rules ) {
      setSwapRules( rules )
    }
    console.log( 'onLoadSwapRules', rules )
  }

  const onUpdateSwapRule = async () => {
    onUpdating()
    const updatedRule = await SwapRuleService.update( swapRuleUpdate._id, swapRuleUpdate )
    if ( updatedRule ) {
      onLoadSwapRules()
      setSwapRuleUpdate({} as IUpdateSwapRule)
      toast.success('Updated Swap Rule!', {
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onUpdated()
  }

  const onChangeSwapRule = ( swapSymbol: string, idx: number, key: string, value: any ) => {
    const swapRule = tokenSwapRules.find( tokenSwapRule => tokenSwapRule.swapTokenSymbol === swapSymbol)?.swapRules[idx]

    if ( !swapRule ) return

    let update = { ...swapRuleUpdate }

    if ( swapRuleUpdate._id !== swapRule._id) {
      update = { _id: swapRule._id }
    }

    update[key] = value
    setSwapRuleUpdate( update )
  }



  console.log('swaps', tokenSwapRules)

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>

        <Text fontSize='lg' marginY="4" fontWeight="bold" textDecoration="underline">
          Swap Rules
        </Text>

        <Accordion allowMultiple minWidth="full">
          { tokenSwapRules.map( (tokenSwapRule, idx) => {
            return(
              <AccordionItem key={tokenSwapRule.swapTokenSymbol}>

                <AccordionButton _expanded={{ bg: 'blue.400', color: 'white' }} minWidth="full">
                  <Box flex='1' textAlign='left'>
                    { tokenSwapRule.swapTokenSymbol }
                  </Box>
                  <AccordionIcon />
                </AccordionButton>

                <AccordionPanel minWidth="full" padding="0.5">
                  { tokenSwapRule.swapRules.map( swapRule => {
                    const combined = swapRuleUpdate && swapRuleUpdate._id === swapRule._id ? { ...swapRule, ...swapRuleUpdate } : swapRule
                    return(
                      <Accordion allowMultiple minWidth="full" key={swapRule._id}>

                        {/* Header */}

                        <AccordionItem>
                          <AccordionButton _expanded={{ bg: 'blue.600', color: 'white' }}>
                            <Box flex='1' textAlign='left'>
                              { combined.baseToken.symbol }
                            </Box>
                            <AccordionIcon />
                          </AccordionButton>

                          {/* Panel */}

                          <AccordionPanel>
                            <SimpleGrid columns={2} spacing={2} alignItems="center" marginY="2">

                              {/* Row 1 */}

                              <FormControl>
                                <Stack direction="row">
                                  <FormLabel>Active?</FormLabel>
                                  <Checkbox
                                    isChecked={ combined.active }
                                    onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'active', e.target.checked ) }
                                  />
                                </Stack>
                              </FormControl>

                              <FormControl>
                                <FormLabel>Slippage %</FormLabel>
                                <NumberInput
                                  size="sm"
                                  step={1.0}
                                  value={ combined.slippage }
                                  onChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'slippage', parseFloat( value )) }
                                >
                                  <NumberInputField />
                                </NumberInput>
                              </FormControl>

                              {/* Enable / Disable Row */}

                              { combined.baseInput === 0 ?
                                <Stack direction="row">
                                  <IconButton aria-label='Enable Buy'
                                    icon={<AddIcon />}
                                    size="xs"
                                    borderRadius="3xl"
                                    backgroundColor="green.300"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', 1 ) }
                                  />
                                  <Text>Enable Buys</Text>
                                </Stack>
                                :
                                <Stack direction="column">
                                  <Stack direction="row">
                                    <IconButton aria-label='Disable Buy'
                                      icon={<CloseIcon />}
                                      size="xs"
                                      borderRadius="3xl"
                                      backgroundColor="red.300"
                                      onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', 0 ) }
                                    />
                                    <Text>Disable Buy</Text>
                                  </Stack>

                                  <Stack direction="row">
                                    <FormLabel>Execute Buys</FormLabel>
                                    <Checkbox
                                      isChecked={ combined.isExecuteBuy }
                                      onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'isExecuteBuy', e.target.checked ) }
                                    />
                                  </Stack>
                                </Stack>
                              }

                              { combined.swapInput === 0 ?
                                <Stack direction="row">
                                  <IconButton aria-label='Enable Sell'
                                    icon={<AddIcon />}
                                    size="xs"
                                    borderRadius="3xl"
                                    backgroundColor="green.300"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', 1 ) }
                                  />
                                  <Text>Enable Sell</Text>
                                </Stack>
                                :
                                <Stack direction="column">
                                  <Stack direction="row">
                                    <IconButton aria-label='Disable Sell'
                                      icon={<CloseIcon />}
                                      size="xs"
                                      borderRadius="3xl"
                                      backgroundColor="red.300"
                                      onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', 0 ) }
                                    />
                                    <Text>Disable Sell</Text>
                                  </Stack>

                                  <Stack direction="row">
                                    <FormLabel>Execute Sell</FormLabel>
                                    <Checkbox
                                      isChecked={ combined.isExecuteSell }
                                      onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'isExecuteSell', e.target.checked ) }
                                    />
                                  </Stack>
                                </Stack>
                              }

                              {/* Targets Row  */}

                              { combined.baseInput !== 0 ?
                                <FormControl>
                                  <FormLabel>Buy Below</FormLabel>
                                  <NumberInput precision={2}
                                    size="sm"
                                    step={1.0}
                                    value={ combined.swapTarget }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapTarget', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField />
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box/>
                              }
                              
                              { combined.swapInput !== 0 ?
                                <FormControl>
                                  <FormLabel>Sell Above</FormLabel>
                                  <NumberInput precision={2}
                                    size="sm"
                                    step={1.0}
                                    value={ combined.baseTarget }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseTarget', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField />
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box/>
                              }
                              
                              {/* Amounts Row */}

                              { combined.baseInput !== 0 ?
                                <FormControl>
                                  <FormLabel>Amount { combined.baseToken.symbol } </FormLabel>
                                  <NumberInput precision={2}
                                    size="sm"
                                    step={1.0}
                                    // value={ combined.baseInput }
                                    defaultValue={ combined.baseInput }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField />
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box />
                              }

                              { combined.swapInput !== 0 ?
                                <FormControl>
                                  <FormLabel>Amount { combined.swapToken.symbol } </FormLabel>
                                  <NumberInput precision={2}
                                    size="sm"
                                    step={1.0}
                                    // value={ combined.swapInput }
                                    defaultValue={ combined.swapInput }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField />
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box />
                              }
                              
                            </SimpleGrid>

                            { swapRuleUpdate._id &&
                              <Button
                                isLoading={isUpdating}
                                loadingText='Saving...'
                                colorScheme='teal'
                                variant='solid'
                                onClick={onUpdateSwapRule}
                              >
                                Save
                              </Button>
                            }
                          </AccordionPanel>
                        </AccordionItem>
                      </Accordion>
                    )
                  })}
                </AccordionPanel>
              </AccordionItem>
            )
          })}
        </Accordion>
      </main>
    </div>
  )
}

export default Home
