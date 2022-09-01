import * as SwapRuleService from './swapRule.service'
import * as WalletService from './wallets.service'

export default {
  ...SwapRuleService,
  ...WalletService,
} as any