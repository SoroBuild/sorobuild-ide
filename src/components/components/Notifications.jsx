import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";
import { IoIosNotificationsOutline } from "react-icons/io";
import { MdOutlineStart } from "react-icons/md";

export default function Notifications() {
	return (
		<Menu>
			{({ open }) => {
				return (
					<div>
						<MenuButton className="cursor-pointer focus:outline-none">
							<div className="p-2 border border-gray-200 rounded-xl bg-white flex gap-2 items-center">
								<IoIosNotificationsOutline className="text-xl" />
								{open ? <RxCaretUp /> : <RxCaretDown />}
							</div>
						</MenuButton>

						<MenuItems
							anchor="bottom"
							className="focus:outline-none shadow-lg w-80 h-80 rounded-2xl bg-white text-sm z-50"
						>
							<MenuItem className="text-gray-700 p-4 pb-2">
								<div className="">
									<p className="text-md font-semibold text-gray-900">
										Notifications
									</p>
								</div>
							</MenuItem>

							<MenuItem>
								<hr className="border-gray-300" />
							</MenuItem>

							<MenuItem className="text-blue-600 p-4 pt-2">
								<div></div>
							</MenuItem>
						</MenuItems>
					</div>
				);
			}}
		</Menu>
	);
}
