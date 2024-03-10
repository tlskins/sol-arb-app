import { Token } from './jupiter'
import { AlertSettings } from './alertSettings'

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
  decimals: number,
  slippage: number,
  active: boolean,
  inactiveBefore?: string,
  inactiveAfter?: string,
  lastBuyCheckAt?: string,
  lastBuyUnitPrice?: number,
  lastSellCheckAt?: string,
  lastSellUnitPrice?: number,
  walletId?: string,
  buyAlertSettings?: AlertSettings,
  sellAlertSettings?: AlertSettings, 
  // stop loss gain
  lastSupport: number | null,
  newSupportHighTest: number | null,
  newSupportLowTest: number | null,
  customSupport: number | null,
  brokeSupport: boolean | null,
  supportBreakPct: number | null, // % change to trigger a break in support
  stopPct: number | null, // % change to trigger a reversion from a break
  supportHistory: PriceSnap[] | null,
}

interface PriceSnap {
  price: number,
  timestamp: string,
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
  decimals?: number,
  slippage?: number,
  active?: boolean,
  inactiveBefore?: string,
  inactiveAfter?: string,
  walletId?: string,
  // stop loss gain
  lastSupport?: number | null,
  newSupportHighTest?: number | null,
  newSupportLowTest?: number | null,
  customSupport?: number | null,
  brokeSupport?: boolean | null,
  supportBreakPct?: number | null, // % change to trigger a break in support
  stopPct?: number | null, // % change to trigger a reversion from a break
  supportHistory?: PriceSnap[] | null,
}

export interface ICreateSwapRule {
  baseTokenSym: string, // USDC
  swapTokenSym: string, // DUST
  active: boolean,
  walletId?: string,
}