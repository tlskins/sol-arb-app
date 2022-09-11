import { Moment } from 'moment-timezone'
import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ISwapRecord } from '../types/swapRecord'

interface SwapRecordsResp {
  swapRecords: ISwapRecord[]
}

interface GetSwapRecordsReq {
  startTime?: string,
  endTime?: string,
}

class SwapRecordService {
  getSwapRecords = async (ruleId: string, start?: Moment, end?: Moment): Promise<ISwapRecord[] | undefined> => {
    try {
      const req = {} as GetSwapRecordsReq
      if ( start ) req.startTime = start.toISOString()
      if ( end ) req.endTime = end.toISOString()
      const resp: IResponse<SwapRecordsResp> = await http.post( `swap-records/${ruleId}`, req)

      return resp.data.swapRecords
    } catch( err ) {
      handleError("Error getting swap records", err)
    }
  }
}

export default new SwapRecordService()
