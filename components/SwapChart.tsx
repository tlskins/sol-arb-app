
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart
import { ISwapRule } from '../types/swapRules'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const SwapChart = ({
  swapRule,
  buyDataPoints,
  sellDataPoints,
  buyTargetPoints,
  sellTargetPoints,
}: {
  swapRule: ISwapRule | undefined,
  buyDataPoints: DataPoint[],
  sellDataPoints: DataPoint[],
  buyTargetPoints: DataPoint[],
  sellTargetPoints: DataPoint[],
}) => {
  const currPrice = buyDataPoints[buyDataPoints.length-1]?.y || sellDataPoints[sellDataPoints.length-1]?.y || 0.0
  return(
    <CanvasJSChart
      options={{
        theme: "light2",
        title: {
          text: `${ swapRule?.swapToken?.symbol || '?' } Prices @ ${ currPrice?.toFixed( swapRule?.decimals ) || "?" }`
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
  )
}

export default SwapChart