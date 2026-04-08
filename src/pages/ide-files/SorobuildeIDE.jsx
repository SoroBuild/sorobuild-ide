import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { Group, Panel } from "react-resizable-panels";
import {
  Play,
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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  networkOptions,
  starterAuditChecks,
  starterFiles,
  starterLogs,
  starterTests,
} from "../../utils/constant";
import {
  buildTree,
  cn,
  getLanguageFromPath,
  randomAddress,
} from "../../utils/lib";
import ResizeHandle from "../../components/ide-files/ResizeHandle";
import StatCard from "../../components/ide-files/StatCard";
import ToolbarButton from "../../components/ide-files/ToolBarButton";
import Modal from "../../components/ide-files/Modal";
import ExplorerNode from "../../components/ide-files/ExplorerNode";
import {
  clearProjectIdFromUrl,
  buildProject,
  downloadProjectAsFiles,
  getProjectIdFromUrl,
  uploadRawFilesAsZip,
  uploadProjectAsZip,
  updateUrlWithProjectId,
  deleteProject,
  fetchRepoTree,
} from "../../utils/api";
import { getExampleFolders } from "../../utils/lib";
import * as monaco from "monaco-editor";
import * as vscode from "vscode";
import SourceExamplesModal from "./SourceExamplesModal";
import { useStates } from "../../contexts/StatesContext";
import { Github } from "./components/CustomIcons";

