import { MoreHorizontal, Search, X } from "lucide-react";

export default function LoadModal(commandItems = []) {
  return (
    <div className="absolute inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-20">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#11182d] shadow-2xl">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d1426] px-4 py-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              autoFocus
              // value={commandQuery}
              // onChange={(e) => setCommandQuery(e.target.value)}
              placeholder="Type a command or search files..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
            <button
              // onClick={() => setShowCommandPalette(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[420px]  overflow-auto p-3">
          {commandItems?.map((item) => (
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
  );
}
