import test from 'node:test';
import assert from 'node:assert/strict';
import {contract,xdr,scValToNative} from '@stellar/stellar-sdk';
import {artifactFromBytes,encodeFunctionFields,MAX_WASM_BYTES} from '../src/ide/contract-interface.js';
const input=(name,type)=>new xdr.ScSpecFunctionInputV0({doc:'',name,type});
const spec=new contract.Spec([xdr.ScSpecEntry.scSpecEntryFunctionV0(new xdr.ScSpecFunctionV0({doc:'',name:'set',inputs:[input('amount',xdr.ScSpecTypeDef.scSpecTypeU64()),input('enabled',xdr.ScSpecTypeDef.scSpecTypeBool())],outputs:[]}))]);
test('function fields encode exact integers and booleans against contract spec',()=>{
 const args=JSON.parse(encodeFunctionFields(spec,'set',{amount:'18446744073709551615',enabled:'false'}));
 assert.equal(scValToNative(xdr.ScVal.fromXDR(args[0].value,'base64')),18446744073709551615n);
 assert.equal(scValToNative(xdr.ScVal.fromXDR(args[1].value,'base64')),false);
 assert.throws(()=>encodeFunctionFields(spec,'set',{amount:'1.5',enabled:'false'}),/integer/);
 assert.throws(()=>encodeFunctionFields(spec,'set',{amount:'1',enabled:'yes'}),/true or false/);
});
test('WASM import rejects corrupt and oversized bytes and preserves valid bytes',async()=>{
 const bytes=Uint8Array.from([0,97,115,109,1,0,0,0]);
 const artifact=await artifactFromBytes('contract.wasm',bytes);
 assert.equal(artifact.uploaded,true);assert.deepEqual(Buffer.from(artifact.wasm,'base64'),Buffer.from(bytes));
 await assert.rejects(artifactFromBytes('contract.rs',bytes),/compiled .wasm/);
 await assert.rejects(artifactFromBytes('broken.wasm',new Uint8Array([0,1,2])),/not valid/);
 await assert.rejects(artifactFromBytes('large.wasm',new Uint8Array(MAX_WASM_BYTES+1)),/4 MiB/);
});
