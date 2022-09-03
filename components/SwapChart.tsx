import { useState, useEffect } from 'react'
import Moment from 'moment-timezone'
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart

import swapRecordService from '../services/swapRecord.service'
import { ISwapRule } from '../types/swapRules'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const SwapChart = ({ swapRule }: { swapRule: ISwapRule | undefined }) => {
  const [dataLoaded, setDataLoaded] = useState(false)
  const [buyDataPoints, setBuyDataPoints] = useState([] as DataPoint[])
  const [sellDataPoints, setSellDataPoints] = useState([] as DataPoint[])
  const [buyTargetPoints, setBuyTargetPoints] = useState([] as DataPoint[])
  const [sellTargetPoints, setSellTargetPoints] = useState([] as DataPoint[])


  useEffect(() => {
    onLoadSwapRecords()
  }, [])

  const onLoadSwapRecords = async () => {
    if ( !swapRule ) {
      return
    }
    setDataLoaded(false)
    const swapRecords = await swapRecordService.getSwapRecords(swapRule._id)
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
    setDataLoaded(true)
  }

  return(
    <div>
      { dataLoaded &&
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
    </div>
  )
}

export default SwapChart