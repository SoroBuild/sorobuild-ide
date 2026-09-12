import {test,expect} from '@playwright/test';
const original='fn main(){let x=1;}';
const formatted='fn main() {\n    let x = 1;\n}\n';
async function setup(page) {
 const files={'Cargo.toml':'[package]\nname="demo"','src/lib.rs':original};
 await page.addInitScript(({files})=>localStorage.setItem('soroban_studio_workspace_v2',JSON.stringify({files,activeFile:'src/lib.rs',dirty:true})),{files});
 const calls=[];
 await page.route('**/api/projects',route=>{calls.push({action:'create',body:route.request().postDataJSON()});return route.fulfill({status:201,json:{projectId:'saved-project',projectToken:'owner-token',revision:1}});});
 await page.route('**/api/projects/saved-project/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
 await page.route('**/api/projects/saved-project',route=>{calls.push({action:'save',body:route.request().postDataJSON()});return route.fulfill({headers:{'X-Project-Revision':'2'},json:{revision:2}});});
 await page.goto('/');await expect(page.locator('.monaco-editor').first()).toBeVisible();return calls;
}
test('Ctrl+S, Cmd+S and Save run cargo fmt before persisting formatted files',async({page})=>{
 let downloads=0;page.on('download',()=>downloads++);const calls=await setup(page);
 await page.route('**/api/projects/saved-project/format',route=>{const body=route.request().postDataJSON();calls.push({action:'format',body});return route.fulfill({json:{success:true,files:{...body.files,'src/lib.rs':formatted}}});});
 await page.keyboard.press('Control+s');
 await expect.poll(()=>calls.map(call=>call.action)).toEqual(['create','format','save']);
 expect(calls[2].body.files['src/lib.rs']).toBe(formatted);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:saved-project'))?.files['src/lib.rs'])).toBe(formatted);
 await page.keyboard.press('Meta+s');await expect.poll(()=>calls.length).toBe(5);
 await page.getByRole('button',{name:'Save project',exact:true}).click();await expect.poll(()=>calls.length).toBe(7);
 expect(calls.map(call=>call.action)).toEqual(['create','format','save','format','save','format','save']);
 expect(downloads).toBe(0);
});
test('format failures preserve source and do not mark the project saved',async({page})=>{
 const calls=await setup(page);
 await page.route('**/api/projects/saved-project/format',route=>route.fulfill({status:422,json:{success:false,output:'cargo fmt: invalid Rust syntax'}}));
 await page.getByRole('button',{name:'Save project',exact:true}).click();
 await expect(page.getByText('cargo fmt: invalid Rust syntax',{exact:true})).toBeVisible();
 expect(calls.map(call=>call.action)).toEqual(['create']);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:saved-project'))?.dirty)).toBe(true);
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:saved-project')));
 expect(saved.files['src/lib.rs']).toBe(original);
});
test('edits made during formatting are retained and require another save',async({page})=>{
 const calls=await setup(page);let release;const ready=new Promise(resolve=>{release=resolve;});let started=false;
 await page.route('**/api/projects/saved-project/format',async route=>{started=true;const body=route.request().postDataJSON();await ready;await route.fulfill({json:{success:true,files:{...body.files,'src/lib.rs':formatted}}});});
 await page.getByRole('button',{name:'Save project',exact:true}).click();await expect.poll(()=>started).toBe(true);
 await page.locator('.monaco-editor .view-lines').first().click({position:{x:80,y:10}});
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText('// newer edit');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:saved-project'))?.files['src/lib.rs'])).toBe('// newer edit');
 release();await expect(page.getByText('Files changed during formatting. Your edits are preserved; save again to format and save them.',{exact:true})).toBeVisible();
 expect(calls.map(call=>call.action)).toEqual(['create']);
});
