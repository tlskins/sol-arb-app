import { Token } from './jupiter'

export interface ITokenSwapRules {
  swapTokenSymbol: string,
  swapRules: ISwapRule[],
}

export interface ISwapRule {
  _id: string,
  discordId: string,
  baseTokenSym: string,
  baseToken: Token, // USDC // stable asset
  baseInput: number, // 250
  baseTarget: number, // 2.55 // swap to USDC if >= 2.55
  isExecuteSell: boolean,
  swapTokenSym: string,
  swapToken: Token, // DUST // target asset
  swapInput: number, // 100
  swapTarget: number, // 2.4 // swap to DUST if <= 2.55
  isExecuteBuy: boolean,
  invertPrice: boolean,
  slippage: number,
  active: boolean,
  inactiveBefore?: string,
  inactiveAfter?: string,
  lastBuyCheckAt?: string,
  lastBuyUnitPrice?: number,
  lastSellCheckAt?: string,
  lastSellUnitPrice?: number,
}

export interface IUpdateSwapRule {
  _id: string,
  discordId?: string,
  baseTokenSym?: string, // USDC
  baseInput?: number, // 250
  baseTarget?: number, // 2.55
  isExecuteSell?: boolean,
  swapTokenSym?: string, // DUST
  swapInput?: number, // 100
  swapTarget?: number, // 2.4
  isExecuteBuy?: boolean,
  invertPrice?: boolean,
  slippage?: number,
  active?: boolean,
  inactiveBefore?: string,
  inactiveAfter?: string,
}

export interface ICreateSwapRule {
  baseTokenSym: string, // USDC
  swapTokenSym: string, // DUST
}