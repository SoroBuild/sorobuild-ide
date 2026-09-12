import { ExternalLink } from 'lucide-react';
import { transactionExplorerUrl } from './explorer';
export default function ExplorerLink({ network, hash, label = 'View in explorer' }) {
  const href = transactionExplorerUrl(network, hash);
  return href ? <a className="transaction-explorer-link" href={href} target="_blank" rel="noopener noreferrer" title="Opens in a new tab">{label}<ExternalLink size={13} aria-hidden="true"/></a> : null;
}
