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
import { useDisclosure } from '@chakra-ui/react'

import Navbar from '../components/Navbar'
import NumberInput from '../components/NumberInput'
import { UpsertProjectRule, ProjectRule } from '../types/projectRules'
import { IProjectRecord } from '../types/projectRecord'
import ProjectRuleService from '../services/projectRule.service'
import projectRecordService from '../services/projectRecord.service'
const SwapChart = dynamic(() => import("../components/NftChart"), { ssr: false })


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


const NftChart: NextPage = () => {
  const router = useRouter()
  const { projId, filterId: routerFilterId } = router.query
  const { data: _sessionData } = useSession()
  const sessionData = _sessionData as any
  console.log('sessionData',sessionData)

  const [filterId, setFilterId] = useState(routerFilterId as string)
  const [projRule, setProjectRule] = useState(undefined as ProjectRule | undefined)
  const [chartStart, setChartStart] = useState(undefined as undefined | Moment.Moment)
  const [chartEnd, setChartEnd] = useState(undefined as undefined | Moment.Moment)
  
  const [isLoading, setIsLoading] = useState(false)
  const [floorDataPoints, setFloorDataPoints] = useState([] as DataPoint[])
  const [alertBelowPoints, setAlertBelowPoints] = useState([] as DataPoint[])
  const [alertAbovePoints, setAlertAbovePoints] = useState([] as DataPoint[])
  const [renderStart, setRenderStart] = useState(undefined as Date | undefined)
  const [renderEnd, setRenderEnd] = useState(undefined as Date | undefined)

  const [projRuleUpdate, setProjRuleUpdate] = useState({} as UpsertProjectRule)
  const {
    isOpen: isUpdating,
    onOpen: onUpdating,
    onClose: onUpdated,
  } = useDisclosure()

  const combined = { ...projRule, ...projRuleUpdate }

  const minPrice = floorDataPoints.reduce((min, curr) => {
    if ( min == null) return curr.y

    return curr.y < min ? curr.y : min
  }, undefined as undefined | number)
  const maxPrice = floorDataPoints.reduce((max, curr) => {
    if ( max == null) return curr.y

    return curr.y > max ? curr.y : max
  }, undefined as undefined | number)
  const avgPrice = (floorDataPoints.reduce((sum, curr) => {
    return sum += curr.y
  }, 0.0 ) / (floorDataPoints.length || 1))

  useEffect(() => {
    if ( sessionData?.token?.id ) {
      if ( filterId ) {
        const filter = ChartRangeFilters.find( filter => filter.id === filterId )
        if ( filter ) {
          const { length, unit } = filter
          setChartStart(Moment().add(-1 * length, unit))
        }
      }
      if ( projId ) {
        onLoadProjRule()
      }
    }
  }, [projId, filterId, sessionData?.token?.id])

  useEffect(() => {
    onLoadProjRecords()
  }, [projRule])

  useEffect(() => {
    if ( routerFilterId ) {
      setFilterId(routerFilterId as string)
    }
  }, [routerFilterId])

  useEffect(() => {
    drawAlertPoints(renderStart, renderEnd, combined.floorBelow, combined.floorAbove)
  }, [floorDataPoints, renderStart, renderEnd, combined.floorBelow, combined.floorAbove])

  const onLoadProjRule = async () => {
    const newProjRule = await ProjectRuleService.getProjectStats( projId as string )
    setProjectRule( newProjRule )
  }

  const onChangeProjRule = async (key: string, value: any) => {
    if ( !projRule ) return
    const update = { ...projRuleUpdate }
    if ( projRuleUpdate._id !== projRule._id ) {
      update._id = projRule._id || ""
    }
    // @ts-ignore: dynamic access
    update[key] = value
    setProjRuleUpdate( update )
  }

  const onUpdateProjRule = async () => {
    if ( !projRuleUpdate._id ) {
      return
    }
    onUpdating()
    const updatedRule = await ProjectRuleService.updateRule( projRuleUpdate._id, projRuleUpdate )
    if ( updatedRule ) {
      setProjRuleUpdate({} as UpsertProjectRule)
      toast.success('Updated Project Rule!', {
        theme: 'dark',
        position: toast.POSITION.TOP_CENTER,
      })
    }
    onUpdated()
  }

  const onLoadProjRecords = async () => {
    if ( !projRule || isLoading ) {
      return
    }
    setIsLoading(true)
    const projRecords = await projectRecordService.getProjRecords(projId as string, chartStart, chartEnd)
    if ( projRecords && projRecords.length > 1 ) {
      drawFloorPoints(projRecords)
      const newRenderStart = Moment(projRecords[0].timestamp).toDate()
      const newRenderEnd = Moment(projRecords[projRecords.length-1].timestamp).toDate()
      setRenderStart(newRenderStart)
      setRenderEnd(newRenderEnd)
    }
    setIsLoading(false)
  }

  const drawFloorPoints = (projRecords: IProjectRecord[]) => {
    if ( !projRule ) return
    setFloorDataPoints(projRecords.map( record => ({
      label: 'Floor Price',
      x: Moment(record.timestamp).toDate(),
      y: record.floor,
    })))
  }

  const drawAlertPoints = (start?: Date, end?: Date, alertBelow?: number | null, alertAbove?: number | null) => {
    if ( alertBelow != null && start != null && end != null ) {
      setAlertBelowPoints([
        {
          label: 'Alert Below',
          x: start,
          y: alertBelow,
        },
        {
          label: 'Alert Below',
          x: end,
          y: alertBelow,
        },
      ])
    }
    if ( alertAbove != null && start != null && end != null ) {
      setAlertAbovePoints([
        {
          label: 'Alert Above',
          x: start,
          y: alertAbove,
        },
        {
          label: 'Alert Above',
          x: end,
          y: alertAbove,
        },
      ])
    }
  }

  return(
    <Stack p="2">
      <Navbar />

      { !isLoading && projRule &&
        <SwapChart
          projRule={projRule}
          floorDataPoints={floorDataPoints}
          alertBelowPoints={alertBelowPoints}
          alertAbovePoints={alertAbovePoints}
        />
      }

      <Stack direction="column" marginY="4" alignContent="center" alignItems="center" justifyContent="center" fontWeight="bold">
        <Stack direction="row" fontSize="sm">
          <Stack direction="column">
            <Text> Min Price </Text>
            <Text> ${ minPrice?.toFixed( 2 ) || "?" } </Text>
          </Stack>
          <Stack direction="column">
            <Text> Avg Price </Text>
            <Text> ${ avgPrice?.toFixed( 2 ) || "?" } </Text>
          </Stack>
          <Stack direction="column">
            <Text> Max Price </Text>
            <Text> ${ maxPrice?.toFixed( 2 ) || "?" } </Text>
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
              Alert Above
            </FormLabel>
            <NumberInput
              thousandSeparator={true}
              value={ combined?.floorAbove }
              onValueChange={ value => onChangeProjRule( 'floorAbove', value ) }
            />
          </Stack>

          <Stack direction="row">
            <FormLabel fontSize="sm">
              Alert Below
            </FormLabel>
            <NumberInput
              thousandSeparator={true}
              value={ combined?.floorBelow }
              onValueChange={ value => onChangeProjRule( 'floorBelow', value ) }
            />
          </Stack>
        </Stack>

        <Stack direction="row" alignContent="center" alignItems="center" justifyContent="center" marginBottom="12">
          <Button
            size="sm"
            colorScheme='teal'
            variant='solid'
            onClick={() => router.push( '/nfts' )}
          >
            Back
          </Button>

          <Button
            size="sm"
            isLoading={isLoading}
            loadingText='Loading...'
            colorScheme='teal'
            variant='solid'
            onClick={onLoadProjRecords}
          >
            Refresh
          </Button>
        </Stack>

        <Stack direction="row">
          { projRuleUpdate._id &&
            <Button
              isLoading={isUpdating}
              loadingText='Saving...'
              colorScheme='teal'
              variant='solid'
              onClick={onUpdateProjRule}
            >
              Save
            </Button>
          }
        </Stack>
        
      </Stack>
    </Stack>
  )
}

export default NftChart