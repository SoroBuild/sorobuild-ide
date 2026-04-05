const features = ["Node API", "Multi-projects stats"];

export default function ProductAndPlans() {
	return (
		<div className="p-4 w-full border border-gray-200 rounded-2xl space-y-3 bg-linear-to-l from-orange-50 to-orange-100">
			<h3 className="text-lg font-semibold text-gray-900">Premium</h3>
			<h3 className="text-md font-semibold text-gray-900">
				Cutting-edge service{" "}
				<span className="text-gray-400">for professionals</span>
			</h3>

			<ul className="list-disc pl-5">
				{features.map((feature, index) => (
					<li key={index} className="text-gray-700 text-sm">
						{feature}
					</li>
				))}
			</ul>
		</div>
	);
}
