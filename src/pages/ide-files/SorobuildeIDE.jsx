import ExplorerLink from '../../ide/ExplorerLink';
import WalletDialog from '../../ide/WalletDialog';
import { externalWalletNetwork, disconnectExternalWallet, supportsWalletNetwork } from '../../ide/wallets';
import DeploymentPanel from '../../ide/DeploymentPanel';
import InteractionOutput from '../../ide/InteractionOutput';
import { mainSourceFile } from '../../ide/file-selection';
import ConfirmDialog from '../../ide/ConfirmDialog';
import ContractArguments from '../../ide/ContractArguments';
import { artifactFromBytes, artifactSpec, functionNames, MAX_WASM_BYTES } from '../../ide/contract-interface';
import WorkspaceHeader from '../../ide/WorkspaceHeader';
import ResizeHandle from '../../components/ide-files/ResizeHandle';
import StatCard from '../../components/ide-files/StatCard';
import ToolbarButton from '../../components/ide-files/ToolBarButton';
import Modal from '../../components/ide-files/Modal';
import ExplorerNode from '../../components/ide-files/ExplorerNode';
import SourceExamplesModal from './SourceExamplesModal';
import { Github } from './components/CustomIcons';
import { ChevronUp } from 'lucide-react';
import { useStates } from '../../ide/WorkspaceContext';
import { parseDiagnostics } from '../../ide/diagnostics';
import { importGithub, EXAMPLES_REF } from '../../ide/github';
import CodeEditor from '../../ide/CodeEditor';
import { useEffect, useMemo, useRef, useState } from "react";
import 'monaco-editor/esm/vs/editor/editor.all';
import 'monaco-editor/esm/vs/basic-languages/rust/rust.contribution';
import 'monaco-editor/esm/vs/basic-languages/ini/ini.contribution';
import 'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution';
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution';
import PropTypes from 'prop-types';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import { starterFiles } from '../../ide/starter';
import { validateFiles, validatePath, renameFiles, manifestPaths, shouldImport } from '../../ide/workspace';
import { ideRequest, projectId, loadProject, saveProject, shareProject, createProject, activateProject } from '../../ide/api';
import { networkOptions, generateAccount, importAccount, fundAccount, accountFor, deployWasm, simulateCall, invokeCall, formatValue, serverFor } from '../../ide/stellar';
self.MonacoEnvironment = { getWorker: () => new EditorWorker() };
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  Play,
  Loader2,
  FileCode2,
  FolderTree,
  ChevronRight,
  ChevronDown,
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
  Server,
  Trash2,
  CheckCircle2,
  Cable,
  PanelLeft,
  PanelRight,
  Database,
  KeyRound,
  PauseCircle,
  Box,
  FolderPlus,
  Upload,
  Download,
  MoreHorizontal,
  X,
  GripVertical,
  FilePlus2,
  Wand2,
} from "lucide-react";

const STORAGE_KEY = "soroban_studio_workspace_v2";

const starterLogs = [{ type: "info", text: "Workspace ready. Build and test use the Sorobuild API. Test accounts live only in this browser session." }];
const starterTests = [];
const starterAuditChecks = [];

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

function getLanguageFromPath(path) {
  if (!path) return "plaintext";
  if (path.endsWith(".rs")) return "rust";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".toml")) return "ini";
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
  return "plaintext";
}

function buildTree(paths) {
  const root = Object.create(null);
  [...paths].sort().forEach((path) => {
    const parts = path.split("/");
    let cursor = root;
    parts.forEach((part, index) => {
      const isFile = index === parts.length - 1;
      if (!Object.hasOwn(cursor, part)) {
        cursor[part] = isFile
          ? { __file: true, path }
          : { __folder: true, path: parts.slice(0, index + 1).join("/") };
      }
      cursor = cursor[part];
    });
  });
  return root;
}

