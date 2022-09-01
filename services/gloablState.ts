import { createGlobalState,  } from 'react-hooks-global-state'

import { ITokenSwapRules } from '../types/swapRules'
import { IWallet } from '../types/wallet'
import { Token } from '../types/jupiter'

const getDefaultState = () => {
  return {
    tokens: [] as Token[],
    tokenSwapRules: [] as ITokenSwapRules[],
    wallets: [] as IWallet[],
  }
}
export const { useGlobalState, setGlobalState } = createGlobalState(getDefaultState())
export const resetGlobalState = () => {
  const dftState = getDefaultState()
  // @ts-ignore: dynamic access
  Object.keys( dftState ).forEach( key => setGlobalState( key, dftState[key] ))
}
