import { ISwapRule, ITokenSwapRules } from '../types/swapRules'

export const pResponseSwapRule = (data: ISwapRule): ISwapRule => {
  return {
    ...data,
    baseTokenSym: data.baseToken?.symbol || '',
    swapTokenSym: data.swapToken?.symbol || '',
  }
}

export const pResponseTokenSwapRules = (rules: ISwapRule[]): ITokenSwapRules[] => {
  const rulesMap = new Map<string, ITokenSwapRules>()
  rules.forEach( rule => {
    const tokenRules = rulesMap.get(rule.swapToken.symbol) || { swapTokenSymbol: rule.swapToken.symbol, swapRules: [] }
    tokenRules.swapRules.push( pResponseSwapRule( rule ))
    rulesMap.set(rule.swapToken.symbol, tokenRules)
  })
  let out = [] as ITokenSwapRules[]
  rulesMap.forEach(swapRules => out.push(swapRules))
  out = out.sort((a, b) => a.swapTokenSymbol.localeCompare(b.swapTokenSymbol) )

  return out
}