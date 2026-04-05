import React, { useMemo, useState } from "react";
import {
  Play,
  FileCode2,
  FolderTree,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Wallet,
  TerminalSquare,
  ShieldCheck,
  Bug,
  FlaskConical,
  Rocket,
  RefreshCw,
  Copy,
  Globe,
  Settings,
  Server,
  Square,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Cable,
  PanelLeft,
  PanelRight,
  Database,
  KeyRound,
  PauseCircle,
  Box,
} from "lucide-react";

const initialFiles = {
  "contracts/counter/src/lib.rs": `#![no_std]
use soroban_sdk::{contract, contractimpl, Env, Symbol, log};

#[contract]
pub struct CounterContract;

#[contractimpl]
impl CounterContract {
    pub fn increment(env: Env, value: i32) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        let count: i32 = env.storage().instance().get(&key).unwrap_or(0);
        let next = count + value;
        env.storage().instance().set(&key, &next);
        log!(&env, "counter updated: {}", next);
        next
    }

    pub fn get(env: Env) -> i32 {
        let key = Symbol::new(&env, "COUNTER");
        env.storage().instance().get(&key).unwrap_or(0)
    }
}
`,
  "contracts/counter/Cargo.toml": `[package]
name = "counter"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = "22.0.0"
`,
  "tests/counter.spec.ts": `describe("counter contract", () => {
  it("increments and reads state", async () => {
    const contractId = "CCOUNTER123";
    expect(contractId).toBeTruthy();
  });
});
`,
  "audit/audit.config.json": `{
  "rules": ["overflow-check", "unbounded-loop", "auth-coverage"],
  "severity": "medium"
}
`,
  "README.md": `# Soroban Studio

A browser IDE for building, testing, auditing, and simulating Soroban smart contracts.

## Included
- Multi-file project explorer
- Local sandbox chain
- Network switching
- Wallet and generated account testing
- Debug and simulation panels
`,
};

const initialTerminal = [
  { type: "info", text: "Soroban Studio booted successfully." },
  { type: "success", text: "Local sandbox chain running on port 8000." },
  { type: "info", text: "Rust analyzer ready. Open a file to begin." },
];

const starterTests = [
  {
    id: 1,
    name: "increment returns updated value",
    status: "passed",
    duration: "42ms",
  },
  {
    id: 2,
    name: "get returns persisted state",
    status: "passed",
    duration: "18ms",
  },
  {
    id: 3,
    name: "rejects invalid auth in privileged flow",
    status: "idle",
    duration: "-",
  },
];

const starterAuditChecks = [
  { name: "Overflow / underflow scan", status: "ok" },
  { name: "Authorization coverage", status: "warning" },
  { name: "Storage access pattern", status: "ok" },
  { name: "Loop bound analysis", status: "ok" },
];

const networkOptions = [
  {
    value: "sandbox",
    label: "Local Sandbox",
    rpc: "localhost:8000/soroban/rpc",
  },
  { value: "testnet", label: "Testnet", rpc: "soroban-testnet.stellar.org" },
  { value: "mainnet", label: "Mainnet", rpc: "soroban-mainnet.stellar.org" },
  { value: "futurenet", label: "Futurenet", rpc: "rpc-futurenet.stellar.org" },
];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function randomHex(length = 56) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let out = "G";
  for (let i = 0; i < length - 1; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function buildTree(paths) {
  const root = {};
  paths.forEach((path) => {
    const parts = path.split("/");
    let cursor = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!cursor[part]) {
        cursor[part] = isFile ? { __file: true, path } : {};
      }
      cursor = cursor[part];
    });
  });
  return root;
}

