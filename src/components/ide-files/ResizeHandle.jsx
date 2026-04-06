import { Separator } from "react-resizable-panels";
import { cn } from "../../utils/lib";

export default function ResizeHandle({ vertical = false }) {
	return (
		<Separator
			className={cn(
				"group relative flex shrink-0 items-center justify-center bg-transparent",
				vertical
					? "h-2 w-full cursor-row-resize"
					: "h-full w-2 cursor-col-resize",
			)}
		>
			<div
				className={cn(
					"rounded-full bg-white/10 transition-all duration-200 group-hover:bg-cyan-400/60",
					vertical ? "h-1 w-14" : "h-14 w-1",
				)}
			/>
		</Separator>
	);
}
