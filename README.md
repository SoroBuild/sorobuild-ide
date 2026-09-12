# Sorobuild IDE

Soroban Rust IDE with multi-directory workspaces, isolated build/test/format jobs, test accounts, Freighter signing, real deployment/invocation and reviewed AI suggestions. The active application is `src/pages/ide-files/SorobuildeIDE.jsx`; the API is the sibling `sorobuild-ide-server` project.

## Run

Use Node.js 22.14 or newer. Start the API using its README, then:

```sh
npm ci
npm run dev
```

Vite forwards `/api` to `http://127.0.0.1:3000`. Development always uses the local Vite proxy. For production builds, if an existing `.env` sets `VITE_BASE_URL` to an older hosted API, update it to the new API origin or leave it blank for the local proxy. `.env.example` documents the public browser settings. Never put wallet secrets or provider credentials in browser environment variables.

## Workflow

1. Use the SDK 25.1.0 Hello World starter, import local files/folders, or enter a public GitHub URL. GitHub URLs support `owner/repository/tree/ref/folder`; use a commit SHA for branches containing slashes. Import merges source and asks before replacing conflicting files. Source is limited to 500 text files and 4 MiB. Build output, environment files and exported test-key files are excluded from folder imports.
2. Select a Cargo manifest in Deploy. A workspace-root manifest builds its default members; configure Cargo `default-members` or select a member manifest as appropriate. Compile produces WASM; Test runs actual Rust tests; Format Rust updates the local editor only if source has not changed during the job.
3. Generate a test account, fund it with Friendbot and select it for signing. Test keys exist only in memory and disappear on reload. Export key creates a **plaintext private-key backup**; keep it private and use Import key to restore it. Keys are not included in source saves or workspace exports.
4. Alternatively connect Freighter. Its network must match the IDE. Mainnet requires Freighter and an operator-configured `VITE_MAINNET_RPC`; it has no faucet.
5. Deploy a current compiled artifact and wait for upload and contract-creation confirmations. Then enter a function and typed arguments, simulate, and invoke. Starter `hello` arguments are `[{"type":"string","value":"World"}]`. Large integers must be decimal strings; use the `xdr` type for complex values.
6. Inspect compiler output and simulation results. The assistant sends selected source and diagnostics to the API's configured model. Review the original and proposed replacement, explicitly apply it, then build and test. Suggestions cannot overwrite files edited after the request.

## Saving and sharing

Browser drafts preserve source, including empty files. Export workspace downloads a JSON source bundle for durable backup. Save project persists source through the API. Builds/tests do not silently replace saved source. Stale revisions are rejected; export local edits before reloading to resolve a conflict.

Copy private link includes an owner token in its URL fragment. **Anyone with that complete link can read, update and delete the project.** Tokens are retained in browser storage, and consumed fragments are removed from the address bar. A project ID alone grants no access. This release has no login-based recovery, collaborator roles or token revocation. Keep a private link and source backups. Clearing browser storage can remove your only access token.

## Verify and host

```sh
npm run lint
npm test
npm run build
npm run test:browser
```

Browser tests use installed Chrome locally; CI installs Chromium. Serve `dist` over HTTPS with SPA fallback, and reverse-proxy `/api` to the API with at least a 660-second response timeout. Alternatively set `VITE_BASE_URL` at build time and allow the frontend's exact origin in API `ALLOWED_ORIGINS`. Static hosting alone does not provide the compiler or persistence.

## Release scope

Rust support includes Monaco file models, rust-analyzer completion and documentation, and real compiler/test output. Instruction-level Soroban stepping is not implemented. Source pattern checks are hints, not a security audit. Deployment supports constructor arguments and ordinary signer-authorized calls; additional authorization signers and automatic state restoration require further work.

AI needs a reachable configured Ollama model. The offline runner caches SDK 25.1.0; other dependencies require an operator-reviewed image rebuild. Before a public launch, verify Freighter manually with the installed extension, configure HTTPS and durable backups, enforce public-service storage/admission quotas, and review compiler host isolation. See the API README for operational requirements. Older inactive UI/utilities remain for reference; lint targets the active application.

### Accounts, deployment and saving

Open **Deploy** to connect Freighter, generate an automatically funded test account, or import an exported account key. The signer selector includes connected and generated accounts and is used for deployment, simulation and invocation. Generated keys stay in memory; export them from Accounts before reloading if you need to reuse them. Funding failures retain the key and can be retried. Mainnet signing uses Freighter.

Upload a compiled `.wasm` or compile a project, fill any constructor inputs, and deploy. Functions and argument fields are read from the contract specification; existing contracts can be opened with **Load contract functions**. **Simulate** previews a call, while **Sign and invoke** submits it.

**Ctrl+S / Cmd+S** and the Save button run `cargo fmt` and save the formatted project to the API. Formatting errors leave editor contents unchanged; edits made while formatting is running are preserved. Loading an example or GitHub project creates a separate saved project and unique URL. Use **More → Copy private link** for a link that includes access; **Export workspace** remains a separate backup action.

### IntelliSense

Saved Cargo projects use rust-analyzer for Soroban SDK completion, hover documentation, signature help, in-workspace definitions and analysis diagnostics. Press **Ctrl+Space** for completion. First indexing can take about a minute; the editor reports progress. The runner must include rust-analyzer, Rust sources and the project's dependencies. This integration does not provide the full VS Code extension UI or step debugging.

An opt-in live browser check is available with `LIVE_TESTNET=1 npm run test:browser -- tests/browser/live-testnet.spec.js`. It creates a fresh funded Testnet account and deploys a test contract; no Mainnet funds are used.
