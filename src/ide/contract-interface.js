import { contract } from '@stellar/stellar-sdk';
import { Buffer } from 'buffer';
export const MAX_WASM_BYTES = 4 * 1024 * 1024;
export function artifactSpec(artifact) {
  if (!artifact?.wasm) return null;
  try { return contract.Spec.fromWasm(Buffer.from(artifact.wasm, 'base64')); } catch { return null; }
}
export async function artifactFromBytes(name, bytes) {
  if (!/\.wasm$/i.test(name)) throw new Error('Choose a compiled .wasm contract. Import Rust sources through the Explorer.');
  if (bytes.byteLength > MAX_WASM_BYTES) throw new Error('WASM files must be at most 4 MiB.');
  try { await WebAssembly.compile(bytes); } catch { throw new Error('This file is not valid WebAssembly.'); }
  return { name, wasm: Buffer.from(bytes).toString('base64'), uploaded: true };
}
export const functionNames = spec => spec ? spec.funcs().map(fn => fn.name().toString()).filter(name => !name.startsWith('__')) : [];
export function encodeFunctionFields(spec, method, fields) {
  const values = {};
  for (const input of spec.getFunc(method).inputs()) {
    const name = input.name().toString(), value = fields[name] ?? '', type = input.type().switch().name;
    if (['scSpecTypeString', 'scSpecTypeSymbol', 'scSpecTypeAddress', 'scSpecTypeMuxedAddress'].includes(type)) values[name] = value;
    else if (['scSpecTypeI64','scSpecTypeU64','scSpecTypeI128','scSpecTypeU128','scSpecTypeI256','scSpecTypeU256'].includes(type)) {
      if (!/^-?\d+$/.test(value)) throw new Error(`${name}: enter a decimal integer.`);
      values[name] = BigInt(value);
    } else if (['scSpecTypeI32','scSpecTypeU32'].includes(type)) {
      if (!/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) throw new Error(`${name}: enter an integer.`);
      values[name] = Number(value);
    } else if (type === 'scSpecTypeBool') {
      if (!['true','false'].includes(value)) throw new Error(`${name}: enter true or false.`);
      values[name] = value === 'true';
    } else if (['scSpecTypeBytes','scSpecTypeBytesN'].includes(type)) {
      if (!/^(?:[0-9a-f]{2})*$/i.test(value)) throw new Error(`${name}: enter hexadecimal bytes.`);
      values[name] = Buffer.from(value, 'hex');
    } else {
      try { values[name] = JSON.parse(value); } catch { throw new Error(`${name}: enter a JSON value or use typed arguments.`); }
    }
  }
  return JSON.stringify(spec.funcArgsToScVals(method, values).map(value => ({type:'xdr',value:value.toXDR('base64')})));
}
