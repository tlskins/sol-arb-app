import { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import {
  Box,
  Button,
  Checkbox,
  FormLabel,
  Spacer,
  Stack,
  Text,
  FormControl,
  Select,
} from '@chakra-ui/react'
import Head from 'next/head'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import { useDisclosure } from '@chakra-ui/react'
import Moment from "moment-timezone"

import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import styles from '../styles/Home.module.css'
import SwapRuleService from '../services/swapRule.service'
import WalletsService from '../services/wallets.service'
import { ISwapRule } from '../types/swapRules'
import { IWallet } from '../types/wallet'
import { pWalletName } from '../presenters/wallets'

const QuickSwap: NextPage = () => {
  const router = useRouter()
  const {
    ruleId: ruleIdParam,
    isBuy: isBuyParam,
    inputAmount: inputAmountParam,
    targetPrice: targetPriceParam,
    slippage: slippageParam,
  } = router.query

  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  const isSignedIn = !!sessionData?.token?.id
  console.log('sessionData',sessionData)

  const [ruleId, setRuleId] = useState(undefined as string | undefined)
  const [isBuy, setIsBuy] = useState(undefined as boolean | undefined)
  const [inputAmount, setInputAmount] = useState(undefined as number | undefined)
  const [targetPrice, setTargetPrice] = useState(undefined as number | undefined)
  const [slippage, setSlippage] = useState(undefined as number | undefined)
  const [swapRule,setSwapRule] = useState(undefined as ISwapRule | undefined)
  const [wallet, setWallet] = useState(undefined as IWallet | undefined)
  const [isAutoSwap, setIsAutoSwap] = useState(false)
  const {
    isOpen: isSwapping,
    onOpen: onSwapping,
    onClose: onSwapped,
  } = useDisclosure()
  const isSwapReqValid = ruleId !== undefined && isBuy !== undefined && inputAmount !== undefined && targetPrice !== undefined
    && slippage !== undefined && swapRule !== undefined

  useEffect(() => {
    setRuleId(ruleIdParam as string | undefined)
    if ( ruleIdParam && isSignedIn ) {
      onLoadSwapRule(ruleIdParam as string)
    }
  }, [ruleIdParam, isSignedIn])
  useEffect(() => {
    setIsBuy(isBuyParam ? isBuyParam as string === "true" : undefined)
  }, [isBuyParam])
  useEffect(() => {
    setInputAmount(inputAmountParam ? parseFloat( inputAmountParam as string ) : undefined)
  }, [inputAmountParam])
  useEffect(() => {
    setTargetPrice(targetPriceParam ? parseFloat( targetPriceParam as string ) : undefined)
  }, [targetPriceParam])
  useEffect(() => {
    setSlippage(slippageParam ? parseFloat( slippageParam as string ) : undefined)
  }, [slippageParam])
  useEffect(() => {
    if ( swapRule?.walletId ) {
      onLoadWallet( swapRule?.walletId )
    }
  }, [swapRule?.walletId])
  useEffect(() => {
    if ( !isSwapping && isAutoSwap && isSwapReqValid && swapRule?.walletId ) {
      onSwap()
    }
  }, [isAutoSwap, isSwapping, isSwapReqValid, swapRule?.walletId])

  const onLoadSwapRule = async (swapRuleId?: string) => {
    const id = swapRuleId || ruleId
    if ( !id || !isSignedIn ) return
    const newSwapRule = await SwapRuleService.getRule( id )
    setSwapRule( newSwapRule )
  }

  const onLoadWallet = async (walletId: string) => {
    const wallets = await WalletsService.getWallets()
    if ( !wallets ) return
    const loadedWallet = wallets.find( wallet => wallet._id === walletId )
    if ( !loadedWallet ) return
    setWallet(loadedWallet)
  }

  const onSwap = async () => {
    if ( !isSwapReqValid || isSwapping || !isSignedIn ) {
      return
    }
    onSwapping()
    const resp = await SwapRuleService.quickSwap({
      ruleId,
      isBuy,
      inputAmount,
      targetPrice,
      slippage,
    })
    if ( resp && resp.swapSuccessful ) {
      toast.success(resp.msg, {
        theme: 'dark',
        position: toast.POSITION.TOP_RIGHT,
      })
    } else if ( resp && !resp.swapSuccessful ) {
      toast.warning(resp.msg, {
        theme: 'dark',
        position: toast.POSITION.TOP_RIGHT,
      })
    }
    onSwapped()
  }

  const baseTokenSymbol = swapRule?.baseToken?.symbol || "?"
  const swapTokenSymbol = swapRule?.swapToken?.symbol || "?"
  const inputTokenSymbol = isBuy ? baseTokenSymbol : swapTokenSymbol
  const targetTokenSymbol = isBuy ? swapTokenSymbol : baseTokenSymbol

  return(
    <div className={styles.container}>
      <Head>
        <title>NFADYOR</title>
        <meta name="description" content="notfinancialadvicedoyourownresearch" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className={styles.main}>

        <Text fontSize='lg' marginY="4" fontWeight="bold" textDecoration="underline">
          Quick Swap
        </Text>

        <Stack fontWeight="bold" borderRadius="md" p="2" bg="teal.100">
          <Text p="1" borderRadius="md" bg="blue.100">
            { inputTokenSymbol } { "->" } { targetTokenSymbol }
          </Text>
          <Text pl="2">
            last ${ (isBuy ? swapRule?.lastBuyUnitPrice : swapRule?.lastSellUnitPrice) || "?" } (${Moment().diff(Moment(isBuy ? swapRule?.lastBuyCheckAt : swapRule?.lastSellCheckAt), 'minutes')} mins ago)
          </Text>
          <Text p="1" borderRadius="md" bg="blue.100">
            Wallet: { wallet ? pWalletName( wallet ) : "?" }
          </Text>
          <Text pl="2">
            { wallet?.balances[swapRule?.baseToken?.symbol || ''] || 0 } ${ swapRule?.baseToken.symbol }
          </Text>
          <Text pl="2">
            { wallet?.balances[swapRule?.swapToken?.symbol || ''] || 0 } ${ swapRule?.swapToken.symbol }
          </Text>
        </Stack>

        <Stack direction="column" marginY="10" alignContent="center" alignItems="left" justifyContent="left" fontWeight="bold">
          <Stack direction="row">
            <FormLabel fontSize="sm">Is Buy?</FormLabel>
            <Spacer />
            <Checkbox
              background="white"
              isChecked={ isBuy }
              onChange={ e => setIsBuy(e.target.checked) }
              borderRadius="lg"
              size="lg"
            />
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">
              Slippage
            </FormLabel>
            <Spacer />
            <NumberInput
              thousandSeparator={true}
              value={ slippage }
              onValueChange={ value => setSlippage( value || 0 ) }
            />
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">
              Input Amount ${ inputTokenSymbol }
            </FormLabel>
            <Spacer />
            <NumberInput
              thousandSeparator={true}
              value={ inputAmount }
              onValueChange={ value => setInputAmount( value || 0 ) }
            />
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">
              Target Price
            </FormLabel>
            <Spacer />
            <NumberInput
              thousandSeparator={true}
              value={ targetPrice }
              onValueChange={ value => setTargetPrice( value || 0 ) }
            />
          </Stack>
        </Stack>
      </main>

      <Box className={styles.footer}>
        <Box position="fixed" zIndex="sticky" bottom="0" bg="blue.600" width="full" pb="4">
          <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginTop="4" spacing="4" px="4">
            { isSwapReqValid &&
              <>
                <Button
                  size="sm"
                  colorScheme='yellow'
                  variant='solid'
                  onClick={() => router.push( '/' )}
                >
                  Back
                </Button>

                <Spacer />

                <Button
                  isLoading={isSwapping}
                  onClick={onSwap}
                  loadingText='Swapping...'
                  colorScheme='teal'
                  variant='solid'
                  marginX="8"
                  size="sm"
                >
                  Swap
                </Button>

                <Spacer />

                <Stack direction="column" alignItems="center" alignContent="center" justifyContent="left">
                  <FormLabel fontSize="sm" textColor="white">Auto Swap</FormLabel>
                  <Checkbox
                    background="white"
                    isChecked={ isAutoSwap }
                    onChange={ e => setIsAutoSwap(e.target.checked) }
                    borderRadius="lg"
                    size="md"
                  />
                </Stack>
              </>
            }
          </Stack>
        </Box>
      </Box>
    </div>
  )
}

export default QuickSwap