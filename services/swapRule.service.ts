import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ISwapRule, IUpdateSwapRule, ITokenSwapRules } from '../types/swapRules'
import { pResponseSwapRule, pResponseTokenSwapRules } from '../presenters/swapRules'

interface SwapRulesResp {
  swapRules: ISwapRule[]
}

class SwapRuleService {
  getRulesByDiscord = async ( discordId: string ): Promise<ITokenSwapRules[] | undefined> => {
    try {
      const resp: IResponse<SwapRulesResp> = await http.get( `swap-rule/by-discord-id/${discordId}` )
      const rules = resp.data.swapRules.map( rule => pResponseSwapRule(rule))
      const out = pResponseTokenSwapRules( rules )

      return out
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
