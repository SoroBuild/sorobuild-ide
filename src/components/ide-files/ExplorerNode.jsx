import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus2,
  FolderOpen,
  FolderPlus,
  FolderTree,
  Trash2,
  Wand2,
} from "lucide-react";
import { cn } from "../../utils/lib";
import { useStates } from "../../ide/WorkspaceContext";

export default function ExplorerNode({
  name,
  node,
  depth = 0,
  expanded,
  toggle,
  openFile,
  activeFile,
  // selectedPath,
  onSelectPath,
  onRename,
  onDelete,
  onLoadFolder,
}) {
  const isFile = Boolean(node?.__file);
  const path = node?.path;
  const isSelected = activeFile === path;
  const isRoot = depth === 0;

  const {
    showNewFileModal,
    setShowNewFileModal,
    showNewFolderModal,
    setShowNewFolderModal,
  } = useStates();

  if (isFile) {
    const isActive = activeFile === path;

    return (
      <div className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            onSelectPath?.(path);
            openFile?.(path);
          }}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
            isActive
              ? "bg-cyan-400/10 text-cyan-200"
              : isSelected
              ? "bg-white/[0.06] text-white"
              : "text-slate-300 hover:bg-white/[0.05]"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          <FileCode2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{name}</span>
        </button>

        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={() => onRename?.(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
            title="Rename"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onDelete?.(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-200"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isExpanded = expanded?.[path] ?? true;

  return (
    <div>
      <div className="group flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            onSelectPath?.(path);
            toggle?.(path);
          }}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
            isSelected ? " text-white" : "text-slate-200 hover:bg-white/[0.05]"
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )}

          <FolderTree className="h-4 w-4 shrink-0 text-cyan-300" />
          <span
            className={cn(
              "truncate ",
              isRoot ? "font-semibold text-lg" : "font-medium"
            )}
          >
            {name}
          </span>
        </button>

        <div
          className={cn(
            "flex items-center gap-1 transition",
            isRoot ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isRoot && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowNewFolderModal(true)}
                className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
              >
                <FolderPlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowNewFileModal(true)}
                className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
              >
                <FilePlus2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => onRename?.(path)}
                className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
                title="Rename"
              >
                <Wand2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {Object.entries(node || {})
            .filter(([key]) => key !== "__folder" && key !== "path")
            .map(([childName, childNode]) => (
              <ExplorerNode
                key={`${path}-${childName}`}
                name={childName}
                node={childNode}
                depth={depth + 1}
                expanded={expanded}
                toggle={toggle}
                openFile={openFile}
                activeFile={activeFile}
                // selectedPath={selectedPath}
                onSelectPath={onSelectPath}
                onRename={onRename}
                onDelete={onDelete}
                onLoadFolder={onLoadFolder}
              />
            ))}
        </div>
      )}
    </div>
  );
}