export default function SorobuildeIDE() {
  const [ongoingProcess, setOngoingProcess] = useState("");
  const hasProjectInUrl = Boolean(
    new URLSearchParams(window.location.search).get("projectId")
  );

  const [activeFile, setActiveFile] = useState(
    hasProjectInUrl ? "" : "hello_world/src/lib.rs"
  );
  const [openTabs, setOpenTabs] = useState(
    hasProjectInUrl ? [] : ["hello_world/src/lib.rs"]
  );
  const [selectedPath, setSelectedPath] = useState(
    hasProjectInUrl ? "" : "hello_world/src/lib.rs"
  );
  const [expanded, setExpanded] = useState(
    hasProjectInUrl ? {} : { hello_world: true }
  );
  const [showExamplesModal, setShowExamplesModal] = useState(false);
  const [examples, setExamples] = useState([]);
  const [loadingExamples, setLoadingExamples] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [fileHandles, setFileHandles] = useState({});
  const [files, setFiles] = useState(starterFiles);
  const [workspaceName, setWorkspaceName] = useState("counter-workspace");
  // const [activeFile, setActiveFile] = useState("hello_world/src/lib.rs");
  // const [openTabs, setOpenTabs] = useState(["hello_world/src/lib.rs"]);
  const [fileQuery, setFileQuery] = useState("");
  // const [expanded, setExpanded] = useState({
  // 	hello_world: true,
  // });
  const [network, setNetwork] = useState("sandbox");
  const [walletConnected, setWalletConnected] = useState(false);
  const [topPanelCollapsed, setTopPanelCollapsed] = useState(false);
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
  const [terminal, setTerminal] = useState(starterLogs);
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
  const [workspaceDirty, setWorkspaceDirty] = useState(false);
  // const [selectedPath, setSelectedPath] = useState("hello_world/src/lib.rs");
  const [dragActive, setDragActive] = useState(false);

  const {
    showNewFileModal,
    setShowNewFileModal,
    showNewFolderModal,
    setShowNewFolderModal,
  } = useStates();
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newFilePath, setNewFilePath] = useState(
    "contracts/counter/src/new_file.rs"
  );
  const [newFolderPath, setNewFolderPath] = useState(
    "contracts/counter/src/utils"
  );
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const clearTerminalLogs = () => {
    setTerminal([]);
  };
  useEffect(() => {
    if (!selectedPath) return;
    if (files[selectedPath]) {
      const parts = selectedPath.split("/");
      parts.pop();
      const dir = parts.join("/") || workspaceName;
      setNewFilePath(`${dir}/new_file.rs`);
      setNewFolderPath(`${dir}/new_folder`);
    } else if (
      Object.keys(files).some((k) => k.startsWith(selectedPath + "/"))
    ) {
      setNewFilePath(`${selectedPath}/new_file.rs`);
      setNewFolderPath(`${selectedPath}/new_folder`);
    }
  }, [selectedPath, files, workspaceName]);

  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");

  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  monaco.editor.defineTheme("sorobuild-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "", foreground: "D1D5DB" }, // default text (slate-300)
      { token: "keyword", foreground: "22D3EE" }, // cyan
      { token: "string", foreground: "A7F3D0" }, // emerald
      { token: "number", foreground: "FDE68A" }, // yellow
      { token: "comment", foreground: "64748B", fontStyle: "italic" }, // slate-500
      { token: "type.identifier", foreground: "93C5FD" }, // blue
    ],
    colors: {
      "editor.background": "#0e1528",
      //   "editor.background": "#0f1629", // match your UI
      //   "editor.background": "#11182d", // match your UI
      "editor.foreground": "#D1D5DB",
      "editorCursor.foreground": "#22D3EE",
      "editor.lineHighlightBackground": "#1a2240",
      "editorLineNumber.foreground": "#475569",
      "editorLineNumber.activeForeground": "#E2E8F0",

      "editor.selectionBackground": "#22D3EE22",
      "editor.inactiveSelectionBackground": "#22D3EE11",

      "editorIndentGuide.background": "#1f2937",
      "editorIndentGuide.activeBackground": "#334155",

      "editorWhitespace.foreground": "#1e293b",
    },
  });

  const mountEditor = (node) => {
    if (!node || editorRef.current) return;

    monaco.editor.setTheme("sorobuild-dark");

    editorRef.current = monaco.editor.create(node, {
      model: monaco.editor.createModel(
        "",
        "rust",
        vscode.Uri.file(`app/src/main.rs`)
      ),
      theme: "sorobuild-dark",
      automaticLayout: true,
      fontSize: 13,
      fontFamily: "JetBrains Mono, monospace",
      minimap: { enabled: false },
      smoothScrolling: true,
      cursorSmoothCaretAnimation: "on",
      padding: { top: 10, bottom: 10 },
    });
  };

  //   const mountEditor = (node) => {
  //     if (!node || editorRef.current) return;

  //     editorRef.current = monaco.editor.create(node, {
  //       model: monaco.editor.createModel(
  //         "",
  //         "rust",
  //         vscode.Uri.file(`app/src/main.rs`)
  //       ),
  //       theme: "vs-dark",
  //       automaticLayout: true,
  //     });
  //   };

  const activeNetwork =
    networkOptions.find((item) => item.value === network) || networkOptions[0];

  const pushLog = (type, text) => {
    setTerminal((prev) => [...prev, { type, text }]);
  };

  const markDirty = () => setWorkspaceDirty(true);

  useEffect(() => {
    if (!editorRef.current || !activeFile) return;
    const currentCode = files[activeFile] ?? "";
    const model = editorRef.current.getModel();
    if (model) {
      model.setValue(currentCode);
    }
  }, [activeFile, files]);

  const loadExamples = async () => {
    setLoadingExamples(true);
    try {
      const tree = await fetchRepoTree();
      const folders = getExampleFolders(tree);
      setExamples(folders);
    } catch {
      pushLog("warning", "Failed to load examples.");
    } finally {
      setLoadingExamples(false);
    }
  };

  useEffect(() => {
    const loadFromUrl = async () => {
      const id = getProjectIdFromUrl();
      if (!id) return;

      setLoading(true);
      try {
        const loadedFiles = await downloadProjectAsFiles(id);
        setProjectId(id);
        setFiles(loadedFiles);

        const filePaths = Object.keys(loadedFiles);
        const rootFolder = filePaths[0]?.split("/")[0] || "imported-workspace";

        const firstSrcFile =
          filePaths.find((p) => p.includes("/src/") && p.endsWith(".rs")) ||
          filePaths.find((p) => p.endsWith(".rs")) ||
          filePaths[0];

        setWorkspaceName(rootFolder);
        setExpanded({ [rootFolder]: true });

        if (firstSrcFile) {
          setActiveFile(firstSrcFile);
          setSelectedPath(firstSrcFile);
          setOpenTabs([firstSrcFile]);
        }

        setStatus("Project loaded");
        pushLog("success", `Project loaded.`);
      } catch {
        pushLog("warning", "Failed to load project from URL.");
        clearProjectIdFromUrl();
      } finally {
        setLoading(false);
      }
    };

    loadFromUrl();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (projectId) {
        deleteProject(projectId); // keepalive fetch inside deleteProject
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [projectId]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // saveWorkspaceBundle();
        saveToBackend();
      }
      if (e.key === "Escape") {
        setShowCommandPalette(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      editorRef.current?.layout?.();
    });
    if (document.body) observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const resolveAllFileContents = async () => {
    const resolved = {};
    for (const [path, content] of Object.entries(files)) {
      if (content) {
        resolved[path] = content;
      } else if (fileHandles[path]) {
        resolved[path] = await fileHandles[path].text();
      } else {
        resolved[path] = "";
      }
    }
    // Update files state so resolved content is cached
    setFiles(resolved);
    return resolved;
  };

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
  // const editorLines = currentCode.split("\n");

  const commandItems = useMemo(() => {
    const items = [
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
  }, [commandQuery, files]);

  const ensureTab = (path) => {
    setOpenTabs((prev) => (prev.includes(path) ? prev : [...prev, path]));
  };

  const openFile = async (path) => {
    if (!(path in files)) return;

    if (!files[path] && fileHandles[path]) {
      const content = await fileHandles[path].text();
      setFiles((prev) => ({ ...prev, [path]: content }));
    }

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
    setFiles((prev) => ({ ...prev, [activeFile]: value }));
    setStatus("Editing...");
    markDirty();
  };

  const createFile = (path) => {
    const clean = path.trim();
    if (!clean) return;

    let targetDir = workspaceName;
    if (selectedPath && files[selectedPath]) {
      const parts = selectedPath.split("/");
      parts.pop();
      targetDir = parts.join("/") || workspaceName;
    } else if (
      selectedPath &&
      Object.keys(files).some((k) => k.startsWith(selectedPath + "/"))
    ) {
      targetDir = selectedPath;
    }

    const fullPath =
      clean.includes("/") || clean.startsWith(targetDir)
        ? clean
        : `${targetDir}/${clean}`;

    if (files[fullPath]) {
      openFile(fullPath);
      return;
    }

    setFiles((prev) => ({ ...prev, [fullPath]: "" }));
    setActiveFile(fullPath);
    setSelectedPath(fullPath);
    ensureTab(fullPath);
    setShowNewFileModal(false);
    setStatus(`Created ${fullPath}`);
    markDirty();
    pushLog("success", `Created file ${fullPath}`);
  };

  const createFolder = (path) => {
    const clean = path.replace(/\/$/, "").trim();
    if (!clean) return;

    let targetDir = workspaceName;
    if (selectedPath && files[selectedPath]) {
      const parts = selectedPath.split("/");
      parts.pop();
      targetDir = parts.join("/") || workspaceName;
    } else if (
      selectedPath &&
      Object.keys(files).some((k) => k.startsWith(selectedPath + "/"))
    ) {
      targetDir = selectedPath;
    }

    const fullPath =
      clean.includes("/") || clean.startsWith(targetDir)
        ? clean
        : `${targetDir}/${clean}`;

    setSelectedPath(fullPath);
    setStatus(`Created folder ${fullPath}`);
    markDirty();
    pushLog("success", `Created folder ${fullPath}`);

    setShowNewFolderModal(false);
  };

  const deletePath = (path) => {
    const prefix = `${path}/`;
    const next = {};

    Object.entries(files).forEach(([filePath, content]) => {
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
      if (fallback) {
        setActiveFile(fallback);
        setSelectedPath(fallback);
      }
    }

    setStatus(`Deleted ${path}`);
    markDirty();
    pushLog("warning", `Removed ${path}`);
  };

  console.log("the examples", examples);
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

    const next = {};
    Object.entries(files).forEach(([filePath, content]) => {
      if (filePath === oldPrefix) next[target] = content;
      else if (filePath.startsWith(prefix))
        next[filePath.replace(prefix, `${target}/`)] = content;
      else next[filePath] = content;
    });

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

    setWorkspaceDirty(false);
    setStatus("Workspace exported");
    pushLog("success", "Workspace exported as JSON bundle.");
  };

  const saveToBackend = async () => {
    try {
      setStatus("Saving...");
      pushLog("info", "Saving project to backend...");

      const resolvedFiles = await resolveAllFileContents();

      if (projectId) {
        await deleteProject(projectId);
      }

      const { projectId: newId } = await uploadProjectAsZip(resolvedFiles);
      setProjectId(newId);
      updateUrlWithProjectId(newId);
      setWorkspaceDirty(false);
      setStatus("Saved");
      pushLog("success", "Project saved successfully.");
    } catch {
      setStatus("Save failed");
      pushLog("warning", "Failed to save project.");
    }
  };

  // const saveToBackend = async () => {
  // 	try {
  // 		setStatus("Saving...");
  // 		pushLog("info", "Saving project to backend...");

  // 		if (projectId) {
  // 			await deleteProject(projectId);
  // 		}

  // 		const { projectId: newId } = await uploadProjectAsZip(files);
  // 		setProjectId(newId);
  // 		updateUrlWithProjectId(newId);
  // 		setWorkspaceDirty(false);
  // 		setStatus("Saved");
  // 		pushLog("success", "Project saved successfully.");
  // 	} catch {
  // 		setStatus("Save failed");
  // 		pushLog("warning", "Failed to save project.");
  // 	}
  // };

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
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.files || typeof parsed.files !== "object") {
        throw new Error("Invalid workspace file");
      }

      setWorkspaceName(
        parsed.workspaceName || parsed.name || "imported-workspace"
      );
      setFiles(parsed.files);

      const importedPaths = Object.keys(parsed.files);
      const srcFile = importedPaths.find(
        (path) => path.split("/")[1] === "src"
      );
      const defaultFile = srcFile || importedPaths[0] || "";

      if (defaultFile) {
        openFile(defaultFile);
      }

      setWorkspaceDirty(false);
      setStatus("Workspace imported");
      pushLog(
        "success",
        `Imported workspace bundle with ${
          Object.keys(parsed.files).length
        } files.`
      );
    } catch {
      setStatus("Import failed");
      pushLog("warning", "Failed to import workspace bundle.");
    }
  };

  const importFilesIntoWorkspace = async (incoming) => {
    setLoading(true);
    try {
      if (projectId) await deleteProject(projectId);

      const { projectId: newId } = await uploadRawFilesAsZip(incoming);
      updateUrlWithProjectId(newId);
      setProjectId(newId);

      const ignored = (path) =>
        path.startsWith("node_modules/") ||
        path.startsWith(".git/") ||
        path.endsWith(".gitkeep") ||
        path.includes("/.pnpm/") ||
        path.includes("/target/");

      const filtered = incoming.filter((item) => !ignored(item.path));

      const next = {};
      for (const item of filtered) {
        next[item.path] = "";
      }

      const rootFolder =
        filtered[0]?.path.split("/")[0] || "imported-workspace";

      // Find first .rs file inside a src folder
      const firstSrcFile = filtered.find(
        (item) => item.path.includes("/src/") && item.path.endsWith(".rs")
      );
      const firstFile =
        firstSrcFile ||
        filtered.find((item) => item.path.endsWith(".rs")) ||
        filtered[0];

      // Load the first file content eagerly
      if (firstFile) {
        next[firstFile.path] = await firstFile.file.text();
      }

      setFiles(next);
      setFileHandles(Object.fromEntries(filtered.map((i) => [i.path, i.file])));
      setWorkspaceName(rootFolder);
      setExpanded({ [rootFolder]: true });
      setWorkspaceDirty(false);

      // Clear all tabs and open only the first file
      setOpenTabs(firstFile ? [firstFile.path] : []);
      setActiveFile(firstFile?.path || "");
      setSelectedPath(firstFile?.path || "");

      setStatus("Workspace imported");
      pushLog("success", `Imported ${filtered.length} files.`);
    } catch {
      pushLog("warning", "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const addFilesToWorkspace = async (incoming) => {
    setLoading(true);
    try {
      const ignored = (path) =>
        path.startsWith("node_modules/") ||
        path.startsWith(".git/") ||
        path.endsWith(".gitkeep") ||
        path.includes("/.pnpm/") ||
        path.includes("/target/");

      const filtered = incoming.filter((item) => !ignored(item.path));

      let targetFolder = selectedPath;
      if (targetFolder && files[targetFolder]) {
        targetFolder = targetFolder.split("/").slice(0, -1).join("/");
      }
      const folderExists = Object.keys(files).some(
        (key) => key.startsWith(targetFolder + "/") || key === targetFolder
      );
      if (!targetFolder || !folderExists) {
        targetFolder = workspaceName;
      }

      const newFiles = {};
      const newFileHandles = {};
      for (const item of filtered) {
        const fileName = item.path.split("/").pop();
        const newPath = `${targetFolder}/${fileName}`;
        newFiles[newPath] = "";
        newFileHandles[newPath] = item.file;
      }

      // Resolve ALL file contents before uploading — existing unloaded files
      // and newly added files both need their content read
      const mergedHandles = { ...fileHandles, ...newFileHandles };
      const resolvedFiles = {};

      for (const [path, content] of Object.entries({ ...files, ...newFiles })) {
        if (content) {
          resolvedFiles[path] = content;
        } else if (mergedHandles[path]) {
          resolvedFiles[path] = await mergedHandles[path].text();
        } else {
          resolvedFiles[path] = "";
        }
      }

      // Upload the fully resolved files
      const filesToUpload = Object.entries(resolvedFiles).map(
        ([path, content]) => ({
          file: new Blob([content]),
          path,
        })
      );

      const urlProjectId = getProjectIdFromUrl();
      if (urlProjectId) {
        await deleteProject(urlProjectId);
      }

      const { projectId: newId } = await uploadRawFilesAsZip(filesToUpload);
      updateUrlWithProjectId(newId);
      setProjectId(newId);

      // Update state with resolved content so editor also shows it correctly
      setFiles(resolvedFiles);
      setFileHandles(mergedHandles);
      setExpanded((prev) => ({ ...prev, [targetFolder]: true }));
      setWorkspaceDirty(false);
      setStatus(
        `Added ${filtered.length} file${filtered.length > 1 ? "s" : ""}`
      );
      pushLog("success", `Added ${filtered.length} files to ${targetFolder}`);
    } catch (error) {
      pushLog("warning", "Failed to add files: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const readDirectoryEntries = async (entries) => {
    const collected = [];

    const walkEntry = async (entry, basePath = "") => {
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

    // If webkitRelativePath is set, it means a folder was selected via the
    // folder input — replace workspace. Otherwise it's individual files — add.
    const isFolder = selected.some((file) => file.webkitRelativePath);

    if (isFolder) {
      await importFilesIntoWorkspace(normalized);
    } else {
      await addFilesToWorkspace(normalized);
    }

    event.target.value = "";
  };

  const pickFolder = async () => {
    try {
      if (window.showDirectoryPicker) {
        const dir = await window.showDirectoryPicker();
        const entries = await readDirectoryEntries([dir]);
        const normalized = entries.map((item) => ({
          ...item,
          path: item.path,
        }));
        await importFilesIntoWorkspace(normalized); // always replace
      } else {
        folderInputRef.current?.click(); // fallback triggers handleUploadFiles
        // which will detect webkitRelativePath and call importFilesIntoWorkspace
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

        // If any handle is a directory, treat as folder replace
        const hasDirectory = handles.some((h) => h.kind === "directory");
        const imported = await readDirectoryEntries(handles);

        if (hasDirectory) {
          await importFilesIntoWorkspace(imported);
        } else {
          await addFilesToWorkspace(imported);
        }
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

    if (dropped.length) {
      // Same rule — if any file has a relative path, it came from a folder drop
      const hasFolder = dropped.some((f) => f.path.includes("/"));
      if (hasFolder) {
        await importFilesIntoWorkspace(dropped);
      } else {
        await addFilesToWorkspace(dropped);
      }
    }
  };

  const compileProject = async () => {
    setOngoingProcess("compile");
    if (!projectId) {
      pushLog("warning", "No project to compile. Upload a project first.");
      return;
    }

    setStatus("Compiling...");
    pushLog(
      "info",
      `Compiling project against ${activeNetwork.label} toolchain...`
    );

    try {
      const resolvedFiles = await resolveAllFileContents();
      const result = await buildProject(
        projectId,
        resolvedFiles,
        workspaceName
      );

      if (result.success) {
        setStatus("Compiled successfully");
        pushLog("success", result.output || "Build completed successfully");
      } else {
        setStatus("Compile failed");
        pushLog("warning", result.output || "Build failed");
      }
    } catch (error) {
      setStatus("Compile failed");
      pushLog("warning", error.message || "Build failed");
    } finally {
      setOngoingProcess("");
    }
  };

  // const compileProject = async () => {
  // 	if (!projectId) {
  // 		pushLog("warning", "No project to compile. Upload a project first.");
  // 		return;
  // 	}

  // 	setStatus("Compiling...");
  // 	pushLog(
  // 		"info",
  // 		`Compiling project against ${activeNetwork.label} toolchain...`,
  // 	);

  // 	try {
  // 		const result = await buildProject(projectId, files, workspaceName);
  // 		setStatus("Compiled successfully");
  // 		pushLog("success", result.output || "Build completed successfully");
  // 	} catch (error) {
  // 		setStatus("Compile failed");
  // 		pushLog("error", error.message || "Build failed");
  // 	}
  // };

  const runTests = () => {
    setStatus("Running tests...");
    pushLog("info", "Executing local contract test suite...");
    setTests((prev) =>
      prev.map((test, index) => ({
        ...test,
        status: "passed",
        duration: index === 0 ? "44ms" : index === 1 ? "19ms" : "38ms",
      }))
    );
    setTimeout(() => {
      setStatus("Tests passed");
      pushLog("success", "3/3 tests passed successfully.");
    }, 350);
  };

  const simulateInvoke = () => {
    setStatus("Simulating transaction...");
    pushLog("info", `Simulation started on ${activeNetwork.label}.`);
    setTimeout(() => {
      setStatus("Simulation complete");
      pushLog(
        "success",
        "Simulation complete. Result: Ok(1), estimated fee: 1243 stroops."
      );
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
      setStatus("Audit complete");
      pushLog(
        "warning",
        "Audit completed with 1 warning: missing explicit authorization check in privileged path."
      );
    }, 500);
  };

  const generateAddress = () => {
    const next = {
      id: Date.now(),
      label: `Generated ${generatedAddresses.length + 1}`,
      address: randomAddress(),
    };
    setGeneratedAddresses((prev) => [next, ...prev]);
    pushLog("success", `Generated test account ${next.address}`);
  };

  console.log("generated wallets", generatedAddresses);

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

  const loadExampleFolder = async (folderName) => {
    setLoading(true);

    try {
      const tree = await fetchRepoTree();

      const files = tree.filter(
        (item) => item.type === "blob" && item.path.startsWith(folderName + "/")
      );

      const normalized = [];

      for (const file of files) {
        const res = await fetch(file.url); // Git blob API
        const blobData = await res.json();

        const content = atob(blobData.content); // decode base64

        normalized.push({
          path: file.path,
          file: new File([content], file.path.split("/").pop() || "file"),
        });
      }

      await importFilesIntoWorkspace(normalized);

      setWorkspaceName(folderName);
      setShowExamplesModal(false);

      pushLog("success", `Loaded example: ${folderName}`);
    } catch (err) {
      pushLog("warning", "Failed to load example.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1020] p-1 h-screen text-white ">
      <div
        className={cn(
          "mx-auto flex h-full    flex-col overflow-hidden  border border-white/10 bg-[#11182d] shadow-[0_25px_80px_rgba(0,0,0,0.45)]",
          dragActive &&
            "ring-2 ring-cyan-400/60 ring-offset-2 ring-offset-[#0b1020] "
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

        <div className="border-b border-white/10 bg-[#10172c] ">
          <header className="bg-[#131b33]/95 px-4 py-3 backdrop-blur  sm:px-5">
            <div className="flex items-start  justify-between gap-3">
              <div className="min-w-0 flex-1 ">
                <div className="flex flex-col  gap-3 xl:flex-row xl:items-center xl:justify-between">
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
                          React + Tailwind + Monaco + resizable panels
                        </div>
                      </div>
                    </div>

                    <>
                      <div className="hidden h-8 w-px bg-white/10 lg:block" />

                      <div className="flex flex-wrap items-center gap-2">
                        <ToolbarButton
                          ongoingProcess={ongoingProcess === "compile"}
                          icon={RefreshCw}
                          label="Compile"
                          onClick={compileProject}
                        />
                        <ToolbarButton
                          icon={FlaskConical}
                          label="Test"
                          onClick={runTests}
                        />
                        <ToolbarButton
                          icon={Rocket}
                          label="Deploy"
                          onClick={deployContract}
                        />
                        <ToolbarButton
                          icon={ShieldCheck}
                          label="Audit"
                          onClick={runAudit}
                        />
                      </div>
                    </>
                  </div>

                  <div className="flex flex-wrap  items-center gap-2 sm:gap-3">
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

                    <button
                      onClick={saveWorkspaceBundle}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
                    >
                      <Download className="h-4 w-4" />
                      Export Workspace
                    </button>
                    <button
                      onClick={() => setShowCommandPalette(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
                    >
                      <Search className="h-4 w-4" />
                      Command Palette
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTopPanelCollapsed((prev) => !prev)}
                aria-expanded={!topPanelCollapsed}
                aria-label={
                  topPanelCollapsed ? "Open top panel" : "Collapse top panel"
                }
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.08] hover:text-white "
              >
                {topPanelCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
            </div>
          </header>

          {!topPanelCollapsed && (
            <section className="grid grid-cols-1 gap-3 border-t border-white/10 bg-[#10172c] px-4 py-3 lg:grid-cols-4 lg:px-5">
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
                value={`${status}${workspaceDirty ? " • Unsaved" : ""}`}
                hint={`${workspaceName} • client-side persistence enabled`}
              />
            </section>
          )}
        </div>

        <div className="min-h-0  flex-1 overflow-hidden ">
          <Group orientation="horizontal" className="h-full w-full">
            {!leftCollapsed ? (
              <>
                <Panel
                  defaultSize="20%"
                  minSize="16%"
                  maxSize="32%"
                  className="min-h-0"
                >
                  <aside className="flex h-full min-h-0 flex-col border-r border-white/10 bg-[#0f1528]">
                    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold tracking-wide text-slate-100">
                          File Explorer
                        </div>
                        <div className="text-xs text-slate-400">
                          Project folders and files
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setShowExamplesModal(true);
                            loadExamples();
                          }}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <Github className="h-4 w-4" />
                        </button>
                        <button
                          onClick={pickFolder}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <FolderPlus className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <FilePlus2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setLeftCollapsed(true)}
                          className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <PanelLeft className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <input
                          value={fileQuery}
                          onChange={(e) => setFileQuery(e.target.value)}
                          placeholder="Search files"
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-2.5 pl-9 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/30"
                        />
                      </div>

                      {/* <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <Upload className="mr-2 inline h-4 w-4" />
                          Files
                        </button>
                        <button
                          onClick={pickFolder}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 transition hover:bg-white/[0.07]"
                        >
                          <Upload className="mr-2 inline h-4 w-4" />
                          Folder
                        </button>
                      </div> */}

                      {/* <div className="rounded-2xl border border-dashed border-cyan-400/20 bg-cyan-400/5 p-3 text-xs leading-6 text-slate-300">
                        Drag and drop files or folders anywhere into the IDE to
                        import into the workspace.
                      </div> */}
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
                          selectedPath={selectedPath}
                          onSelectPath={setSelectedPath}
                          onRename={startRename}
                          onDelete={deletePath}
                        />
                      ))}
                    </div>

                    <div className="border-t border-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                          <KeyRound className="h-4 w-4 text-cyan-300" />
                          Test Accounts
                        </div>
                        <button
                          onClick={generateAddress}
                          className="rounded-xl border border-white/10 bg-white/[0.03] px-2 py-1 text-xs text-slate-200"
                        >
                          Add
                        </button>
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
                </Panel>
                <ResizeHandle />
              </>
            ) : (
              <>
                <Panel
                  defaultSize="3%"
                  minSize="3%"
                  maxSize="5%"
                  className="border-r border-white/10 bg-[#0f1528]"
                >
                  <div className="flex h-full items-start justify-center pt-4">
                    <button
                      onClick={() => setLeftCollapsed(false)}
                      className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
                    >
                      <PanelRight className="h-4 w-4" />
                    </button>
                  </div>
                </Panel>
                <ResizeHandle />
              </>
            )}

            <Panel defaultSize="80%" minSize="35%" className="min-h-0">
              <Group orientation="vertical" className="h-full">
                <Panel defaultSize="72%" minSize="30%" className="min-h-0">
                  <Group orientation="horizontal" className="h-full">
                    <Panel
                      defaultSize={rightCollapsed ? "100%" : "76%"}
                      minSize="35%"
                      className="min-h-0"
                    >
                      <div className="flex h-full min-h-0 flex-col bg-[#11182d]">
                        <div className="border-b border-white/10 bg-[#121a31] px-3 pt-2">
                          <div className="flex items-center justify-between gap-3 overflow-hidden pb-2">
                            <div className="flex items-center gap-2 overflow-x-auto">
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
                                onClick={exportCurrentFile}
                                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.07]"
                              >
                                Export File
                              </button>
                              <button
                                onClick={() => startRename(activeFile)}
                                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-200 transition hover:bg-white/[0.07]"
                              >
                                Rename
                              </button>
                              <button
                                onClick={() => deletePath(activeFile)}
                                className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 transition hover:bg-rose-500/20"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-white/10 bg-[#121a31] px-4 py-2.5">
                          <div>
                            <div className="text-sm font-semibold text-slate-100">
                              {activeFile}
                            </div>
                            <div className="text-xs text-slate-400">
                              {getLanguageFromPath(activeFile)} • Monaco editor
                              enabled
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

                        {activeFile ? (
                          <div
                            className="h-full w-full relative pt-2.5"
                            ref={mountEditor}
                          />
                        ) : (
                          <div className="flex min-h-0 flex-1 items-center justify-center bg-[#0f1528]">
                            <div className="text-center text-slate-500">
                              <div className="text-sm">No file open</div>
                              <div className="mt-1 text-xs">
                                Select a file from the explorer
                              </div>
                            </div>
                          </div>
                        )}

                        {/* <div className="border-t border-white/10 bg-[#10172c] px-4 py-2 text-xs text-slate-400">
													Click line numbers to toggle breakpoints. Resize
													sidebars and console by dragging the handles.
												</div> */}
                      </div>
                    </Panel>

                    {!rightCollapsed && (
                      <>
                        <ResizeHandle />
                        <Panel
                          defaultSize="24%"
                          minSize="16%"
                          maxSize="40%"
                          className="min-h-0"
                        >
                          <div className="flex h-full min-h-0 flex-col bg-[#10172c]">
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
                                      Ask for code generation, explain compiler
                                      errors, suggest test cases, or scaffold
                                      audit rules.
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
                                      onChange={(e) =>
                                        setSelectedContext(e.target.value)
                                      }
                                      className="w-full rounded-xl border border-white/10 bg-[#0d1426] px-3 py-2 text-sm text-white outline-none"
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
                                          <Play className="h-4 w-4" />
                                          Resume
                                        </button>
                                      ) : (
                                        <button
                                          onClick={startDebug}
                                          className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950"
                                        >
                                          <PauseCircle className="h-4 w-4" />
                                          Pause
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
                                              navigator.clipboard?.writeText(
                                                item.address
                                              )
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
                          className="border-l border-white/10 bg-[#10172c]"
                        >
                          <div className="flex h-full items-start justify-center pt-4">
                            <button
                              onClick={() => setRightCollapsed(false)}
                              className="rounded-xl border border-white/10 bg-white/[0.03] p-2 text-slate-200 transition hover:bg-white/[0.07]"
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
                  defaultSize="28%"
                  minSize="14%"
                  maxSize="60%"
                  className="min-h-0 border-t border-white/10 bg-[#0f1528]"
                >
                  {/* <div className="flex h-full min-h-0 flex-col">
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
															: "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]",
													)}
												>
													<Icon className="h-4 w-4" />
													{key}
												</button>
											))}

											<div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
												<GripVertical className="h-4 w-4" />
												Drag handle above to resize terminal
											</div>
										</div>

										<div className="min-h-0 flex-1 overflow-auto p-4">
											{bottomTab === "console" && (
												<pre className="space-y-2 font-mono text-sm">
													{terminal.map((entry, index) => (
														<div
															key={`${entry.text}-${index}`}
															className={cn(
																"rounded-xl px-3 py-2",
																entry.type === "success"
																	? "bg-emerald-500/10 text-emerald-300"
																	: entry.type === "warning"
																		? "bg-amber-500/10 text-amber-300"
																		: "bg-white/[0.03] text-slate-300",
															)}
														>
															{entry.text}
														</div>
													))}
												</pre>
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
																			: "bg-rose-500/10 text-rose-300",
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
															{breakpoints[0]
																? `Line ${breakpoints[0]}`
																: "None"}
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
															<CheckCircle2 className="h-4 w-4" />
															Ready to deploy
														</div>
													</div>
												</div>
											)}
										</div>
									</div> */}

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
                              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium capitalize transition",
                              isActive
                                ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
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
                              "inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition",
                              terminal.length
                                ? "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
                                : "cursor-not-allowed border-white/5 bg-white/[0.02] text-slate-600"
                            )}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Clear logs
                          </button>
                        )}

                        <div className="hidden items-center gap-2 text-xs text-slate-500 lg:flex">
                          <GripVertical className="h-4 w-4" />
                          Drag handle above to resize
                        </div>
                      </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden">
                      {bottomTab === "console" && (
                        <div className="flex h-full min-h-0 flex-col">
                          <div className="flex items-center justify-between border-b border-white/5 px-4 py-2">
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <TerminalSquare className="h-4 w-4 text-cyan-300" />
                              <span>Runtime console</span>
                              <span className="text-slate-600">•</span>
                              <span>
                                {terminal.length}{" "}
                                {terminal.length === 1 ? "entry" : "entries"}
                              </span>
                            </div>

                            {terminal.length > 0 && (
                              <div className="text-[11px] text-slate-500">
                                Latest output shown below
                              </div>
                            )}
                          </div>

                          <div className="min-h-0 flex-1 overflow-y-auto p-4">
                            {terminal.length === 0 ? null : (
                              //   <div className="flex h-full min-h-[180px] items-center justify-center">
                              //     <div className="max-w-md rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-8 text-center">
                              //       <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                              //         <TerminalSquare className="h-5 w-5" />
                              //       </div>
                              //       <div className="text-sm font-semibold text-white">
                              //         No console output yet
                              //       </div>
                              //       <p className="mt-2 text-sm leading-6 text-slate-400">
                              //         Compile, test, deploy, or run workspace
                              //         actions to stream logs here.
                              //       </p>
                              //     </div>
                              //   </div>
                              <div className="space-y-2 font-mono text-sm">
                                {terminal.map((entry, index) => {
                                  const type = entry?.type || "info";

                                  return (
                                    <div
                                      key={`${entry?.text || "log"}-${index}`}
                                      className={cn(
                                        "rounded-xl border px-3 py-2.5 leading-6 shadow-sm",
                                        type === "success"
                                          ? "border-emerald-400/10 bg-emerald-500/10 text-emerald-300"
                                          : type === "warning"
                                          ? "border-amber-400/10 bg-amber-500/10 text-amber-300"
                                          : type === "error"
                                          ? "border-rose-400/10 bg-rose-500/10 text-rose-300"
                                          : "border-white/5 bg-white/[0.03] text-slate-300"
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

                          <div className="border-t border-white/5 px-4 py-2 text-[11px] text-slate-500">
                            Folder upload supported
                            <span className="mx-2 text-slate-700">•</span>
                            Workspace persists locally
                            <span className="mx-2 text-slate-700">•</span>
                            Network: {activeNetwork.label}
                          </div>
                        </div>
                      )}

                      {bottomTab === "tests" && (
                        <div className="h-full overflow-y-auto p-4">
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
                        </div>
                      )}

                      {bottomTab === "debug" && (
                        <div className="h-full overflow-y-auto p-4">
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
                                {breakpoints[0]
                                  ? `Line ${breakpoints[0]}`
                                  : "None"}
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
                        </div>
                      )}

                      {bottomTab === "deploy" && (
                        <div className="h-full overflow-y-auto p-4">
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
                                <CheckCircle2 className="h-4 w-4" />
                                Ready to deploy
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Panel>
              </Group>
            </Panel>
          </Group>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-[#0d1426] px-4 py-2 text-xs text-slate-400 sm:px-5">
          <div className="flex flex-wrap items-center gap-4">
            <span>Monaco editor enabled</span>
            <span>•</span>
            <span>Resizable left, right, and bottom panels</span>
            <span>•</span>
            <span>Folder upload supported</span>
            <span>•</span>
            <span>Workspace persists locally</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Network: {activeNetwork.label}</span>
            <span>Compiler: soroban-sdk 22.0.0</span>
            <span>{debugPaused ? "Paused" : "Live"}</span>
          </div>
        </footer>

        {/* {showExamplesModal && (
          <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20">
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#11182d] shadow-2xl">
              <div className="border-b border-white/10 p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Soroban Examples</h2>

                <button
                  onClick={() => setShowExamplesModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[420px] overflow-auto p-3">
                {loadingExamples ? (
                  <div className="max-h-[420px] flex flex-col items-center justify-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-cyan-400" />
                    <div className="text-sm font-medium text-slate-300">
                      Loading examples...
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {examples.map((ex) => (
                      <button
                        key={ex.path}
                        onClick={() => {
                          loadExampleFolder(ex.path);
                          setShowExamplesModal(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.05]"
                      >
                        {ex.path}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )} */}

        <SourceExamplesModal
          open={showExamplesModal}
          onClose={() => setShowExamplesModal(false)}
          title="Load Soroban Project"
          examples={examples?.filter(
            (e) => e.path !== ".github" && e.path !== ".devcontainer"
          )}
          loadingExamples={loadingExamples}
          exampleBaseUrl="https://github.com/stellar/soroban-examples/tree/main"
          onLoadExample={(example) => loadExampleFolder(example.path)}
          onLoadGithubRepo={async (repoUrl) => {
            await loadGithubRepository(repoUrl);
          }}
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
            <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#11182d] shadow-2xl">
              <div className="border-b border-white/10 p-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1426] px-4 py-3">
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
                    className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm text-slate-200 transition hover:bg-white/[0.06]"
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
