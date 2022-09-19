import { createGlobalState,  } from 'react-hooks-global-state'

import { ITokenSwapRules, ISwapRule } from '../types/swapRules'
import { IWallet } from '../types/wallet'
import { ProjectRule } from '../types/projectRules'
import { Token } from '../types/jupiter'


interface ConfirmModal {
  message: string,
  callback: () => {},
}

const getDefaultState = () => {
  return {
    tokens: [] as Token[],
    tokenSwapRules: [] as ITokenSwapRules[],
    projectRules: [] as ProjectRule[],
    wallets: [] as IWallet[],
    tags: [] as string[],
    confirmModal: undefined as ConfirmModal | undefined,
  }
}
export const { useGlobalState, setGlobalState } = createGlobalState(getDefaultState())
export const resetGlobalState = () => {
  const dftState = getDefaultState()
  // @ts-ignore: dynamic access
  Object.keys( dftState ).forEach( key => setGlobalState( key, dftState[key] ))
}
