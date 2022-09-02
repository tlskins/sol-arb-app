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
}

const SwapChart = ({ swapRule }: { swapRule: ISwapRule | undefined }) => {
  const [dataPoints, setDataPoints] = useState([] as DataPoint[])
  useEffect(() => {
    if ( swapRule?._id ) {
      onLoadSwapRecords()
    }
  }, [swapRule?._id])

  const onLoadSwapRecords = async () => {
    if ( !swapRule ) {
      return
    }
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id)
    if ( swapRecords ) {
      setDataPoints(swapRecords.map( record => ({ x: Moment(record.timestamp).toDate(), y: record.unitPrice })))
    }
  }

  return(
    <div>
      <CanvasJSChart options={{
        theme: "light2",
        title: {
          text: `${ swapRule?.swapToken?.symbol || '?' } Prices`
        },
        axisY: {
          title: `${ swapRule?.swapToken?.symbol || '?' } Price in ${ swapRule?.baseToken?.symbol || '?' }`,
          prefix: "$",
        },
        data: [{
          type: "line",
          xValueFormatString: "MM hh:mm",
          yValueFormatString: "$#,##0.00",
          dataPoints
        }]
      }}
    />
    </div>
  )
}

export default SwapChart