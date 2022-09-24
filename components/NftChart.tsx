
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
  listingDataPoints,
  alertBelowPoints,
  alertAbovePoints,
}: {
  projRule: ProjectRule | undefined,
  floorDataPoints: DataPoint[],
  listingDataPoints: DataPoint[],
  alertBelowPoints: DataPoint[],
  alertAbovePoints: DataPoint[],
}) => {
  console.log('nftchart', projRule)
  const currFloor = floorDataPoints[floorDataPoints.length-1]?.y || 0.0
  const currListings = listingDataPoints[listingDataPoints.length-1]?.y || 0.0
  return(
    <CanvasJSChart
      options={{
        theme: "light2",
        title: {
          text: `${ projRule?.stats?.project?.display_name || '?' }`
        },
        subtitles: [
          { text: `Floor @ ${ currFloor?.toFixed( 2 ) || "?" }`, fontColor: "blue" },
          { text: `Listings @ ${ currListings?.toFixed( 2 ) || "?" }`, fontColor: "red" },
        ],
        axisY: {
          title: 'Floor',
          prefix: "$",
        },
        axisY2: {
          title: 'Listings',
          prefix: "#",
        },
        data: [
          {
            type: "line",
            xValueFormatString: "MM hh:mm",
            yValueFormatString: "$#,##0.00",
            dataPoints: floorDataPoints,
            color: "blue",
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
          {
            type: "line",
            axisYType: "secondary",
            xValueFormatString: "MM hh:mm",
            yValueFormatString: "#0",
            dataPoints: listingDataPoints,
            color: "red",
          },
        ]
      }}
    />
  )
}

export default NftChart