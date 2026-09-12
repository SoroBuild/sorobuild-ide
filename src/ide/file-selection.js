export function mainSourceFile(files, preferred) {
  if (preferred && Object.hasOwn(files, preferred)) return preferred;
  const paths = Object.keys(files).sort((a,b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
  return paths.find(path => /(^|\/)src\/(lib|main)\.rs$/.test(path)) || paths.find(path => path.endsWith('.rs')) || paths[0] || '';
}
