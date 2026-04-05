export default function ChargingBalance() {
	return (
		<div className="p-4 w-full grow border border-gray-200 rounded-2xl flex justify-between items-start bg-white">
			<div className="space-y-3">
				<h3 className="text-lg font-semibold text-gray-900">Charging model</h3>
				<h3 className="text-lg font-semibold text-gray-900">
					0 API Credits <sup className="text-gray-400">≈$0.00</sup>
				</h3>
			</div>

			<div className="border-2 border-gray-300 text-gray-300 p-2 rounded-lg">
				Balances
			</div>
		</div>
	);
}
