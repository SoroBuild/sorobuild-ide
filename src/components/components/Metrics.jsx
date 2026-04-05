const metrics = [
	{
		title: "Total requests",
		value: "123",
	},
	{
		title: "Top projects (reqs)",
		value: "",
	},
];

export default function Metrics() {
	return (
		<div className="flex gap-2 flex-col md:flex-row">
			{metrics.map((metric, index) => (
				<div
					key={index}
					className="p-4 w-full border border-gray-200 rounded-2xl space-y-2 bg-white"
				>
					<div className="text-md font-semibold text-gray-900 flex items-center gap-1">
						{metric.title}{" "}
						<span className="bg-gray-200 text-[10px] p-1 text-gray-400 rounded-md">
							24h
						</span>
					</div>
					<div className="text-sm text-gray-500">
						{metric.value > 0 ? `${metric.value} requests` : "No requests"}
					</div>
				</div>
			))}
		</div>
	);
}
