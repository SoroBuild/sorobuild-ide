export default function StatCard({ icon: Icon, title, value, hint }) {
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
