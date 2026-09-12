import { test, expect } from '@playwright/test';
import { mockFunding } from './funding';
const wasm=Buffer.from([0,97,115,109,1,0,0,0]).toString('base64');
test('funded account can compile in Deploy and sees why a stale build cannot deploy',async({page})=>{
 await page.route('**/api/projects/*/format',route=>route.fulfill({json:{success:true,files:route.request().postDataJSON().files}}));
 await mockFunding(page);let builds=0;
 await page.route('**/api/projects',route=>route.fulfill({status:201,json:{projectId:'compile-test',projectToken:'owner',revision:1}}));
 await page.route('**/api/projects/compile-test/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
 await page.route('**/api/projects/compile-test/build',route=>{builds++;return route.fulfill({json:{success:true,output:'Build complete',artifacts:[{name:'counter.wasm',wasm}]}});});
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Transaction signer'}).locator('option:checked')).toContainText('(funded)');
 await expect(page.locator('#deployment-readiness')).toContainText('Compile your contract');
 await page.getByRole('button',{name:'Compile contract',exact:true}).click();
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeEnabled();expect(builds).toBe(1);
 await expect(page.locator('#deployment-readiness')).toContainText('Ready to deploy counter.wasm');
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeInViewport();
 await page.screenshot({path:'test-results/deployment-ready.png',fullPage:true});
 await page.getByRole('button',{name:'Clear',exact:true}).click();
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeDisabled();
 await expect(page.locator('#deployment-readiness')).toContainText('Recompile');
 await page.getByRole('button',{name:'Recompile contract',exact:true}).click();
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeEnabled();expect(builds).toBe(2);
});

test('rebuilding clears incomplete constructor arguments from an uploaded contract',async({page})=>{
 const {xdr}=await import('@stellar/stellar-sdk');
 const spec=xdr.ScSpecEntry.scSpecEntryFunctionV0(new xdr.ScSpecFunctionV0({
  doc:'',name:'__constructor',inputs:[new xdr.ScSpecFunctionInputV0({doc:'',name:'start',type:xdr.ScSpecTypeDef.scSpecTypeU32()})],outputs:[],
 })).toXDR();
 const leb=value=>{const bytes=[];do{let byte=value&127;value>>>=7;if(value)byte|=128;bytes.push(byte);}while(value);return Buffer.from(bytes);};
 const name=Buffer.from('contractspecv0');const payload=Buffer.concat([leb(name.length),name,spec]);
 const constructorWasm=Buffer.concat([Buffer.from(wasm,'base64'),Buffer.from([0]),leb(payload.length),payload]);
 await page.route('**/api/projects/*/format',route=>route.fulfill({json:{success:true,files:route.request().postDataJSON().files}}));
 await mockFunding(page);
 await page.route('**/api/projects',route=>route.fulfill({status:201,json:{projectId:'constructor-test',projectToken:'owner',revision:1}}));
 await page.route('**/api/projects/constructor-test/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
 await page.route('**/api/projects/constructor-test/build',route=>route.fulfill({json:{success:true,output:'Build complete',artifacts:[{name:'counter.wasm',wasm}]}}));
 await page.goto('/');await page.getByRole('button',{name:'Deploy',exact:true}).first().click();
 await page.getByRole('button',{name:'Generate test account',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Transaction signer'}).locator('option:checked')).toContainText('(funded)');
 await page.getByLabel('Upload WASM',{exact:true}).setInputFiles({name:'constructor.wasm',mimeType:'application/wasm',buffer:constructorWasm});
 await expect(page.locator('#deployment-readiness')).toContainText('Complete the constructor arguments');
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeDisabled();
 await page.getByRole('button',{name:'Compile contract',exact:true}).click();
 await expect(page.getByRole('button',{name:'Deploy selected WASM'})).toBeEnabled();
 await expect(page.locator('#deployment-readiness')).toContainText('Ready to deploy counter.wasm');
});
