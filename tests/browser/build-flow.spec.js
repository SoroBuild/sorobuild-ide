import {test,expect} from '@playwright/test';
test('build formats first, locks the editor, shows logs and recovers from compiler errors',async({page})=>{
 let buildFiles,release;const gate=new Promise(resolve=>{release=resolve;});
 await page.route('**/api/projects',route=>route.fulfill({status:201,json:{projectId:'build-flow',projectToken:'owner',revision:1}}));
 await page.route('**/api/projects/build-flow/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
 await page.route('**/api/projects/build-flow/format',route=>route.fulfill({json:{success:true,files:{...route.request().postDataJSON().files,'src/lib.rs':'// formatted source\n'}}}));
 await page.route('**/api/projects/build-flow/build',async route=>{buildFiles=route.request().postDataJSON().files;await gate;await route.fulfill({contentType:'application/x-ndjson',body:JSON.stringify({type:'log',text:'Compiling counter\nerror: test compilation error'})+'\n'+JSON.stringify({type:'result',result:{success:false,output:'error: test compilation error',artifacts:[]}})+'\n'});});
 await page.goto('/');await page.getByRole('button',{name:'Compile',exact:true}).first().click();
 await expect(page.locator('.build-progress')).toContainText('Compiling contract');
 expect(buildFiles['src/lib.rs']).toBe('// formatted source\n');
 const editor=page.locator('.monaco-editor .view-lines').first();await editor.click();await page.keyboard.type('blocked_edit');await expect(editor).not.toContainText('blocked_edit');
 await page.screenshot({path:'test-results/build-progress.png'});
 release();
 await expect(page.locator('.build-progress')).toHaveCount(0);
 await expect(page.getByText('error: test compilation error',{exact:false}).first()).toBeVisible();
 await editor.click();await page.keyboard.type('resumed_edit');await expect(editor).toContainText('resumed_edit');
});
test('format failure prevents compilation and remains visible',async({page})=>{
 let builds=0;
 await page.route('**/api/projects',route=>route.fulfill({status:201,json:{projectId:'format-failure',projectToken:'owner',revision:1}}));
 await page.route('**/api/projects/format-failure/language',route=>route.fulfill({json:{result:null,diagnostics:{}}}));
 await page.route('**/api/projects/format-failure/format',route=>route.fulfill({status:422,json:{success:false,output:'cargo fmt: unexpected closing delimiter'}}));
 await page.route('**/api/projects/format-failure/build',route=>{builds++;return route.fulfill({json:{success:true}});});
 await page.goto('/');await page.getByRole('button',{name:'Compile',exact:true}).first().click();
 await expect(page.getByText('cargo fmt: unexpected closing delimiter',{exact:true})).toBeVisible();expect(builds).toBe(0);
});
