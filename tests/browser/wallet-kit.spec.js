import { test, expect } from '@playwright/test';
import { Keypair, Account, TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';

test('real Wallets Kit connects xBull, signs with it, and filters sandbox wallets inside the expanded panel',async({page})=>{
 const key=Keypair.random();
 const tx=new TransactionBuilder(new Account(key.publicKey(),'1'),{fee:'100',networkPassphrase:Networks.STANDALONE}).addOperation(Operation.payment({destination:key.publicKey(),asset:Asset.native(),amount:'1'})).setTimeout(60).build();
 tx.sign(key);
 // Replace only the external wallet module. The real Kit and Sorobuild adapter run normally.
 await page.route(/stellar-wallets-kit.*modules.xbull/,route=>route.fulfill({contentType:'application/javascript',body:`export class xBullModule {productId='xbull';productName='xBull';productUrl='https://xbull.app';productIcon='';moduleType='HOT_WALLET';async isAvailable(){return true};async getAddress(){return {address:'${key.publicKey()}'}};async signTransaction(xdr,opts){globalThis.walletSignatureRequest={xdr,opts};return {signedTxXdr:'${tx.toXDR()}',signerAddress:opts.address}};async getNetwork(){throw new Error('Not supported')}};`}));
 await page.goto('/');await page.getByRole('combobox',{name:'Network',exact:true}).selectOption('sandbox');
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();await page.getByRole('button',{name:'Expand deployment view',exact:true}).click();
 await page.getByRole('button',{name:'Connect wallet',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Connect a wallet',exact:true});await expect(dialog).toBeVisible();
 await expect(dialog.getByRole('button',{name:/Albedo/})).toHaveCount(0);await expect(dialog.getByRole('link',{name:'Install LOBSTR'})).toHaveCount(0);
 await dialog.getByRole('button',{name:'xBull Connect',exact:true}).click();
 await expect(dialog).toHaveCount(0);await expect(page.getByLabel('Transaction signer')).toHaveValue(key.publicKey());
 const signed=await page.evaluate(async ({xdr,address})=>{
  const {signExternalTransaction}=await import('/src/ide/wallets.js');
  return signExternalTransaction(xdr,{value:'sandbox',passphrase:'Standalone Network ; February 2017'},address);
 },{xdr:tx.toXDR(),address:key.publicKey()});
 expect(signed).toBe(tx.toXDR());
 expect(await page.evaluate(()=>globalThis.walletSignatureRequest.opts)).toEqual({address:key.publicKey(),networkPassphrase:Networks.STANDALONE});
 await page.getByText('Manage accounts',{exact:true}).click();await page.getByRole('button',{name:'Disconnect wallet',exact:true}).click();
 await expect(page.getByLabel('Transaction signer')).toHaveValue('');
});

test('wallet chooser cancellation preserves generated-account workflow',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Connect a wallet',exact:true});
 await expect(dialog.getByRole('button',{name:/Albedo/})).toBeVisible({timeout:15000});
 await expect(dialog.getByRole('link',{name:'Install LOBSTR'})).toBeVisible();
 await page.getByRole('button',{name:'Close wallet chooser'}).click();await expect(dialog).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Connect Wallet',exact:true})).toBeEnabled();
});
