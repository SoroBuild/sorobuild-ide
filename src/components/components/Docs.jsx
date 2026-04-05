import { IoIosPricetags } from "react-icons/io";
import { MdOutlineStart } from "react-icons/md";

const links = [
	{
		title: "Getting Started",
		link: "#",
		icon: <MdOutlineStart />,
	},
	{
		title: "Pricing",
		link: "#",
		icon: <IoIosPricetags />,
	},
];

export default function Docs() {
	return (
		<div className="p-4 w-full border border-gray-200 rounded-2xl space-y-5 bg-white">
			<div className="text-md font-semibold text-gray-900 flex items-center justify-between gap-1">
				Docs
				<a
					href="#"
					className="underline text-xs p-0.5 rounded text-blue-600 hover:text-blue-400"
				>
					View all
				</a>
			</div>

			<div className="space-y-1">
				{links.map((link, index) => (
					<a
						key={index}
						href={link.link}
						className="flex items-center gap-2 text-sm underline hover:no-underline"
					>
						<span className="text-gray-600">{link.icon}</span>
						<span className="text-gray-800">{link.title}</span>
					</a>
				))}
			</div>
		</div>
	);
}
