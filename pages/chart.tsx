import { useState, useEffect } from 'react'
import Moment from 'moment-timezone'
import { useSession } from "next-auth/react"
import DatePicker from "react-datepicker"
import {
  Button,
  FormLabel,
  Stack,
  Text,
  FormControl,
  Select,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { toast } from 'react-toastify'
import {
  useDisclosure,
  NumberInput,
  NumberInputField,
} from '@chakra-ui/react'

import Navbar from '../components/Navbar'
import swapRecordService from '../services/swapRecord.service'
import { IUpdateSwapRule, ISwapRule } from '../types/swapRules'
import { ISwapRecord } from '../types/swapRecord'
import SwapRuleService from '../services/swapRule.service'
const SwapChart = dynamic(() => import("../components/SwapChart"), { ssr: false })


interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

type ChartRangeUnits = 'week' | 'day'

interface ChartFilter {
  id: string,
  unit: ChartRangeUnits,
  length: number,
}

export const ChartRangeFilters = [
  { id: '1 Day', unit: 'day', length: 1 },
  { id: '2 Day', unit: 'day', length: 2 },
  { id: '3 Day', unit: 'day', length: 3 },
  { id: '1 Week', unit: 'week', length: 1 },
  { id: '2 Week', unit: 'week', length: 2 },
  { id: '3 Week', unit: 'week', length: 3 },
] as ChartFilter[]

let buySellTimeout = undefined as any

const Chart: NextPage = () => {
  const router = useRouter()
  const { ruleId, filterId: routerFilterId } = router.query
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  console.log('sessionData',sessionData)

  const [filterId, setFilterId] = useState(routerFilterId as string)
  const [swapRule,setSwapRule] = useState(undefined as ISwapRule | undefined)
  const [chartStart, setChartStart] = useState(undefined as undefined | Moment.Moment)
  const [chartEnd, setChartEnd] = useState(undefined as undefined | Moment.Moment)
  
  const [isLoading, setIsLoading] = useState(false)
  const [buyDataPoints, setBuyDataPoints] = useState([] as DataPoint[])
  const [sellDataPoints, setSellDataPoints] = useState([] as DataPoint[])
  const [buyTargetPoints, setBuyTargetPoints] = useState([] as DataPoint[])
  const [sellTargetPoints, setSellTargetPoints] = useState([] as DataPoint[])
  const [renderStart, setRenderStart] = useState(undefined as Date | undefined)
  const [renderEnd, setRenderEnd] = useState(undefined as Date | undefined)
  const [buyHits, setBuyHits] = useState(0)
  const [sellHits, setSellHits] = useState(0)

  const [swapRuleUpdate, setSwapRuleUpdate] = useState({} as IUpdateSwapRule)
  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()

  const combined = { ...swapRule, ...swapRuleUpdate }
  const margin = `(${(((combined?.baseTarget || 0) - (combined?.swapTarget || 0)) / (combined.swapTarget || 1) * 100).toFixed(0)}%)`

  const minPrice = [...buyDataPoints, ...sellDataPoints].reduce((min, curr) => {
    if ( min == null) return curr.y

    return curr.y < min ? curr.y : min
  }, undefined as undefined | number)
  const maxPrice = [...buyDataPoints, ...sellDataPoints].reduce((max, curr) => {
    if ( max == null) return curr.y

    return curr.y > max ? curr.y : max
  }, undefined as undefined | number)
  const avgPrice = ([...buyDataPoints, ...sellDataPoints].reduce((sum, curr) => {
    return sum += curr.y
  }, 0.0 ) / ([...buyDataPoints, ...sellDataPoints].length || 1))

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      if ( filterId ) {
        const filter = ChartRangeFilters.find( filter => filter.id === filterId )
        if ( filter ) {
          const { length, unit } = filter
          setChartStart(Moment().add(-1 * length, unit))
        }
      }
      if ( ruleId ) {
        onLoadSwapRule()
      }
    }
  }, [ruleId, filterId, sessionData?.token?.id])

  useEffect(() => {
    onLoadSwapRecords()
  }, [swapRule])

  useEffect(() => {
    if ( routerFilterId ) {
      setFilterId(routerFilterId as string)
    }
  }, [routerFilterId])

  useEffect(() => {
    drawBuySellPoints(renderStart, renderEnd, combined.swapTarget, combined.baseTarget)
    calcBuySellHits(combined.swapTarget, combined.baseTarget)
  }, [buyDataPoints, sellDataPoints, renderStart, renderEnd, combined.swapTarget, combined.baseTarget])

  const onLoadSwapRule = async () => {
    const newSwapRule = await SwapRuleService.getRule( ruleId as string )
    setSwapRule( newSwapRule )
  }

  const onChangeSwapRule = async (key: string, value: any) => {
    if ( !swapRule ) return
    const update = { ...swapRuleUpdate }
    if ( swapRuleUpdate._id !== swapRule._id ) {
      update._id = swapRule._id || ""
    }
    // @ts-ignore: dynamic access
    update[key] = value
    setSwapRuleUpdate( update )
    onLoadSwapRecords()
  }

  // const reDrawBuySellPoints = () => {
  //   if ( buySellTimeout ) {
  //     clearTimeout( buySellTimeout )
  //   }
  //   buySellTimeout = undefined
  //   buySellTimeout = setTimeout(() => {
  //     calcBuySellHits(combined.swapTarget, combined.baseTarget)
  //   }, 150 )
  // }

  const onUpdateSwapRule = async () => {
    onUpdating()
    const updatedRule = await SwapRuleService.update( swapRuleUpdate._id, swapRuleUpdate )
    if ( updatedRule ) {
      setSwapRuleUpdate({} as IUpdateSwapRule)
      toast.success('Updated Swap Rule!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onUpdated()
  }

  const onLoadSwapRecords = async () => {
    if ( !swapRule ) {
      return
    }
    setIsLoading(true)
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id, chartStart, chartEnd)
    if ( swapRecords && swapRecords.length > 1 ) {
      drawPricePoints(swapRecords)
      const newRenderStart = Moment(swapRecords[0].timestamp).toDate()
      const newRenderEnd = Moment(swapRecords[swapRecords.length-1].timestamp).toDate()
      setRenderStart(newRenderStart)
      setRenderEnd(newRenderEnd)
      calcBuySellHits(combined.swapTarget, combined.baseTarget)
    }
    setIsLoading(false)
  }

  const calcBuySellHits = (buyBelow?: number, sellAbove?: number) => {
    if ( buyBelow != null ) {
      let count = 0
      let isBelow = false
      buyDataPoints.forEach( pt => {
        if ( !isBelow && pt.y <= buyBelow ) {
          isBelow = true
          count += 1
        } else if ( isBelow && pt.y > buyBelow ) {
          isBelow = false
        }
      })
      setBuyHits(count)
    }
    if ( sellAbove != null ) {
      let count = 0
      let isAbove = false
      sellDataPoints.forEach( pt => {
        if ( !isAbove && pt.y >= sellAbove ) {
          isAbove = true
          count += 1
        } else if ( isAbove && pt.y < sellAbove ) {
          isAbove = false
        }
      })
      setSellHits(count)
    }
  }

  const drawPricePoints = (swapRecords: ISwapRecord[]) => {
    if ( !swapRule ) return
    setBuyDataPoints(swapRecords.filter( record => record.inputTokenSymbol === swapRule.baseToken.symbol ).map( record => ({
      label: 'Buy Price',
      x: Moment(record.timestamp).toDate(),
      y: record.unitPrice,
    })))
    setSellDataPoints(swapRecords.filter( record => record.inputTokenSymbol !== swapRule.baseToken.symbol ).map( record => ({
      label: 'Sell Price',
      x: Moment(record.timestamp).toDate(),
      y: record.unitPrice,
    })))
  }

  const drawBuySellPoints = (start?: Date, end?: Date, buyBelow?: number, sellAbove?: number) => {
    if ( buyBelow != null && start != null && end != null ) {
      setBuyTargetPoints([
        {
          label: 'Buy Target',
          x: start,
          y: buyBelow,
        },
        {
          label: 'Buy Target',
          x: end,
          y: buyBelow,
        },
      ])
    }
    if ( sellAbove != null && start != null && end != null ) {
      setSellTargetPoints([
        {
          label: 'Sell Above',
          x: start,
          y: sellAbove,
        },
        {
          label: 'Sell Above',
          x: end,
          y: sellAbove,
        },
      ])
    }
  }

  return(
    <Stack p="2">
      <Navbar />

      { !isLoading && swapRule &&
        <SwapChart
          swapRule={swapRule}
          buyDataPoints={buyDataPoints}
          sellDataPoints={sellDataPoints}
          buyTargetPoints={buyTargetPoints}
          sellTargetPoints={sellTargetPoints}
        />
      }

      <Stack direction="column" marginY="4" alignContent="center" alignItems="center" justifyContent="center" fontWeight="bold">
        <Stack direction="row" fontSize="sm">
          <Stack direction="column">
            <Text> Min Price </Text>
            <Text> ${ minPrice?.toFixed( swapRule?.decimals ) || "?" } </Text>
          </Stack>
          <Stack direction="column">
            <Text> Avg Price </Text>
            <Text> ${ avgPrice?.toFixed( swapRule?.decimals ) || "?" } </Text>
          </Stack>
          <Stack direction="column">
            <Text> Max Price </Text>
            <Text> ${ maxPrice?.toFixed( swapRule?.decimals ) || "?" } </Text>
          </Stack>
          <Stack direction="column">
            <Text> Spread </Text>
            <Text> { ((((maxPrice || 0) - (minPrice || 0)) / (minPrice || 1)) * 100).toFixed(0) }% </Text>
          </Stack>
        </Stack>

        <Stack direction="column">
          <FormControl fontSize="sm">
            <Select size="sm"
              fontSize="sm"
              background="white"
              borderRadius="lg"
              onChange={ e => setFilterId(e.target.value)}
              value={ filterId }
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

          <Stack direction="row">
            <FormLabel fontSize="sm">Start</FormLabel>
            <DatePicker
              className="filter-calendar full-width"
              selected={chartStart?.toDate()}
              dateFormat="Pp"
              onChange={ date => setChartStart(date ? Moment(date) : undefined) }
              showTimeSelect
              isClearable={true}
              timeFormat="HH:mm"
              timeIntervals={60}
              timeCaption="time"
            />
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">End </FormLabel>
            <DatePicker
              className="filter-calendar full-width"
              selected={chartEnd?.toDate()}
              dateFormat="Pp"
              onChange={ date => setChartEnd(date ? Moment(date) : undefined) }
              showTimeSelect
              isClearable={true}
              timeFormat="HH:mm"
              timeIntervals={60}
              timeCaption="time"
            />
          </Stack>
        </Stack>

        <Stack direction="column">
          <Stack direction="row">
            <FormLabel fontSize="sm">
              Sell Above
            </FormLabel>
            <NumberInput
              size="sm"
              step={1.0}
              defaultValue={ combined?.baseTarget || 0 }
              onChange={ val => onChangeSwapRule( 'baseTarget', parseFloat(val)) }
            >
              <NumberInputField borderRadius="lg" background="white"/>
            </NumberInput>
            <FormLabel fontSize="sm">
              Hits ({ sellHits })
            </FormLabel>
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">
              Buy Below
            </FormLabel>
            <NumberInput
              size="sm"
              step={1.0}
              defaultValue={ combined?.swapTarget || 0 }
              onChange={ val => onChangeSwapRule( 'swapTarget', parseFloat(val)) }
            >
              <NumberInputField borderRadius="lg" background="white"/>
            </NumberInput>
            <FormLabel fontSize="sm">
              Hits ({ buyHits })
            </FormLabel>

          </Stack>
        </Stack>

        <Stack>
          <Text fontSize="sm" fontWeight="bold">
            Margin { margin }
          </Text>
        </Stack>

        <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginBottom="12">
          <Button
            size="sm"
            colorScheme='teal'
            variant='solid'
            onClick={() => router.push( '/' )}
          >
            Back
          </Button>

          <Button
            size="sm"
            isLoading={isLoading}
            loadingText='Loading...'
            colorScheme='teal'
            variant='solid'
            onClick={onLoadSwapRecords}
          >
            Refresh
          </Button>
        </Stack>

        <Stack direction="row">
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
        </Stack>
        
      </Stack>
    </Stack>
  )
}

export default Chart