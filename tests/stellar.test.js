import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, StrKey, scValToNative } from '@stellar/stellar-sdk';
import { generateAccount, parseArguments, waitForTransaction, networkOptions } from '../src/ide/stellar.js';

test('generated keypairs are valid and can sign', () => {
  const account = generateAccount();
  assert.ok(StrKey.isValidEd25519PublicKey(account.address));
  const key = Keypair.fromSecret(account.secret);
  assert.equal(key.publicKey(), account.address);
  assert.ok(key.verify(Buffer.from('test'), key.sign(Buffer.from('test'))));
});
test('typed arguments preserve large integer precision and reject ambiguous inputs', () => {
  const result = parseArguments('[{"type":"u64","value":"18446744073709551615"}]');
  assert.equal(scValToNative(result[0]), 18446744073709551615n);
  assert.throws(() => parseArguments('[{"type":"u64","value":123}]'), /decimal strings/);
  assert.throws(() => parseArguments('{}'), /array/);
  assert.throws(() => parseArguments('[{"type":"wat","value":1}]'), /Unsupported/);
});
test('transaction polling requires confirmed success', async () => {
  let calls = 0;
  const result = await waitForTransaction({ getTransaction: async () => ({ status: ++calls === 2 ? 'SUCCESS' : 'NOT_FOUND' }) }, 'abc', { delay: 0 });
  assert.equal(result.status, 'SUCCESS');
  await assert.rejects(waitForTransaction({ getTransaction: async () => ({ status: 'FAILED' }) }, 'abc'), /failed on ledger/);
  await assert.rejects(waitForTransaction({ getTransaction: async () => ({ status: 'NOT_FOUND' }) }, 'abc', { attempts: 1, delay: 0 }), /may still confirm/);
});
test('mainnet has no faucet', () => assert.equal(networkOptions.find(n => n.value === 'mainnet').friendbot, undefined));

 test('wallet signatures must preserve the transaction and match the account and network',async()=>{
  const {Account,Asset,Keypair,Operation,TransactionBuilder}=await import('@stellar/stellar-sdk');
  const {transactionFromWallet}=await import('../src/ide/stellar.js');
  const key=Keypair.random(),other=Keypair.random(),network=networkOptions[0];
  const make=(passphrase,amount='1')=>new TransactionBuilder(new Account(key.publicKey(),'1'),{fee:'100',networkPassphrase:passphrase}).addOperation(Operation.payment({destination:key.publicKey(),asset:Asset.native(),amount})).setTimeout(0).build();
  const unsigned=make(network.passphrase),signed=make(network.passphrase);signed.sign(key);
  assert.ok(transactionFromWallet(unsigned,signed.toXDR(),network,key.publicKey()));
  const wrongAccount=make(network.passphrase);wrongAccount.sign(other);
  assert.throws(()=>transactionFromWallet(unsigned,wrongAccount.toXDR(),network,key.publicKey()),/selected account/);
  const wrongNetwork=make(networkOptions[2].passphrase);wrongNetwork.sign(key);
  assert.throws(()=>transactionFromWallet(unsigned,wrongNetwork.toXDR(),network,key.publicKey()),/selected account/);
  const changed=make(network.passphrase,'2');changed.sign(key);
  assert.throws(()=>transactionFromWallet(unsigned,changed.toXDR(),network,key.publicKey()),/different transaction/);
 });
