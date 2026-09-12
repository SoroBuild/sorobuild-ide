import ExplorerLink from './ExplorerLink';
import { Loader2, CheckCircle2, AlertCircle, TerminalSquare } from 'lucide-react';
export default function InteractionOutput({state, result, network}) {
  let data; try { data = result ? JSON.parse(result) : null; } catch { data = null; }
  const pending = state?.status === 'pending', failed = state?.status === 'error';
  return <section className={`function-output ${failed ? 'has-error' : ''}`} aria-label="Function output" aria-busy={pending}>
    <header><h3><TerminalSquare size={16} /> Output</h3>{state && <span>{state.operation}</span>}</header>
    {!state ? <div className="output-empty">Run a simulation or invoke the function.<br />The return value will appear here.</div> : <>
      <div className="output-status" role={failed ? 'alert' : 'status'}>
        {pending ? <Loader2 size={16} className="animate-spin" /> : failed ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
        <span>{state.message}</span>
      </div>
      {data && !pending && !failed && <>
        <div className="output-value"><span>Return value · {state.method}</span><pre aria-label="Return value">{data.result === null || data.result === undefined ? 'No return value' : JSON.stringify(data.result, null, 2)}</pre></div>
        {data.hash && <div className="output-metadata"><span>Transaction hash</span><code>{data.hash}</code><ExplorerLink network={state.network || network} hash={data.hash}/></div>}
        {data.fee !== undefined && <div className="output-metadata"><span>Estimated resource fee</span><code>{data.fee} stroops</code></div>}
        <details className="output-details"><summary>Full response{data.events?.length ? ` · ${data.events.length} events` : ''}</summary><pre>{result}</pre></details>
      </>}
    </>}
  </section>;
}
