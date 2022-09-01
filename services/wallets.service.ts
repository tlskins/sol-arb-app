import http, { handleError } from '../http-common'
import { IResponse } from '../types/service'
import { ICreateWallet, IWallet } from '../types/wallet'

interface WalletsResp {
  wallets: IWallet[]
}

class WalletService {
  newWallet = (): ICreateWallet => {
    return {
      privateKey: "",
      publicKey: "",
      name: "",
    } as ICreateWallet
  }

  getWallets = async (): Promise<IWallet[] | undefined> => {
    try {
      const resp: IResponse<WalletsResp> = await http.get( `wallet` )

      return resp.data.wallets
    } catch( err ) {
      handleError("Error getting wallets", err)
    }
  }

  create = async ( wallet: ICreateWallet ): Promise<IWallet | undefined> => {
    try {
      const resp: IResponse<IWallet> = await http.post( `wallet`, wallet )

      return resp.data
    } catch( err ) {
      handleError("Error creating wallet", err)
    }
  }
}

export default new WalletService()
