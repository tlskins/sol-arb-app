import { createGlobalState,  } from 'react-hooks-global-state'

import { ITokenSwapRules, ISwapRule } from '../types/swapRules'
import { IWallet } from '../types/wallet'
import { Token } from '../types/jupiter'
import Moment from 'moment-timezone'

const getDefaultState = () => {
  return {
    tokens: [] as Token[],
    tokenSwapRules: [] as ITokenSwapRules[],
    wallets: [] as IWallet[],
    chartSwapRule: undefined as ISwapRule | undefined,
    chartStart: undefined as Moment.Moment | undefined,
    chartEnd: undefined as Moment.Moment | undefined,
  }
}
export const { useGlobalState, setGlobalState } = createGlobalState(getDefaultState())
export const resetGlobalState = () => {
  const dftState = getDefaultState()
  // @ts-ignore: dynamic access
  Object.keys( dftState ).forEach( key => setGlobalState( key, dftState[key] ))
}
