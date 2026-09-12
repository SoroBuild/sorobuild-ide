// Pinned to the official SDK 25 update, matching the installed build runner.
export const EXAMPLES_REF = '52c2bcdafe48f834c32ed9d227258605607402b8';
import { validateFiles, shouldImport, MAX_FILES, MAX_BYTES, manifestPaths } from './workspace.js';
async function get(url) { const response = await fetch(url, { signal: AbortSignal.timeout(30000) }); if (!response.ok) throw new Error(`GitHub request failed (${response.status}). Check the URL or API rate limit.`); return response; }
export async function importGithub(value) {
  let url; try { url = new URL(value); } catch { throw new Error('Enter a valid HTTPS GitHub repository URL.'); }
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);
  if (url.protocol !== 'https:' || !['github.com', 'www.github.com'].includes(url.hostname) || parts.length < 2 || (parts.length > 2 && (parts[2] !== 'tree' || !parts[3]))) throw new Error('Use an HTTPS github.com owner/repository URL, optionally /tree/branch/folder.');
  const owner = encodeURIComponent(parts[0]), repo = encodeURIComponent(parts[1].replace(/\.git$/, ''));
  const base = `https://api.github.com/repos/${owner}/${repo}`;
  const ref = parts[3] || (await (await get(base)).json()).default_branch;
  const prefix = parts.slice(4).join('/');
  const tree = await (await get(`${base}/git/trees/${encodeURIComponent(ref)}?recursive=1`)).json();
  if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('Repository tree is incomplete. Import a smaller local folder.');
  const selected = tree.tree.filter(item => item.type === 'blob' && item.mode !== '120000' && (!prefix || item.path.startsWith(prefix + '/')) && shouldImport(item.path));
  if (!selected.length || selected.length > MAX_FILES || selected.reduce((sum, item) => sum + (item.size || 0), 0) > MAX_BYTES) throw new Error('Select a source folder with at most 500 files and 4 MiB.');
  const files = {}; let bytes = 0;
  for (const entry of selected) {
    const response = await get(`https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(ref)}/${entry.path.split('/').map(encodeURIComponent).join('/')}`);
    const reader = response.body.getReader(), chunks = [];
    try { while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.length; if (bytes > MAX_BYTES) throw new Error('Repository source exceeds 4 MiB.'); chunks.push(value); } } finally { await reader.cancel(); }
    const data = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0)); let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.length; }
    try { files[prefix ? entry.path.slice(prefix.length + 1) : entry.path] = new TextDecoder('utf-8', { fatal: true }).decode(data); }
    catch { throw new Error(`Cannot import binary file ${entry.path}. Choose a source-only project folder.`); }
  }
  if (!manifestPaths(files).length) throw new Error('No Cargo.toml found. Choose a Rust project folder or repository.');
  return validateFiles(files);
}
