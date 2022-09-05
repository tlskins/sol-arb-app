import { useState, useEffect } from 'react'
import Moment from 'moment-timezone'
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart
import DatePicker from "react-datepicker"
import {
  Box,
  Button,
  FormLabel,
  Stack,
  Text,
} from '@chakra-ui/react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'

import swapRecordService from '../services/swapRecord.service'
import { ISwapRule } from '../types/swapRules'
import { useGlobalState } from '../services/gloablState'


interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const SwapChart: NextPage = () => {
  const router = useRouter()
  const [swapRule, setChartSwapRule] = useGlobalState('chartSwapRule')
  const [chartStart, setChartStart] = useGlobalState('chartStart')
  const [chartEnd, setChartEnd] = useGlobalState('chartEnd')

  const [isLoading, setIsLoading] = useState(false)
  const [buyDataPoints, setBuyDataPoints] = useState([] as DataPoint[])
  const [sellDataPoints, setSellDataPoints] = useState([] as DataPoint[])
  const [buyTargetPoints, setBuyTargetPoints] = useState([] as DataPoint[])
  const [sellTargetPoints, setSellTargetPoints] = useState([] as DataPoint[])

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
  }, 0.0 ) / [...buyDataPoints, ...sellDataPoints].length)

  useEffect(() => {
    onLoadSwapRecords()
  }, [])

  const onLoadSwapRecords = async () => {
    if ( !swapRule || !chartStart || !chartEnd ) {
      return
    }
    setIsLoading(true)
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id, chartStart, chartEnd)
    if ( swapRecords ) {
      const newBuyDataPts = swapRecords.filter( record => record.inputTokenSymbol === swapRule.baseToken.symbol ).map( record => ({
        label: 'Buy Price',
        x: Moment(record.timestamp).toDate(),
        y: record.unitPrice,
      }))
      const newSellDataPts = swapRecords.filter( record => record.inputTokenSymbol !== swapRule.baseToken.symbol ).map( record => ({
        label: 'Sell Price',
        x: Moment(record.timestamp).toDate(),
        y: record.unitPrice,
      }))
      setBuyDataPoints(newBuyDataPts)
      setSellDataPoints(newSellDataPts)
      const biggerDataSet = newBuyDataPts.length > newSellDataPts.length ? newBuyDataPts : newSellDataPts
      if ( swapRule.baseInput ) {
        const newBuyTargetPoints = biggerDataSet.map( point => ({
          label: 'Buy Target',
          x: point.x,
          y: swapRule.swapTarget,
        }))
        setBuyTargetPoints(newBuyTargetPoints)
      }
      if ( swapRule.swapInput ) {
        const newSellTargetPoints = biggerDataSet.map( point => ({
          label: 'Sell Target',
          x: point.x,
          y: swapRule.baseTarget,
        }))
        setSellTargetPoints(newSellTargetPoints)
      }
    }
    setIsLoading(false)
  }

  return(
    <Stack p="2">
      <Button
        colorScheme='teal'
        variant='solid'
        onClick={() => router.push( '/' )}
      >
        Back
      </Button>

      { !isLoading &&
        <CanvasJSChart
          options={{
            theme: "light2",
            title: {
              text: `${ swapRule?.swapToken?.symbol || '?' } Prices`
            },
            axisY: {
              title: `${ swapRule?.swapToken?.symbol || '?' } Price in ${ swapRule?.baseToken?.symbol || '?' }`,
              prefix: "$",
            },
            data: [
              {
                type: "line",
                xValueFormatString: "MM hh:mm",
                yValueFormatString: "$#,##0.00",
                dataPoints: buyDataPoints,
              },
              {
                type: "line",
                xValueFormatString: "MM hh:mm",
                yValueFormatString: "$#,##0.00",
                dataPoints: sellDataPoints,
              },
              {
                type: "line",
                xValueFormatString: "MM hh:mm",
                yValueFormatString: "$#,##0.00",
                dataPoints: buyTargetPoints,
              },
              {
                type: "line",
                xValueFormatString: "MM hh:mm",
                yValueFormatString: "$#,##0.00",
                dataPoints: sellTargetPoints,
              },
            ]
          }}
        />
      }

      <Stack direction="column" marginY="4">
        <Text> Max Price ${ maxPrice?.toFixed( swapRule?.decimals ) }</Text>
        <Text> Min Price ${ minPrice?.toFixed( swapRule?.decimals ) }</Text>
        <Text> Avg Price ${ avgPrice?.toFixed( swapRule?.decimals ) }</Text>

        <Stack direction="row">
          <FormLabel fontSize="sm">Start</FormLabel>
          <DatePicker
            className="filter-calendar"
            selected={chartStart?.toDate()}
            dateFormat="Pp"
            onChange={ date => setChartStart(Moment(date)) }
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={60}
            timeCaption="time"
          />
        </Stack>

        <Stack direction="row">
          <FormLabel fontSize="sm">End </FormLabel>
          <DatePicker
            className="filter-calendar"
            selected={chartEnd?.toDate()}
            dateFormat="Pp"
            onChange={ date => setChartEnd(Moment(date)) }
            showTimeSelect
            timeFormat="HH:mm"
            timeIntervals={60}
            timeCaption="time"
          />
        </Stack>

        <Button
          size="sm"
          marginY="2"
          isLoading={isLoading}
          loadingText='Loading...'
          colorScheme='teal'
          variant='solid'
          onClick={onLoadSwapRecords}
        >
          Refresh
        </Button>
      </Stack>
    </Stack>
  )
}

export default SwapChart