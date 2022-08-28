import { ISwapRule } from '../types/swapRules'

export const pResponseSwapRule = (data: ISwapRule): ISwapRule => {
  return {
    ...data,
    inputTokenSym: data.inputToken?.symbol || '',
    targetTokenSym: data.targetToken?.symbol || '',
  }
}