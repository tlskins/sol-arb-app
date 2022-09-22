import * as SwapRuleService from './swapRule.service'
import * as WalletService from './wallets.service'
import * as ProjectRuleService from './projectRule.service'
import * as ProjectRecordService from './projectRecord.service'

export default {
  ...SwapRuleService,
  ...WalletService,
  ...ProjectRuleService,
  ...ProjectRecordService,
} as any