import { createGlobalState } from 'react-hooks-global-state'

import { ITokenSwapRules } from '../types/swapRules'
import { Token } from '../types/jupiter'

const initialState = {
  tokens: [] as Token[],
  tokenSwapRules: [] as ITokenSwapRules[],
}
export const { useGlobalState } = createGlobalState(initialState)
