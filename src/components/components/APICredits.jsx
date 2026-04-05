import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MdOutlineStart } from "react-icons/md";
import { GoPlus } from "react-icons/go";
import { RxCaretDown, RxCaretUp } from "react-icons/rx";

export default function APICredits() {
	return (
		<Menu>
			{({ open }) => {
				return (
					<div>
						<MenuButton className="cursor-pointer focus:outline-none">
							<div className="p-2 border text-sm border-gray-200 rounded-xl bg-white flex gap-2 items-center">
								<div>
									0 <span className="text-gray-400">API Credits</span>
								</div>

								{open ? <RxCaretUp /> : <RxCaretDown />}

								<a href="" title="Pay" className="bg-gray-900 rounded">
									<GoPlus className="text-white text-xl" />
								</a>
							</div>
						</MenuButton>
						<MenuItems
							anchor="bottom"
							className="focus:outline-none shadow-lg w-60 rounded-2xl bg-white p-4 text-sm"
						>
							<MenuItem className="text-gray-700">
								<div className="space-y-4">
									<p className="text-md font-semibold text-gray-900">
										Charging
									</p>
									<p className="text-md font-semibold text-gray-900">
										0 API Credits <br />
										<sup className="text-gray-400">$0.00 / ≈0 reqs</sup>
									</p>
								</div>
							</MenuItem>

							<MenuItem className="text-blue-600">
								<div className="flex items-center gap-2 mt-2">
									<MdOutlineStart />
									<a href="#">Billings</a>
								</div>
							</MenuItem>
						</MenuItems>
					</div>
				);
			}}
		</Menu>
	);
}
