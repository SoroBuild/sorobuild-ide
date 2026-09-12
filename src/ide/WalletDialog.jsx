import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ExternalLink, Loader2, ShieldCheck, X } from 'lucide-react';
import { listWallets, connectExternalWallet } from './wallets';
export default function WalletDialog({ network, onDecision }) {
  const dialog = useRef(null), active = useRef(true);
  const [wallets,setWallets] = useState(null), [error,setError] = useState(''), [pending,setPending] = useState('');
  useEffect(() => {
    active.current = true;
    const element = dialog.current; element.showModal();
    listWallets(network).then(setWallets).catch(error => setError(error.message || 'Unable to load wallets.'));
    return () => { active.current = false; element.close(); };
  }, [network]);
  const connect = async id => {
    setPending(id); setError('');
    try { const result = await connectExternalWallet(id,network); if (active.current) onDecision(result); }
    catch (error) { if (active.current) setError(error.message || 'Wallet connection was declined.'); }
    finally { if (active.current) setPending(''); }
  };
  return <dialog ref={dialog} className="project-confirm wallet-picker" aria-labelledby="wallet-picker-title" onCancel={event => { event.preventDefault(); onDecision(null); }}>
    <header className="wallet-picker-header"><div><h2 id="wallet-picker-title">Connect a wallet</h2><span className="wallet-network-badge"><span />{network.label}</span></div><button className="chrome-button" aria-label="Close wallet chooser" onClick={()=>onDecision(null)}><X size={18}/></button></header>
    <p className="wallet-picker-intro">Select your wallet to continue.</p>
    {error && <p className="wallet-picker-error" role="alert">{error}</p>}
    {!wallets && !error && <p className="wallet-picker-loading" role="status"><Loader2 size={16} className="animate-spin"/>Finding available wallets…</p>}
    <div className="wallet-picker-list">{wallets?.slice().sort((a,b)=>Number(b.isAvailable)-Number(a.isAvailable)).map(wallet => {
      const mark = <span className="wallet-brand" aria-hidden="true"><span>{wallet.name.slice(0,1)}</span>{wallet.icon && <img src={wallet.icon} alt="" referrerPolicy="no-referrer" onError={event=>{event.currentTarget.style.display='none';}}/>}</span>;
      return wallet.isAvailable ? <button key={wallet.id} className="wallet-option" aria-label={`${wallet.name} Connect`} disabled={Boolean(pending)} onClick={()=>connect(wallet.id)}>
        {mark}<span className="wallet-option-name">{wallet.name}{pending === wallet.id && <small role="status">Approve in your wallet…</small>}</span>
        {pending === wallet.id ? <Loader2 size={17} className="animate-spin"/> : <ArrowRight size={17}/>}
      </button> : <a key={wallet.id} className="wallet-option is-unavailable" href={wallet.url} target="_blank" rel="noopener noreferrer" aria-label={`Install ${wallet.name}`}>
        {mark}<span className="wallet-option-name">{wallet.name}<small>Extension not detected</small></span><span className="wallet-install">Install<ExternalLink size={13}/></span>
      </a>;
    })}</div>
    {network.value === 'sandbox' && <p className="wallet-picker-local">Fund your account on Local Sandbox. Freighter must use its standalone custom network.</p>}
    <footer className="wallet-picker-footer"><p><ShieldCheck size={15}/>Your keys stay in your wallet.</p><span>Powered by Stellar Wallets Kit</span></footer>
  </dialog>;
}
