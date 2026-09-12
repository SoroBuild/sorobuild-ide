import {xdr} from '@stellar/stellar-sdk';
export async function mockFunding(page) {
  const state={fail:false,requests:[],funded:new Set(),visibilityDelay:0,lookups:0};
  await page.route('https://friendbot.stellar.org/**',async route=>{
    const address=new URL(route.request().url()).searchParams.get('addr');
    state.requests.push(address);
    if(state.fail) return route.fulfill({status:503,json:{}});
    state.funded.add(address);return route.fulfill({json:{successful:true}});
  });
  await page.route('https://soroban-testnet.stellar.org/**',async route=>{
    state.lookups++;
    const request=route.request().postDataJSON();
    const key=xdr.LedgerKey.fromXDR(request.params.keys[0],'base64');
    const {StrKey}=await import('@stellar/stellar-sdk');
    const address=StrKey.encodeEd25519PublicKey(key.account().accountId().ed25519());
    const account=new xdr.AccountEntry({accountId:key.account().accountId(),balance:xdr.Int64.fromString('100000000000'),seqNum:xdr.SequenceNumber.fromString('1'),numSubEntries:0,inflationDest:null,flags:0,homeDomain:'',thresholds:Buffer.alloc(4),signers:[],ext:new xdr.AccountEntryExt(0)});
    return route.fulfill({json:{jsonrpc:'2.0',id:request.id,result:{latestLedger:1,entries:state.lookups>state.visibilityDelay && state.funded.has(address)?[{key:request.params.keys[0],xdr:xdr.LedgerEntryData.account(account).toXDR('base64'),lastModifiedLedgerSeq:1}]:[]}}});
  });
  return state;
}
