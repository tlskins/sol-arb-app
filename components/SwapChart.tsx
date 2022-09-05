import { useState, useEffect } from 'react'
import Moment from 'moment-timezone'
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart
import DatePicker from "react-datepicker"
import {
  Button,
  FormLabel,
  Stack,
} from '@chakra-ui/react'

import swapRecordService from '../services/swapRecord.service'
import { ISwapRule } from '../types/swapRules'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const SwapChart = ({
  swapRule,
  start,
  end,
}: {
  swapRule: ISwapRule | undefined,
  start: Moment.Moment | undefined,
  end: Moment.Moment | undefined,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [buyDataPoints, setBuyDataPoints] = useState([] as DataPoint[])
  const [sellDataPoints, setSellDataPoints] = useState([] as DataPoint[])
  const [buyTargetPoints, setBuyTargetPoints] = useState([] as DataPoint[])
  const [sellTargetPoints, setSellTargetPoints] = useState([] as DataPoint[])
  const [startTime, setStartTime] = useState(start)
  const [endTime, setEndTime] = useState(end)

  useEffect(() => {
    onLoadSwapRecords()
  }, [])

  const onLoadSwapRecords = async () => {
    if ( !swapRule || !startTime || !endTime ) {
      return
    }
    setIsLoading(true)
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id, startTime, endTime)
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
    <div>
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
        <Stack direction="row">
          <FormLabel fontSize="sm">Start</FormLabel>
          <DatePicker
            className="filter-calendar"
            selected={startTime?.toDate()}
            dateFormat="Pp"
            onChange={ date => setStartTime(Moment(date)) }
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
            selected={endTime?.toDate()}
            dateFormat="Pp"
            onChange={ date => setEndTime(Moment(date)) }
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
    </div>
  )
}

export default SwapChart