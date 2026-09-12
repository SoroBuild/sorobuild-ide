import { useEffect, useRef, useState } from 'react';
import { Box, Check, ChevronDown, Command, Download, FlaskConical, Globe, MoreHorizontal, Play, Rocket, Save, Wallet } from 'lucide-react';

export function ActionMenu({ label = 'More actions', actions }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null), trigger = useRef(null), menu = useRef(null);
  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector('button:not(:disabled)')?.focus();
    const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  const onKeyDown = event => {
    if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); return; }
    if (event.key === 'Tab') { setOpen(false); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = [...menu.current.querySelectorAll('button:not(:disabled)')];
    const index = items.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next]?.focus();
  };
  return <div className="workspace-menu" ref={root}>
    <button ref={trigger} className="chrome-button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); setOpen(true); } }}><MoreHorizontal size={16} /><span>More</span></button>
    {open && <div ref={menu} className="workspace-menu-panel" role="menu" aria-label={label} onKeyDown={onKeyDown}>
      {actions.map(action => <button role="menuitem" key={action.label} disabled={action.disabled} onClick={() => { setOpen(false); trigger.current?.focus(); action.onClick(); }}>{action.icon && <action.icon size={15} />}<span>{action.label}</span>{action.shortcut && <kbd>{action.shortcut}</kbd>}</button>)}
    </div>}
  </div>;
}

export default function WorkspaceHeader({ name, dirty, busy, status, network, networks, onNetwork, walletConnected, onWallet, onCompile, onTest, onDeploy, onSave, onFormat, onCommands, actions, detailsOpen, onDetails }) {
  return <>
    <header className="workspace-header">
      <div className="workspace-brand"><div className="brand-mark"><Box size={19} /></div><span>Sorobuild<span className="brand-subtitle">IDE</span></span></div>
      <span className="chrome-divider" />
      <div className="workspace-name" title={name}>{name}<span className={dirty ? 'status-dot unsaved' : 'status-dot'} title={dirty ? 'Unsaved changes' : 'Workspace ready'} /></div>
      <div className="header-utilities">
        <button className="command-trigger" onClick={onCommands} aria-label="Command Palette"><Command size={14} /><span>Commands</span><kbd>⌘ K</kbd></button>
        <label className="network-picker"><Globe size={14} /><select aria-label="Network" value={network} disabled={busy} onChange={event => onNetwork(event.target.value)}>{networks.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        <button className={`chrome-button wallet-button ${walletConnected ? 'is-connected' : ''}`} disabled={busy} onClick={onWallet}><Wallet size={15} /><span>{walletConnected ? 'Connected' : 'Connect Wallet'}</span>{walletConnected && <Check size={13} />}</button>
      </div>
    </header>
    <div className="workspace-toolbar" aria-label="Workspace actions">
      <div className="toolbar-primary">
        <button className="chrome-button primary-action" disabled={busy} onClick={onCompile}><Play size={14} fill="currentColor" /><span>{busy && status.startsWith('Build') ? 'Compiling…' : 'Compile'}</span></button>
        <button className="chrome-button" disabled={busy} onClick={onTest}><FlaskConical size={15} />Test</button>
        <button className="chrome-button" disabled={busy} onClick={onDeploy}><Rocket size={15} />Deploy</button>
        <span className="chrome-divider" />
        <button className="chrome-button" disabled={busy} onClick={onSave} aria-label="Save project"><Save size={15} />Save</button>
        <button className="chrome-button format-action" disabled={busy} onClick={onFormat}>Format</button>
        <ActionMenu actions={actions} />
      </div>
      <button className={`workspace-status ${/failed|error/i.test(status) ? 'has-error' : ''}`} onClick={onDetails} aria-expanded={detailsOpen} aria-label={detailsOpen ? 'Collapse top panel' : 'Open top panel'}><span className={busy ? 'status-dot working' : 'status-dot'} /><span>{/failed|error/i.test(status) || busy ? status : dirty ? 'Unsaved changes' : 'Ready'}</span><ChevronDown size={13} className={detailsOpen ? 'rotate-180' : ''} /></button>
    </div>
  </>;
}
