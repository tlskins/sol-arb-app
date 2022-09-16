import { createGlobalState,  } from 'react-hooks-global-state'

import { ITokenSwapRules, ISwapRule } from '../types/swapRules'
import { IWallet } from '../types/wallet'
import { ProjectRule } from '../types/projectRules'
import { Token } from '../types/jupiter'
import Moment from 'moment-timezone'

const getDefaultState = () => {
  return {
    tokens: [] as Token[],
    tokenSwapRules: [] as ITokenSwapRules[],
    projectRules: [] as ProjectRule[],
    wallets: [] as IWallet[],
    tags: [] as string[],
  }
}
export const { useGlobalState, setGlobalState } = createGlobalState(getDefaultState())
export const resetGlobalState = () => {
  const dftState = getDefaultState()
  // @ts-ignore: dynamic access
  Object.keys( dftState ).forEach( key => setGlobalState( key, dftState[key] ))
}
