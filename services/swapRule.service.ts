import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ISwapRule, IUpdateSwapRule, ITokenSwapRules, ICreateSwapRule } from '../types/swapRules'
import { pResponseSwapRule, pResponseTokenSwapRules } from '../presenters/swapRules'

interface SwapRulesResp {
  swapRules: ISwapRule[]
}

class SwapRuleService {
  newSwapRule = (): ICreateSwapRule => {
    return {
      baseTokenSym: "",
      swapTokenSym: "",
    } as ICreateSwapRule
  }

  getRulesByDiscord = async (): Promise<ITokenSwapRules[] | undefined> => {
    try {
      const resp: IResponse<SwapRulesResp> = await http.get( `swap-rule` )
      const rules = resp.data.swapRules.map( rule => pResponseSwapRule(rule))
      const out = pResponseTokenSwapRules( rules )

      return out
    } catch( err ) {
      handleError("Error getting swap rules", err)
    }
  }

  create = async ( rule: ICreateSwapRule ): Promise<ISwapRule | undefined> => {
    try {
      const resp: IResponse<ISwapRule> = await http.post( `swap-rule`, {
        baseTokenSym: rule.baseTokenSym,
        baseInput: 1,
        baseTarget: 1,
        isExecuteSell: false,
        swapTokenSym: rule.swapTokenSym,
        swapInput: 1,
        swapTarget: 1,
        isExecuteBuy: false,
        slippage: 5,
        active: false,
      } )

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

  checkSwaps = async (): Promise<boolean> => {
    try {
      const resp: IResponse<null> = await http.post( `check-swaps` )

      return true
    } catch( err ) {
      handleError("Error checking swaps", err)

      return false
    }
  }
}

export default new SwapRuleService()
