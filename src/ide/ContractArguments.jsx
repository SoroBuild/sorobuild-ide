import { useEffect, useMemo, useState } from 'react';
import { encodeFunctionFields } from './contract-interface';
export default function ContractArguments({ spec, method, onChange, disabled, label = 'Argument' }) {
  const [fields, setFields] = useState({});
  const result = useMemo(() => {
    try { return { args: encodeFunctionFields(spec, method, fields), error: '' }; }
    catch (error) { return { args: null, error: error.message }; }
  }, [spec, method, fields]);
  useEffect(() => { onChange(result.args); }, [onChange, result.args]);
  const inputs = spec.getFunc(method).inputs();
  return <div className="space-y-2">
    {!inputs.length && <p className="text-xs text-slate-400">This function takes no arguments.</p>}
    <div className="grid gap-2 md:grid-cols-2">{inputs.map(input => {
      const name = input.name().toString(), type = input.type().switch().name.replace('scSpecType','');
      return <label key={name} className="text-xs text-slate-300">{name} <span className="text-slate-500">{type}</span><input aria-label={`${label} ${name}`} disabled={disabled} className="ide-input" value={fields[name] ?? ''} onChange={event => setFields(previous => ({...previous,[name]:event.target.value}))} placeholder={type === 'Bool' ? 'true or false' : type.startsWith('Bytes') ? 'Hexadecimal bytes' : name} /></label>;
    })}</div>
    {result.error && <p role="status" className="text-xs text-amber-200">{result.error}</p>}
  </div>;
}
