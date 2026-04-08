export default function Modal({
	open,
	title,
	description,
	value,
	setValue,
	onClose,
	onConfirm,
	confirmLabel = "Confirm",
}) {
	if (!open) return null;

	return (
		<div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#11182d] p-6 shadow-2xl">
				<div className="text-lg font-semibold text-white">{title}</div>
				<p className="mt-1 text-sm text-slate-400">{description}</p>
				<input
					value={value}
					onChange={(e) => setValue(e.target.value)}
					className="mt-4 w-full rounded-2xl border border-white/10 bg-[#0d1426] px-4 py-3 text-sm text-white outline-none"
				/>
				<div className="mt-5 flex justify-end gap-3">
					<button
						onClick={onClose}
						className="rounded-2xl border border-white/10 px-4 py-2.5 text-sm text-slate-300"
					>
						Cancel
					</button>
					<button
						onClick={onConfirm}
						className="rounded-2xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950"
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
