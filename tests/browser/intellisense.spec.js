import {test,expect} from '@playwright/test';
test('Rust completion inserts the server suggestion and requests authenticated workspace analysis',async({page})=>{
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':'fn main() { env.sto }'};let requests=0;
 await page.addInitScript(({files})=>{
  localStorage.setItem('sorobuild:workspace:editor-test',JSON.stringify({files,dirty:true,activeFile:'src/lib.rs'}));
  localStorage.setItem('sorobuild:access:editor-test',JSON.stringify({token:'owner',revision:1}));
 },{files});
 await page.route('**/api/projects/editor-test/language',route=>{
  const body=route.request().postDataJSON();expect(route.request().headers().authorization).toBe('Bearer owner');
  if(body.method!=='textDocument/completion')return route.fulfill({json:{result:null,diagnostics:{}}});
  requests++;expect(body.files['src/lib.rs']).toContain('env.sto');
  return route.fulfill({json:{result:{items:[{label:'storage()',kind:2,insertText:'storage()',detail:'Soroban Env storage',textEdit:{newText:'storage()',range:{start:{line:0,character:16},end:{line:0,character:19}}}}]},diagnostics:{}}});
 });
 await page.goto('/?projectId=editor-test');await expect(page.locator('.monaco-editor').first()).toBeVisible();
 await page.locator('.monaco-editor .view-lines').first().click({position:{x:140,y:10}});
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs']);await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
 await expect(page.getByRole('textbox',{name:'Editor content',exact:true})).toBeFocused();
 await page.keyboard.press('Control+Space');await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible();
 await page.keyboard.press('Enter');await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:editor-test')).files['src/lib.rs'])).toContain('env.storage()');
 expect(requests).toBeGreaterThan(0);
});
