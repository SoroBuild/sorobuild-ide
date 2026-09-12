async function mockWallet(page,address) {
 await page.route('**/src/ide/wallets.js',route=>route.fulfill({contentType:'application/javascript',body:`export function supportsWalletNetwork(){return true};export async function listWallets(){return [{id:'freighter',name:'Freighter',isAvailable:true}]};export async function connectExternalWallet(){return {id:'freighter',name:'Freighter',address:'${address}'}};export async function externalWalletNetwork(){return globalThis.testWalletNetwork || 'Test SDF Network ; September 2015'};export async function disconnectExternalWallet(){};export async function signExternalTransaction(){throw new Error('Signing not mocked')};`}));
}
import { mockFunding } from './funding';
import {test,expect} from '@playwright/test';
test.beforeEach(async ({page}) => { await mockFunding(page); });
const wasm=Buffer.from([0,97,115,109,1,0,0,0]);
test('generated account can select uploaded WASM without a source build and mainnet prevents local signing',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Transaction signer'})).toHaveValue(/^G[A-Z2-7]{55}$/);
 await page.getByLabel('Upload WASM',{exact:true}).setInputFiles({name:'uploaded.wasm',mimeType:'application/wasm',buffer:wasm});
 await expect(page.getByRole('combobox',{name:'WASM artifact'})).toHaveValue('uploaded.wasm');
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeEnabled();
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await expect(page.getByRole('button',{name:'Fund selected account'})).toBeEnabled();
 await page.getByRole('combobox',{name:'Network',exact:true}).selectOption('mainnet');
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeDisabled();
 await expect(page.getByRole('button',{name:'Fund selected account'})).toBeDisabled();
 expect(errors).toEqual([]);
});
test('invalid WASM is rejected without creating a deployable artifact',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await page.getByLabel('Upload WASM',{exact:true}).setInputFiles({name:'invalid.wasm',mimeType:'application/wasm',buffer:Buffer.from('not wasm')});
 await expect(page.getByText('This file is not valid WebAssembly.',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeDisabled();
});
test('connected Freighter account becomes the signer and disconnect clears selection',async({page})=>{
 const address='GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
 await mockWallet(page,address);
 await page.goto('/');
 await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();await page.getByRole('button',{name:'Freighter Connect',exact:true}).click();
 await expect(page.getByRole('button',{name:'Connected',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await expect(page.getByRole('combobox',{name:'Transaction signer'})).toHaveValue(address);
 await page.getByText('Manage accounts',{exact:true}).click();
 await page.getByRole('button',{name:'Disconnect wallet'}).click();
 await expect(page.getByRole('combobox',{name:'Transaction signer'})).toHaveValue('');
});

test('generation funds each account and both remain selectable alongside the wallet',async({page})=>{
 const funding=await mockFunding(page);
 const wallet='GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
 await mockWallet(page,wallet);
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 const selector=page.getByRole('combobox',{name:'Transaction signer'});
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(selector.locator('option:checked')).toContainText('(funded)');
 const first=await selector.inputValue();
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(selector.locator('option:checked')).toContainText('(funded)');
 const second=await selector.inputValue();expect(first).not.toBe(second);
 expect(funding.requests).toEqual([first,second]);
 await page.getByRole('button',{name:'Connect wallet',exact:true}).click();await page.getByRole('button',{name:'Freighter Connect',exact:true}).click();
 await expect(selector).toHaveValue(wallet);
 await expect(selector.locator('option')).toHaveCount(4);
 await selector.selectOption(first);await expect(selector).toHaveValue(first);
 await selector.selectOption(second);await expect(selector).toHaveValue(second);
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await expect(page.getByRole('button',{name:'Fund selected account'})).toBeEnabled();
});
test('funding failure retains the generated key and retry funds the same account',async({page})=>{
 const funding=await mockFunding(page);funding.fail=true;
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await page.locator('.account-tools').evaluate(element=>{element.open=true;});
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(page.getByText('Create funded account failed',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 const selector=page.getByRole('combobox',{name:'Transaction signer'}), address=await selector.inputValue();
 expect(address).toMatch(/^G/);await expect(selector.locator('option:checked')).not.toContainText('(funded)');
 funding.fail=false;await page.locator('.account-tools').evaluate(element=>{element.open=true;});await page.getByRole('button',{name:'Fund selected account'}).click();
 await expect(selector.locator('option:checked')).toContainText('(funded)');
 expect(funding.requests).toEqual([address,address]);
});

test('blocked browser Friendbot requests fall back to the funding API with the same account',async({page})=>{
 const funding = await mockFunding(page);
 let funded;
 await page.route('https://friendbot.stellar.org/**',route=>route.abort('failed'));
 await page.route('**/api/accounts/fund',route=>{const body=route.request().postDataJSON();funded=body.address;funding.funded.add(funded);return route.fulfill({json:{funded:true,address:body.address,network:body.network}});});
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 const selector=page.getByRole('combobox',{name:'Transaction signer'});await expect(selector.locator('option:checked')).toContainText('(funded)');expect(await selector.inputValue()).toBe(funded);
});

 test('funding waits for RPC visibility and reports a network-specific missing account outside account tools',async({page})=>{
  const funding=await mockFunding(page);funding.visibilityDelay=2;
  await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
  await page.getByRole('button',{name:'Generate test account',exact:true}).click();
  const selector=page.getByLabel('Transaction signer');
  await expect(selector.locator('option:checked')).toContainText('(funded)',{timeout:10000});
  expect(funding.lookups).toBeGreaterThanOrEqual(3);
  funding.funded.clear();
  await page.getByText('Manage accounts',{exact:true}).click();
  await page.getByRole('button',{name:'Check account',exact:true}).click();
  await expect(selector.locator('option:checked')).not.toContainText('(funded)');
  await page.getByText('Manage accounts',{exact:true}).click();
  await expect(page.getByText(/Account not found on Testnet:/)).toBeVisible();
 });

test('sandbox only offers Freighter after its standalone network is verified and clears a mismatched signer',async({page})=>{
 const address='GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
 await mockWallet(page,address);
 await page.goto('/');await page.getByRole('button',{name:'Connect Wallet',exact:true}).click();await page.getByRole('button',{name:'Freighter Connect',exact:true}).click();
 await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 const selector=page.getByLabel('Transaction signer');await expect(selector).toHaveValue(address);
 await page.getByRole('combobox',{name:'Network',exact:true}).selectOption('sandbox');
 await expect(selector.locator(`option[value="${address}"]`)).toHaveCount(0);await expect(selector).toHaveValue('');
 await expect(page.getByText(/Use a generated or imported account for Local Sandbox/)).toBeVisible();
 await page.evaluate(()=>{globalThis.testWalletNetwork='Standalone Network ; February 2017';window.dispatchEvent(new Event('focus'));});
 await expect(selector.locator(`option[value="${address}"]`)).toHaveCount(1,{timeout:10000});
 await selector.selectOption(address);await expect(selector).toHaveValue(address);
 await page.evaluate(()=>{globalThis.testWalletNetwork='Test SDF Network ; September 2015';window.dispatchEvent(new Event('focus'));});
 await expect(selector.locator(`option[value="${address}"]`)).toHaveCount(0,{timeout:10000});await expect(selector).toHaveValue('');
 await page.getByRole('combobox',{name:'Network',exact:true}).selectOption('testnet');
 await expect(selector.locator(`option[value="${address}"]`)).toHaveCount(1);
});
