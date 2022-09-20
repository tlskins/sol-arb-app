import type { NextPage } from 'next'
import Head from 'next/head'
import { useSession } from "next-auth/react"
import { FaChartLine } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
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
  Stack,
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
import WalletsService from '../services/wallets.service'
import { setAccessToken } from '../http-common'
import styles from '../styles/Home.module.css'
import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import { ISwapRule, IUpdateSwapRule } from '../types/swapRules'
import { useGlobalState } from '../services/gloablState'
import { pWalletName } from '../presenters/wallets'
import { ChartRangeFilters } from './chart'

const Home: NextPage = () => {
  const router = useRouter()
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const [tokenSwapRules, setTokenSwapRules] = useGlobalState('tokenSwapRules')
  const [wallets, setWallets] = useGlobalState('wallets')
  const [, setConfirmModal] = useGlobalState('confirmModal')
  const [swapRuleUpdate, setSwapRuleUpdate] = useState({} as IUpdateSwapRule)
  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()
  const {
    isOpen: isRefreshingSwapRules,
    onOpen: onRefreshingSwapRules,
    onClose: onDoneRefreshingSwapRules,
  } = useDisclosure()
  const {
    isOpen: isChecking,
    onOpen: onChecking,
    onClose: onDoneChecking,
  } = useDisclosure()
  const {
    isOpen: isDeleting,
    onOpen: onDeleting,
    onClose: onDeleted,
  } = useDisclosure()

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      setAccessToken( sessionData?.token?.access_token )
      onLoadSwapRules()
      onLoadWallets()
    }
  }, [sessionData?.token?.id])

  const onOpenSwapChart = (swapRule: ISwapRule, filterId: string) => {
    router.push(`chart/?ruleId=${swapRule._id}&filterId=${filterId}`)
  }

  const onLoadSwapRules = async () => {
    if ( !sessionData ) {
      return
    }
    onRefreshingSwapRules()
    const rules = await SwapRuleService.getRulesByDiscord()
    if ( rules ) {
      setTokenSwapRules( rules )
    }
    onDoneRefreshingSwapRules()
  }

  const onLoadWallets = async () => {
    if ( !sessionData ) {
      return
    }
    const wallets = await WalletsService.getWallets()
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
        theme: 'dark',
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

  const onChangeAlert = ( swapSymbol: string, idx: number, alertType: string, key: string, value: any ) => {
    const swapRule = tokenSwapRules.find( tokenSwapRule => tokenSwapRule.swapTokenSymbol === swapSymbol)?.swapRules[idx]
    if ( !swapRule ) return
    let update = { ...swapRuleUpdate }
    if ( swapRuleUpdate._id !== swapRule._id) {
      update = { _id: swapRule._id }
    }
    // @ts-ignore: dynamic access
    if ( !update[alertType] ) {
      // @ts-ignore: dynamic access
      update[alertType] = swapRule[alertType] ?
        // @ts-ignore: dynamic access
        swapRule[alertType]
        :
        {
          active: false,
          fixedPriceChange: 0.05,
        }
    }
    // @ts-ignore: dynamic access
    update[alertType][key] = value
    setSwapRuleUpdate( update )
  }

  const onCheckSwapRules = async () => {
    onChecking()
    if ( await SwapRuleService.checkSwaps() ) {
      onLoadSwapRules()
    }
    onDoneChecking()
  }

  const onDelete = (swapRule: ISwapRule) => () => {
    setConfirmModal({
      message: `Are you sure you want to delete the rule for ${ swapRule.swapToken?.symbol || "?" }?`,
      callback: async () => {
        if ( isDeleting ) {
          return
        }
        onDeleting()
        await SwapRuleService.deleteRule( swapRule._id )
        setConfirmModal(undefined)
        onDeleted()
        onLoadSwapRules()
      }
    })
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
          Swap Rules
        </Text>

        { tokenSwapRules && tokenSwapRules.length > 0 &&
          <>
            <Accordion minWidth="full" allowMultiple={true} defaultIndex={Array.from(Array(tokenSwapRules.length).keys())}>
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
                        const margin = `(${((combined.baseTarget - combined.swapTarget) / combined.swapTarget * 100).toFixed(0)}%)`
                        const wallet = wallets.find( wallet => swapRule.walletId === wallet._id )
                        const buyDiff = (combined.lastBuyUnitPrice || 0) - combined.swapTarget
                        const sellDiff = combined.baseTarget - (combined.lastSellUnitPrice || 0)
                        const isLeanBuy = buyDiff < sellDiff
                        const hitBuy = buyDiff <= 0
                        const hitSell = sellDiff <= 0
                        return(
                          <Accordion
                            key={swapRule._id}
                            minWidth="full"
                            allowMultiple={true}
                            defaultIndex={[]}
                          >

                            {/* Header */}

                            <AccordionItem>
                              <AccordionButton _expanded={{ bg: 'blue.200' }}>
                                <Stack textAlign='left' direction="row" paddingRight="2">
                                  <Stack direction="column" fontSize="sm" fontWeight="bold">
                                    <Text marginRight="2">
                                      { combined.baseToken.symbol }
                                    </Text>
                                    { (combined.baseInput && combined.swapInput) &&
                                      <Text textColor={ isLeanBuy ? 'green' : 'red' }>
                                        { isLeanBuy ? 'BUY' : 'SELL' }
                                      </Text>
                                    }
                                  </Stack>
                                  <Stack direction="column" fontSize="xs" spacing="2">
                                    { combined.baseInput &&
                                      <Text borderRadius="lg" background={ hitBuy ? "green.100" : ""} p={ hitBuy ? "0.5" : ""}>
                                        { `BUY Price @ $${ combined.lastBuyUnitPrice || "?" } (${Moment().diff(Moment(combined.lastBuyCheckAt), 'minutes')} mins ago) IF <= ${ combined.swapTarget } ` }
                                      </Text>
                                    }
                                    { combined.swapInput && 
                                      <Text borderRadius="lg" background={ hitSell ? "red.100" : ""} p={ hitSell ? "0.5" : ""}>
                                        { `SELL Price @ $${ combined.lastSellUnitPrice || "?" } (${Moment().diff(Moment(combined.lastSellCheckAt), 'minutes')} mins ago) IF >= ${ combined.baseTarget } ` }
                                      </Text>
                                    }
                                    <Text>
                                      { !wallet && "No Wallet Linked" }
                                      { wallet && `${ wallet.balances[swapRule.baseToken.symbol] || 0 } ${ swapRule.baseToken.symbol } |
                                      ${ wallet.balances[swapRule.swapToken.symbol] || 0 } ${ swapRule.swapToken.symbol }` }
                                    </Text>
                                  </Stack>
                                </Stack>
                              </AccordionButton>

                              {/* Panel */}

                              <AccordionPanel background="blue.50">

                                <SimpleGrid columns={2} spacing={2} alignItems="center" marginY="2">

                                  {/* Row 1 */}

                                  <Stack direction="column">
                                    <Stack direction="row" alignItems="center" alignContent="center" justifyContent="left">
                                      <FormLabel fontSize="sm">Active?</FormLabel>
                                      <Checkbox
                                        background="white"
                                        isChecked={ combined.active }
                                        onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'active', e.target.checked ) }
                                        borderRadius="lg"
                                        size="lg"
                                      />
                                    </Stack>

                                    <FormControl fontSize="sm">
                                      <Select size="sm"
                                        fontSize="sm"
                                        icon={<FaChartLine />}
                                        background="white"
                                        borderRadius="lg"
                                        onChange={ e => onOpenSwapChart(swapRule, e.target.value) }
                                      >
                                        <option value="">Chart</option>
                                        { ChartRangeFilters.map( ({ id }) => <option
                                          key={id}
                                          value={id}
                                        >
                                          { id }
                                        </option> )}
                                      </Select>
                                    </FormControl>
                                  </Stack>

                                  <Stack direction="column">
                                    <FormLabel fontSize="sm">Inactive Before </FormLabel>
                                    <DatePicker
                                      className="filter-calendar full-width"
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
                                      className="filter-calendar full-width"
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

                                  <Stack direction="row">
                                    <FormControl>
                                      <FormLabel fontSize="sm">Decimals</FormLabel>
                                      <NumberInput
                                        onlyInt={true}
                                        maxWidth={50}
                                        value={ combined.decimals }
                                        onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'decimals', value) }
                                      />
                                    </FormControl>

                                    <FormControl>
                                      <FormLabel fontSize="sm">Slippage</FormLabel>
                                      <NumberInput
                                        onlyInt={true}
                                        maxWidth={50}
                                        value={ combined.slippage }
                                        onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'decimals', value) }
                                      />
                                    </FormControl>
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
                                      onChange={ e => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'walletId', e.target.value === 'None' ? null : e.target.value ) }
                                    >
                                      <option value="None">None</option>
                                      { wallets.map( wallet => (
                                        <option key={wallet._id} value={wallet._id}> 
                                          { pWalletName( wallet ) }
                                        </option>
                                      ))}
                                    </Select>
                                  </Stack>

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

                                  <Stack direction="row">
                                    <Checkbox
                                      background="white"
                                      isChecked={ combined.buyAlertSettings?.active || false }
                                      onChange={ e => onChangeAlert( tokenSwapRule.swapTokenSymbol, idx, 'buyAlertSettings', 'active', e.target.checked ) }
                                      borderRadius="lg"
                                      size="lg"
                                    />
                                    <FormLabel fontSize="sm">Alert Buy</FormLabel>
                                  </Stack>

                                  <Stack direction="row">
                                    <Checkbox
                                      background="white"
                                      isChecked={ combined.sellAlertSettings?.active || false }
                                      onChange={ e => onChangeAlert( tokenSwapRule.swapTokenSymbol, idx, 'sellAlertSettings', 'active', e.target.checked ) }
                                      borderRadius="lg"
                                      size="lg"
                                    />
                                    <FormLabel fontSize="sm">Alert Sell</FormLabel>
                                  </Stack>

                                  {/* Targets Row  */}

                                  { combined.baseInput !== 0 ?
                                    <Stack marginY="2" direction="column">
                                      <FormControl>
                                        <FormLabel fontSize="sm">
                                          Amount { combined.baseToken.symbol }
                                        </FormLabel>
                                        <NumberInput
                                          value={ combined.baseInput }
                                          onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseInput', value) }
                                        />
                                      </FormControl>

                                      <FormControl>
                                        <FormLabel fontSize="sm">
                                          Buy Below
                                        </FormLabel>
                                        <NumberInput
                                          value={ combined.swapTarget }
                                          onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapTarget', value) }
                                        />
                                      </FormControl>
                                    </Stack>
                                    :
                                    <Box/>
                                  }
                                  
                                  { combined.swapInput !== 0 ?
                                    <Stack marginY="2" direction="column">
                                      <FormControl>
                                        <FormLabel fontSize="sm">
                                          Amount { combined.swapToken.symbol }
                                        </FormLabel>
                                        <NumberInput
                                          value={ combined.swapInput }
                                          onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'swapInput', value) }
                                        />
                                      </FormControl>

                                      <FormControl>
                                        <FormLabel fontSize="sm">
                                          Sell Above
                                        </FormLabel>
                                        <NumberInput
                                          value={ combined.baseTarget }
                                          onValueChange={ value => onChangeSwapRule( tokenSwapRule.swapTokenSymbol, idx, 'baseTarget', value) }
                                        />
                                      </FormControl>
                                    </Stack>
                                    :
                                    <Box/>
                                  }

                                  {/* Margin Row  */}

                                  { (combined.baseTarget && combined.swapTarget) ?
                                    <Text fontSize="sm" fontWeight="bold">
                                      Margin { margin }
                                    </Text>
                                    :
                                    <Box />
                                  }

                                  <Box />
                                  
                                  {/* Alerts Row */}
                                  
                                  <FormControl>
                                    <FormLabel fontSize="sm">Fixed Change</FormLabel>
                                    <NumberInput
                                      value={ combined.buyAlertSettings?.fixedPriceChange }
                                      onValueChange={ value => onChangeAlert( tokenSwapRule.swapTokenSymbol, idx, 'buyAlertSettings', 'fixedPriceChange', value) }
                                    />
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">Fixed Change</FormLabel>
                                    <NumberInput
                                      value={ combined.sellAlertSettings?.fixedPriceChange }
                                      onValueChange={ value => onChangeAlert( tokenSwapRule.swapTokenSymbol, idx, 'sellAlertSettings', 'fixedPriceChange', value) }
                                    />
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      { (combined.buyAlertSettings && combined.buyAlertSettings?.lastAlertUnitPrice != null) &&
                                        `Last: $${ combined.buyAlertSettings?.lastAlertUnitPrice?.toFixed( combined.decimals ) }`
                                      }
                                    </FormLabel>
                                  </FormControl>

                                  <FormControl>
                                    <FormLabel fontSize="sm">
                                      { (combined.sellAlertSettings && combined.sellAlertSettings?.lastAlertUnitPrice != null) &&
                                        `Last: $${ combined.sellAlertSettings?.lastAlertUnitPrice?.toFixed( combined.decimals ) }`
                                      }
                                    </FormLabel>
                                  </FormControl>
                                  
                                </SimpleGrid>

                                <Button
                                  isLoading={isDeleting}
                                  loadingText='Deleting...'
                                  marginY="4"
                                  colorScheme='red'
                                  variant='solid'
                                  onClick={onDelete( swapRule )}
                                >
                                  Delete
                                </Button>

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

            <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4">
              <Button
                isLoading={isRefreshingSwapRules}
                loadingText='Refreshing...'
                colorScheme="green"
                variant='solid'
                onClick={onLoadSwapRules}
              >
                Refresh
              </Button>

              <Button
                isLoading={isChecking}
                loadingText='Checking...'
                colorScheme="blue"
                variant='solid'
                onClick={onCheckSwapRules}
              >
                Check Rules
              </Button>
            </Stack>
          </>
        }
      </main>
    </div>
  )
}

export default Home
