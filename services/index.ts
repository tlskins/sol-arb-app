import * as SwapRuleService from './swapRule.service'
import * as WalletService from './wallets.service'
import * as ProjectRuleService from './projectRule.service'


export default {
  ...SwapRuleService,
  ...WalletService,
  ...ProjectRuleService,
} as any