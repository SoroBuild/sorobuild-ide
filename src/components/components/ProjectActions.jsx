import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { useState } from "react";
import { FaEllipsisVertical } from "react-icons/fa6";
import UpdateProjectForm from "./UpdateProjectForm";

export default function ProjectActions({ project }) {
	const [showUpdate, setShowUpdate] = useState(false);

	return (
		<>
			<Menu>
				<MenuButton className="cursor-pointer focus:outline-none">
					<div className="p-2 bg-gray-100 rounded">
						<FaEllipsisVertical className="text-xl" />
					</div>
				</MenuButton>
				<MenuItems
					anchor="bottom"
					className="focus:outline-none shadow-lg rounded bg-white text-sm z-50 border-2 flex flex-col gap-0.5 p-2"
				>
					<MenuItem className="text-gray-700 p-2 font-bold">
						<div>Actions</div>
					</MenuItem>
					<hr className="border-gray-300" />

					<MenuItem className="text-gray-700 p-2">
						<button
							className="cursor-pointer p-1 hover:bg-gray-400 hover:text-white text-left rounded"
							onClick={() => navigator.clipboard.writeText(project.projectId)}
						>
							Copy project ID
						</button>
					</MenuItem>

					<MenuItem className="text-gray-700 p-2">
						<button className="cursor-pointer p-1 hover:bg-gray-400 hover:text-white text-left rounded">
							Toggle Dev Mode
						</button>
					</MenuItem>

					<MenuItem className="text-gray-700 p-2">
						<button
							className="cursor-pointer p-1 hover:bg-gray-400 hover:text-white text-left rounded"
							onClick={() => setShowUpdate(true)}
						>
							Update Project
						</button>
					</MenuItem>

					<MenuItem className="text-gray-700 p-2">
						<button className="bg-red-500 p-1 text-white hover:bg-red-700 text-left rounded cursor-pointer">
							Delete
						</button>
					</MenuItem>
				</MenuItems>

				<UpdateProjectForm
					open={showUpdate}
					onClose={() => setShowUpdate(false)}
					project={project}
				/>
			</Menu>
		</>
	);
}
