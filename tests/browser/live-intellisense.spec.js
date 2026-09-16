import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
test('real API and Docker deliver Soroban suggestions while editing',async({page,request},testInfo)=>{
 test.skip(process.env.LIVE_INTELLISENSE!=='1','Requires the local API and Docker runner.');test.setTimeout(240000);
 const files={'Cargo.toml':'[package]\nname="editor-probe"\nversion="0.1.0"\nedition="2021"\n[lib]\ncrate-type=["cdylib"]\n[dependencies]\nsoroban-sdk="25.1.0"\n','src/lib.rs':'#![no_std]\nuse soroban_sdk::Env;\npub fn probe(env: Env) { env.sto }\n'};
 files['Cargo.lock']=await readFile('../sorobuild-ide-server/runner-template/Cargo.lock','utf8');
 const created=await request.post('/api/projects',{data:{files}});expect(created.ok()).toBeTruthy();const {projectId,projectToken}=await created.json();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',async r=>{if(r.url().endsWith('/language')){const body=await r.json().catch(()=>({}));console.log('Language response',r.status(),r.request().postDataJSON().position,body.error||(body.result?.items||[]).map(i=>i.label).slice(0,12));await page.screenshot({path:testInfo.outputPath('response.png')});}});
 try {
 await page.addInitScript(({projectId,projectToken,files})=>{
 localStorage.setItem(`sorobuild:access:${projectId}`,JSON.stringify({token:projectToken,revision:1}));
 localStorage.setItem(`sorobuild:workspace:${projectId}`,JSON.stringify({files,dirty:false,activeFile:'src/lib.rs'}));
 },{projectId,projectToken,files});
 await page.goto(`/?projectId=${projectId}`);await expect(page.locator('.monaco-editor').first()).toBeVisible();
 const editor=page.getByRole('textbox',{name:'Editor content',exact:true});await editor.focus();
 await page.keyboard.press('ControlOrMeta+a');await page.keyboard.insertText(files['src/lib.rs'].trimEnd());await page.keyboard.press('ArrowLeft');await page.keyboard.press('ArrowLeft');
 await page.keyboard.press('Control+Space');
 await expect(page.getByRole('option').filter({hasText:'storage()'})).toBeVisible({timeout:180000});
 await page.screenshot({path:testInfo.outputPath('real-completion.png')});
 await page.keyboard.press('Enter');
 await expect.poll(()=>page.evaluate(id=>JSON.parse(localStorage.getItem(`sorobuild:workspace:${id}`)).files['src/lib.rs'],projectId)).toContain('env.storage()');
 expect(errors).toEqual([]);
 }finally {await request.post(`/api/projects/${projectId}/delete`,{headers:{Authorization:`Bearer ${projectToken}`,'X-Project-Revision':'1'}});}
});
