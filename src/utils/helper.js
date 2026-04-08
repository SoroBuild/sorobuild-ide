export function buildGithubTreeUrl({
  example,
  owner = "stellar",
  repo = "soroban-examples",
  branch = "main",
}) {
  const { type, path } = example;
  if (!path) return null;
  return `https://github.com/${owner}/${repo}/${type}/${branch}/${path}`;
}
