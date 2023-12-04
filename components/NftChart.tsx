
import CanvasJSReact from '../canvasjs.react'
var CanvasJSChart = CanvasJSReact.CanvasJSChart
import { ProjectRule } from '../types/projectRules'
import { Select, Stack, FormControl, FormLabel } from '@chakra-ui/react'
import { useState } from 'react'

interface DataPoint {
  x: Date,
  y: number,
  label: string,
}

interface Y2Option {
  value: string,
  title: string,
  prefix: string,
  xValueFormatString: string,
  yValueFormatString: string,
  color: string,
  type: string,
  getTitle: (props: NftChartProps) => string,
  getDataPoints: (props: NftChartProps) => DataPoint[],
}

const Y2Options: Y2Option[] = [
  {
    value: 'Listings',
    title: 'Listings',
    prefix: '#',
    xValueFormatString: "MM hh:mm",
    yValueFormatString: "#0",
    color: "red",
    type: "line",
    getDataPoints: (props: NftChartProps): DataPoint[] => {

      return props.listingDataPoints
    },
    getTitle: (props: NftChartProps): string => {
      const { listingDataPoints } = props
      const currListings = listingDataPoints[listingDataPoints.length-1]?.y || 0.0

      return `Listings @ ${ currListings?.toFixed( 2 ) || "?" }`
    },
  },
  {
    value: 'numHolders',
    title: 'Unique Holders',
    prefix: '#',
    xValueFormatString: "MM hh:mm",
    yValueFormatString: "#0",
    color: "red",
    type: "line",
    getDataPoints: (props: NftChartProps): DataPoint[] => {

      return props.numHolderDataPoints
    },
    getTitle: (props: NftChartProps): string => {
      const { numHolderDataPoints } = props
      const curr = numHolderDataPoints[numHolderDataPoints.length-1]?.y || 0.0

      return `Unique Holders @ ${ curr?.toFixed( 2 ) || "?" }`
    },
  },
  {
    value: 'hr1Volume',
    title: '1 HR Volume',
    prefix: '#',
    xValueFormatString: "MM hh:mm",
    yValueFormatString: "#0",
    color: "red",
    type: "line",
    getDataPoints: (props: NftChartProps): DataPoint[] => {

      return props.hr1VolumeDataPoints
    },
    getTitle: (props: NftChartProps): string => {
      const { hr1VolumeDataPoints } = props
      const curr = hr1VolumeDataPoints[hr1VolumeDataPoints.length-1]?.y || 0.0

      return `1 HR Vol @ ${ curr?.toFixed( 2 ) || "?" }`
    },
  },
]

interface NftChartProps {
  projRule: ProjectRule | undefined,
  floorDataPoints: DataPoint[],
  listingDataPoints: DataPoint[],
  numHolderDataPoints: DataPoint[],
  hr1VolumeDataPoints: DataPoint[],
  alertBelowPoints: DataPoint[],
  alertAbovePoints: DataPoint[],
}

const NftChart = (props: NftChartProps) => {
  const {
    projRule,
    floorDataPoints,
    alertBelowPoints,
    alertAbovePoints,
  } = props
  console.log('nftchart', projRule)
  const currFloor = floorDataPoints[floorDataPoints.length-1]?.y || 0.0
  const [selectedY2, setSelectedY2] = useState(Y2Options[0])
  return(
    <Stack width="full" alignContent="center" alignItems="center" justifyContent="center" direction="column">
      <CanvasJSChart
        options={{
          theme: "light2",
          title: {
            text: `${ projRule?.stats?.name || '?' }`
          },
          subtitles: [
            { text: `Floor @ ${ currFloor?.toFixed( 2 ) || "?" }`, fontColor: "blue" },
            { text: selectedY2.getTitle(props), fontColor: "red" },
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
              dataPoints: selectedY2.getDataPoints(props),
              color: "red",
            },
          ]
        }}
      />
      <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" px="10">
        <FormControl fontSize="sm">
          <FormLabel fontSize="sm">Y2 Metric</FormLabel>
          <Select variant='outline'
            size="sm"
            width="60"
            background="white"
            borderRadius="lg"
            value={selectedY2.value}
            fontSize="sm"
            padding="0.5"
            onChange={ e => {
              const pickedY2 = Y2Options.find( opt => opt.value === e.target.value )
              if ( !pickedY2 ) return
              setSelectedY2(pickedY2)
            }}
          >
            <option value="None">None</option>
            { Y2Options.map( opt => (
              <option key={opt.value} value={opt.value}> 
                { opt.title }
              </option>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Stack>
  )
}

export default NftChart