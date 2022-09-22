
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart
import { ProjectRule } from '../types/projectRules'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

const NftChart = ({
  projRule,
  floorDataPoints,
  alertBelowPoints,
  alertAbovePoints,
}: {
  projRule: ProjectRule | undefined,
  floorDataPoints: DataPoint[],
  alertBelowPoints: DataPoint[],
  alertAbovePoints: DataPoint[],
}) => {
  console.log('nftchart', projRule)
  const currFloor = floorDataPoints[floorDataPoints.length-1]?.y || 0.0
  return(
    <CanvasJSChart
      options={{
        theme: "light2",
        title: {
          text: `${ projRule?.stats?.project?.display_name || '?' } Floor @ ${ currFloor?.toFixed( 2 ) || "?" }`
        },
        axisY: {
          title: 'Floor',
          prefix: "$",
        },
        data: [
          {
            type: "line",
            xValueFormatString: "MM hh:mm",
            yValueFormatString: "$#,##0.00",
            dataPoints: floorDataPoints,
          },
          {
            type: "line",
            xValueFormatString: "MM hh:mm",
            yValueFormatString: "$#,##0.00",
            dataPoints: alertAbovePoints,
          },
          {
            type: "line",
            xValueFormatString: "MM hh:mm",
            yValueFormatString: "$#,##0.00",
            dataPoints: alertBelowPoints,
          },
        ]
      }}
    />
  )
}

export default NftChart