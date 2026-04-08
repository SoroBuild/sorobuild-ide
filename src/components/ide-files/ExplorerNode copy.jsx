import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FolderTree,
  Trash2,
  Wand2,
} from "lucide-react";
import { cn } from "../../utils/lib";

export default function ExplorerNode({
  name,
  node,
  depth = 0,
  expanded,
  toggle,
  openFile,
  activeFile,
  selectedPath,
  onSelectPath,
  onRename,
  onDelete,
}) {
  const isFile = Boolean(node.__file);
  const path = node.path;
  const isSelected = selectedPath === path;

  if (isFile) {
    const isActive = activeFile === path;
    return (
      <div className="group flex items-center gap-1">
        <button
          onClick={() => {
            onSelectPath(path);
            openFile(path);
          }}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
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
        {/* <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100"> */}
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onRename(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  const isExpanded = expanded[path] ?? true;

  return (
    <div>
      <div className="group flex items-center gap-1">
        <button
          onClick={() => {
            onSelectPath(path);
            toggle(path);
          }}
          className={cn(
            "flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
            isSelected
              ? "bg-white/[0.06] text-white"
              : "text-slate-200 hover:bg-white/[0.05]"
          )}
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
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            onClick={() => onRename(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
          >
            <Wand2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(path)}
            className="rounded-md p-1 text-slate-400 hover:bg-rose-500/15 hover:text-rose-200"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-0.5">
          {Object.entries(node)
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
                selectedPath={selectedPath}
                onSelectPath={onSelectPath}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
        </div>
      )}
    </div>
  );
}
