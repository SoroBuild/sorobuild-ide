import {test,expect} from '@playwright/test';
test('Rust completion inserts the server suggestion and requests authenticated workspace analysis',async({page},testInfo)=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.sto }'};let requests=0;
 await page.addInitScript(({files})=>{
  localStorage.setItem('sorobuild:workspace:editor-test',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:editor-test',JSON.stringify({token:'owner',revision:1}));
 },{files});
 await page.route('**/api/projects/editor-test/language',route=>{
  const body=route.request().postDataJSON();expect(route.request().headers().authorization).toBe('Bearer owner');
  if(body.method!=='textDocument/completion')return route.fulfill({json:{result:null,diagnostics:{}}});
  requests++;expect(body.files['src/lib.rs']).toContain('env.sto');
  return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()',detail:'fn(&self) -> Storage',documentation:{kind:'markdown',value:'Access persistent contract storage.'},textEdit:{newText:'storage()',range:{start:{line:0,character:16},end:{line:0,character:19}}}}]},diagnostics:{}}});
 });
 await page.goto('/?projectId=editor-test');await expect(page.locator('.monaco-editor').first()).toBeVisible();
 await page.locator('.monaco-editor .view-lines').first().click({position:{x:140,y:10}});
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs']);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
 await expect(page.getByRole('textbox',{name:'Editor content',exact:true})).toBeFocused();
 await page.keyboard.press('Control+Space');await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();
 await page.keyboard.press('Control+Space');await expect(page.locator('.suggest-details')).toContainText('Access persistent contract storage.');await page.screenshot({path:testInfo.outputPath('intellisense.png')});await page.keyboard.press('Escape');await page.keyboard.press('Control+Space');await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:editor-test')).files['src/lib.rs'])).toContain('env.storage()');
 expect(requests).toBeGreaterThan(0);
});

test('a local workspace gets a private link and SDK suggestions without a manual save',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.sto }'};
 let creates=0, attempts=0;
 await page.addInitScript(files=>localStorage.setItem('soroban_studio_workspace_v2',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'})),files);
 await page.route('**/api/projects',route=>{creates++;return route.fulfill({json:{projectId:'new-editor',projectToken:'owner',revision:1}});});
 await page.route('**/api/projects/new-editor/language',route=>{if(++attempts<=4)return route.fulfill({status:503,json:{error:'Indexing the Soroban SDK. Retry shortly.'}});return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()'}]},diagnostics:{}}});});
 await page.goto('/');await expect(page.locator('.monaco-editor').first()).toBeVisible();
 await page.getByRole('textbox',{name:'Editor content',exact:true}).focus();
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs']);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
 await page.keyboard.press('Control+Space');
 await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();
 await expect(page).toHaveURL(/projectId=new-editor/);expect(creates).toBe(1);
});

test('typing cancels an in-flight completion so the latest request can proceed',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.st }'};
 let started,release,completions=0;
 const firstStarted=new Promise(resolve=>{started=resolve;});
 const held=new Promise(resolve=>{release=resolve;});
 await page.addInitScript(files=>{
  localStorage.setItem('sorobuild:workspace:cancel-editor',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:cancel-editor',JSON.stringify({token:'owner',revision:1}));
 },files);
 await page.route('**/api/projects/cancel-editor/language',async route=>{
  if(route.request().postDataJSON().method!=='textDocument/completion')return route.fulfill({json:{result:null,diagnostics:{}}});
  if(++completions===1){started();await held;return route.fulfill({json:{result:null,diagnostics:{}}}).catch(()=>{});}
  return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()'}]},diagnostics:{}}});
 });
 try {
  await page.goto('/?projectId=cancel-editor');await expect(page.locator('.monaco-editor').first()).toBeVisible();
  await page.getByRole('textbox',{name:'Editor content',exact:true}).focus();
  await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs']);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Control+Space');await firstStarted;
  const aborted=page.waitForEvent('requestfailed',{predicate:req=>req.url().endsWith('/language')});
  await page.keyboard.press('Escape');await page.keyboard.insertText('o');await page.keyboard.press('Control+Space');
  expect((await aborted).failure().errorText).toContain('ABORTED');
  await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();
 }finally{release();}
});


test('completion preempts a stalled background warm-up',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.sto }'};
 let started,release;
 const warmStarted=new Promise(resolve=>{started=resolve;});
 const held=new Promise(resolve=>{release=resolve;});
 await page.addInitScript(files=>{
  localStorage.setItem('sorobuild:workspace:warm-editor',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:warm-editor',JSON.stringify({token:'owner',revision:1}));
 },files);
 await page.route('**/api/projects/warm-editor/language',async route=>{
  if(route.request().postDataJSON().method==='textDocument/hover'){
   started();await held;return route.fulfill({json:{result:null,diagnostics:{}}}).catch(()=>{});
  }
  return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()'}]},diagnostics:{}}});
 });
 try{
  await page.goto('/?projectId=warm-editor');await warmStarted;
  await page.getByRole('textbox',{name:'Editor content',exact:true}).focus();
  await page.keyboard.press('ControlOrMeta+End');await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('Control+Space');
  await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible({timeout:10000});
 }finally{release();}
});


test('analyzer dependency errors remain visible instead of reporting ready',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() {}'};
 await page.addInitScript(files=>{
  localStorage.setItem('sorobuild:workspace:error-editor',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:error-editor',JSON.stringify({token:'owner',revision:1}));
 },files);
 await page.route('**/api/projects/error-editor/language',route=>route.fulfill({status:422,json:{error:'Rust IntelliSense cannot load this project: missing dependency'}}));
 await page.goto('/?projectId=error-editor');
 await expect(page.locator('.sorobuild-code-editor [role=status]')).toHaveText(/missing dependency/);
});


test('an inaccessible saved project reconnects a private copy of the local files',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.sto }'};let copies=0;
 await page.addInitScript(files=>{
  localStorage.setItem('sorobuild:workspace:lost-access',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:lost-access',JSON.stringify({token:'outdated',revision:1}));
 },files);
 await page.route('**/api/projects/lost-access/language',route=>route.fulfill({status:403,json:{error:'Project access denied.'}}));
 await page.route('**/api/projects',route=>{copies++;expect(route.request().postDataJSON().files).toEqual(files);return route.fulfill({json:{projectId:'reconnected',projectToken:'new-owner',revision:1}});});
 await page.route('**/api/projects/reconnected/language',route=>{expect(route.request().headers().authorization).toBe('Bearer new-owner');return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()'}]},diagnostics:{}}});});
 await page.goto('/?projectId=lost-access');
 await expect(page).toHaveURL(/projectId=reconnected/);
 await expect(page.locator('.sorobuild-code-editor [role=status]')).toHaveText(/Rust IntelliSense ready/);
 expect(copies).toBe(1);
});
