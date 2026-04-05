import { BsInstagram } from "react-icons/bs";
import { FaX } from "react-icons/fa6";

const socials = [
	{
		title: "X (Twitter)",
		link: "#",
		icon: <FaX />,
	},
	{
		title: "Instagram",
		link: "#",
		icon: <BsInstagram />,
	},
];

export default function Socials() {
	return (
		<div className="p-4 w-full border border-gray-200 rounded-2xl space-y-5 bg-white">
			<div className="text-md font-semibold text-gray-900 flex items-center justify-between gap-1">
				Socials
			</div>

			<div className="space-y-1">
				{socials.map((social, index) => (
					<a
						key={index}
						href={social.link}
						className="flex items-center gap-2 text-sm underline hover:no-underline"
					>
						<span className="text-gray-600">{social.icon}</span>
						<span className="text-gray-800">{social.title}</span>
					</a>
				))}
			</div>
		</div>
	);
}
