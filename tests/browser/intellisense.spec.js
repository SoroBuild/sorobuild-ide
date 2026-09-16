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
 await page.route('**/api/projects/new-editor/language',route=>{if(++attempts===1)return route.fulfill({status:503,json:{error:'Indexing the Soroban SDK. Retry shortly.'}});return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()'}]},diagnostics:{}}});});
 await page.goto('/');await expect(page.locator('.monaco-editor').first()).toBeVisible();
 await page.getByRole('textbox',{name:'Editor content',exact:true}).focus();
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs']);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
 await page.keyboard.press('Control+Space');
 await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();
 await expect(page).toHaveURL(/projectId=new-editor/);expect(creates).toBe(1);
});
