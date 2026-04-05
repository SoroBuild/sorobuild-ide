import {
	Description,
	Dialog,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import CustomInput from "./CustomInput";

export default function UpdateProjectForm({ open, onClose, project }) {
	if (!open) return null;

	return (
		<>
			<Dialog open={open} onClose={onClose} className="relative z-50">
				<div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-[#000]/75">
					<DialogPanel className="max-w-lg w-lg space-y-4 rounded-2xl bg-white p-12">
						<DialogTitle className="font-bold">
							Update Project Details
						</DialogTitle>
						<Description>Update details for: {project.name}</Description>
						<CustomInput
							label="Project Name"
							placeholder="Enter your project name"
							defaultValue={project.name}
						/>

						<CustomInput
							label="Whitelisted Domain"
							placeholder="Enter your domain name"
							defaultValue={project.whitelist}
						/>

						<div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
							<button
								className="grow bg-gray-400 cursor-pointer text-white rounded p-2 text-sm"
								onClick={onClose}
							>
								Cancel
							</button>
							<button
								className="grow bg-gray-900 cursor-pointer text-white rounded p-2 text-sm"
								onClick={onClose}
							>
								Submit
							</button>
						</div>
					</DialogPanel>
				</div>
			</Dialog>
		</>
	);
}
