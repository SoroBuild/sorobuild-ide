import { Fragment } from "react";
import { CloseButton } from "@headlessui/react";
import { AiOutlineHome } from "react-icons/ai";
import { BiFolder } from "react-icons/bi";
import { CiMoneyBill } from "react-icons/ci";

const NAV_LINKS = [
	{ title: "Home", href: "/", icon: AiOutlineHome },
	{ title: "Projects", href: "/projects", icon: BiFolder },
	{ title: "Billings", href: "/billings", icon: CiMoneyBill },
];

export default function Nav() {
	const links = NAV_LINKS.map((link) => (
		<Fragment key={link.href}>
			<li className={`px-2 py-1 rounded mb-1 flex items-center gap-1`}>
				<link.icon className="text-gray-600" />
				<CloseButton className={`text-gray-600 w-full text-left`}>
					{link.title}
				</CloseButton>
			</li>
		</Fragment>
	));

	return (
		<nav>
			<div className="flex flex-col">
				<ul className="list-none">{links}</ul>
			</div>
		</nav>
	);
}
