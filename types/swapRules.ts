import { Token } from './jupiter'

export interface ISwapRule {
  _id: string,
  inputAmount: number,
  inputToken: Token,
  targetToken: Token,
  targetAmount: number,
  invTargetAmount: boolean,
  unitPrice: boolean,
  decimals: number,
  slippage: number,
  active: boolean,
}

export interface IUpdateSwapRule {
  _id: string,
  inputAmount?: number,
  inputToken?: Token,
  targetToken?: Token,
  targetAmount?: number,
  invTargetAmount?: boolean,
  unitPrice?: boolean,
  decimals?: number,
  slippage?: number,
  active?: boolean,
}