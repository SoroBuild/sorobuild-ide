import { StrKey } from '@stellar/stellar-sdk';
let loading;
async function kit() {
  if (!loading) loading = Promise.all([
    import('@creit.tech/stellar-wallets-kit/sdk'),
    import('@creit.tech/stellar-wallets-kit/modules/freighter'),
    import('@creit.tech/stellar-wallets-kit/modules/xbull'),
    import('@creit.tech/stellar-wallets-kit/modules/albedo'),
    import('@creit.tech/stellar-wallets-kit/modules/lobstr'),
  ]).then(([{StellarWalletsKit: sdk}, {FreighterModule}, {xBullModule}, {AlbedoModule}, {LobstrModule}]) => {
    sdk.init({modules:[new FreighterModule(),new xBullModule(),new AlbedoModule(),new LobstrModule()]});
    return sdk;
  }).catch(error => { loading = null; throw error; });
  return loading;
}
const customNetworks = new Set(['freighter','xbull']);
export function supportsWalletNetwork(id, network) {
  if (network.value === 'sandbox') return customNetworks.has(id);
  if (id === 'albedo') return ['mainnet','testnet'].includes(network.value);
  return true;
}
export async function listWallets(network) {
  const sdk = await kit();
  return (await sdk.refreshSupportedWallets()).filter(wallet => supportsWalletNetwork(wallet.id, network));
}
export async function connectExternalWallet(id, network) {
  const sdk = await kit();
  if (!supportsWalletNetwork(id, network)) throw new Error('This wallet integration does not support Local Sandbox.');
  sdk.setNetwork(network.passphrase); sdk.setWallet(id);
  const {address} = await sdk.fetchAddress();
  if (!StrKey.isValidEd25519PublicKey(address)) throw new Error('Wallet returned an invalid account address.');
  return {address,id,name:sdk.selectedModule.productName};
}
export async function externalWalletNetwork(network) {
  const sdk = await kit();
  if (!supportsWalletNetwork(sdk.selectedModule.productId, network)) throw new Error('Selected wallet does not support this network.');
  if (['xbull','albedo'].includes(sdk.selectedModule.productId)) return network.passphrase;
  return (await sdk.getNetwork()).networkPassphrase;
}
export async function disconnectExternalWallet() { if (loading) await (await kit()).disconnect(); }
export async function signExternalTransaction(xdr, network, address) {
  const sdk = await kit();
  if (!supportsWalletNetwork(sdk.selectedModule.productId, network)) throw new Error('Selected wallet does not support this network.');
  sdk.setNetwork(network.passphrase);
  if (sdk.selectedModule.productId === 'freighter') {
    const passphrase = await externalWalletNetwork(network);
    if (passphrase !== network.passphrase) throw new Error(`Switch Freighter to ${network.label} before signing.`);
  }
  const result = await sdk.signTransaction(xdr, {address,networkPassphrase:network.passphrase});
  if (!result.signedTxXdr || (result.signerAddress && result.signerAddress !== address)) throw new Error('Wallet signature was rejected or the selected account changed.');
  return result.signedTxXdr;
}
