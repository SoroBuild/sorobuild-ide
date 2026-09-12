import { cn } from "../../utils/lib";

export default function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  active,
  danger,
  ongoingProcess,
  disabled,
}) {
  return (
    <button disabled={disabled || ongoingProcess}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition",
        danger
          ? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
          : active
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
          : "border-transparent bg-transparent text-slate-200 hover:bg-white/[0.07]"
      )}
    >
      <Icon className={`h-4 w-4 ${ongoingProcess && "spin"}`} />
      {label}
    </button>
  );
}
