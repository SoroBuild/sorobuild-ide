import {test,expect} from '@playwright/test';
const files={'Cargo.toml':'[workspace]','contract_a/Cargo.toml':'[package]','contract_a/src/lib.rs':'// main contract','contract_a/src/test.rs':'// tests'};
async function setup(page){
 await page.addInitScript(()=>localStorage.setItem('sorobuild:access:file-test',JSON.stringify({token:'owner',revision:1})));
 await page.route('**/api/projects/file-test',route=>route.fulfill({json:{files,revision:1}}));
 await page.route('**/api/projects/file-test/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
}
test('shared project opens main Rust source and URL selection survives immediate refresh',async({page})=>{
 await setup(page);await page.goto('/?projectId=file-test');
 await expect(page.locator('.monaco-editor .view-lines')).toContainText('// main contract');
 await expect(page).toHaveURL(/file=contract_a%2Fsrc%2Flib.rs/);
 await page.getByRole('button',{name:'Cargo.toml',exact:true}).first().click();
 await expect(page).toHaveURL(/file=Cargo.toml/);await page.reload();
 await expect(page.locator('.monaco-editor .view-lines')).toContainText('[workspace]');
});
test('explicit file link takes precedence and missing files fall back to main source',async({page})=>{
 await setup(page);await page.goto('/?projectId=file-test&file=contract_a%2Fsrc%2Ftest.rs');
 await expect(page.locator('.monaco-editor .view-lines')).toContainText('// tests');
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('sorobuild:workspace:file-test'))?.activeFile)).toBe('contract_a/src/test.rs');
 await page.evaluate(()=>localStorage.removeItem('sorobuild:workspace:file-test'));
 await page.goto('/?projectId=file-test&file=missing.rs');
 await expect(page.locator('.monaco-editor .view-lines')).toContainText('// main contract');
});
