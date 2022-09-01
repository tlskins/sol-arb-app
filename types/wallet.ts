
export interface IWallet {
  _id: string,
  discordId: string,
  publicKey: string,
  name: string,
  balances: {
    [key: string]: number,
  }
}

export interface ICreateWallet {
  privateKey: string,
  publicKey: string,
  name: string,
}