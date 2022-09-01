import { IWallet } from '../types/wallet'

export const pWalletName = (wallet: IWallet): string => {
  return `${ wallet.name } (${ wallet.publicKey.slice(0, 4) }...${ wallet.publicKey.slice(wallet.publicKey.length - 4) })`
}