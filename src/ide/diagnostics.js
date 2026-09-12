export function parseDiagnostics(output, files, manifest) {
  const lines = String(output).split('\n'), results = [], root = manifest.includes('/') ? manifest.slice(0, manifest.lastIndexOf('/') + 1) : '';
  let message = 'Compiler diagnostic', severity = 'error';
  for (const line of lines) {
    if (/^(error|warning)(\[|:)/.test(line)) { message = line; severity = line.startsWith('warning') ? 'warning' : 'error'; }
    const match = line.match(/^\s*-->\s+(.+):(\d+):(\d+)\s*$/);
    if (!match) continue;
    const relative = match[1].replace(/^\/tmp\/project\//, '').replace(/^\.\//, '');
    const path = [relative, root + relative].find(path => Object.hasOwn(files, path));
    if (path) results.push({ path, line: Math.max(1, Number(match[2])), column: Math.max(1, Number(match[3])), message, severity });
  }
  return results;
}
