import {
	Popover,
	PopoverBackdrop,
	PopoverButton,
	PopoverPanel,
} from "@headlessui/react";
import Nav from "./Nav";
import Profile from "./Profile";
import { AiOutlineClose, AiOutlineMenu } from "react-icons/ai";

export default function MobileNav() {
	return (
		<Popover className="group">
			<PopoverButton className="focus:outline-none cursor-pointer">
				<AiOutlineClose className="text-gray-600 text-2xl hidden group-data-[open]:block" />
				<AiOutlineMenu className="text-gray-600 text-2xl group-data-[open]:hidden" />
			</PopoverButton>
			<PopoverBackdrop
				transition
				className="fixed inset-0 bg-black/30 top-[70px] transition duration-300 ease-out data-[closed]:opacity-0"
			/>
			<PopoverPanel
				transition
				className="fixed flex flex-col justify-between top-0 bottom-0 transition duration-300 ease-in-out left-0 data-[closed]:-translate-x-[100%] h-full bg-gray-100 w-4/5 min-[425px]:w-1/2 p-2 pr-4 pt-4"
			>
				<div>
					<div className="text-gray-700 rounded-2xl bg-white p-4 text-sm mb-2">
						<div className="space-y-4">
							<p className="text-md font-semibold text-gray-900">Charging</p>
							<p className="text-md font-semibold text-gray-900">
								0 API Credits <br />
								<sup className="text-gray-400">$0.00 / ≈0 reqs</sup>
							</p>
						</div>
					</div>

					<Nav />
				</div>

				<Profile />
			</PopoverPanel>
		</Popover>
	);
}
