const BASE = (import.meta.env?.DEV ? '' : import.meta.env?.VITE_BASE_URL || '').replace(/\/$/, '');
const sessions = new Map();
export const projectId = () => new URLSearchParams(window.location.search).get('projectId');
function session(id) {
  if (sessions.has(id)) return sessions.get(id);
  let value = {};
  try { value = JSON.parse(localStorage.getItem(`sorobuild:access:${id}`)) || {}; } catch { /* Memory access remains available. */ }
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (hash.has('access')) { value.token = hash.get('access'); hash.delete('access'); const url = new URL(window.location.href); url.hash = hash.toString(); history.replaceState({}, '', url); }
  remember(id, value); return value;
}
function remember(id, value) { sessions.set(id, value); try { localStorage.setItem(`sorobuild:access:${id}`, JSON.stringify(value)); } catch { /* Export a private share link for recovery. */ } }
async function request(route, method = 'GET', body, id, signal, onOutput) {
  const access = id ? session(id) : {};
  if (id && !access.token) throw new Error('Open the full private project link or import a backup. This browser has no owner token.');
  let response;
  try { response = await fetch(BASE + route, { method, signal: signal || AbortSignal.timeout(650000), headers: { 'Content-Type': 'application/json', ...(onOutput ? {Accept:'application/x-ndjson'} : {}), ...(access.token ? { Authorization: `Bearer ${access.token}` } : {}), ...(access.revision ? { 'X-Project-Revision': String(access.revision) } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }); }
  catch { throw new Error('API unavailable or timed out. Check the service and VITE_BASE_URL before retrying.'); }
  if (onOutput && response.ok && response.headers.get('content-type')?.includes('application/x-ndjson')) {
    const reader = response.body.getReader(), decoder = new TextDecoder(); let pending = '', result;
    const consume = line => { if (!line.trim()) return; const event = JSON.parse(line); if (event.type === 'log') onOutput(event.text); else if (event.type === 'result') result = event.result; else if (event.type === 'error') throw new Error(event.error); };
    try { while (true) { const {value, done} = await reader.read(); pending += decoder.decode(value, {stream:!done}); const lines = pending.split('\n'); pending = lines.pop(); for (const line of lines) consume(line); if (done) break; } if (pending) consume(pending); }
    finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (!result) throw new Error('Build connection ended before completion. Retry the build.');
    return result;
  }
  const data = await response.json().catch(() => null);
  if (!data) throw new Error('API returned an invalid response.');
  if (!response.ok && response.status !== 422) throw Object.assign(new Error(data.error || `API request failed (${response.status}).`), {status:response.status});
  const revision = Number(response.headers.get('X-Project-Revision'));
  if (response.ok && id && revision) remember(id, { ...access, revision });
  return data;
}
export async function createProject(files) {
  const created = await request('/api/projects', 'POST', { files });
  if (!created.projectId || !created.projectToken) throw new Error('API did not return a private project link.');
  remember(created.projectId, { token: created.projectToken, revision: created.revision });
  return created.projectId;
}
export function activateProject(id) {
  const url = new URL(window.location.href); url.searchParams.set('projectId', id);
  const hash = new URLSearchParams(url.hash.slice(1)); hash.delete('access'); url.hash = hash.toString();
  history.replaceState({}, '', url);
  window.dispatchEvent(new Event('sorobuild-project'));
}
async function ensureProject(files) {
  const current = projectId(); if (current) return current;
  const id = await createProject(files); activateProject(id); return id;
}
export async function saveProject(files) {
  const current = projectId();
  if (!current) return ensureProject(files);
  await request(`/api/projects/${current}`, 'PUT', { files }, current); return current;
}
export async function loadProject(id) { return request(`/api/projects/${encodeURIComponent(id)}`, 'GET', undefined, id); }
export function shareProject() { const id = projectId(); if (!id || !session(id).token) throw new Error('Save the project before sharing.'); const url = new URL(window.location.href); url.hash = new URLSearchParams({ access: session(id).token }).toString(); return url.toString(); }
export async function ideRequest(action, payload, signal, workspace = payload.files, onOutput) { const id = await ensureProject(workspace); return request(`/api/projects/${id}/${action}`, 'POST', payload, id, signal, onOutput); }

// Starting an imported workspace must not overwrite the previously saved project.
export function detachProject() {
  const url = new URL(window.location.href);
  url.searchParams.delete('projectId');
  const hash = new URLSearchParams(url.hash.slice(1)); hash.delete('access'); url.hash = hash.toString();
  history.replaceState({}, '', url);
  window.dispatchEvent(new Event('sorobuild-project'));
}
