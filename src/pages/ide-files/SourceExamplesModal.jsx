import { useMemo, useState } from "react";
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
import { buildGithubTreeUrl } from "../../utils/helper";

export default function SourceExamplesModal({
  open,
  onClose,
  title = "Load Project",
  examples = [],
  loadingExamples = false,
  onLoadExample,
  onLoadGithubRepo,
  exampleBaseUrl = "",
  defaultMode = "examples", // "examples" | "github"
}) {
  const [mode, setMode] = useState(defaultMode);
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
      if (!["github.com", "www.github.com"].includes(url.hostname)) {
        return false;
      }

      const parts = url.pathname.split("/").filter(Boolean);
      return parts.length >= 2;
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
      setGithubError("Enter a valid GitHub repository URL.");
      return;
    }

    setGithubError("");

    try {
      setSubmittingRepo(true);
      await onLoadGithubRepo?.(value);
      onClose?.();
    } catch (error) {
      setGithubError(error?.message || "Failed to load repository.");
    } finally {
      setSubmittingRepo(false);
    }
  }

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/50 p-3 pt-6 sm:p-4 sm:pt-10 lg:pt-16">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#11182d] shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white sm:text-lg">
                {title}
              </h2>
              <p className="mt-1 text-xs text-slate-400 sm:text-sm">
                Load an official Soroban example or import a Rust project from
                GitHub.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("examples")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
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
              onClick={() => setMode("github")}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition",
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

        {mode === "examples" && (
          <>
            <div className="border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1426] px-4 py-3">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Soroban examples..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              {loadingExamples ? (
                <div className="flex min-h-[260px] flex-col items-center justify-center gap-4">
                  <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
                  <div className="text-sm font-medium text-slate-300">
                    Loading examples...
                  </div>
                </div>
              ) : filteredExamples.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center">
                  <div className="max-w-md rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
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
                    const url = buildGithubTreeUrl({ example });
                    return (
                      <div
                        key={example.path}
                        className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3 transition hover:border-white/12 hover:bg-white/[0.05]"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onLoadExample?.(example);
                            onClose?.();
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="truncate text-sm font-medium text-white">
                            {example.name || example.path}
                          </div>

                          <div className="mt-1 truncate text-xs text-slate-400">
                            {example.path}
                          </div>

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
                            title="Open example in a new tab"
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
            <div className="rounded-3xl border border-white/10 bg-[#0d1426] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-2xl bg-cyan-400/10 p-2 text-cyan-300">
                  <Github className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">
                    Load a GitHub Rust project
                  </div>
                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Paste a GitHub repository URL that points to a Rust project
                    you want to load into the workspace.
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                  Repository URL
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#11182d] px-4 py-3">
                      <Github className="h-4 w-4 text-slate-500" />
                      <input
                        autoFocus
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

                    {githubError && (
                      <div className="mt-2 text-xs text-rose-300">
                        {githubError}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleLoadGithubRepo}
                    disabled={submittingRepo}
                    className={cn(
                      "inline-flex min-h-[48px] items-center justify-center rounded-2xl border px-4 text-sm font-medium transition sm:min-w-[140px]",
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

              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Notes
                </div>
                <div className="mt-2 space-y-2 text-sm leading-6 text-slate-400">
                  <p>
                    Repository should point to a Rust project that can be loaded
                    into the editor workspace.
                  </p>
                  <p>
                    Private repositories will require your own authentication
                    flow if you decide to support them.
                  </p>
                  <p>
                    For best results, point to repositories with a clear project
                    root and Cargo manifest.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
