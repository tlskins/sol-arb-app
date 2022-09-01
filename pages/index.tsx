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
  Select,
} from '@chakra-ui/react'
import { AddIcon, CloseIcon } from '@chakra-ui/icons'
import { toast } from 'react-toastify'
import DatePicker from "react-datepicker"
import Moment from "moment-timezone"

import SwapRuleService from '../services/swapRule.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import { IUpdateSwapRule } from '../types/swapRules'
import { useGlobalState } from '../services/gloablState'
import walletsService from '../services/wallets.service'
import { pWalletName } from '../presenters/wallets'


const Home: NextPage = () => {
  const { data: _sessionData } = useSession();
  const sessionData = _sessionData as any
  const [tokenSwapRules, setTokenSwapRules] = useGlobalState('tokenSwapRules')
  const [wallets, setWallets] = useGlobalState('wallets')
  const [swapRuleUpdate, setSwapRuleUpdate] = useState({} as IUpdateSwapRule)
  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()
  const {
    isOpen: isChecking,
    onOpen: onChecking,
    onClose: onDoneChecking,
  } = useDisclosure()

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      setAccessToken( sessionData?.token?.access_token )
      onLoadSwapRules()
      onLoadWallets()
    }
  }, [sessionData?.token?.id])

  const onLoadSwapRules = async () => {
    if ( !sessionData ) {
      return
    }
    const rules = await SwapRuleService.getRulesByDiscord()
    if ( rules ) {
      setTokenSwapRules( rules )
    }
  }

  const onLoadWallets = async () => {
    if ( !sessionData ) {
      return
    }
    const wallets = await walletsService.getWallets()
    if ( wallets ) {
      setWallets( wallets )
    }
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

    // @ts-ignore: dynamic access
    update[key] = value
    setSwapRuleUpdate( update )
  }

  const onCheckSwapRules = async () => {
    onChecking()
    if ( await SwapRuleService.checkSwaps() ) {
      onLoadSwapRules()
    }
    onDoneChecking()
  }

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

        <Accordion minWidth="full" allowMultiple={true} defaultIndex={[]}>
          { tokenSwapRules.map( (tokenSwapRule) => {
            return(
              <AccordionItem key={tokenSwapRule.swapTokenSymbol}>

                <AccordionButton _expanded={{ bg: 'blue.500', color: 'white' }} minWidth="full">
                  <Box flex='1' textAlign='left'>
                    { tokenSwapRule.swapTokenSymbol }
                  </Box>
                  <AccordionIcon />
                </AccordionButton>

                <AccordionPanel minWidth="full" padding="0.5">
                  { tokenSwapRule.swapRules.map( (swapRule, idx) => {
                    const combined = swapRuleUpdate && swapRuleUpdate._id === swapRule._id ? { ...swapRule, ...swapRuleUpdate } : swapRule
                    let margin = undefined as string | undefined
                    if ( combined.baseTarget !== 0 && combined.swapTarget !== 0 ) {
                      if ( combined.invertPrice ) {
                        margin = `(${((combined.swapTarget - combined.baseTarget) / combined.baseTarget * 100).toFixed(0)}%)`
                      } else {
                        margin = `(${((combined.baseTarget - combined.swapTarget) / combined.swapTarget * 100).toFixed(0)}%)`
                      }
                    }
                    const wallet = wallets.find( wallet => swapRule.walletId === wallet._id )
                    return(
                      <Accordion
                        key={swapRule._id}
                        minWidth="full"
                        allowMultiple={true}
                        defaultIndex={[]}
                      >

                        {/* Header */}

                        <AccordionItem>
                          <AccordionButton _expanded={{ bg: 'blue.500', color: 'white' }}>
                            <Stack textAlign='left' direction="row" paddingRight="4">
                              <Text marginRight="2">
                                { combined.baseToken.symbol }
                              </Text>
                              <Stack direction="column" fontSize="xs">
                                <Text>
                                  { combined.lastBuyUnitPrice &&
                                    `$${ combined.lastBuyUnitPrice } (${Moment(combined.lastBuyCheckAt).format("LT")} ${Moment().diff(Moment(combined.lastBuyCheckAt), 'minutes')} mins ago)`
                                  }
                                  { (!combined.lastBuyUnitPrice && combined.lastSellUnitPrice) &&
                                    `$${ combined.lastSellUnitPrice } (${Moment(combined.lastSellCheckAt).format("LT")})`
                                  }
                                </Text>
                                <Text>
                                  { !wallet && "No Wallet Linked" }
                                  { wallet && `Balances: ${ wallet.balances[swapRule.baseToken.symbol] || 0 } ${ swapRule.baseToken.symbol } |
                                  ${ wallet.balances[swapRule.swapToken.symbol] } ${ swapRule.swapToken.symbol }` }
                                </Text>
                              </Stack>
                            </Stack>
                            <AccordionIcon />
                          </AccordionButton>

                          {/* Panel */}

                          <AccordionPanel background="blue.50">

                            <SimpleGrid columns={2} spacing={2} alignItems="center" marginY="2">

                              {/* Row 1 */}

                              <Stack direction="row">
                                <Stack direction="column">
                                  <FormControl>
                                    <FormLabel fontSize="sm">Active?</FormLabel>
                                    <Checkbox
                                      background="white"
                                      isChecked={ combined.active }
                                      onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'active', e.target.checked ) }
                                      borderRadius="lg"
                                      size="lg"
                                    />
                                  </FormControl>
                                </Stack>
                                <Stack direction="column">
                                  <FormControl>
                                    <FormLabel fontSize="sm">Invert?</FormLabel>
                                    <Checkbox
                                      background="white"
                                      isChecked={ combined.invertPrice }
                                      onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'invertPrice', e.target.checked ) }
                                      borderRadius="lg"
                                      size="lg"
                                    />
                                  </FormControl>
                                </Stack>
                              </Stack>

                              <Stack direction="column">
                                <FormLabel fontSize="sm">Inactive Before </FormLabel>
                                <DatePicker
                                  className="filter-calendar"
                                  selected={combined.inactiveBefore ? Moment( combined.inactiveBefore ).toDate() : null }
                                  dateFormat="Pp"
                                  onChange={ date => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'inactiveBefore', date?.toISOString() || '' ) }
                                  showTimeSelect
                                  timeFormat="HH:mm"
                                  timeIntervals={15}
                                  timeCaption="time"
                                  isClearable
                                />
                                <FormLabel fontSize="sm">Inactive After </FormLabel>
                                <DatePicker
                                  className="filter-calendar"
                                  selected={combined.inactiveAfter ? Moment( combined.inactiveAfter ).toDate() : null }
                                  dateFormat="Pp"
                                  onChange={ date => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'inactiveAfter', date?.toISOString() || '' ) }
                                  showTimeSelect
                                  timeFormat="HH:mm"
                                  timeIntervals={15}
                                  timeCaption="time"
                                  isClearable
                                />
                              </Stack>

                              {/* Row 2 */}

                              <Stack direction="column">
                                <FormLabel fontSize="sm" marginY="0">Slippage %</FormLabel>
                                <NumberInput
                                  size="sm"
                                  step={1.0}
                                  value={ combined.slippage }
                                  onChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'slippage', parseFloat( value )) }
                                >
                                  <NumberInputField borderRadius="lg" background="white"/>
                                </NumberInput>
                              </Stack>

                              <Stack direction="column">
                                <FormLabel fontSize="sm" marginY="0">Wallet</FormLabel>
                                <Select variant='outline'
                                  size="sm"
                                  background="white"
                                  borderRadius="lg"
                                  value={combined.walletId}
                                  fontSize="sm"
                                  padding="0.5"
                                  onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'walletId', e.target.value) }
                                >
                                  <option value={undefined}>None</option>
                                  { wallets.map( wallet => (
                                    <option key={wallet._id} value={wallet._id}> 
                                      { pWalletName( wallet ) }
                                    </option>
                                  ))}
                                </Select>
                              </Stack>

                              {/* Enable / Disable Row */}

                              { combined.baseInput === 0 ?
                                <Stack direction="row" marginTop="3">
                                  <IconButton aria-label='Enable Buy'
                                    icon={<AddIcon />}
                                    size="xs"
                                    borderRadius="md"
                                    backgroundColor="green.300"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', 1 ) }
                                  />
                                  <Text fontSize="sm">Enable Buys</Text>
                                </Stack>
                                :
                                <Stack direction="row" marginTop="3">
                                  <IconButton aria-label='Disable Buy'
                                    icon={<CloseIcon />}
                                    size="xs"
                                    borderRadius="md"
                                    backgroundColor="red.200"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', 0 ) }
                                  />
                                  <Text fontSize="sm">Disable Buy</Text>
                                </Stack>
                              }

                              { combined.swapInput === 0 ?
                                <Stack direction="row" marginTop="3">
                                  <IconButton aria-label='Enable Sell'
                                    icon={<AddIcon />}
                                    size="xs"
                                    borderRadius="md"
                                    backgroundColor="green.300"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', 1 ) }
                                  />
                                  <Text fontSize="sm">Enable Sell</Text>
                                </Stack>
                                :
                                <Stack direction="row" marginTop="3">
                                  <IconButton aria-label='Disable Sell'
                                    icon={<CloseIcon />}
                                    size="xs"
                                    borderRadius="md"
                                    backgroundColor="red.200"
                                    onClick={ () => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', 0 ) }
                                  />
                                  <Text fontSize="sm">Disable Sell</Text>
                                </Stack>
                              }

                              {/* Execute Buy / Sell  */}

                              { combined.baseInput !== 0 ?
                                <Stack direction="row" marginTop="4">
                                  <Checkbox
                                    isChecked={ combined.isExecuteBuy }
                                    onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'isExecuteBuy', e.target.checked ) }
                                    borderRadius="lg"
                                    size="lg"
                                    background="white"
                                  />
                                  <FormLabel fontSize="sm">
                                    Execute Buys
                                  </FormLabel>
                                </Stack> 
                                :
                                <Box />
                              }

                              { combined.swapInput !== 0 ?
                                <Stack direction="row" marginTop="4">
                                  <Checkbox
                                    isChecked={ combined.isExecuteSell }
                                    onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'isExecuteSell', e.target.checked ) }
                                    borderRadius="lg"
                                    size="lg"
                                    background="white"
                                  />
                                  <FormLabel fontSize="sm">
                                    Execute Sell
                                  </FormLabel>
                                </Stack>
                                :
                                <Box />
                              }

                              {/* Targets Row  */}

                              { combined.baseInput !== 0 ?
                                <FormControl marginY="2">
                                  <FormLabel fontSize="sm">
                                    Buy { combined.invertPrice ? "Above" : "Below" }
                                  </FormLabel>
                                  <NumberInput
                                    size="sm"
                                    step={1.0}
                                    borderRadius="lg"
                                    defaultValue={ combined.swapTarget }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapTarget', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField borderRadius="lg" background="white"/>
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box/>
                              }
                              
                              { combined.swapInput !== 0 ?
                                <FormControl marginY="2">
                                  <Stack direction="row">
                                    <FormLabel fontSize="sm">
                                      Sell { combined.invertPrice ? "Below" : "Above" }
                                    </FormLabel>
                                    <Text color="blue.400">{ margin }</Text>
                                  </Stack>
                                  <NumberInput
                                    size="sm"
                                    step={1.0}
                                    defaultValue={ combined.baseTarget }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseTarget', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField borderRadius="lg" background="white"/>
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box/>
                              }
                              
                              {/* Amounts Row */}

                              { combined.baseInput !== 0 ?
                                <FormControl>
                                  <FormLabel fontSize="sm">Amount { combined.baseToken.symbol } </FormLabel>
                                  <NumberInput
                                    size="sm"
                                    step={1.0}
                                    defaultValue={ combined.baseInput }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField borderRadius="lg" background="white"/>
                                  </NumberInput>
                                </FormControl>
                                :
                                <Box />
                              }

                              { combined.swapInput !== 0 ?
                                <FormControl>
                                  <FormLabel fontSize="sm">Amount { combined.swapToken.symbol } </FormLabel>
                                  <NumberInput
                                    size="sm"
                                    step={1.0}
                                    defaultValue={ combined.swapInput }
                                    onBlur={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', parseFloat(e.target.value)) }
                                  >
                                    <NumberInputField borderRadius="lg" background="white"/>
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

        <Button
          isLoading={isChecking}
          loadingText='Checking...'
          colorScheme="green"
          variant='solid'
          marginTop="8"
          onClick={onCheckSwapRules}
        >
          Check Rules
        </Button>
      </main>
    </div>
  )
}

export default Home
