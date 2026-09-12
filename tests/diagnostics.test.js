import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDiagnostics } from '../src/ide/diagnostics.js';
test('maps member compiler paths and skips unrelated dependencies', () => {
  const result = parseDiagnostics('error[E0425]: missing value\n --> src/lib.rs:7:2\nwarning: dependency\n --> /registry/lib.rs:1:1', { 'contracts/a/src/lib.rs': '' }, 'contracts/a/Cargo.toml');
  assert.deepEqual(result, [{path:'contracts/a/src/lib.rs',line:7,column:2,message:'error[E0425]: missing value',severity:'error'}]);
});
