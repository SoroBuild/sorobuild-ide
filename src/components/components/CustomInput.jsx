export default function CustomInput({ label, placeholder, defaultValue = "" }) {
	return (
		<div>
			<label className="flex flex-col gap-1">
				<span className="text-[#101928] text-[14px] leading-[145%] font-medium">
					{label}
				</span>
				<input
					type="text"
					autoComplete="off"
					placeholder={placeholder}
					defaultValue={defaultValue}
					className="placeholder:font-normal placeholder:text-xs disabled:bg-neutral-100 disabled:border-neutral-200 disabled:cursor-not-allowed w-full rounded-[8px] bg-white px-4 py-2.5 text-[14px] leading-[145%] text-[#101928] font-normal outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6"
				/>
			</label>
		</div>
	);
}
