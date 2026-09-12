import { test, expect } from '@playwright/test';
const hash='6a800457951b8a53d9f511c8e38c1ebbc01b1f942710c14d558dc4e3f3ae8f64';
test('confirmed output opens the correct explorer in a new tab; simulations have no explorer link',async({page})=>{
 await page.goto('/');
 await page.evaluate(async hash=>{
  const React=(await import('/node_modules/.vite/deps/react.js')).default;
  const {createRoot}=(await import('/node_modules/.vite/deps/react-dom_client.js')).default;
  const {default:Output}=await import('/src/ide/InteractionOutput.jsx');
  const host=document.createElement('div');host.style='position:fixed;inset:0;z-index:9999;background:#0d141f;padding:30px';document.body.append(host);
  const root=createRoot(host);
  globalThis.renderOutput=(network,simulation=false)=>root.render(React.createElement(Output,{network,state:{status:'success',operation:simulation?'Simulation':'Invocation',method:'add',message:'Transaction confirmed'},result:JSON.stringify(simulation?{result:18}:{hash,result:18})}));
  globalThis.renderOutput('testnet');
 },hash);
 const link=page.getByRole('link',{name:'View in explorer',exact:true});
 await expect(link).toHaveAttribute('href',`https://stellar.expert/explorer/testnet/tx/${hash}`);
 await expect(link).toHaveAttribute('rel','noopener noreferrer');
 await page.context().route('https://stellar.expert/**',route=>route.fulfill({body:'Explorer'}));
 const popupPromise=page.waitForEvent('popup');await link.click();const popup=await popupPromise;await expect(popup).toHaveURL(`https://stellar.expert/explorer/testnet/tx/${hash}`);await popup.close();
 for(const [network,base] of [['mainnet','https://stellar.expert/explorer/public/tx/'],['futurenet','https://futurenet.steexp.com/tx/']]){
  await page.evaluate(network=>globalThis.renderOutput(network),network);await expect(link).toHaveAttribute('href',base+hash);
 }
 await page.evaluate(()=>globalThis.renderOutput('testnet',true));await expect(link).toHaveCount(0);
 await page.evaluate(()=>globalThis.renderOutput('sandbox'));await expect(link).toHaveCount(0);
 await page.evaluate(()=>globalThis.renderOutput('unknown'));await expect(link).toHaveCount(0);
});
