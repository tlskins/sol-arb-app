import { useState, useEffect } from 'react'
import Moment from 'moment-timezone'
import CanvasJSReact from '../canvasjs.react'
var CanvasJS = CanvasJSReact.CanvasJS
var CanvasJSChart = CanvasJSReact.CanvasJSChart

import swapRecordService from '../services/swapRecord.service'
import { ISwapRule } from '../types/swapRules'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const SwapChart = ({ swapRule }: { swapRule: ISwapRule | undefined }) => {
  const [buyDataPoints, setBuyDataPoints] = useState([] as DataPoint[])
  const [sellDataPoints, setSellDataPoints] = useState([] as DataPoint[])

  useEffect(() => {
    if ( !!swapRule?._id ) {
      onLoadSwapRecords()
    }
  }, [swapRule])

  const onLoadSwapRecords = async () => {
    if ( !swapRule ) {
      return
    }
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id)
    if ( swapRecords ) {
      setBuyDataPoints(swapRecords.filter( record => record.inputTokenSymbol === swapRule.baseToken.symbol ).map( record => ({
        label: 'Buy',
        x: Moment(record.timestamp).toDate(),
        y: record.unitPrice,
      })))
      setSellDataPoints(swapRecords.filter( record => record.inputTokenSymbol !== swapRule.baseToken.symbol ).map( record => ({
        label: 'Sell',
        x: Moment(record.timestamp).toDate(),
        y: record.unitPrice,
      })))
    }
  }

  return(
    <div>
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
          ]
        }}
      />
    </div>
  )
}

export default SwapChart