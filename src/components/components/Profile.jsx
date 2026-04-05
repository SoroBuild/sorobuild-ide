import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { IoIosLogOut } from "react-icons/io";

export default function Profile() {
	return (
		<Menu>
			{({ open }) => {
				return (
					<div>
						<MenuButton className="cursor-pointer focus:outline-none">
							<div className="p-2 border text-sm border-gray-200 rounded-xl bg-white flex gap-2 items-center">
								<div>
									<span className="text-gray-400">Jideotetic</span>
								</div>
								{open ? <RxCaretUp /> : <RxCaretDown />}
							</div>
						</MenuButton>

						<MenuItems
							anchor="bottom"
							className="focus:outline-none shadow-lg rounded-xl bg-white p-3 text-sm z-50"
						>
							<MenuItem>
								<div className="flex items-center gap-2">
									<IoIosLogOut />

									<span>Sign Out</span>
								</div>
							</MenuItem>
						</MenuItems>
					</div>
				);
			}}
		</Menu>
	);
}
