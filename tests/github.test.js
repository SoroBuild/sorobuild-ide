import {test} from 'node:test';
import assert from 'node:assert/strict';
import {importGithub} from '../src/ide/github.js';
test('loads a nested project without unrelated files and accepts www URLs',async()=>{
 const previous=globalThis.fetch;

 globalThis.fetch=async url=>url.includes('/git/trees/')?new Response(JSON.stringify({tree:[{type:'blob',path:'contract/Cargo.toml',size:2},{type:'blob',path:'contract/src/lib.rs',size:2},{type:'blob',path:'other/Cargo.toml',size:2}]})):new Response('ok');
 try {assert.deepEqual(await importGithub('https://www.github.com/owner/repo/tree/main/contract'),{'Cargo.toml':'ok','src/lib.rs':'ok'});}finally{globalThis.fetch=previous;}
});
test('rejects invalid and incomplete repository URLs',async()=>{
 for(const url of ['bad','http://github.com/o/r','https://github.com/o/r/tree','https://github.com/o/r/blob/main/a.rs']) await assert.rejects(importGithub(url),/GitHub|github.com/);
});
test('rejects non-Rust folders before replacing a workspace',async()=>{
 const previous=globalThis.fetch;
 globalThis.fetch=async url=>url.includes('/git/trees/')?new Response(JSON.stringify({tree:[{type:'blob',path:'README.md',size:2}]})):new Response('ok');
 try {await assert.rejects(importGithub('https://github.com/o/r/tree/main'),/No Cargo.toml/);}finally{globalThis.fetch=previous;}
});
