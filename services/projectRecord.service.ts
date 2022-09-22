import { Moment } from 'moment-timezone'
import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { IProjectRecord } from '../types/projectRecord'

interface ProjRecordsResp {
  projectRecords: IProjectRecord[]
}

interface GetSwapRecordsReq {
  startTime?: string,
  endTime?: string,
}

class ProjRecordService {
  getProjRecords = async (projId: string, start?: Moment, end?: Moment): Promise<IProjectRecord[] | undefined> => {
    try {
      const req = {} as GetSwapRecordsReq
      if ( start ) req.startTime = start.toISOString()
      if ( end ) req.endTime = end.toISOString()
      const resp: IResponse<ProjRecordsResp> = await http.post( `project-records/${projId}`, req)

      return resp.data.projectRecords
    } catch( err ) {
      handleError("Error getting project records", err)
    }
  }
}

export default new ProjRecordService()
