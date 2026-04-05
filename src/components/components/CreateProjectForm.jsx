import {
	Description,
	Dialog,
	DialogPanel,
	DialogTitle,
} from "@headlessui/react";
import { useState } from "react";
import { BiPlus } from "react-icons/bi";
import CustomInput from "./CustomInput";

export default function CreateProjectForm() {
	const [isOpen, setIsOpen] = useState(false);
	const [step, setStep] = useState(1);

	const handleClose = () => {
		setIsOpen(false);
		setStep(1); // reset on close
	};

	const handleSubmit = () => {
		// Your submit logic goes here
		console.log("Form submitted");
		handleClose();
	};

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="bg-gray-700 cursor-pointer text-white rounded p-2 text-sm flex items-center gap-1"
			>
				<BiPlus />
				Create project
			</button>
			<Dialog open={isOpen} onClose={handleClose} className="relative z-50">
				<div className="fixed inset-0 flex w-screen items-center justify-center p-4 bg-[#000]/75">
					<DialogPanel className="max-w-lg w-full space-y-4 rounded-2xl bg-white p-12">
						{step === 1 && (
							<>
								<DialogTitle className="font-bold">
									Create a New Project
								</DialogTitle>
								<Description>Enter your project details below</Description>
								<CustomInput
									label="Project Name"
									placeholder="Enter your project name"
								/>

								<div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
									<button
										className="grow bg-gray-400 text-white rounded p-2 text-sm"
										onClick={handleClose}
									>
										Cancel
									</button>
									<button
										className="grow bg-gray-900 text-white rounded p-2 text-sm"
										onClick={() => setStep(2)}
									>
										Next
									</button>
								</div>
							</>
						)}

						{step === 2 && (
							<>
								<DialogTitle className="font-bold">
									Optional Settings
								</DialogTitle>
								<Description>You can skip this step</Description>
								<CustomInput
									label="Whitelisted Domain"
									placeholder="Enter your domain name"
								/>

								{/* Buttons */}
								<div className="flex gap-2 sm:gap-4 flex-col sm:flex-row">
									<button
										className="grow bg-gray-400 text-white rounded p-2 text-sm"
										onClick={() => setStep(1)}
									>
										Back
									</button>
									{/* <button
										className="grow bg-gray-600 text-white rounded p-2 text-sm"
										onClick={handleSubmit}
									>
										Skip
									</button> */}
									<button
										className="grow bg-gray-900 text-white rounded p-2 text-sm"
										onClick={handleSubmit}
									>
										Submit
									</button>
								</div>
							</>
						)}
					</DialogPanel>
				</div>
			</Dialog>
		</>
	);
}
