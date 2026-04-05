export default function ChargingModel() {
	return (
		<div className="p-4 w-full border border-gray-200 rounded-2xl space-y-3 bg-white">
			<h3 className="text-lg font-semibold text-gray-900">Charging model</h3>
			<h3 className="text-lg font-semibold text-gray-900">
				0 API Credits <sup className="text-gray-400">≈$0.00</sup>
			</h3>

			<div className="p-4 w-full border flex flex-col gap-2 items-start md:flex-row justify-between md:items-center border-gray-200 rounded-2xl bg-linear-to-l from-orange-100 to-orange-300">
				<p className="text-gray-700 text-sm">
					<span className="font-semibold">Get more: </span>Superior rate limits,
					x3 projects, multi-project stats and whitelists.
				</p>

				<button className="p-2 text-sm text-gray-200 bg-gray-900 rounded cursor-pointer">
					Upgrade
				</button>
			</div>
		</div>
	);
}
