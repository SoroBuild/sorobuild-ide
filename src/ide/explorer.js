const transactionBases = {
  testnet: 'https://stellar.expert/explorer/testnet/tx/',
  mainnet: 'https://stellar.expert/explorer/public/tx/',
  futurenet: 'https://futurenet.steexp.com/tx/',
};
export function transactionExplorerUrl(network, hash) {
  const base = transactionBases[network];
  return base && typeof hash === 'string' && /^[a-f0-9]{64}$/i.test(hash) ? base + hash : null;
}
