import { useState } from "react";

export default function Payments() {
	const [payments, setPayments] = useState("One-time");
	const [currency, setCurrency] = useState("USDT");
	const [amount, setAmount] = useState(100);
	return (
		<div className="p-4 w-full border border-gray-200 rounded-2xl space-y-3 bg-white">
			<h3 className="text-lg font-semibold text-gray-900">Payments</h3>

			<div className="flex items-center gap-4 bg-gray-200 text-gray-700">
				<button
					className={`p-2 text-sm rounded w-full cursor-pointer ${
						payments === "One-time"
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setPayments("One-time")}
				>
					One-time
				</button>
				<button
					className={`p-2 text-sm rounded w-full cursor-pointer ${
						payments === "Recurring"
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setPayments("Recurring")}
				>
					Recurring
				</button>
			</div>

			<h3 className="text-lg font-semibold text-gray-900">Currency</h3>

			<div className="flex items-center gap-4 bg-gray-200 text-gray-700">
				<button
					className={`p-2 text-sm rounded w-full ${
						currency === "USD"
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setCurrency("USD")}
				>
					USD
				</button>
				<button
					className={`p-2 text-sm rounded w-full ${
						currency === "USDT"
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setCurrency("USDT")}
				>
					USDT
				</button>
			</div>

			<h3 className="text-lg font-semibold text-gray-900">Amount</h3>

			<div className="flex items-center gap-4 text-gray-700">
				<button
					className={`p-2 text-sm rounded ${
						amount === 100
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setAmount(100)}
				>
					$100
				</button>
				<button
					className={`p-2 text-sm rounded ${
						amount === 200
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setAmount(200)}
				>
					$200
				</button>
				<button
					className={`p-2 text-sm rounded ${
						amount === 300
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setAmount(300)}
				>
					$300
				</button>
				<button
					className={`p-2 text-sm rounded ${
						amount === 400
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setAmount(400)}
				>
					$400
				</button>
				<button
					className={`p-2 text-sm rounded ${
						amount === 500
							? "bg-gray-900 text-white"
							: "bg-gray-200 text-gray-700"
					}`}
					onClick={() => setAmount(500)}
				>
					$500
				</button>
			</div>

			<button className="bg-gray-900 text-white w-full p-2 rounded-lg hover:bg-gray-900 cursor-pointer">
				Pay
			</button>
		</div>
	);
}
