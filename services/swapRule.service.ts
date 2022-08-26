import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ISwapRule, IUpdateSwapRule } from '../types/swapRules'

class SwapRuleService {
  getRulesByDiscord = async ( discordId: string ): Promise<ISwapRule[] | undefined> => {
    try {
      const resp: IResponse<ISwapRule[]> = await http.get( `swap-rule/by-discord-id/${discordId}` )

      return resp.data
    } catch( err ) {
      handleError("Error getting swap rules", err)
    }
  }

  create = async ( rule: ISwapRule ): Promise<ISwapRule | undefined> => {
    try {
      const resp: IResponse<ISwapRule> = await http.post( `swap-rule`, rule )

      return resp.data
    } catch( err ) {
      handleError("Error creating swap rule", err)
    }
  }

  update = async ( id: string, update: IUpdateSwapRule ): Promise<ISwapRule | undefined> => {
    try {
      const resp: IResponse<ISwapRule> = await http.put( `swap-rule/${ id }`, update )

      return resp.data
    } catch( err ) {
      handleError("Error updating swap rule", err)
    }
  }
}

export default new SwapRuleService()
