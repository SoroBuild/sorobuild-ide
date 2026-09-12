// Explicit opt-in integration check: fresh Friendbot test account, no user funds.
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { generateAccount, fundAccount, networkOptions, deployWasm, simulateCall, invokeCall } from '../src/ide/stellar.js';
const network = networkOptions.find(item => item.value === 'testnet'), signer = generateAccount();
const artifact = JSON.parse(await readFile('../sorobuild-ide-server/tests/artifact.local.json', 'utf8'));
await fundAccount(network, signer.address);
const deployment = await deployWasm(network, signer, artifact, console.log);
const args = '[{"type":"string","value":"World"}]';
const simulation = await simulateCall(network, signer.address, deployment.contractId, 'hello', args);
assert.deepEqual(simulation.result, ['Hello','World']);
const result = await invokeCall(network, signer, deployment.contractId, 'hello', args, console.log);
assert.deepEqual(result.result, ['Hello','World']);
console.log(JSON.stringify({ contractId: deployment.contractId, deployment: deployment.hash, invocation: result.hash, result: result.result }));