export default function SorobuildIDE() {
  const [topPanelCollapsed, setTopPanelCollapsed] = useState(true);
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const confirmationResolver = useRef(null);
  const confirmWorkspaceChange = request => new Promise(resolve => {
    if (confirmationResolver.current) { resolve(false); return; }
    confirmationResolver.current = resolve; setConfirmation(request);
  });
  const resolveConfirmation = accepted => { const resolve = confirmationResolver.current; confirmationResolver.current = null; setConfirmation(null); resolve?.(accepted); };
  useEffect(() => () => { confirmationResolver.current?.(false); }, []);
  const [examples, setExamples] = useState([]);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [examplesError, setExamplesError] = useState('');

  const [files, setFiles] = useState(starterFiles);
  const sourceRef = useRef(files); sourceRef.current = files;
  const [currentProject, setCurrentProject] = useState(projectId);
  const draftKey = currentProject ? `sorobuild:workspace:${currentProject}` : STORAGE_KEY;
  useEffect(() => { const update = () => setCurrentProject(projectId()); window.addEventListener('sorobuild-project', update); return () => window.removeEventListener('sorobuild-project', update); }, []);
  const [workspaceName, setWorkspaceName] = useState("hello-world");
  const [activeFile, setActiveFile] = useState("hello_world/src/lib.rs");
  const [openTabs, setOpenTabs] = useState([
    "hello_world/src/lib.rs",
  ]);
  const [fileQuery, setFileQuery] = useState("");
  const [expanded, setExpanded] = useState({
    hello_world: true,
  });
  const [network, setNetwork] = useState("testnet");
  const [walletAddress, setWalletAddress] = useState('');
  const walletConnected = Boolean(walletAddress);
  const [walletName, setWalletName] = useState('Wallet');
  const [walletId, setWalletId] = useState('');
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const walletDecision = useRef(null);
  const [walletNetwork, setWalletNetwork] = useState(null);
  const walletSelectable = Boolean(walletAddress) && supportsWalletNetwork(walletId, networkOptions.find(item => item.value === network)) && (network !== 'sandbox' || (walletNetwork?.address === walletAddress && walletNetwork?.passphrase === networkOptions.find(item => item.value === 'sandbox').passphrase));
  const [generatedAddresses, setGeneratedAddresses] = useState([]);
  const accountKeys = useRef(new Map());
  const [signerAddress, setSignerAddress] = useState('');
  const [manifest, setManifest] = useState('Cargo.toml');
  const [diagnostics, setDiagnostics] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [artifactName, setArtifactName] = useState('');
  const [builtSource, setBuiltSource] = useState('');
  const [contractId, setContractId] = useState('');
  const [method, setMethod] = useState('hello');
  const [callSpec, setCallSpec] = useState(null);
  const [manualArgs, setManualArgs] = useState(false);
  const [constructorArgs, setConstructorArgs] = useState('[]');
  const [manualConstructor, setManualConstructor] = useState(false);
  const [accountStatus, setAccountStatus] = useState('');
  const [args, setArgs] = useState('[{"type":"string","value":"World"}]');
  const [deploymentFeedback, setDeploymentFeedback] = useState(null);
  const [buildPhase, setBuildPhase] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [storageReady, setStorageReady] = useState(false);
  const loading = !storageReady;

  const storageBlocked = useRef(false);
  const [storageError, setStorageError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [suggestion, setSuggestion] = useState(null);
  const [suggestionOriginal, setSuggestionOriginal] = useState('');
  const [interactionState, setInteractionState] = useState(null);
  const [interactionResult, setInteractionResult] = useState('');
  const [terminal, setTerminal] = useState(starterLogs);
  const [status, setStatus] = useState("Ready");
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(() => window.innerWidth < 1100);
  const [bottomTab, setBottomTab] = useState("console");
  const [rightTab, setRightTab] = useState("assistant");
  const [tests, setTests] = useState(starterTests);
  const [auditChecks, setAuditChecks] = useState(starterAuditChecks);
  const [breakpoints, setBreakpoints] = useState([]);
  const debugPaused = false;

  const [selectedContext, setSelectedContext] = useState("Current file");
  const [workspaceDirty, setWorkspaceDirty] = useState(false);
  const [selectedPath, setSelectedPath] = useState(
    "hello_world/src/lib.rs"
  );
  const [dragActive, setDragActive] = useState(false);

  const { showNewFileModal, setShowNewFileModal, showNewFolderModal, setShowNewFolderModal } = useStates();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState(
    "hello_world/src/new_file.rs"
  );
  const [newFolderPath, setNewFolderPath] = useState(
    "hello_world/src/utils"
  );
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const editorRef = useRef(null);
  const deploymentPanelRef = useRef(null);
  const consoleScroll = useRef(null);
  const interactionPanel = useRef(null);
  const outputPanel = useRef(null);
  useEffect(() => { if (interactionState) outputPanel.current?.scrollIntoView({behavior:'smooth',block:'nearest'}); }, [interactionState]);
  useEffect(() => { setInteractionState(null); setInteractionResult(''); }, [contractId, method, network]);
  useEffect(() => { if (contractId && bottomTab === 'deploy') interactionPanel.current?.scrollIntoView({behavior:'smooth', block:'nearest'}); }, [contractId, bottomTab]);
  useEffect(() => { if (buildPhase && consoleScroll.current) consoleScroll.current.scrollTop = consoleScroll.current.scrollHeight; }, [terminal, buildPhase]);
  useEffect(() => { if (bottomTab === 'deploy') deploymentPanelRef.current?.resize('58%'); }, [bottomTab]);
  const monacoRef = useRef(null);

  useEffect(() => {
    if (!walletAddress || network !== 'sandbox') { setWalletNetwork(null); return; }
    let active = true, checking = false;
    const check = async () => {
      if (checking) return;
      checking = true;
      try { const passphrase = await externalWalletNetwork(networkOptions.find(item => item.value === network)); if (active) setWalletNetwork({address:walletAddress,passphrase}); }
      catch { if (active) setWalletNetwork(null); }
      finally { checking = false; }
    };
    check();
    const timer = setInterval(check, 3000);
    window.addEventListener('focus', check);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', check); };
  }, [walletAddress, network]);
  useEffect(() => {
    if (walletAddress && signerAddress === walletAddress && !walletSelectable && !accountKeys.current.has(signerAddress)) setSignerAddress('');
  }, [walletAddress, signerAddress, walletSelectable]);

  const activeNetwork =
    networkOptions.find((item) => item.value === network) || networkOptions[0];

  const pushLog = (type, text) => {
    setTerminal((prev) => [...prev.slice(-199), { type, text: String(text).slice(0, 100000) }]);
  };

  const markDirty = () => setWorkspaceDirty(true);

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
    try {
      const saved = localStorage.getItem(draftKey);
      let parsed = saved ? JSON.parse(saved) : null;
      if (currentProject && !parsed?.dirty) { const loaded = await loadProject(currentProject); parsed = { ...parsed, files: loaded.files, dirty:false }; }
      if (cancelled) return;
      if (!parsed) parsed = {files:sourceRef.current};
      setWorkspaceDirty(Boolean(parsed.dirty));
      if (!parsed?.files) return;

      parsed.files = validateFiles(parsed.files);
      setFiles(parsed.files);
      setWorkspaceName(typeof parsed.workspaceName === "string" ? parsed.workspaceName : "restored-workspace");

      const requestedFile = new URLSearchParams(window.location.search).get('file');
      const safeActive = mainSourceFile(parsed.files, Object.hasOwn(parsed.files, requestedFile) ? requestedFile : parsed.activeFile);

      setActiveFile(safeActive || "");
      setSelectedPath(safeActive || "");

      setOpenTabs(
        Array.isArray(parsed.openTabs) && parsed.openTabs.filter((path) => Object.hasOwn(parsed.files, path)).length
          ? [...new Set([...parsed.openTabs.filter((path) => Object.hasOwn(parsed.files, path)), safeActive].filter(Boolean))]
          : safeActive
          ? [safeActive]
          : []
      );

      setNetwork(networkOptions.some(n => n.value === parsed.network) ? parsed.network : "testnet");
      setBreakpoints([]);
      setExpanded(parsed.expanded && typeof parsed.expanded === "object" && !Array.isArray(parsed.expanded) ? parsed.expanded : {});

    } catch {
      storageBlocked.current = true;
      setStorageError("Saved workspace could not be restored. Export your files before clearing browser storage.");
    } finally {
      if (!cancelled) setStorageReady(true);
    }
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!storageReady || storageBlocked.current) return;
    const url = new URL(window.location.href);
    if (activeFile && Object.hasOwn(files, activeFile)) url.searchParams.set('file', activeFile);
    else url.searchParams.delete('file');
    history.replaceState(history.state, '', url);
  }, [activeFile, files, storageReady]);

  useEffect(() => {
    if (!storageReady || storageBlocked.current) return;
    const payload = {
      files,
      dirty: workspaceDirty,
      workspaceName,
      activeFile,
      openTabs,
      network,
      breakpoints,
      expanded,

    };
    const timer = setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(payload)); setStorageError(''); }
      catch { setStorageError('Browser storage is full or unavailable. Export your workspace to keep your changes.'); }
    }, 400);
    return () => clearTimeout(timer);
  }, [
    files,
    workspaceName,
    activeFile,
    openTabs,
    network,
    breakpoints,
    expanded,
    storageReady, draftKey, workspaceDirty,
  ]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault(); e.stopPropagation();
        if (!e.repeat) saveRemote();
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      editorRef.current?.layout?.();
    });
    if (document.body) observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const tree = useMemo(() => buildTree(Object.keys(files)), [files]);

  const filteredTree = useMemo(() => {
    if (!fileQuery.trim()) return Object.entries(tree);
    const q = fileQuery.toLowerCase();
    const matching = Object.keys(files).filter((p) =>
      p.toLowerCase().includes(q)
    );
    return Object.entries(buildTree(matching));
  }, [tree, fileQuery, files]);

  const currentCode = files[activeFile] ?? "";
  const editorLines = currentCode.split("\n");

  const commandItems = (() => {
    const items = [
      { label: "Save project", action: () => saveRemote() },
      { label: "Compile project", action: () => compileProject() },
      { label: "Run tests", action: () => runTests() },
      { label: "Run audit", action: () => runAudit() },
      { label: "Simulate invoke", action: () => simulateInvoke() },
      { label: "Deploy contract", action: () => deployContract() },
      { label: "New file", action: () => setShowNewFileModal(true) },
      { label: "New folder", action: () => setShowNewFolderModal(true) },
      { label: "Export workspace", action: () => saveWorkspaceBundle() },
      ...Object.keys(files).map((path) => ({
        label: `Open ${path}`,
        action: () => openFile(path),
      })),
    ];

    if (!commandQuery.trim()) return items.slice(0, 12);

    return items
      .filter((item) =>
        item.label.toLowerCase().includes(commandQuery.toLowerCase())
      )
      .slice(0, 12);
  })();

  const ensureTab = (path) => {
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
  };

  const openFile = (path) => {
    if (!Object.hasOwn(files, path)) return;
    setActiveFile(path);
    setSelectedPath(path);
    ensureTab(path);
    setStatus(`Opened ${path}`);
    setShowCommandPalette(false);
  };

  const closeTab = (path) => {
    const nextTabs = openTabs.filter((tab) => tab !== path);
    setOpenTabs(nextTabs);
    if (activeFile === path) {
      const next = nextTabs[nextTabs.length - 1] || Object.keys(files)[0];
      if (next) setActiveFile(next);
    }
  };

  const updateCode = (value = "") => {
    if (!activeFile || !Object.hasOwn(files, activeFile)) return;
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    setStatus("Editing...");
    markDirty();
  };

  const createFile = (path) => {
    const clean = path.trim();
    if (!clean) return;
    if (Object.hasOwn(files, clean)) {
      openFile(clean);
      return;
    }

    const template = clean.endsWith(".rs")
      ? "pub fn helper() -> u32 {\n    1\n}\n"
      : clean.endsWith(".json")
      ? "{}\n"
      : clean.endsWith(".md")
      ? "# New File\n"
      : "";

    try { validateFiles({ ...files, [clean]: template }); }
    catch (error) { pushLog('warning', error.message); setStatus(error.message); return; }
    setFiles((prev) => ({ ...prev, [clean]: template }));
    setActiveFile(clean);
    setSelectedPath(clean);
    ensureTab(clean);
    setShowNewFileModal(false);
    setNewFilePath("hello_world/src/new_file.rs");
    setStatus(`Created ${clean}`);
    markDirty();
    pushLog("success", `Created file ${clean}`);
  };

  const createFolder = (path) => {
    const clean = path.replace(/\/$/, "").trim();
    if (!clean) return;
    const placeholder = `${clean}/.gitkeep`;

    try { validateFiles({ ...files, [placeholder]: '' }); }
    catch (error) { pushLog('warning', error.message); setStatus(error.message); return; }
    if (!Object.hasOwn(files, placeholder)) {
      setFiles((prev) => ({ ...prev, [placeholder]: "" }));
      setSelectedPath(clean);
      setStatus(`Created folder ${clean}`);
      markDirty();
      pushLog("success", `Created folder ${clean}`);
    }

    setShowNewFolderModal(false);
    setNewFolderPath("hello_world/src/utils");
  };

  const deletePath = async (path) => {
    if (busyRef.current) return;
    if (!await confirmWorkspaceChange({title:'Delete from workspace?',description:`Delete ${path} and its contents?`,detail:'Export a backup first if you need to keep these files.',confirmLabel:'Delete',cancelLabel:'Cancel'})) return;
    if (busyRef.current) return;
    const prefix = `${path}/`;
    const next = {};

    Object.entries(sourceRef.current).forEach(([filePath, content]) => {
      if (filePath !== path && !filePath.startsWith(prefix)) {
        next[filePath] = content;
      }
    });

    setFiles(next);
    setOpenTabs((prev) =>
      prev.filter((tab) => tab !== path && !tab.startsWith(prefix))
    );

    if (activeFile === path || activeFile.startsWith(prefix)) {
      const fallback = Object.keys(next)[0];
      setActiveFile(fallback || "");
      setSelectedPath(fallback || "");
    }

    setStatus(`Deleted ${path}`);
    markDirty();
    pushLog("warning", `Removed ${path}`);
  };

  const startRename = (path) => {
    setRenameTarget(path);
    setRenameValue(path.split("/").pop() || path);
    setShowRenameModal(true);
  };

  const applyRename = () => {
    if (!renameTarget || !renameValue.trim()) return;

    const oldPrefix = renameTarget;
    const parent = renameTarget.includes("/")
      ? renameTarget.split("/").slice(0, -1).join("/")
      : "";
    const target = parent
      ? `${parent}/${renameValue.trim()}`
      : renameValue.trim();
    const prefix = `${oldPrefix}/`;

    let next;
    try { next = renameFiles(files, oldPrefix, target); }
    catch (error) { pushLog('warning', error.message); setStatus(error.message); return; }

    setFiles(next);
    setOpenTabs((prev) =>
      prev.map((tab) =>
        tab === oldPrefix
          ? target
          : tab.startsWith(prefix)
          ? tab.replace(prefix, `${target}/`)
          : tab
      )
    );

    if (activeFile === oldPrefix) {
      setActiveFile(target);
    } else if (activeFile.startsWith(prefix)) {
      setActiveFile(activeFile.replace(prefix, `${target}/`));
    }

    setSelectedPath(target);
    setShowRenameModal(false);
    setRenameTarget("");
    setRenameValue("");
    setStatus("Rename applied");
    markDirty();
    pushLog("success", `Renamed ${oldPrefix} to ${target}`);
  };

  const saveWorkspaceBundle = () => {
    const payload = JSON.stringify({ workspaceName, files }, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workspaceName}.soroban-workspace.json`;
    a.click();
    URL.revokeObjectURL(url);

    setStatus("Workspace exported");
    pushLog("success", "Workspace exported as JSON bundle.");
  };

  const exportCurrentFile = () => {
    const blob = new Blob([currentCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = activeFile.split("/").pop() || "file.txt";
    a.click();
    URL.revokeObjectURL(url);
    pushLog("success", `Exported ${activeFile}`);
  };

  const loadWorkspaceBundle = async (file) => {
    try {
      if (file.size > 6 * 1024 * 1024) throw new Error("Workspace bundle exceeds 6 MiB.");
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.files || typeof parsed.files !== "object") {
        throw new Error("Invalid workspace file");
      }

      validateFiles(parsed.files);
      if (!await confirmWorkspaceChange({title:'Open workspace backup?',description:'This backup will replace the files in your editor.',detail:'Export the current workspace first if you need a separate backup.',confirmLabel:'Open backup'})) return;
      const savedId = await createProject(parsed.files);
      activateProject(savedId);
      setWorkspaceName(typeof parsed.workspaceName === 'string' ? parsed.workspaceName : 'imported-workspace');
      parsed.files = validateFiles(parsed.files);
      setFiles(parsed.files);

      const initialFile = mainSourceFile(parsed.files);
      setActiveFile(initialFile); setSelectedPath(initialFile); setOpenTabs(initialFile ? [initialFile] : []);

      setWorkspaceDirty(false);
      setStatus("Workspace imported");
      pushLog(
        "success",
        `Imported workspace bundle with ${
          Object.keys(parsed.files).length
        } files.`
      );
    } catch (error) {
      setStatus("Import failed");
      pushLog("warning", error.message);
    }
  };

  const importFilesIntoWorkspace = async (incoming) => {
    if (busyRef.current) { pushLog('warning', 'Wait for the current operation before importing files.'); return; }
    const next = {};
    try {
      for (const item of incoming.filter(item => shouldImport(item.path))) {
        validatePath(item.path);
        if (item.file.size > 4 * 1024 * 1024) throw new Error('File exceeds 4 MiB.');
        next[item.path] = await item.file.text();
      }
      validateFiles({ ...sourceRef.current, ...next });
    } catch (error) { pushLog('warning', error.message); setStatus('Import failed'); return; }
    if (Object.keys(next).some(path => Object.hasOwn(files, path) && files[path] !== next[path]) &&
        !await confirmWorkspaceChange({title:'Replace matching files?',description:'Some imported files have the same names as files in your workspace.',detail:'Only matching files will be replaced. Export first if you need to keep both versions.',confirmLabel:'Replace files'})) return;

    const merged = validateFiles({ ...sourceRef.current, ...next });
    setFiles(merged);
    const paths = Object.keys(next);
    const initialFile = mainSourceFile(next);
    if (initialFile) { setActiveFile(initialFile); setSelectedPath(initialFile); ensureTab(initialFile); }

    markDirty();
    setStatus(`Imported ${paths.length} file${paths.length > 1 ? "s" : ""}`);
    pushLog(
      "success",
      `Imported ${paths.length} file${
        paths.length > 1 ? "s" : ""
      } into workspace.`
    );
    await runOperation('Save imported files', async () => {
      await saveProject(merged);
      if (JSON.stringify(sourceRef.current) === JSON.stringify(merged)) setWorkspaceDirty(false);
    });
  };

  const readDirectoryEntries = async (entries) => {
    const collected = [];

    const walkEntry = async (entry, basePath = "") => {
      if (!entry || !shouldImport(`${basePath}${entry.name}`)) return;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        collected.push({ path: `${basePath}${file.name}`, file });
        return;
      }

      if (entry.kind === "directory") {
        for await (const child of entry.values()) {
          await walkEntry(child, `${basePath}${entry.name}/`);
        }
      }
    };

    await Promise.all(Array.from(entries).map((entry) => walkEntry(entry)));
    return collected;
  };

  const handleUploadFiles = async (event) => {
    const selected = Array.from(event.target.files || []);
    if (!selected.length) return;

    const workspaceBundle = selected.find((file) =>
      file.name.endsWith(".soroban-workspace.json")
    );
    if (workspaceBundle) {
      await loadWorkspaceBundle(workspaceBundle);
      event.target.value = "";
      return;
    }

    const normalized = selected.map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));

    await importFilesIntoWorkspace(normalized);
    event.target.value = "";
  };

  const pickFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const dir = await window.showDirectoryPicker();
        const entries = await readDirectoryEntries([dir]);
        const normalized = entries.map((item) => ({
          ...item,
          path: item.path.replace(`${dir.name}/`, "") || item.path,
        }));
        await importFilesIntoWorkspace(normalized);
      } else {
        folderInputRef.current?.click();
      }
    } catch {
      pushLog("warning", "Folder selection cancelled.");
    }
  };

  const onDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);

    const items = event.dataTransfer.items;
    if (items?.length && items[0].getAsFileSystemHandle) {
      try {
        const handles = await Promise.all(
          Array.from(items)
            .map((item) => item.getAsFileSystemHandle?.())
            .filter(Boolean)
        );
        const imported = await readDirectoryEntries(handles);
        await importFilesIntoWorkspace(imported);
        return;
      } catch {
        pushLog(
          "warning",
          "Advanced drag-and-drop import failed. Falling back to flat file import."
        );
      }
    }

    const dropped = Array.from(event.dataTransfer.files || []).map((file) => ({
      file,
      path: file.webkitRelativePath || file.name,
    }));

    if (dropped.length) await importFilesIntoWorkspace(dropped);
  };

  const runOperation = async (label, operation) => {
    if (busyRef.current) return;
    if (!storageReady || storageBlocked.current) { pushLog('warning', 'Resolve workspace loading before running operations. Export a backup first.'); return; }
    busyRef.current = true; setBusy(true); setStatus(`${label}…`);
    try { await operation(); setStatus(`${label} complete`); }
    catch (error) { setStatus(`${label} failed`); pushLog('warning', error.message); if (label === 'Deployment') { setDeploymentFeedback({error:true, text:error.message}); setBottomTab('deploy'); } else if (label === 'Simulation' || label === 'Invocation') { setInteractionState({status:'error',operation:label,method,message:error.message}); setBottomTab('deploy'); } else if (bottomTab === 'deploy' && ['Funding','Account check','Create funded account','Contract interface'].includes(label)) { if (label === 'Contract interface') setInteractionState({status:'error',operation:'Interface',message:error.message}); else setAccountStatus(error.message); setBottomTab('deploy'); } else setBottomTab('console'); }
    finally { busyRef.current = false; setBusy(false); }
  };
  const saveRemote = () => runOperation('Save', async () => {
    const currentFiles = validateFiles(sourceRef.current);
    const snapshot = JSON.stringify(currentFiles);
    if (!selectedManifest) throw new Error('Select a Cargo project before saving with cargo fmt.');
    setStatus('Save: formatting with cargo fmt…');
    const result = await ideRequest('format', { files: currentFiles, manifest: selectedManifest });
    if (!result.success) throw new Error(result.output || 'cargo fmt failed. Correct the Rust syntax before saving again.');
    const formatted = validateFiles(result.files);
    if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Files changed during formatting. Your edits are preserved; save again to format and save them.');
    setStatus('Save: uploading formatted project…');
    await saveProject(formatted);
    if (snapshot === JSON.stringify(sourceRef.current)) { setFiles(formatted); setWorkspaceDirty(false); }
    else { setWorkspaceDirty(true); pushLog('warning', 'The formatted snapshot was saved; newer edits remain unsaved.'); }
    pushLog('success', 'Project formatted with cargo fmt and saved. Keep a private share link and export backups.');
  });
  const formatProject = () => runOperation('Format', async () => {
    const snapshot = JSON.stringify(files);
    const result = await ideRequest('format', { files, manifest: selectedManifest });
    if (!result.success) throw new Error(result.output || 'Formatting failed.');
    if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Files changed during formatting. Retry to keep your edits.');
    setFiles(validateFiles(result.files)); markDirty();
  });
  const importKey = event => runOperation('Import key', async () => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 4096) throw new Error('Invalid test key file.');
    const data = JSON.parse(await file.text()); const account = importAccount(data.secret);
    if (data.address && data.address !== account.address) throw new Error('Key/address mismatch.');
    accountKeys.current.set(account.address, account.secret);
    setGeneratedAddresses(prev => [...prev.filter(item => item.address !== account.address), { id: account.id, address: account.address, label: `Imported test account` }]);
    setSignerAddress(account.address);
  });
  const selectedManifest = manifestPaths(files).includes(manifest) ? manifest : manifestPaths(files)[0] || '';
  const selectedArtifact = artifacts.find(item => item.name === artifactName);
  const buildCurrent = builtSource === JSON.stringify(files);
  const deployable = selectedArtifact && (selectedArtifact.uploaded || buildCurrent);
  const selectedSpec = useMemo(() => artifactSpec(selectedArtifact), [selectedArtifact]);
  const constructorMethod = selectedSpec?.funcs().some(fn => fn.name().toString() === '__constructor');
  const callableMethods = functionNames(callSpec);
  const uploadWasm = async event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    await runOperation('WASM upload', async () => {
      if (file.size > MAX_WASM_BYTES) throw new Error('WASM files must be at most 4 MiB.');
      const artifact = await artifactFromBytes(file.name, await file.arrayBuffer());
      setArtifacts(previous => [...previous.filter(item => item.name !== artifact.name), artifact]);
      setArtifactName(artifact.name); setConstructorArgs('[]'); setManualConstructor(false); setBottomTab('deploy');
      pushLog('success', `Uploaded ${file.name}. Select a funded account to deploy.`);
    });
  };
  const loadContractInterface = () => runOperation('Contract interface', async () => {
    const wasm = await serverFor(activeNetwork).getContractWasmByContractId(contractId);
    const spec = artifactSpec({wasm: btoa(Array.from(wasm, byte => String.fromCharCode(byte)).join(''))});
    if (!spec) throw new Error('This contract has no readable interface. Enter its function and typed arguments manually.');
    setCallSpec(spec); setMethod(functionNames(spec)[0] || ''); setArgs(null); setManualArgs(false);
  });
  const fundSelectedAccount = () => runOperation('Funding', async () => {
    if (!signerAddress) throw new Error('Select an account first.');
    await fundAccount(activeNetwork, signerAddress);
    setGeneratedAddresses(previous => previous.map(item => item.address === signerAddress ? {...item, fundedNetworks: [...new Set([...(item.fundedNetworks || []), network])]} : item));
    setAccountStatus(`Funded on ${activeNetwork.label}`); pushLog('success', `Account funded: ${signerAddress}`);
  });
  const checkSelectedAccount = () => runOperation('Account check', async () => {
    setAccountStatus('');
    try { await accountFor(activeNetwork, signerAddress); setAccountStatus(`Account exists on ${activeNetwork.label}`); }
    catch (error) { setGeneratedAddresses(previous => previous.map(item => item.address === signerAddress ? {...item, fundedNetworks: (item.fundedNetworks || []).filter(value => value !== network)} : item)); throw error; }
  });
  useEffect(() => { setAccountStatus(''); }, [signerAddress, network]);
  const signer = signerAddress && (signerAddress !== walletAddress || walletSelectable || accountKeys.current.has(signerAddress)) ? { address: signerAddress, secret: accountKeys.current.get(signerAddress) } : null;
  const deploymentBlocker = busy ? 'Wait for the current operation to finish.' : !signer ? 'Select or generate an account to deploy.' : network === 'mainnet' && signer.secret ? 'Connect an external wallet to deploy on Mainnet.' : !activeNetwork.rpc ? 'Configure a Mainnet RPC endpoint before deploying.' : !deployable ? selectedManifest ? selectedArtifact ? 'Source files changed. Recompile before deploying.' : 'Compile your contract to create a deployable WASM.' : 'Upload a WASM file or load a Cargo project.' : !constructorArgs ? 'Complete the constructor arguments to enable deployment.' : '';
  useEffect(() => { setDeploymentFeedback(null); }, [artifactName, signerAddress, network]);
  const selectedAccount = generatedAddresses.find(item => item.address === signerAddress);
  const signerSummary = !signer ? 'No account selected' : selectedAccount?.fundedNetworks?.includes(network) ? `Funded on ${activeNetwork.label}` : signerAddress === walletAddress ? 'Connected wallet · network checked when signing' : 'Imported or generated account · check funding on this network';
  const compileProject = ({ forDeployment = false } = {}) => runOperation('Build', async () => {
    setArtifacts([]); setBuiltSource(''); setBottomTab('console'); setBuildPhase('Formatting project');
    try {
      const currentFiles = validateFiles(sourceRef.current), snapshot = JSON.stringify(currentFiles);
      if (!selectedManifest) throw new Error('Select a Cargo project before building.');
      setStatus('Build: running cargo fmt…'); pushLog('info', 'Running cargo fmt…');
      const formatting = await ideRequest('format', {files:currentFiles, manifest:selectedManifest});
      if (!formatting.success) { setDiagnostics(parseDiagnostics(formatting.output || '', currentFiles, selectedManifest)); throw new Error(formatting.output || 'cargo fmt failed. Fix the syntax errors before building.'); }
      if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Files changed during formatting. Retry the build to preserve your edits.');
      const formatted = validateFiles(formatting.files);
      setFiles(formatted); sourceRef.current = formatted; markDirty();
      pushLog('success', 'Formatting complete.'); setBuildPhase('Compiling contract'); setStatus('Build: compiling contract…');
      pushLog('info', 'Running cargo build · release · wasm32v1-none…');
      let streamed = false;
      const result = await ideRequest('build', { files:formatted, manifest:selectedManifest }, undefined, formatted, text => { streamed = true; pushLog('info', text); });
      setDiagnostics(parseDiagnostics(result.output || '', formatted, selectedManifest));
      if (!streamed) pushLog(result.success ? 'success' : 'warning', result.output || 'Compiler returned no output.');
      if (!result.success) throw new Error('Compilation failed. See compiler output.');
      if (!result.artifacts?.length) throw new Error('Build produced no WASM artifacts. Check the selected manifest and crate-type.');
      setArtifacts(result.artifacts); setArtifactName(result.artifacts[0].name); setBuiltSource(JSON.stringify(formatted)); setConstructorArgs('[]'); setManualConstructor(false);
      pushLog('success', `Build complete: ${result.artifacts.length} WASM artifact(s) ready.`);
      if (forDeployment) setBottomTab('deploy');
    } finally { setBuildPhase(''); }
  });
  const runTests = () => runOperation('Tests', async () => {
    setTests([]); setBottomTab('console');
    const result = await ideRequest('test', { files, manifest: selectedManifest });
    setDiagnostics(parseDiagnostics(result.output, files, selectedManifest));
    pushLog(result.success ? 'success' : 'warning', result.output);
    const rows = [...result.output.matchAll(/^test (.+) \.{3} (ok|FAILED|ignored)$/gm)].map((match, id) => ({ id, name: match[1], status: match[2] === 'ok' ? 'passed' : match[2] === 'ignored' ? 'idle' : 'failed', duration: 'See console' }));
    setTests(rows);
    if (!result.success) throw new Error('Tests failed. See the console for compiler errors or test failures.');
    pushLog('success', rows.length ? `Completed ${rows.length} Rust tests.` : 'Cargo completed. No individual test results were reported; see console.');
  });
  const simulateInvoke = () => {
    setBottomTab('deploy');
    if (!contractId || !signer) { setStatus('Select an account and enter a contract ID in Deploy.'); return; }
    return runOperation('Simulation', async () => {
      setInteractionResult(''); setInteractionState({status:'pending',operation:'Simulation',method,message:`Simulating ${method}…`});
      const result = await simulateCall(activeNetwork, signer.address, contractId, method, args);
      setInteractionState({status:'success',operation:'Simulation',method,message:'Simulation complete · no transaction submitted'});
      setInteractionResult(formatValue(result)); pushLog('success', `Simulation: ${formatValue(result)}`);
    });
  };
  const deployContract = async () => {
    setBottomTab('deploy');
    if (!deployable || !signer || !constructorArgs) { setStatus('Upload WASM or compile, select a funded account, and complete constructor arguments in Deploy.'); return; }
    setDeploymentFeedback(null);
    if (!await confirmWorkspaceChange({kind:'deployment', title:'Deploy contract?', description:`Deploy ${selectedArtifact.name} to ${activeNetwork.label}.`, detail:`Account: ${signer.address}. This submits two transactions and incurs network fees.`, confirmLabel:'Confirm deployment', cancelLabel:'Cancel'})) return;
    return runOperation('Deployment', async () => {
      setDeploymentFeedback({text:'Preparing upload and checking account…'});
      const result = await deployWasm(activeNetwork, signer, selectedArtifact, text => {pushLog('info', text); setDeploymentFeedback({text});}, constructorArgs);
      setDeploymentFeedback({success:true, hash:result.hash, network, text:`Deployed successfully: ${result.contractId}`});
      setContractId(result.contractId); setInteractionResult(''); setInteractionState(null);
      setCallSpec(selectedSpec); setMethod(functionNames(selectedSpec)[0] || ''); setArgs(selectedSpec ? null : '[]'); setManualArgs(false);
      pushLog('success', `Confirmed contract: ${result.contractId}`);
    });
  };
  const invokeContract = async () => {
    if (!signer || !contractId) { setStatus('Select a signer and enter a contract ID.'); return; }
    if (!await confirmWorkspaceChange({kind:'deployment',title:'Invoke contract?',description:`Submit ${method} on ${activeNetwork.label}.`,detail:`Account: ${signer.address}. This can change contract state and incurs network fees.`,confirmLabel:'Confirm invocation',cancelLabel:'Cancel'})) return;
    return runOperation('Invocation', async () => {
      setBottomTab('deploy'); setInteractionResult(''); setInteractionState({status:'pending',operation:'Invocation',method,message:`Preparing ${method} transaction…`});
      const result = await invokeCall(activeNetwork, signer, contractId, method, args, text => {pushLog('info', text);setInteractionState({status:'pending',operation:'Invocation',method,message:text});});
      setInteractionState({status:'success',operation:'Invocation',method,network,message:'Transaction confirmed'});
      setInteractionResult(formatValue(result)); pushLog('success', formatValue(result));
    });
  };
  const runAudit = () => {
    setRightTab('audit');
    const checks = [];
    for (const [path, content] of Object.entries(files).filter(([path]) => path.endsWith('.rs'))) {
      for (const [pattern, label] of [[/\.unwrap\(/g, 'Review unwrap panic'], [/\bloop\s*\{/g, 'Review unbounded loop'], [/unsafe\s*\{/g, 'Review unsafe block']]) {
        for (const match of content.matchAll(pattern)) checks.push({ name: `${path}:${content.slice(0, match.index).split('\n').length} — ${label}`, status: 'warning' });
      }
    }
    setAuditChecks(checks); setStatus('Source checks complete');
    pushLog('info', `Source pattern checks found ${checks.length} review items. This is not a security audit and does not evaluate authorization or prove safety.`);
  };
  const generateAddress = () => runOperation('Create funded account', async () => {
    if (!activeNetwork.friendbot) throw new Error('Generate test accounts on Testnet, Futurenet, or Local Sandbox. Connect a wallet for Mainnet.');
    if (bottomTab !== 'deploy') { setRightCollapsed(false); setRightTab('accounts'); }
    const account = generateAccount(); accountKeys.current.set(account.address, account.secret);
    setGeneratedAddresses(previous => [...previous, { id: account.id, address: account.address, label: `Test account ${previous.length + 1}`, fundedNetworks: [], funding: true }]);
    setSignerAddress(account.address);
    try {
      await fundAccount(activeNetwork, account.address);
      setGeneratedAddresses(previous => previous.map(item => item.address === account.address ? {...item, funding: false, fundedNetworks: [network]} : item));
      setAccountStatus(`Funded on ${activeNetwork.label}`);
      pushLog('success', `Generated and funded ${account.address} on ${activeNetwork.label}. Selected for deployment and invocation. Export its key to reuse after reload.`);
    } catch (error) {
      setGeneratedAddresses(previous => previous.map(item => item.address === account.address ? {...item, funding: false} : item));
      setAccountStatus('Funding failed. The account is retained; use Fund selected account to retry.');
      throw new Error(`Account generated, but funding failed: ${error.message}. Your key is retained. Retry with Fund selected account.`);
    }
  });
  const exportKey = address => {
    const secret = accountKeys.current.get(address);
    if (!secret) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ address, secret }, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${address.slice(0, 12)}-test-key.json`; link.click(); URL.revokeObjectURL(url);
  };
  const askAssistant = () => runOperation('Assistant', async () => {
    const contextFiles = Object.fromEntries(Object.entries(files).filter(([path]) => selectedContext === 'Whole project' || (selectedContext === 'Current file' ? path === activeFile : selectedContext === 'Tests only' ? /test|spec/.test(path) : path.startsWith('audit/'))));
    setSuggestion(null);
    const result = await ideRequest('assistant', { prompt, files: contextFiles, diagnostics: terminal.map(entry => entry.text).join('\n').slice(-16000) }, undefined, files);
    setSuggestion(result); setSuggestionOriginal(contextFiles[result.path] || '');
  });

  const toggleBreakpoint = (line) => {
    setBreakpoints((prev) =>
      prev.includes(line)
        ? prev.filter((item) => item !== line)
        : [...prev, line].sort((a, b) => a - b)
    );
  };

  const startDebug = () => { setBottomTab('debug'); setStatus('Use Rust tests and RPC simulation diagnostics. Step debugging is not connected.'); };
  const resumeDebug = startDebug;
  const connectWallet = () => runOperation('Wallet', async () => {
    if (walletConnected) { await disconnectExternalWallet(); if (signerAddress === walletAddress) setSignerAddress(''); setWalletAddress(''); return; }
    setShowWalletDialog(true);
    const wallet = await new Promise(resolve => { walletDecision.current = resolve; });
    if (!wallet) return;
    let passphrase;
    if (network === 'sandbox') { try { passphrase = await externalWalletNetwork(activeNetwork); } catch { /* Hide wallets whose local network cannot be verified. */ } }
    setWalletAddress(wallet.address); setWalletName(wallet.name); setWalletId(wallet.id); setWalletNetwork({address:wallet.address,passphrase});
    if (network !== 'sandbox' || passphrase === activeNetwork.passphrase) setSignerAddress(wallet.address);
    pushLog('success', `${wallet.name} connected: ${wallet.address}`);
  });

  const clearTerminalLogs = () => setTerminal([]);
  const ongoingProcess = busy ? (status.startsWith('Build') ? 'compile' : status.startsWith('Format') ? 'format' : 'busy') : '';
  const loadExamples = async () => {
    setLoadingExamples(true); setExamplesError('');
    try {
      const response = await fetch(`https://api.github.com/repos/stellar/soroban-examples/contents?ref=${EXAMPLES_REF}`, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error('Could not load examples. Check your connection or GitHub rate limit.');
      const entries = await response.json();
      setExamples(entries.filter(item => item.type === 'dir' && !item.name.startsWith('.')).map(item => ({name:item.name,path:item.path,type:'tree'})));
    } catch (error) { setExamplesError(error.message); pushLog('warning', error.message); } finally { setLoadingExamples(false); }
  };
  const loadGithubRepository = async repoUrl => {
    if (busyRef.current) throw new Error('Another operation is running. Try again when it finishes.');
    if (!storageReady || storageBlocked.current) throw new Error('Resolve workspace loading before importing a project.');
    busyRef.current = true; setBusy(true); setStatus('Loading project…');
    const snapshot = JSON.stringify(sourceRef.current);
    try {
      const incoming = await importGithub(repoUrl);
      if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Your files changed while downloading. Please retry to preserve those edits.');
      if (!await confirmWorkspaceChange({title:'Open this project?',description:`${Object.keys(incoming).length} files will open in a new saved project.`,detail:'Your current editor workspace will be replaced. Saved projects remain available through their private links. Export unsaved work first if you need a separate backup.'})) {
        setStatus('Project load cancelled'); return false;
      }
      if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Your files changed while confirming. Please load the project again.');
      const nextManifest = manifestPaths(incoming)[0];
      const paths = Object.keys(incoming);
      const active = mainSourceFile(incoming);
      const name = new URL(repoUrl).pathname.split('/').filter(Boolean).at(-1).replace(/\.git$/, '');
      const folders = Object.fromEntries(paths.flatMap(path => path.split('/').slice(0, -1).map((_, index) => [path.split('/').slice(0, index + 1).join('/'), true])));
      // Persist both sides before switching; a storage failure must leave the editor intact.
      localStorage.setItem(draftKey, JSON.stringify({ files: sourceRef.current, dirty: workspaceDirty, workspaceName, activeFile, openTabs, network, expanded }));
      localStorage.setItem('sorobuild:previous-workspace', JSON.stringify({ files: sourceRef.current, workspaceName, projectId: currentProject }));
      const savedId = await createProject(incoming);
      if (snapshot !== JSON.stringify(sourceRef.current)) throw new Error('Your files changed while saving the new project. Please retry loading.');
      localStorage.setItem(`sorobuild:workspace:${savedId}`, JSON.stringify({ files: incoming, dirty: false, workspaceName: name, activeFile: active, openTabs: [active], expanded: folders, network }));
      activateProject(savedId);
      setFiles(incoming); setWorkspaceName(name); setActiveFile(active); setSelectedPath(active); setOpenTabs([active]); setExpanded(folders); setFileQuery('');
      setManifest(nextManifest); setArtifacts([]); setArtifactName(''); setBuiltSource(''); setDiagnostics([]); setTests([]); setBreakpoints([]);
      setContractId(''); setCallSpec(null); setInteractionResult(''); setSuggestion(null); setSuggestionOriginal('');
      setWorkspaceDirty(false); setStatus('Project loaded and saved'); pushLog('success', `Loaded and saved ${name}: ${paths.length} files. Use Copy private link to reopen or share this project.`);
      return true;
    } catch (error) {
      setStatus('Project load failed'); pushLog('warning', error.message); throw error;
    } finally { busyRef.current = false; setBusy(false); }
  };
  const loadExampleFolder = path => loadGithubRepository(`https://github.com/stellar/soroban-examples/tree/${EXAMPLES_REF}/${path}`);

return (
		<div className="sorobuild-app h-screen min-h-screen text-white">
			<div
				className={cn(
					"workspace-shell flex h-full flex-col overflow-hidden",
					dragActive &&
						"ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-[#0b1020] ",
				)}
				onDragOver={(e) => {
					e.preventDefault();
					setDragActive(true);
				}}
				onDragLeave={() => setDragActive(false)}
				onDrop={onDrop}
			>
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="hidden"
					onChange={handleUploadFiles}
				/>
				<input
					ref={(node) => {
						folderInputRef.current = node;
						if (node) {
							node.setAttribute("webkitdirectory", "");
							node.setAttribute("directory", "");
						}
					}}
					type="file"
					multiple
					className="hidden"
					onChange={handleUploadFiles}
				/>

				{loading && (
					<div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-[28px] bg-[#0b1020]/80 backdrop-blur-sm">
						<div className="h-10 w-10 animate-spin  rounded-full border-4 border-white/10 border-t-cyan-400" />
						<div className="text-sm font-medium text-slate-300">
							Loading workspace...
						</div>
					</div>
				)}

				<div className="border-b border-white/10 bg-[#101822] ">
					<WorkspaceHeader name={workspaceName} dirty={workspaceDirty} busy={busy} status={status} network={network} networks={networkOptions}
 onNetwork={value => { setNetwork(value); setContractId(''); setCallSpec(null); setInteractionResult(''); }} walletConnected={walletConnected} onWallet={connectWallet}
 onCompile={compileProject} onTest={runTests} onDeploy={() => setBottomTab('deploy')} onSave={saveRemote} onFormat={formatProject} onCommands={() => setShowCommandPalette(true)}
 detailsOpen={!topPanelCollapsed} onDetails={() => setTopPanelCollapsed(value => !value)}
 actions={[
  { label: 'Import folder', icon: FolderPlus, disabled: busy, onClick: pickFolder },
  { label: 'Import files', icon: FilePlus2, disabled: busy, onClick: () => fileInputRef.current?.click() },
  { label: 'Export workspace', icon: Download, onClick: saveWorkspaceBundle },
  { label: 'Copy private link', icon: Copy, disabled: busy || !currentProject, onClick: () => runOperation('Share', async () => { await navigator.clipboard.writeText(shareProject()); pushLog('info', 'Private owner link copied. Anyone with it can edit this project.'); }) },
  { label: 'Generate Address', icon: KeyRound, disabled: busy, onClick: generateAddress },
  { label: 'Source checks', icon: ShieldCheck, disabled: busy, onClick: () => { setRightCollapsed(false); runAudit(); } },
  { label: 'Command Palette', icon: Search, onClick: () => setShowCommandPalette(true), shortcut: '⌘ K' },
 ]} />

					{!topPanelCollapsed && (
						<section className="workspace-details">
							<StatCard
								icon={Server}
								title="Active Network"
								value={activeNetwork.label}
								hint={activeNetwork.rpc}
							/>
							<StatCard
								icon={Database}
								title="Build Artifacts"
								value={String(artifacts.length)}
								hint={buildCurrent ? "Current source compiled" : "Compile to generate WASM"}
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
								value={`${status}${workspaceDirty ? " • Unsaved" : ""}`}
								hint={storageError || `${workspaceName} • browser draft enabled`}
							/>
						</section>
					)}
				</div>

				<div className="min-h-0  flex-1 overflow-hidden ">
					<Group orientation="horizontal" className="h-full w-full">
						{!leftCollapsed ? (
							<>
								<Panel
									defaultSize="18%"
									minSize="14%"
									maxSize="28%"
									className="min-h-0"
								>
									<aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-[#0d141f]">
										<div className="panel-heading flex items-center justify-between border-b border-white/10 px-3 py-2">
											<div>
												<div className="text-sm font-semibold tracking-wide text-slate-100">
													Explorer
												</div>
												<div className="text-xs text-slate-400">

												</div>
											</div>
											<div className="flex items-center gap-2">
												<button
													aria-label="Load Soroban project" onClick={() => {
														setShowExamplesModal(true);
														loadExamples();
													}}
													className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
												>
													<Github className="h-4 w-4" />
												</button>


												<button
													aria-label="Hide explorer" title="Hide explorer" onClick={() => setLeftCollapsed(true)}
													className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
												>
													<PanelLeft className="h-4 w-4" />
												</button>
											</div>
										</div>

										<div className="space-y-3 p-3">
											<div className="relative">
												<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
												<input
													value={fileQuery}
													onChange={(e) => setFileQuery(e.target.value)}
													placeholder="Search files"
													className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/30"
												/>
											</div>

										</div>

										<div className="min-h-0 flex-1 overflow-auto px-2 pb-3">
											{filteredTree.map(([name, node]) => (
												<ExplorerNode
													key={name}
													name={name}
													node={node}
													expanded={expanded}
													toggle={(path) =>
														setExpanded((prev) => ({
															...prev,
															[path]: !prev[path],
														}))
													}
													openFile={openFile}
													activeFile={activeFile}
													// selectedPath={selectedPath}
													onSelectPath={setSelectedPath}
													onRename={startRename}
													onDelete={deletePath}
												/>
											))}
										</div>

									</aside>
								</Panel>
								<ResizeHandle />
							</>
						) : (
							<>
								<Panel
									defaultSize="3%"
									minSize="3%"
									maxSize="5%"
									className="border-r border-white/10 bg-[#0d141f]"
								>
									<div className="flex h-full items-start justify-center pt-4">
										<button
											aria-label="Show explorer" title="Show explorer" onClick={() => setLeftCollapsed(false)}
											className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
										>
											<PanelRight className="h-4 w-4" />
										</button>
									</div>
								</Panel>
								<ResizeHandle />
							</>
						)}

						<Panel defaultSize="82%" minSize="35%" className="min-h-0">
							<Group orientation="vertical" className="h-full">
								<Panel defaultSize="80%" minSize="30%" className="min-h-0">
									<Group orientation="horizontal" className="h-full">
										<Panel
											defaultSize={rightCollapsed ? "100%" : "74%"}
											minSize="35%"
											className="min-h-0"
										>
											<div className="flex h-full min-h-0 flex-col bg-[#101822]">
												<div className="border-b border-white/10 bg-[#101822] px-3 pt-1">
													<div className="flex items-center justify-between gap-3 overflow-hidden pb-2">
														<div className="editor-tabs flex items-center gap-1 overflow-x-auto">
															{openTabs.map((tab) => {
																const active = tab === activeFile;
																return (
																	<div
																		key={tab}
																		className={cn(
																			"group flex items-center gap-2 rounded-t-2xl border px-3 py-2 text-sm",
																			active
																				? "border-white/10 border-b-[#11182d] bg-[#101822] text-white"
																				: "border-transparent bg-white/[0.03] text-slate-400 hover:text-white",
																		)}
																	>
																		<button
																			onClick={() => openFile(tab)}
																			className="truncate text-left"
																		>
																			{tab.split("/").slice(-1)[0]}
																		</button>
																		<button
																			onClick={() => closeTab(tab)}
																			className="rounded-md p-0.5 text-slate-500 transition hover:bg-white/[0.08] hover:text-white"
																		>
																			<X className="h-3.5 w-3.5" />
																		</button>
																	</div>
																);
															})}
														</div>

														<div className="hidden items-center gap-2 xl:flex">
															<button
																title="Export file" onClick={exportCurrentFile}
																className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.07]"
															><Download className="h-3.5 w-3.5" /><span className="sr-only">Export File</span></button>
															<button
																title="Rename file" onClick={() => startRename(activeFile)}
																className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.07]"
															><Wand2 className="h-3.5 w-3.5" /><span className="sr-only">Rename</span></button>
															<button
																title="Delete file" onClick={() => deletePath(activeFile)}
																className="rounded-md border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"
															><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete</span></button>
														</div>
													</div>
												</div>

												<div className="flex items-center justify-between border-b border-white/10 bg-[#101822] px-4 py-2.5">
													<div>
														<div className="text-sm font-semibold text-slate-100">
															{activeFile}
														</div>
														<div className="text-xs text-slate-400">
															{getLanguageFromPath(activeFile)} 																													</div>
													</div>

													<div className="flex items-center gap-2">
														<ToolbarButton disabled={busy}
															icon={Copy}
															label="Copy"
															onClick={() =>
																navigator.clipboard?.writeText(currentCode)
															}
														/>
														<ToolbarButton disabled={busy}
															icon={Trash2}
															label="Clear"
															onClick={() => updateCode("")}
															danger
														/>
													</div>
												</div>

												{buildPhase && <div className="build-progress" role="status"><Loader2 size={18} className="animate-spin" /><div><strong>{buildPhase}…</strong><span>Editing is paused. Follow compiler output in the Console below.</span></div></div>}
                        {activeFile ? (
													<CodeEditor readOnly={Boolean(buildPhase)} onOpenFile={openFile} diagnostics={diagnostics} files={files} activeFile={activeFile} editorRef={editorRef} onChange={(path, value) => {
                              try { setFiles(validateFiles({ ...sourceRef.current, [path]: value })); markDirty(); }
                              catch (error) { pushLog('warning', error.message); }
                            }} />
												) : (
													<div className="flex min-h-0 flex-1 items-center justify-center bg-[#0d141f]">
														<div className="text-center text-slate-500">
															<div className="text-sm">No file open</div>
															<div className="mt-1 text-xs">
																Select a file from the explorer
															</div>
														</div>
													</div>
												)}

											</div>
										</Panel>

										{!rightCollapsed && (
											<>
												<ResizeHandle />
												<Panel
													defaultSize="26%"
													minSize="16%"
													maxSize="40%"
													className="min-h-0"
												>
													<div className="flex h-full min-h-0 flex-col bg-[#101822]">
														<div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
															<div>
																<div className="text-sm font-semibold text-slate-100">
																	Workbench
																</div>
																<div className="text-xs text-slate-400">

																</div>
															</div>
															<button
																aria-label="Hide workbench" title="Hide workbench" onClick={() => setRightCollapsed(true)}
																className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
															>
																<PanelRight className="h-4 w-4" />
															</button>
														</div>

														<div className="workbench-tabs">
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
																		"inline-flex items-center justify-center gap-2 rounded-md border px-2 py-2 text-xs font-medium capitalize transition",
																		rightTab === key
																			? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
																			: "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]",
																	)}
																>
																	<Icon className="h-4 w-4" />
																	{key}
																</button>
															))}
														</div>

														<div className="workbench-content min-h-0 flex-1 overflow-auto p-4">
															{rightTab === "assistant" && (
                                <div className="space-y-4">
                                  <div className="assistant-intro"><div className="assistant-heading"><TerminalSquare size={17} /><h2>Contract assistant</h2><span className="preview-badge">AI</span></div><p>Explain errors, review code, or write tests.</p></div>

                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                                    <div className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                                      Context
                                    </div>
                                    <select
                                      value={selectedContext}
                                      onChange={(e) =>
                                        setSelectedContext(e.target.value)
                                      }
                                      className="w-full rounded-md border border-white/10 bg-[#0d141f] px-3 py-2 text-sm text-white outline-none"
                                    >
                                      <option className="bg-slate-900">
                                        Current file
                                      </option>
                                      <option className="bg-slate-900">
                                        Whole project
                                      </option>
                                      <option className="bg-slate-900">
                                        Tests only
                                      </option>
                                      <option className="bg-slate-900">
                                        Audit config
                                      </option>
                                    </select>
                                    <textarea
                                      value={prompt}
                                      onChange={e => setPrompt(e.target.value)}
                                      placeholder="Ask anything about your contract, tests, or network simulation..." aria-label="Assistant prompt"
                                      className="mt-3 h-36 w-full rounded-md border border-white/10 bg-[#0d141f] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                                    />
                                    <button onClick={askAssistant} disabled={busy || !prompt.trim()} className="mt-3 w-full rounded-md bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400">
                                      {busy ? "Working…" : "Ask Assistant"}
                                    </button>
                                  </div>
                                </div>
                              )}
{rightTab === 'assistant' && suggestion && <div className="mt-4 space-y-3">
                                <p className="whitespace-pre-wrap text-sm">{suggestion.answer}</p>
                                {suggestion.path && <>
                                  <p className="text-xs">Review proposed change: {suggestion.path}</p>
                                  <div><details><summary>Original source</summary><pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs">{suggestionOriginal}</pre></details><pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-emerald-950/30 p-2 text-xs">{suggestion.content}</pre></div>
                                  {files[suggestion.path] !== suggestionOriginal && <p role="alert">File changed since this suggestion. Request a new suggestion before applying.</p>}
                                  <button className="ide-button" disabled={busy || files[suggestion.path] !== suggestionOriginal} onClick={() => {
                                    if (files[suggestion.path] !== suggestionOriginal) { setStatus('File changed since this suggestion. Ask again before applying.'); return; }
                                    try { setFiles(validateFiles({ ...files, [suggestion.path]: suggestion.content })); }
                                    catch (error) { setStatus(error.message); return; }
                                    openFile(suggestion.path); markDirty(); setSuggestion(null); setStatus('Suggestion applied. Build and test to verify.');
                                  }}>Apply reviewed change</button>
                                  <button className="ide-button" onClick={() => setSuggestion(null)}>Dismiss</button>
                                </>}
                              </div>}

															{rightTab === "debug" && (
                                <div className="space-y-4">
                                  <p className="text-sm">Compiler diagnostics</p>
                                  {diagnostics.length ? diagnostics.map((item, index) => <button key={index} className="ide-button block w-full text-left" onClick={() => openFile(item.path)}>{item.path}:{item.line}:{item.column} — {item.message}</button>) : <p className="text-xs text-slate-400">Build or test to collect compiler diagnostics.</p>}
                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <div className="text-sm font-semibold text-white">
                                          Debug Session
                                        </div>
                                        <div className="mt-1 text-xs text-slate-400">
                                          {debugPaused
                                            ? "Paused on breakpoint"
                                            : "Step debugging is not connected"}
                                        </div>
                                      </div>
                                      {debugPaused ? (
                                        <button
                                          onClick={resumeDebug}
                                          className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950"
                                        >
                                          <Play className="h-4 w-4" />
                                          Resume
                                        </button>
                                      ) : (
                                        <button
                                          onClick={startDebug}
                                          className="inline-flex items-center gap-2 rounded-md bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950"
                                        >
                                          <PauseCircle className="h-4 w-4" />
                                          Diagnostics
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                                    <div className="text-sm font-semibold text-white">
                                      Breakpoints
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {breakpoints.length ? (
                                        breakpoints.map((line) => (
                                          <span
                                            key={line}
                                            className="rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
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
                                </div>
                              )}

															{rightTab === "accounts" && (
                                <div className="space-y-4">
                                  <label className="ide-button inline-flex">Import key<input type="file" accept="application/json" className="hidden" disabled={busy} onChange={importKey} /></label>
                                  <button
                                    disabled={busy} onClick={generateAddress}
                                    className="w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
                                  >
                                    Generate New Test Address
                                  </button>

                                  <p className="text-xs text-slate-400">New test accounts are funded automatically on the selected network. Keys stay in memory until you reload or close this tab. Exported keys are unencrypted and intended for test networks.</p>
                                  <div className="space-y-3">
                                    {generatedAddresses.map((item) => (
                                      <div
                                        key={item.id}
                                        className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
                                      >
                                        <div className="flex items-start justify-between gap-3">
                                          <div className="min-w-0">
                                            <div className="text-sm font-semibold text-white">
                                              {item.label}
                                            </div>
                                            <div className="text-xs text-slate-400">{item.funding ? 'Funding…' : item.fundedNetworks?.includes(network) ? `Funded on ${activeNetwork.label}` : `Funding not verified on ${activeNetwork.label}`}</div>
                                            <div className="my-2 flex flex-wrap gap-2">
                                              <button disabled={busy || !activeNetwork.friendbot} className="ide-button" onClick={() => runOperation('Funding', async () => { await fundAccount(activeNetwork, item.address); setGeneratedAddresses(previous => previous.map(account => account.address === item.address ? {...account, fundedNetworks: [...new Set([...(account.fundedNetworks || []), network])]} : account)); pushLog('success', `Account funded on ${activeNetwork.label}: ${item.address}`); })}>Fund</button>
                                              <button className="ide-button" onClick={() => exportKey(item.address)}>Export key</button>
                                              <button disabled={busy} className="ide-button" onClick={() => { setSignerAddress(item.address); setBottomTab('deploy'); }}>Use account</button>
                                            </div>
                                            <div className="mt-1 break-all text-xs text-slate-400">
                                              {item.address}
                                            </div>
                                          </div>
                                          <button
                                            onClick={() =>
                                              navigator.clipboard?.writeText(
                                                item.address
                                              )
                                            }
                                            className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-300"
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
																		className="w-full rounded-lg bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
																	>
																		Run source checks
																	</button>

																	{auditChecks.map((check) => (
																		<div
																			key={check.name}
																			className="rounded-lg border border-white/10 bg-white/[0.03] p-4"
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
																							: "bg-amber-500/10 text-amber-300",
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
													</div>
												</Panel>
											</>
										)}

										{rightCollapsed && (
											<>
												<ResizeHandle />
												<Panel
													defaultSize="4%"
													minSize="4%"
													maxSize="6%"
													className="border-l border-white/10 bg-[#101822]"
												>
													<div className="flex h-full items-start justify-center pt-4">
														<button
															aria-label="Show workbench" title="Show workbench" onClick={() => setRightCollapsed(false)}
															className="rounded-md border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
														>
															<PanelLeft className="h-4 w-4" />
														</button>
													</div>
												</Panel>
											</>
										)}
									</Group>
								</Panel>

								<ResizeHandle vertical />

								<Panel
									panelRef={deploymentPanelRef}
                                    defaultSize="18%"
									minSize="14%"
									maxSize="60%"
									className="min-h-0 border-t border-white/10 bg-[#0d141f]"
								>

									<div className="flex h-full min-h-0 flex-col">
										<div className="flex flex-wrap items-center gap-2 border-b border-white/10 px-4 py-3">
											{[
												["console", TerminalSquare],
												["tests", FlaskConical],
												["debug", Bug],
												["deploy", Rocket],
											].map(([key, Icon]) => {
												const isActive = bottomTab === key;

												return (
													<button
														key={key}
														type="button"
														onClick={() => setBottomTab(key)}
														className={cn(
															"inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium capitalize transition",
															isActive
																? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
																: "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white",
														)}
														aria-pressed={isActive}
													>
														<Icon className="h-4 w-4" />
														{key}
													</button>
												);
											})}

											<div className="ml-auto flex items-center gap-2">
												{bottomTab === "console" && (
													<button
														type="button"
														onClick={clearTerminalLogs}
														disabled={!terminal.length}
														className={cn(
															"inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-medium transition",
															terminal.length
																? "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
																: "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600",
														)}
													>
														<Trash2 className="h-3.5 w-3.5" />
														Clear logs
													</button>
												)}

												<div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
													<GripVertical className="h-4 w-4" />

												</div>
											</div>
										</div>

										<div className="min-h-0 flex-1 overflow-hidden">
											{bottomTab === "console" && (
												<div className="console-output flex h-full min-h-0 flex-col">


													<div ref={consoleScroll} className="min-h-0 flex-1 overflow-y-auto p-4">
														{terminal.length === 0 ? null : (
															<div className="space-y-2 font-mono text-sm">
																{terminal.map((entry, index) => {
																	const type = entry?.type || "info";

																	return (
																		<div
																			key={`${entry?.text || "log"}-${index}`}
																			className={cn(
																				"rounded-md border px-3 py-2.5 leading-6 shadow-sm",
																				type === "success"
																					? "border-emerald-400/10 bg-emerald-500/10 text-emerald-300"
																					: type === "warning"
																						? "border-amber-400/10 bg-amber-500/10 text-amber-300"
																						: type === "error"
																							? "border-rose-400/10 bg-rose-500/10 text-rose-300"
																							: "border-white/5 bg-white/[0.03] text-slate-300",
																			)}
																		>
																			<div className="whitespace-pre-wrap break-words">
																				{entry?.text || ""}
																			</div>
																		</div>
																	);
																})}
															</div>
														)}
													</div>

												</div>
											)}

											{bottomTab === "tests" && (
												<div className="h-full overflow-y-auto p-4">
													<div className="space-y-3">
														{tests.map((test) => (
															<div
																key={test.id}
																className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4"
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
																				: "bg-rose-500/10 text-rose-300",
																	)}
																>
																	{test.status}
																</span>
															</div>
														))}
													</div>
												</div>
											)}

											{bottomTab === "debug" && (
                        <div className="grid gap-3 md:grid-cols-3">
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-sm font-semibold text-white">
                              Execution Frame
                            </div>
                            <div className="mt-3 text-sm text-slate-300">
                              Run tests or simulate a call to inspect real errors.
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-sm font-semibold text-white">
                              Current Breakpoint
                            </div>
                            <div className="mt-3 text-sm text-slate-300">
                              {breakpoints[0]
                                ? `Line ${breakpoints[0]}`
                                : "None"}
                            </div>
                          </div>
                          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                            <div className="text-sm font-semibold text-white">
                              Debugger State
                            </div>
                            <div className="mt-3 text-sm text-slate-300">
                              {"Step debugging unavailable"}
                            </div>
                          </div>
                        </div>
                      )}

											{bottomTab === "deploy" && (
                        <DeploymentPanel network={activeNetwork.label}>

                            <section className="deployment-card" aria-label="Deployment account">
                            <label>Transaction signer
                              <select aria-label="Transaction signer" title={signerAddress} value={signerAddress} disabled={busy} onChange={e => setSignerAddress(e.target.value)} className="ide-input">
                                <option value="">Select a funded account</option>
                                {walletSelectable && <option value={walletAddress}>{walletName}: {walletAddress.slice(0, 6)}…{walletAddress.slice(-6)}</option>}
                                {generatedAddresses.map(item => <option key={item.id} value={item.address}>{item.label}{item.fundedNetworks?.includes(network) ? ' (funded)' : ''}: {item.address.slice(0, 6)}…{item.address.slice(-6)}</option>)}
                              </select>
                            </label>
<p className="deployment-hint">{signerSummary}</p>{network === 'sandbox' && !walletSelectable && <p className="deployment-hint">Use a generated or imported account for Local Sandbox. Connected wallets appear here only when their integration supports this network. Freighter must use its standalone custom network.</p>}<details className="account-tools" open={!signer}><summary>Manage accounts</summary><div className="deployment-actions">                            <button className="ide-button" disabled={busy} onClick={connectWallet}>{walletConnected ? 'Disconnect wallet' : 'Connect wallet'}</button>
                            <button className="ide-button" disabled={busy || network === 'mainnet'} onClick={generateAddress}>Generate test account</button>
                            <button className="ide-button" disabled={busy || !signer?.secret} onClick={() => exportKey(signerAddress)}>Export selected key</button>
                            <label className="ide-button">Import account<input aria-label="Import account key" type="file" accept="application/json" className="hidden" disabled={busy} onChange={importKey} /></label>
</div>
<div className="deployment-advanced">                          <div className="flex flex-wrap items-center gap-2">
                            <button disabled={busy || !signer || !activeNetwork.friendbot} className="ide-button" onClick={fundSelectedAccount}>Fund selected account</button>
                            <button disabled={busy || !signer} className="ide-button" onClick={checkSelectedAccount}>Check account</button>

                          </div>
</div></details>
                            {accountStatus && accountStatus !== signerSummary && <p className="deployment-hint" role="status">{accountStatus}</p>}
                            </section>
                          <details className="deployment-preparation" open={!contractId}><summary>{contractId ? 'Deploy another contract' : 'Prepare deployment'}</summary>
                          <div className="deployment-setup">
                            <section className="deployment-card" aria-label="Contract deployment"><div className="deployment-contract-selectors">
                            <label>Build target
                              <select aria-label="Build target" value={selectedManifest} disabled={busy} onChange={e => setManifest(e.target.value)} className="ide-input">
                                {!selectedManifest && <option value="">Import a Cargo.toml</option>}
                                {manifestPaths(files).map(path => <option key={path}>{path}</option>)}
                              </select>
                            </label>
                            <label>WASM artifact {selectedArtifact?.uploaded ? '(uploaded)' : artifacts.length > 0 && !buildCurrent && '(sources changed)'}
                              <select aria-label="WASM artifact" value={artifactName} disabled={busy} onChange={e => { setArtifactName(e.target.value); setConstructorArgs('[]'); setManualConstructor(false); }} className="ide-input">
                                {!artifacts.length && <option value="">Upload WASM or compile</option>}
                                {artifacts.map(item => <option key={item.name}>{item.name}</option>)}
                              </select>
                            </label>
</div><div className="deployment-actions">                            <label className="ide-button">Upload WASM<input aria-label="Upload WASM" type="file" accept=".wasm,application/wasm" className="hidden" disabled={busy} onChange={uploadWasm} /></label>
<button className="ide-button" disabled={busy || !selectedManifest} onClick={() => compileProject({forDeployment:true})}>{selectedArtifact && !deployable ? 'Recompile contract' : 'Compile contract'}</button></div>
                          {selectedArtifact && (constructorMethod || !selectedSpec) && <details open={constructorMethod || undefined} className="constructor-options"><summary className="cursor-pointer font-medium">Constructor arguments{constructorMethod ? '' : ' (optional)'}</summary>
                            {constructorMethod && <button className="ide-button my-2" disabled={busy} onClick={() => { setManualConstructor(!manualConstructor); setConstructorArgs(manualConstructor ? null : '[]'); }}>{manualConstructor ? 'Use constructor inputs' : 'Use typed constructor arguments'}</button>}
                            {constructorMethod && !manualConstructor ? <ContractArguments key={artifactName} spec={selectedSpec} method="__constructor" label="Constructor argument" onChange={setConstructorArgs} disabled={busy} /> : <textarea aria-label="Typed constructor arguments" className="ide-input font-mono" disabled={busy} value={constructorArgs || ''} onChange={event => setConstructorArgs(event.target.value)} placeholder="[]" />}
                          </details>}
                          <div className="deployment-submit-actions">
                            <button aria-describedby="deployment-readiness" disabled={Boolean(deploymentBlocker)} onClick={deployContract} className="ide-button deployment-primary">Deploy selected WASM</button>
                            <button disabled={!selectedArtifact} className="ide-button" onClick={() => {
                              const bytes = Uint8Array.from(atob(selectedArtifact.wasm), char => char.charCodeAt(0));
                              const url = URL.createObjectURL(new Blob([bytes], { type: 'application/wasm' }));
                              const link = document.createElement('a'); link.href = url; link.download = selectedArtifact.name; link.click(); URL.revokeObjectURL(url);
                            }}>Download WASM</button>
                          </div>
                            </section>
                            <section className="deployment-status" aria-label="Deployment status"><h3>Deployment status</h3>
                          {deploymentFeedback && <div className={`deployment-feedback ${deploymentFeedback.error ? 'is-error' : ''}`} role={deploymentFeedback.error ? 'alert' : 'status'}>{busy && <Loader2 size={16} className="animate-spin" />}<span>{deploymentFeedback.text}</span></div>}
                          <p id="deployment-readiness" className={`deployment-readiness ${deploymentBlocker ? '' : 'is-ready'}`} role="status">{deploymentBlocker || `Ready to deploy ${selectedArtifact?.name} on ${activeNetwork.label}.`}</p>
                            {deploymentFeedback?.success && <ExplorerLink network={deploymentFeedback.network} hash={deploymentFeedback.hash} label="View deployment in explorer"/>}
                            {!deploymentFeedback && <p className="deployment-hint">{deploymentBlocker ? 'Prepare the contract on the left. Progress and the deployed address will appear here.' : 'Review the contract and selected account, then deploy. You will confirm before any transaction is submitted.'}</p>}
                            </section>
                          </div></details>
                          <details ref={interactionPanel} open={Boolean(contractId)} className="deployment-card deployment-interaction" aria-label="Contract interaction"><summary className="interaction-summary">{contractId ? "Contract functions" : "Interact with an existing contract"}</summary>{contractId && <p className="deployment-hint">{deploymentFeedback?.success ? "Deployed successfully. " : ""}Choose a function and enter its arguments.</p>}
                          <div className="interaction-contract">
                            <label>Contract ID<input aria-label="Contract ID" className="ide-input" value={contractId} disabled={busy} onChange={e => { setContractId(e.target.value.trim()); setCallSpec(null); setInteractionResult(''); }} placeholder="C…" /></label>

                          </div>
                          <div className="function-workspace"><div className="function-form">
                            <label>Function{callableMethods.length ? <select aria-label="Function" className="ide-input" value={method} disabled={busy} onChange={e => { setMethod(e.target.value); setArgs(null); setInteractionResult(''); }}>{callableMethods.map(name => <option key={name}>{name}</option>)}</select> : <input aria-label="Function" className="ide-input" value={method} disabled={busy} onChange={e => setMethod(e.target.value)} />}</label>
                          <div className="flex flex-wrap gap-2">
                            <button className="ide-button" disabled={busy || !contractId} onClick={loadContractInterface}>Load contract functions</button>
                            {callSpec && <button className="ide-button" disabled={busy} onClick={() => { setManualArgs(!manualArgs); setArgs(manualArgs ? null : '[]'); }}>{manualArgs ? 'Use function inputs' : 'Use typed arguments'}</button>}
                          </div>
                          {callSpec && !manualArgs && callableMethods.includes(method) ? <ContractArguments key={`${contractId}:${method}`} spec={callSpec} method={method} onChange={setArgs} disabled={busy} /> : <label className="block">Typed arguments (JSON array)
                            <textarea aria-label="Typed arguments" className="ide-input font-mono" value={args || ''} disabled={busy} onChange={e => setArgs(e.target.value)} placeholder={'[{"type":"i32","value":1}]'} />
                          </label>}
                          <p className="text-xs text-slate-400">Simulate previews a result. Invoke submits a transaction.</p>
                          <div className="flex gap-2">
                            <button className="ide-button" disabled={busy || !contractId || !signer || !method || !args} onClick={simulateInvoke}>Simulate</button>
                            <button className="ide-button" disabled={busy || !contractId || !signer || !method || !args || (network === 'mainnet' && signer.secret)} onClick={invokeContract}>Sign and invoke</button>
                          </div>
                          </div><div ref={outputPanel}><InteractionOutput state={interactionState} result={interactionResult} network={network} /></div></div>
                          </details>
                        </DeploymentPanel>
                      )}
										</div>
									</div>
								</Panel>
							</Group>
						</Panel>
					</Group>
				</div>

				<footer className="workspace-footer"><span><span className="status-dot" />Local workspace<span className="footer-separator">/</span>{Object.keys(files).length} files</span><span><span className="hidden sm:inline">{activeFile ? getLanguageFromPath(activeFile) : 'No file selected'}<span className="footer-separator">/</span></span>{activeNetwork.label}</span></footer>

                {showWalletDialog && <WalletDialog network={activeNetwork} onDecision={wallet => { setShowWalletDialog(false); walletDecision.current?.(wallet); walletDecision.current = null; }} />}
                {confirmation && <ConfirmDialog request={confirmation} onDecision={resolveConfirmation} />}
				<SourceExamplesModal
					open={showExamplesModal}
					onClose={() => setShowExamplesModal(false)}
					title="Load Soroban Project"
					examples={examples?.filter(
						(e) => e.path !== ".github" && e.path !== ".devcontainer",
					)}
					loadingExamples={loadingExamples}
                    examplesError={examplesError}
                    onRetryExamples={loadExamples}
					exampleBaseUrl={`https://github.com/stellar/soroban-examples/tree/${EXAMPLES_REF}`}
					onLoadExample={(example) => loadExampleFolder(example.path)}
					onLoadGithubRepo={loadGithubRepository}
				/>

				<Modal
					open={showNewFileModal}
					title="Create File"
					description="Enter a relative path such as contracts/counter/src/math.rs"
					value={newFilePath}
					setValue={setNewFilePath}
					onClose={() => setShowNewFileModal(false)}
					onConfirm={() => createFile(newFilePath)}
					confirmLabel="Create"
				/>

				<Modal
					open={showNewFolderModal}
					title="Create Folder"
					description="Enter a relative path such as contracts/counter/src/helpers"
					value={newFolderPath}
					setValue={setNewFolderPath}
					onClose={() => setShowNewFolderModal(false)}
					onConfirm={() => createFolder(newFolderPath)}
					confirmLabel="Create"
				/>

				<Modal
					open={showRenameModal}
					title="Rename Item"
					description="Only the last segment will be changed. Files inside folders move with the rename."
					value={renameValue}
					setValue={setRenameValue}
					onClose={() => setShowRenameModal(false)}
					onConfirm={applyRename}
					confirmLabel="Rename"
				/>

				{showCommandPalette && (
					<div className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20">
						<div className="w-full max-w-2xl rounded-lg border border-white/10 bg-[#101822] shadow-2xl">
							<div className="border-b border-white/10 p-4">
								<div className="flex items-center gap-3 rounded-lg border border-white/10 bg-[#0d141f] px-4 py-3">
									<Search className="h-4 w-4 text-slate-500" />
									<input
										autoFocus
										value={commandQuery}
										onChange={(e) => setCommandQuery(e.target.value)}
										placeholder="Type a command or search files..."
										className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
									/>
									<button
										onClick={() => setShowCommandPalette(false)}
										className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
									>
										<X className="h-4 w-4" />
									</button>
								</div>
							</div>

							<div className="max-h-[420px]  overflow-auto p-3">
								{commandItems.map((item) => (
									<button
										key={item.label}
										onClick={() => {
											item.action();
											setShowCommandPalette(false);
											setCommandQuery("");
										}}
										className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
									>
										<span>{item.label}</span>
										<MoreHorizontal className="h-4 w-4 text-slate-500" />
									</button>
								))}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
