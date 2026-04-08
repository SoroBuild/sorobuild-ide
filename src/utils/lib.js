export function cn(...classes) {
	return classes.filter(Boolean).join(" ");
}

export function randomAddress(length = 56) {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
	let out = "G";
	for (let i = 0; i < length - 1; i += 1) {
		out += chars[Math.floor(Math.random() * chars.length)];
	}
	return out;
}

export function getLanguageFromPath(path) {
	if (!path) return "plaintext";
	if (path.endsWith(".rs")) return "rust";
	if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
	if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
	if (path.endsWith(".json")) return "json";
	if (path.endsWith(".toml")) return "ini";
	if (path.endsWith(".md")) return "markdown";
	if (path.endsWith(".yml") || path.endsWith(".yaml")) return "yaml";
	return "plaintext";
}

export function buildTree(paths) {
	const root = {};
	const sortedPaths = [...paths].sort();
	
	for (let i = 0; i < sortedPaths.length; i++) {
		const path = sortedPaths[i];
		const parts = path.split("/");
		let cursor = root;
		
		parts.forEach((part, index) => {
			const isFile = index === parts.length - 1;
			const currentPath = parts.slice(0, index + 1).join("/");
			
			if (!cursor[part]) {
				cursor[part] = isFile
					? { __file: true, path: currentPath }
					: { __folder: true, path: currentPath };
			}
			cursor = cursor[part];
		});
	}
	
	for (let i = 0; i < sortedPaths.length - 1; i++) {
		const current = sortedPaths[i];
		const next = sortedPaths[i + 1];
		if (next.startsWith(current + "/")) {
			const parts = current.split("/");
			const parentParts = parts.slice(0, -1);
			let cursor = root;
			for (let j = 0; j < parentParts.length; j++) {
				cursor = cursor[parentParts[j]];
			}
			const lastPart = parts[parts.length - 1];
			if (cursor[lastPart] && !cursor[lastPart].__folder) {
				cursor[lastPart] = { __folder: true, path: current };
			}
		}
	}
	
	return root;
}

export const getExampleFolders = (tree) => {
	return tree.filter(
		(item) => item.type === "tree" && !item.path.includes("/"),
	);
};
