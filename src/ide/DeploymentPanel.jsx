import { useLayoutEffect, useRef, useState } from 'react';
import { Maximize2, X } from 'lucide-react';

const timing = { duration: 260, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' };
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dockTransform = (dock, full) => `translate(${dock.left - full.left}px, ${dock.top - full.top}px) scale(${dock.width / full.width}, ${dock.height / full.height})`;

export default function DeploymentPanel({ network, children }) {
  const [expanded, setExpanded] = useState(false);
  const [closing, setClosing] = useState(false);
  const host = useRef(null), dialog = useRef(null), scroll = useRef(null), toggle = useRef(null);
  const animation = useRef(null), transitioning = useRef(false);
  useLayoutEffect(() => {
    const element = dialog.current;
    const position = scroll.current.scrollTop;
    element.close();
    if (expanded) element.showModal();
    else element.show();
    scroll.current.scrollTop = position;
    if (expanded || element.contains(document.activeElement)) toggle.current.focus({ preventScroll: true });
    if (expanded && !reduceMotion()) {
      transitioning.current = true;
      const motion = element.animate([
        { transform: dockTransform(host.current.getBoundingClientRect(), element.getBoundingClientRect()), borderRadius: '0px' },
        { transform: 'none' },
      ], timing);
      animation.current = motion;
      motion.onfinish = () => { if (animation.current === motion) { transitioning.current = false; animation.current = null; } };
    } else transitioning.current = false;
    return () => { animation.current?.cancel(); animation.current = null; transitioning.current = false; element.close(); };
  }, [expanded]);

  const changeView = () => {
    if (closing) return;
    if (transitioning.current) {
      if (!expanded || closing) return;
      animation.current?.finish();
    }
    if (!expanded) { setExpanded(true); return; }
    if (reduceMotion()) { setExpanded(false); return; }
    transitioning.current = true;
    setClosing(true);
    const element = dialog.current;
    const motion = element.animate([
      { transform: 'none' },
      { transform: dockTransform(host.current.getBoundingClientRect(), element.getBoundingClientRect()), borderRadius: '0px' },
    ], { ...timing, fill: 'forwards' });
    animation.current = motion;
    motion.onfinish = () => { setClosing(false); setExpanded(false); };
  };

  return <div ref={host} className="deployment-panel-host"><dialog ref={dialog} className={`deployment-panel${expanded ? ' is-expanded' : ''}${closing ? ' is-closing' : ''}`} role={expanded ? 'dialog' : 'region'} aria-label="Deploy contract" aria-modal={expanded || undefined} onCancel={event => { event.preventDefault(); if (expanded) changeView(); }}>
    <header className="deployment-panel-header">
      <h2>Deploy contract</h2>
      <span className="deployment-network">{network}</span>
      <button ref={toggle} className="chrome-button" aria-label={expanded ? 'Close expanded deployment view' : 'Expand deployment view'} title={expanded ? 'Return to panel (Esc)' : 'Expand deployment view'} onClick={changeView}>
        {expanded ? <X size={16} /> : <Maximize2 size={16} />}
        <span>{expanded ? 'Return to panel' : 'Expand'}</span>
      </button>
    </header>
    <div ref={scroll} className="deployment-panel-scroll" tabIndex={0} role="region" aria-label="Deployment controls">
      <div className="deployment-workspace text-sm">{children}</div>
    </div>
  </dialog></div>;
}
