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
	[...paths].sort().forEach((path) => {
		const parts = path.split("/");
		let cursor = root;
		parts.forEach((part, index) => {
			const isFile = index === parts.length - 1;
			if (!cursor[part]) {
				cursor[part] = isFile
					? { __file: true, path }
					: { __folder: true, path: parts.slice(0, index + 1).join("/") };
			}
			cursor = cursor[part];
		});
	});
	return root;
}

export const getExampleFolders = (tree) => {
	return tree.filter(
		(item) => item.type === "tree" && !item.path.includes("/"),
	);
};
