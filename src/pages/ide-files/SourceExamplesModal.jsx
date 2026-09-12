import { useEffect, useMemo, useRef, useState } from "react";
import {
  ExternalLink,
  Loader2,
  Search,
  X,
  FolderGit2,
  Sparkles,
} from "lucide-react";
import { cn } from "../../utils/lib";
import { Github } from "./components/CustomIcons";


export default function SourceExamplesModal({
  open,
  onClose,
  title = "Load Project",
  examples = [],
  loadingExamples = false,
  examplesError = "",
  onRetryExamples,
  onLoadExample,
  onLoadGithubRepo,
  exampleBaseUrl = "",
  defaultMode = "examples", // "examples" | "github"
}) {
  const dialog = useRef(null);
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousFocus = document.activeElement;
    element.showModal();
    element.querySelector("input")?.focus();
    return () => { element.close(); previousFocus?.focus(); };
  }, [open]);
  const [mode, setMode] = useState(defaultMode);
  useEffect(() => { if (open) dialog.current?.querySelector("input")?.focus(); }, [open, mode]);
  const [query, setQuery] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [githubError, setGithubError] = useState("");
  const [submittingRepo, setSubmittingRepo] = useState(false);

  const filteredExamples = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return examples;

    return examples.filter((ex) => {
      const path = ex?.path || "";
      const name = ex?.name || "";
      const description = ex?.description || "";

      return [path, name, description].some((value) =>
        value.toLowerCase().includes(q)
      );
    });
  }, [examples, query]);

  function resolveExampleUrl(example) {
    if (example?.url) return example.url;
    if (!exampleBaseUrl) return "";
    const cleanBase = exampleBaseUrl.replace(/\/$/, "");
    const cleanPath = (example?.path || "").replace(/^\//, "");
    return `${cleanBase}/${cleanPath}`;
  }

  function isValidGithubRepoUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname)) {
        return false;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      return parts.length >= 2 && (parts.length === 2 || (parts[2] === "tree" && Boolean(parts[3])));
    } catch {
      return false;
    }
  }

  async function handleLoadGithubRepo() {
    const value = repoUrl.trim();

    if (!value) {
      setGithubError("Enter a GitHub repository URL.");
      return;
    }

    if (!isValidGithubRepoUrl(value)) {
      setGithubError("Use a GitHub repository URL or a /tree/branch/folder URL.");
      return;
    }

    await submit(() => onLoadGithubRepo(value));
  }

  async function submit(load) {
    if (submittingRepo) return;
    setGithubError(''); setSubmittingRepo(true);
    try {
      const loaded = await load();
      if (loaded !== false) onClose?.();
    } catch (error) {
      setGithubError(error?.message || 'Failed to load project. Please retry.');
    } finally { setSubmittingRepo(false); }
  }

  if (!open) return null;

  return (
    <dialog ref={dialog} className="project-loader" aria-label={title} aria-busy={submittingRepo} onCancel={event => { if (submittingRepo) event.preventDefault(); else onClose?.(); }}>
      <div className="relative flex max-h-[85dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#11182d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">
                {title}
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Start with an official example or import a public GitHub project.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submittingRepo}
              aria-label="Close project loader"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submittingRepo}
              aria-pressed={mode === "examples"}
              onClick={() => { setMode("examples"); setGithubError(""); }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                mode === "examples"
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Sparkles className="h-4 w-4" />
              Soroban Examples
            </button>

            <button
              type="button"
              disabled={submittingRepo}
              aria-pressed={mode === "github"}
              onClick={() => { setMode("github"); setGithubError(""); }}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition",
                mode === "github"
                  ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              )}
            >
              <Github className="h-4 w-4" />
              GitHub Repository
            </button>
          </div>
        </div>

        {submittingRepo && <div className="project-loader-progress" role="status" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300" aria-hidden="true" />
          <strong className="text-sm text-white">Loading project…</strong>
          <p className="max-w-xs text-center text-xs leading-5 text-slate-300">Fetching and preparing your project files. Larger directories may take a little longer.</p>
        </div>}
        {githubError && <div role="alert" className="px-5 py-3 text-sm text-rose-300">{githubError}</div>}
        {mode === "examples" && examplesError && <div role="alert" className="px-5 py-3 text-sm text-rose-300">{examplesError} <button type="button" onClick={onRetryExamples} disabled={loadingExamples} className="ml-2 underline">Retry examples</button></div>}
        {mode === "examples" && (
          <>
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d1426] px-4 py-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  aria-label="Search Soroban examples"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Soroban examples..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            {!loadingExamples && !examplesError && <div className="flex items-center justify-between px-5 pt-3 text-xs text-slate-400"><span role="status">{filteredExamples.length} {filteredExamples.length === 1 ? "example" : "examples"}</span>{query && <button className="text-cyan-200" onClick={() => setQuery("")}>Clear search</button>}</div>}
            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {loadingExamples ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                  <div className="text-sm font-medium text-slate-300">
                    Loading examples...
                  </div>
                </div>
              ) : examplesError ? null : filteredExamples.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="max-w-md rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300">
                      <FolderGit2 className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-white">
                      No examples found
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Try a different search term or switch to GitHub
                      Repository.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredExamples.map((example) => {
                    const url = resolveExampleUrl(example);
                    return (
                      <div
                        key={example.path}
                        className="group flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-3 transition hover:border-white/12 hover:bg-white/[0.05]"
                      >
                        <button
                          type="button"
                          disabled={submittingRepo}
                          onClick={() => submit(() => onLoadExample(example))}
                          aria-label={`Load ${example.name || example.path}`}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-sm font-medium text-white">
                            {example.name || example.path}
                          </div>

                          {example.path !== example.name && <div className="mt-1 truncate text-xs text-slate-400">{example.path}</div>}

                          {example.description && (
                            <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                              {example.description}
                            </div>
                          )}
                        </button>

                        {url ? (
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`View ${example.name || example.path} on GitHub`}
                            title="View source on GitHub"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {mode === "github" && (
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
            <div className="rounded-xl border border-white/10 bg-[#0d1426] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-cyan-400/10 p-2 text-cyan-300">
                  <Github className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    Import from GitHub
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Use a public repository or a folder containing Cargo.toml.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label htmlFor="github-project-url" className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Repository URL
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#11182d] px-4 py-3">
                      <Github className="h-4 w-4 text-slate-500" />
                      <input
                              id="github-project-url"
                        aria-describedby="github-project-help"
                        aria-invalid={Boolean(githubError)}
                        disabled={submittingRepo}
                        value={repoUrl}
                        onChange={(e) => {
                          setRepoUrl(e.target.value);
                          if (githubError) setGithubError("");
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !submittingRepo) {
                            handleLoadGithubRepo();
                          }
                        }}
                        placeholder="https://github.com/owner/repository"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      />
                    </div>


                  </div>

                  <button
                    type="button"
                    onClick={handleLoadGithubRepo}
                    disabled={submittingRepo}
                    className={cn(
                      "inline-flex min-h-[48px] items-center justify-center rounded-lg border px-4 text-sm font-medium transition sm:min-w-[140px]",
                      submittingRepo
                        ? "cursor-not-allowed border-cyan-400/10 bg-cyan-400/10 text-cyan-200/70"
                        : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200 hover:bg-cyan-400/15"
                    )}
                  >
                    {submittingRepo ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      "Load Repository"
                    )}
                  </button>
                </div>
              </div>

              <p id="github-project-help" className="mt-3 text-xs leading-5 text-slate-400">
                Repository: github.com/owner/repository<br />
                Branch or folder: github.com/owner/repository/tree/main/contracts/counter
              </p>
            </div>
          </div>
        )}
        <div className="border-t border-white/10 px-5 py-3 text-xs leading-5 text-slate-400">You’ll review before replacing your workspace. Each loaded project gets its own private link.</div>
      </div>
    </dialog>
  );
}
