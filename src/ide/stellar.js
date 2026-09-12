import { signExternalTransaction } from './wallets.js';
import { Address, BASE_FEE, Contract, Keypair, Networks, Operation, StrKey, TransactionBuilder, nativeToScVal, rpc, scValToNative, xdr } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
export const networkOptions = [
  { value: 'testnet', label: 'Testnet', rpc: 'https://soroban-testnet.stellar.org', passphrase: Networks.TESTNET, friendbot: 'https://friendbot.stellar.org' },
  { value: 'futurenet', label: 'Futurenet', rpc: 'https://rpc-futurenet.stellar.org', passphrase: Networks.FUTURENET, friendbot: 'https://friendbot-futurenet.stellar.org' },
  { value: 'sandbox', label: 'Local Sandbox', rpc: 'http://localhost:8000/rpc', passphrase: Networks.STANDALONE, friendbot: 'http://localhost:8000/friendbot' },
  { value: 'mainnet', label: 'Mainnet', rpc: import.meta.env?.VITE_MAINNET_RPC || '', passphrase: Networks.PUBLIC },
];
export const serverFor = network => { if (!network.rpc) throw new Error('Configure VITE_MAINNET_RPC before using Mainnet.'); return new rpc.Server(network.rpc, { allowHttp: network.value === 'sandbox', timeout: 30 }); };
export const formatValue = value => JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item, 2);
export function generateAccount() {
  const key = Keypair.random();
  return { id: crypto.randomUUID(), address: key.publicKey(), secret: key.secret() };
}
export async function accountFor(network, address) {
  try { return await serverFor(network).getAccount(address); }
  catch (error) {
    if (error.message?.includes('Account not found')) throw new Error(`Account not found on ${network.label}: ${address}. ${network.friendbot ? 'Use Fund selected account on this network, then retry.' : 'Fund this account on Mainnet before submitting.'}`);
    throw new Error(`Could not check the account on ${network.label}: ${error.message}`);
  }
}
async function confirmFundedAccount(network, address) {
  let error;
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await accountFor(network, address); } catch (failure) { error = failure; }
    if (attempt < 4) await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw error;
}
export async function fundAccount(network, address) {
  if (!network.friendbot) throw new Error('Mainnet accounts cannot be funded by Friendbot.');
  try {
    const response = await fetch(`${network.friendbot}?addr=${encodeURIComponent(address)}`, { signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error(`Friendbot failed (${response.status}).`);
    return await confirmFundedAccount(network, address);
  } catch (error) {
    // A lost response can still mean funding succeeded. Check before retrying.
    try { return await serverFor(network).getAccount(address); } catch { /* Try the same-origin service next. */ }
    if (!['testnet','futurenet'].includes(network.value)) throw new Error(`Local Sandbox funding is unavailable at ${network.friendbot}. Start the local Stellar sandbox, wait until it is healthy, and retry funding. You can also select Testnet to use its hosted faucet.`);
    const base = (import.meta.env?.DEV ? '' : import.meta.env?.VITE_BASE_URL || '').replace(/\/$/, '');
    let response;
    try { response = await fetch(`${base}/api/accounts/fund`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({network:network.value,address}),signal:AbortSignal.timeout(50000)}); }
    catch { throw new Error('Could not reach the funding API. Your key is retained; check the API connection and retry funding.'); }
    const result = await response.json().catch(()=>null);
    if (!response.ok || result?.funded !== true || result.address !== address || result.network !== network.value) throw new Error(result?.error || 'Funding could not be confirmed. Your key is retained; retry funding shortly.');
    return await confirmFundedAccount(network, address);
  }
}

export async function waitForTransaction(server, hash, { attempts = 30, delay = 1500 } = {}) {
  for (let i = 0; i < attempts; i++) {
    const result = await server.getTransaction(hash);
    if (result.status === 'SUCCESS') return result;
    if (result.status === 'FAILED') throw new Error(`Transaction failed on ledger: ${hash}`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error(`Confirmation timed out. Transaction ${hash} may still confirm; check it before submitting again.`);
}

async function prepare(network, address, operation) {
  const server = serverFor(network);
  const account = await accountFor(network, address);
  const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: network.passphrase }).addOperation(operation).setTimeout(180).build();
  const simulation = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simulation)) throw new Error(simulation.error);
  if (!rpc.Api.isSimulationSuccess(simulation)) throw new Error('Simulation did not return a usable result.');
  if (rpc.Api.isSimulationRestore(simulation)) throw new Error('Contract state needs restoration before this transaction can execute.');
  return { server, tx: rpc.assembleTransaction(tx, simulation).build(), simulation };
}

