import { useEffect, useRef } from 'react';
import { FolderOpen, Rocket, X } from 'lucide-react';
export default function ConfirmDialog({ request, onDecision }) {
  const dialog = useRef(null), cancel = useRef(null), callback = useRef(onDecision);
  callback.current = onDecision;
  useEffect(() => {
    const element = dialog.current;
    element.showModal(); cancel.current?.focus();
    return () => element.close();
  }, []);
  return <dialog ref={dialog} className="project-confirm" aria-labelledby="project-confirm-title" aria-describedby="project-confirm-description" onCancel={event => { event.preventDefault(); callback.current(false); }}>
    <div className="project-confirm-heading"><span className="project-confirm-icon">{request.kind === 'deployment' ? <Rocket size={22} /> : <FolderOpen size={22} />}</span><button aria-label="Close confirmation" className="chrome-button" onClick={() => callback.current(false)}><X size={18} /></button></div>
    <h2 id="project-confirm-title">{request.title}</h2>
    <p id="project-confirm-description">{request.description}</p>
    {request.detail && <div className="project-confirm-detail">{request.detail}</div>}
    <div className="project-confirm-actions"><button ref={cancel} className="ide-button" onClick={() => callback.current(false)}>{request.cancelLabel || 'Keep current workspace'}</button><button className="ide-button confirm-primary" onClick={() => callback.current(true)}>{request.confirmLabel || 'Open project'}</button></div>
  </dialog>;
}
