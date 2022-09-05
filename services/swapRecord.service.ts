import { Moment } from 'moment-timezone'
import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ISwapRecord } from '../types/swapRecord'

interface SwapRecordsResp {
  swapRecords: ISwapRecord[]
}

class SwapRecordService {
  getSwapRecords = async (ruleId: string, start: Moment, end: Moment): Promise<ISwapRecord[] | undefined> => {
    try {
      const resp: IResponse<SwapRecordsResp> = await http.post( `swap-records/${ruleId}`,
        {
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }
      )

      return resp.data.swapRecords
    } catch( err ) {
      handleError("Error getting swap records", err)
    }
  }
}

export default new SwapRecordService()
