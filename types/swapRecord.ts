export interface ISwapRecord {
  _id: string,
  swapRuleId: string,
  timestamp: string,
  inputTokenAddress: string,
  inputTokenSymbol: string,
  targetTokenAddress: string,
  targetTokenSymbol: string,
  inputAmount: number,
  unitPrice: number,
}