function StatCard({ icon: Icon, title, value, hint }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.16em] text-slate-400">
            {title}
          </div>
          <div className="mt-2 text-xl font-semibold text-white">{value}</div>
          <div className="mt-1 text-xs text-slate-400">{hint}</div>
        </div>
        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 p-2 text-cyan-300">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick, active, danger }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
        danger
          ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
          : active
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
          : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function ExplorerNode({
  name,
  node,
  depth = 0,
  expanded,
  toggle,
  openFile,
  activeFile,
}) {
  const isFile = Boolean(node.__file);
  const nodeKey = node.path || `${depth}-${name}`;

  if (isFile) {
    const isActive = activeFile === node.path;
    return (
      <button
        onClick={() => openFile(node.path)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
          isActive
            ? "bg-cyan-400/10 text-cyan-200"
            : "text-slate-300 hover:bg-white/[0.05]"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileCode2 className="h-4 w-4 shrink-0" />
        <span className="truncate">{name}</span>
      </button>
    );
  }

  const isExpanded = expanded[nodeKey] ?? true;
  return (
    <div>
      <button
        onClick={() => toggle(nodeKey)}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-slate-200 transition hover:bg-white/[0.05]"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <FolderTree className="h-4 w-4 text-cyan-300" />
        <span className="truncate font-medium">{name}</span>
      </button>
      {isExpanded && (
        <div className="space-y-0.5">
          {Object.entries(node).map(([childName, childNode]) => {
            if (childName === "__file" || childName === "path") return null;
            return (
              <ExplorerNode
                key={`${nodeKey}-${childName}`}
                name={childName}
                node={childNode}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                openFile={openFile}
                activeFile={activeFile}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SorobanStudioIDE() {
  const [files, setFiles] = useState(initialFiles);
  const [activeFile, setActiveFile] = useState("contracts/counter/src/lib.rs");
  const [openTabs, setOpenTabs] = useState([
    "contracts/counter/src/lib.rs",
    "contracts/counter/Cargo.toml",
    "tests/counter.spec.ts",
  ]);
  const [fileQuery, setFileQuery] = useState("");
  const [expanded, setExpanded] = useState({
    contracts: true,
    tests: true,
    audit: true,
  });
  const [network, setNetwork] = useState("sandbox");
  const [walletConnected, setWalletConnected] = useState(false);
  const [generatedAddresses, setGeneratedAddresses] = useState([
    {
      id: 1,
      label: "Deployer",
      address: "GABX4XQH7RM7LQ3S2P5A7G3M9KD4N6YF4D5XUN3J7J5EWQ5RQZJ3O4AT",
    },
    {
      id: 2,
      label: "Tester 1",
      address: "GDSRVJ6Q7PKZSO6ZL2MLA3DMK64AEM7XJH7A33WUUKX3TQ6FQWCI5AOM",
    },
  ]);
  const [terminal, setTerminal] = useState(initialTerminal);
  const [status, setStatus] = useState("Ready");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [bottomTab, setBottomTab] = useState("console");
  const [rightTab, setRightTab] = useState("assistant");
  const [tests, setTests] = useState(starterTests);
  const [auditChecks, setAuditChecks] = useState(starterAuditChecks);
  const [breakpoints, setBreakpoints] = useState([8, 13]);
  const [debugPaused, setDebugPaused] = useState(false);
  const [localChainHeight, setLocalChainHeight] = useState(2411);
  const [selectedContext, setSelectedContext] = useState("Current file");

  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);

  const filteredTreeEntries = useMemo(() => {
    if (!fileQuery.trim()) return Object.entries(tree);
    const matching = Object.keys(files).filter((p) =>
      p.toLowerCase().includes(fileQuery.toLowerCase())
    );
    return Object.entries(buildTree(matching));
  }, [tree, fileQuery, files]);

  const currentCode = files[activeFile] || "";
  const lines = currentCode.split("\n");
  const activeNetwork = networkOptions.find((item) => item.value === network);

  const pushLog = (type, text) => {
    setTerminal((prev) => [...prev, { type, text }]);
  };

  const updateCode = (value) => {
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    setStatus("Editing...");
  };

  const openFile = (path) => {
    setActiveFile(path);
    setStatus(`Opened ${path}`);
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
  };

  const closeTab = (path) => {
    setOpenTabs((prev) => prev.filter((tab) => tab !== path));
    if (activeFile === path) {
      const next =
        openTabs.find((tab) => tab !== path) || Object.keys(files)[0];
      if (next) setActiveFile(next);
    }
  };

  const compileProject = () => {
    setStatus("Compiling...");
    pushLog(
      "info",
      `Compiling project against ${activeNetwork.label} toolchain...`
    );
    setTimeout(() => {
      setStatus("Compiled successfully");
      pushLog(
        "success",
        "Build finished. WASM artifact generated: target/wasm32v1-none/release/counter.wasm"
      );
    }, 500);
  };

  const runTests = () => {
    setStatus("Running tests...");
    pushLog("info", "Executing local contract test suite...");
    setTests((prev) =>
      prev.map((test, index) => ({
        ...test,
        status: index < 2 ? "passed" : "passed",
        duration: index === 0 ? "44ms" : index === 1 ? "19ms" : "38ms",
      }))
    );
    setTimeout(() => {
      setStatus("Tests passed");
      pushLog("success", "3/3 tests passed successfully.");
    }, 400);
  };

  const simulateInvoke = () => {
    setStatus("Simulating transaction...");
    pushLog("info", `Simulation started on ${activeNetwork.label}.`);
    setTimeout(() => {
      pushLog(
        "success",
        "Simulation complete. Result: Ok(1), estimated fee: 1243 stroops."
      );
      setStatus("Simulation complete");
    }, 350);
  };

  const deployContract = () => {
    setStatus("Deploying...");
    pushLog("info", `Deploying counter contract to ${activeNetwork.label}...`);
    setTimeout(() => {
      const contractId = `C${Math.random()
        .toString(36)
        .slice(2, 10)
        .toUpperCase()}S0R0BAN`;
      pushLog("success", `Deployment successful. Contract ID: ${contractId}`);
      setStatus("Deployed successfully");
      if (network === "sandbox") setLocalChainHeight((prev) => prev + 1);
    }, 600);
  };

  const runAudit = () => {
    setStatus("Auditing...");
    pushLog(
      "info",
      "Running audit SDK checks: overflow-check, unbounded-loop, auth-coverage..."
    );
    setAuditChecks([
      { name: "Overflow / underflow scan", status: "ok" },
      { name: "Authorization coverage", status: "warning" },
      { name: "Storage access pattern", status: "ok" },
      { name: "Loop bound analysis", status: "ok" },
      { name: "Event emission review", status: "ok" },
    ]);
    setTimeout(() => {
      pushLog(
        "warning",
        "Audit completed with 1 warning: missing explicit authorization check in privileged path."
      );
      setStatus("Audit complete");
    }, 500);
  };

  const addFile = () => {
    const name = `contracts/counter/src/module_${Object.keys(files).length}.rs`;
    setFiles((prev) => ({
      ...prev,
      [name]: `pub fn helper() -> u32 {\n    1\n}\n`,
    }));
    setOpenTabs((prev) => [...prev, name]);
    setActiveFile(name);
    pushLog("info", `Created file ${name}`);
  };

  const generateAddress = () => {
    const next = {
      id: Date.now(),
      label: `Generated ${generatedAddresses.length + 1}`,
      address: randomHex(),
    };
    setGeneratedAddresses((prev) => [next, ...prev]);
    pushLog("success", `Generated test account ${next.address}`);
  };

  const toggleBreakpoint = (line) => {
    setBreakpoints((prev) =>
      prev.includes(line)
        ? prev.filter((item) => item !== line)
        : [...prev, line].sort((a, b) => a - b)
    );
  };

  const startDebug = () => {
    setDebugPaused(true);
    setBottomTab("debug");
    setStatus("Debugger paused on breakpoint");
    pushLog("warning", `Execution paused at line ${breakpoints[0] || 1}.`);
  };

  const resumeDebug = () => {
    setDebugPaused(false);
    setStatus("Debugger resumed");
    pushLog("success", "Debugger resumed. Execution completed without panic.");
  };

  const connectWallet = () => {
    setWalletConnected((prev) => !prev);
    pushLog(
      "info",
      walletConnected
        ? "Wallet disconnected."
        : "Freighter-compatible wallet connected."
    );
  };

  return (
    <div className="min-h-screen bg-[#0b1020] p-4 text-white sm:p-5 lg:p-6">
      <div className="mx-auto flex h-[92vh] max-w-[1800px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#11182d] shadow-[0_25px_80px_rgba(0,0,0,0.45)]">
        <header className="border-b border-white/10 bg-[#131b33]/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2">
                <div className="rounded-xl bg-cyan-400/15 p-2 text-cyan-300">
                  <Box className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold tracking-wide text-cyan-200">
                    Soroban Studio
                  </div>
                  <div className="text-xs text-slate-400">
                    Smart contract IDE for Stellar
                  </div>
                </div>
              </div>

              <div className="hidden h-8 w-px bg-white/10 lg:block" />

              <div className="flex flex-wrap items-center gap-2">
                <ToolbarButton
                  icon={Play}
                  label="Run"
                  onClick={simulateInvoke}
                />
                <ToolbarButton
                  icon={Rocket}
                  label="Deploy"
                  onClick={deployContract}
                />
                <ToolbarButton
                  icon={FlaskConical}
                  label="Test"
                  onClick={runTests}
                />
                <ToolbarButton
                  icon={Bug}
                  label="Debug"
                  onClick={startDebug}
                  active={debugPaused}
                />
                <ToolbarButton
                  icon={ShieldCheck}
                  label="Audit"
                  onClick={runAudit}
                />
                <ToolbarButton
                  icon={RefreshCw}
                  label="Compile"
                  onClick={compileProject}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
                <Globe className="h-4 w-4 text-cyan-300" />
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="bg-transparent text-sm outline-none"
                >
                  {networkOptions.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                      className="bg-slate-900 text-white"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={generateAddress}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
              >
                <KeyRound className="h-4 w-4 text-emerald-300" />
                Generate Address
              </button>

              <button
                onClick={connectWallet}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                  walletConnected
                    ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                    : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"
                )}
              >
                <Wallet className="h-4 w-4" />
                {walletConnected ? "Wallet Connected" : "Connect Wallet"}
              </button>

              <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]">
                <Settings className="h-4 w-4" />
                Settings
              </button>
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 border-b border-white/10 bg-[#10172c] px-4 py-3 lg:grid-cols-4 lg:px-5">
          <StatCard
            icon={Server}
            title="Active Network"
            value={activeNetwork.label}
            hint={activeNetwork.rpc}
          />
          <StatCard
            icon={Database}
            title="Local Chain Height"
            value={String(localChainHeight)}
            hint="Updates on sandbox deployment"
          />
          <StatCard
            icon={Cable}
            title="Wallet Session"
            value={walletConnected ? "Connected" : "Not Connected"}
            hint="Use wallet or generated addresses"
          />
          <StatCard
            icon={CheckCircle2}
            title="Workspace Status"
            value={status}
            hint="Ready for code, test, simulate, and deploy"
          />
        </section>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          {!leftCollapsed && (
            <aside className="flex w-[320px] shrink-0 flex-col border-r border-white/10 bg-[#0f1528]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                  <div className="text-sm font-semibold tracking-wide text-slate-100">
                    File Explorer
                  </div>
                  <div className="text-xs text-slate-400">
                    Multi-file Soroban workspace
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={addFile}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setLeftCollapsed(true)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={fileQuery}
                    onChange={(e) => setFileQuery(e.target.value)}
                    placeholder="Search files"
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/30"
                  />
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
                {filteredTreeEntries.map(([name, node]) => (
                  <ExplorerNode
                    key={name}
                    name={name}
                    node={node}
                    expanded={expanded}
                    activeFile={activeFile}
                    openFile={openFile}
                    toggle={(key) =>
                      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                  />
                ))}
              </div>

              <div className="border-t border-white/10 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <KeyRound className="h-4 w-4 text-cyan-300" /> Test Accounts
                </div>
                <div className="space-y-2">
                  {generatedAddresses.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <div className="text-xs font-medium text-slate-300">
                        {item.label}
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {item.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {leftCollapsed && (
            <div className="flex w-12 shrink-0 items-start justify-center border-r border-white/10 bg-[#0f1528] pt-4">
              <button
                onClick={() => setLeftCollapsed(false)}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
              >
                <PanelRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <main className="flex min-w-0 flex-1 flex-col bg-[#11182d]">
            <div className="border-b border-white/10 bg-[#121a31] px-3 pt-2">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {openTabs.map((tab) => {
                  const active = tab === activeFile;
                  return (
                    <div
                      key={tab}
                      className={cn(
                        "group flex items-center gap-2 rounded-t-2xl border px-3 py-2 text-sm",
                        active
                          ? "border-white/10 border-b-[#11182d] bg-[#11182d] text-white"
                          : "border-transparent bg-white/[0.03] text-slate-400 hover:text-white"
                      )}
                    >
                      <button
                        onClick={() => setActiveFile(tab)}
                        className="truncate text-left"
                      >
                        {tab.split("/").slice(-1)[0]}
                      </button>
                      <button
                        onClick={() => closeTab(tab)}
                        className="rounded-md p-0.5 text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
                      >
                        <Square className="h-3 w-3 fill-current" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
              <section className="flex min-h-0 flex-col border-r border-white/10">
                <div className="flex items-center justify-between border-b border-white/10 bg-[#121a31] px-4 py-2.5">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {activeFile}
                    </div>
                    <div className="text-xs text-slate-400">
                      Rust / TOML / TS supported in this starter UI
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ToolbarButton
                      icon={Copy}
                      label="Copy"
                      onClick={() =>
                        navigator.clipboard?.writeText(currentCode)
                      }
                    />
                    <ToolbarButton
                      icon={Trash2}
                      label="Clear"
                      onClick={() => updateCode("")}
                      danger
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-auto bg-[#0f1528]">
                  <div className="flex min-w-[900px] font-mono text-[13px] leading-7 text-slate-200">
                    <div className="sticky left-0 z-10 border-r border-white/10 bg-[#0c1223] px-2 py-3 text-right text-slate-500">
                      {lines.map((_, index) => {
                        const line = index + 1;
                        const marked = breakpoints.includes(line);
                        return (
                          <button
                            key={line}
                            onClick={() => toggleBreakpoint(line)}
                            className={cn(
                              "flex h-7 w-12 items-center justify-end gap-2 rounded px-1 transition",
                              marked ? "text-rose-300" : "hover:bg-white/[0.04]"
                            )}
                          >
                            <span
                              className={cn(
                                "h-2 w-2 rounded-full",
                                marked
                                  ? "bg-rose-400"
                                  : "bg-transparent border border-transparent"
                              )}
                            />
                            {line}
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      value={currentCode}
                      onChange={(e) => updateCode(e.target.value)}
                      spellCheck={false}
                      className="min-h-full flex-1 resize-none bg-transparent px-4 py-3 text-slate-200 outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-white/10 bg-[#10172c] px-4 py-2 text-xs text-slate-400">
                  Click line numbers to toggle breakpoints. Use Debug to pause
                  execution and inspect behavior.
                </div>
              </section>

              {!rightCollapsed && (
                <aside className="flex min-h-0 flex-col bg-[#10172c]">
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-100">
                        Workbench
                      </div>
                      <div className="text-xs text-slate-400">
                        Debug, audit, accounts, assistant
                      </div>
                    </div>
                    <button
                      onClick={() => setRightCollapsed(true)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                    >
                      <PanelRight className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 border-b border-white/10 p-3">
                    {[
                      ["assistant", TerminalSquare],
                      ["debug", Bug],
                      ["accounts", KeyRound],
                      ["audit", ShieldCheck],
                    ].map(([key, Icon]) => (
                      <button
                        key={key}
                        onClick={() => setRightTab(key)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-xs font-medium capitalize transition",
                          rightTab === key
                            ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                            : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {key}
                      </button>
                    ))}
                  </div>

                  <div className="min-h-0 flex-1 overflow-auto p-4">
                    {rightTab === "assistant" && (
                      <div className="space-y-4">
                        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 text-center">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[22px] bg-cyan-400/15 text-cyan-300">
                            <TerminalSquare className="h-8 w-8" />
                          </div>
                          <div className="text-lg font-semibold text-white">
                            Soroban AI Assistant
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            Ask for code generation, explain compiler errors,
                            suggest test cases, or scaffold audit rules.
                          </p>
                        </div>

                        <div className="space-y-2">
                          {[
                            "Generate a storage wrapper for instance state",
                            "Create tests for increment and auth edge cases",
                            "Find possible overflow and loop risks",
                            "Explain why this contract would fail authorization",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.07]"
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                          <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                            Context
                          </div>
                          <select
                            value={selectedContext}
                            onChange={(e) => setSelectedContext(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-[#0d1426] px-3 py-2 text-sm text-white outline-none"
                          >
                            <option className="bg-slate-900">
                              Current file
                            </option>
                            <option className="bg-slate-900">
                              Whole project
                            </option>
                            <option className="bg-slate-900">Tests only</option>
                            <option className="bg-slate-900">
                              Audit config
                            </option>
                          </select>
                          <textarea
                            placeholder="Ask anything about your contract, tests, or network simulation..."
                            className="mt-3 h-28 w-full rounded-xl border border-white/10 bg-[#0d1426] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                          />
                          <button className="mt-3 w-full rounded-xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                            Ask Assistant
                          </button>
                        </div>
                      </div>
                    )}

                    {rightTab === "debug" && (
                      <div className="space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-white">
                                Debug Session
                              </div>
                              <div className="mt-1 text-xs text-slate-400">
                                {debugPaused
                                  ? "Paused on breakpoint"
                                  : "Debugger idle"}
                              </div>
                            </div>
                            {debugPaused ? (
                              <button
                                onClick={resumeDebug}
                                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
                              >
                                <Play className="h-4 w-4" /> Resume
                              </button>
                            ) : (
                              <button
                                onClick={startDebug}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950"
                              >
                                <PauseCircle className="h-4 w-4" /> Pause
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-sm font-semibold text-white">
                            Breakpoints
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {breakpoints.length ? (
                              breakpoints.map((line) => (
                                <span
                                  key={line}
                                  className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
                                >
                                  Line {line}
                                </span>
                              ))
                            ) : (
                              <div className="text-sm text-slate-400">
                                No breakpoints set.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-sm font-semibold text-white">
                            Variable Watch
                          </div>
                          <div className="mt-3 space-y-2 text-sm text-slate-300">
                            <div className="flex items-center justify-between rounded-xl bg-[#0d1426] px-3 py-2">
                              <span>count</span>
                              <span className="text-cyan-300">1</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-[#0d1426] px-3 py-2">
                              <span>value</span>
                              <span className="text-cyan-300">1</span>
                            </div>
                            <div className="flex items-center justify-between rounded-xl bg-[#0d1426] px-3 py-2">
                              <span>network</span>
                              <span className="text-cyan-300">
                                {activeNetwork.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {rightTab === "accounts" && (
                      <div className="space-y-4">
                        <button
                          onClick={generateAddress}
                          className="w-full rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                        >
                          Generate New Test Address
                        </button>

                        <div className="space-y-3">
                          {generatedAddresses.map((item) => (
                            <div
                              key={item.id}
                              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold text-white">
                                    {item.label}
                                  </div>
                                  <div className="mt-1 break-all text-xs text-slate-400">
                                    {item.address}
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    navigator.clipboard?.writeText(item.address)
                                  }
                                  className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-300"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {rightTab === "audit" && (
                      <div className="space-y-4">
                        <button
                          onClick={runAudit}
                          className="w-full rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
                        >
                          Run Audit SDKs
                        </button>
                        {auditChecks.map((check) => (
                          <div
                            key={check.name}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm text-slate-200">
                                {check.name}
                              </div>
                              <span
                                className={cn(
                                  "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                                  check.status === "ok"
                                    ? "bg-emerald-500/10 text-emerald-300"
                                    : "bg-amber-500/10 text-amber-300"
                                )}
                              >
                                {check.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </aside>
              )}

              {rightCollapsed && (
                <div className="flex items-start justify-center border-l border-white/10 bg-[#10172c] pt-4">
                  <button
                    onClick={() => setRightCollapsed(false)}
                    className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                  >
                    <PanelLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <section className="border-t border-white/10 bg-[#0f1528]">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
                {[
                  ["console", TerminalSquare],
                  ["tests", FlaskConical],
                  ["debug", Bug],
                  ["deploy", Rocket],
                ].map(([key, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setBottomTab(key)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm capitalize transition",
                      bottomTab === key
                        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                        : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {key}
                  </button>
                ))}
              </div>

              <div className="h-[220px] overflow-auto p-4">
                {bottomTab === "console" && (
                  <div className="space-y-2 font-mono text-sm">
                    {terminal.map((entry, index) => (
                      <div
                        key={`${entry.text}-${index}`}
                        className={cn(
                          "rounded-xl px-3 py-2",
                          entry.type === "success"
                            ? "bg-emerald-500/10 text-emerald-300"
                            : entry.type === "warning"
                            ? "bg-amber-500/10 text-amber-300"
                            : "bg-white/[0.03] text-slate-300"
                        )}
                      >
                        {entry.text}
                      </div>
                    ))}
                  </div>
                )}

                {bottomTab === "tests" && (
                  <div className="space-y-3">
                    {tests.map((test) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div>
                          <div className="text-sm font-medium text-white">
                            {test.name}
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            Duration: {test.duration}
                          </div>
                        </div>
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                            test.status === "passed"
                              ? "bg-emerald-500/10 text-emerald-300"
                              : test.status === "idle"
                              ? "bg-slate-700 text-slate-300"
                              : "bg-rose-500/10 text-rose-300"
                          )}
                        >
                          {test.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {bottomTab === "debug" && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white">
                        Execution Frame
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        increment(env, value)
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white">
                        Current Breakpoint
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        {breakpoints[0] ? `Line ${breakpoints[0]}` : "None"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-white">
                        Debugger State
                      </div>
                      <div className="mt-3 text-sm text-slate-300">
                        {debugPaused ? "Paused" : "Idle / completed"}
                      </div>
                    </div>
                  </div>
                )}

                {bottomTab === "deploy" && (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Target
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        {activeNetwork.label}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Signer
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        {walletConnected
                          ? "Connected Wallet"
                          : "Generated Address"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Artifact
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">
                        counter.wasm
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                      <div className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Readiness
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-base font-semibold text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" /> Ready to deploy
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0d1426] px-4 py-2 text-xs text-slate-400 sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <span>Breakpoint toggles in gutter</span>
            <span>•</span>
            <span>Multi-file project ready</span>
            <span>•</span>
            <span>Wallet + generated account testing</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Network: {activeNetwork.label}</span>
            <span>Compiler: soroban-sdk 22.0.0</span>
            <span>{debugPaused ? "Paused" : "Live"}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