export function transactionFromWallet(tx, signedXdr, network, address) {
  const signed = TransactionBuilder.fromXDR(signedXdr, network.passphrase);
  if (!signed.hash().equals(tx.hash())) throw new Error('Wallet returned a different transaction.');
  const key = Keypair.fromPublicKey(address);
  if (!signed.signatures.some(signature => { try { return key.verify(tx.hash(), signature.signature()); } catch { return false; } })) throw new Error('Wallet did not sign with the selected account on this network.');
  return signed;
}

async function submit(network, signer, operation, log) {
  if (!signer?.address) throw new Error('Select a funded account or connect Freighter.');
  if (network.value === 'mainnet' && signer.secret) throw new Error('Use an external wallet for Mainnet transactions.');
  const { server, tx } = await prepare(network, signer.address, operation);
  let signed = tx;
  if (signer.secret) tx.sign(Keypair.fromSecret(signer.secret));
  else {
    const signedXdr = await signExternalTransaction(tx.toXDR(), network, signer.address);
    signed = transactionFromWallet(tx, signedXdr, network, signer.address);
  }
  const sent = await server.sendTransaction(signed);
  if (!['PENDING', 'DUPLICATE'].includes(sent.status)) throw new Error(`Submission ${sent.status}: ${sent.errorResult?.toXDR('base64') || sent.hash}`);
  log?.(`Submitted transaction ${sent.hash}`);
  return waitForTransaction(server, sent.hash);
}

export function parseArguments(text) {
  const values = JSON.parse(text);
  if (!Array.isArray(values)) throw new Error('Arguments must be a JSON array of {type, value} entries.');
  return values.map(arg => {
    if (!arg || typeof arg.type !== 'string') throw new Error('Each argument needs an explicit Soroban type.');
    if (arg.type === 'address') return new Address(arg.value).toScVal();
    if (arg.type === 'xdr') return xdr.ScVal.fromXDR(arg.value, 'base64');
    if (!['bool', 'string', 'symbol', 'u32', 'i32', 'u64', 'i64', 'u128', 'i128', 'u256', 'i256'].includes(arg.type)) throw new Error(`Unsupported argument type: ${arg.type}. Use xdr for complex values.`);
    if (['u64', 'i64', 'u128', 'i128', 'u256', 'i256'].includes(arg.type) && typeof arg.value !== 'string') throw new Error('Large integers must be decimal strings to preserve precision.');
    return nativeToScVal(arg.value, { type: arg.type });
  });
}
export async function simulateCall(network, address, contract, method, args) {
  const { simulation } = await prepare(network, address, new Contract(contract).call(method, ...parseArguments(args)));
  return { result: scValToNative(simulation.result.retval), fee: simulation.minResourceFee, events: simulation.events?.map(event => event.toXDR('base64')) || [] };
}
export async function invokeCall(network, signer, contract, method, args, log) {
  const result = await submit(network, signer, new Contract(contract).call(method, ...parseArguments(args)), log);
  return { hash: result.txHash, result: result.returnValue ? scValToNative(result.returnValue) : null };
}
export async function deployWasm(network, signer, artifact, log, constructorArguments = '[]') {
  const constructorArgs = parseArguments(constructorArguments);
  const wasm = Buffer.from(artifact.wasm, 'base64');
  if (wasm.length < 8 || wasm.readUInt32BE(0) !== 0x0061736d) throw new Error('Artifact is not valid WebAssembly.');
  const uploaded = await submit(network, signer, Operation.uploadContractWasm({ wasm }), log);
  if (!uploaded.returnValue) throw new Error('Upload confirmed without a WASM hash.');
  const wasmHash = scValToNative(uploaded.returnValue);
  log?.(`WASM uploaded: ${Buffer.from(wasmHash).toString('hex')}`);
  const deployed = await submit(network, signer, Operation.createCustomContract({ address: new Address(signer.address), wasmHash, constructorArgs, salt: Buffer.from(crypto.getRandomValues(new Uint8Array(32))) }), log);
  if (!deployed.returnValue) throw new Error('Deployment confirmed without a contract address.');
  return { contractId: Address.fromScVal(deployed.returnValue).toString(), hash: deployed.txHash };
}

export function importAccount(secret) { const key = Keypair.fromSecret(secret); return { id: crypto.randomUUID(), address: key.publicKey(), secret: key.secret() }; }
