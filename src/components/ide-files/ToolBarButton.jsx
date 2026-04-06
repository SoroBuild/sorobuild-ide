import { cn } from "../../utils/lib";

export default function ToolbarButton({
	icon: Icon,
	label,
	onClick,
	active,
	danger,
}) {
	return (
		<button
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition",
				danger
					? "border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
					: active
						? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
						: "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]",
			)}
		>
			<Icon className="h-4 w-4" />
			{label}
		</button>
	);
}
