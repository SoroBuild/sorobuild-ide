import JSZip from "jszip";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export function getProjectIdFromUrl() {
	const params = new URLSearchParams(window.location.search);
	return params.get("projectId");
}

export function updateUrlWithProjectId(projectId) {
	const url = new URL(window.location.href);
	url.searchParams.set("projectId", projectId);
	window.history.replaceState({}, "", url.toString());
}

export function clearProjectIdFromUrl() {
	const url = new URL(window.location.href);
	url.searchParams.delete("projectId");
	window.history.replaceState({}, "", url.toString());
}

export async function uploadProjectAsZip(files) {
	// files: { [path]: content string }
	const zip = new JSZip();

	Object.entries(files).forEach(([path, content]) => {
		zip.file(path, content);
	});

	const blob = await zip.generateAsync({ type: "blob" });
	const formData = new FormData();
	formData.append("file", blob, "project.zip");

	const res = await fetch(`${BASE_URL}/api/projects/upload-zip`, {
		method: "POST",
		body: formData,
	});

	if (!res.ok) throw new Error("Upload failed");
	return await res.json(); // { projectId }
}

export async function uploadRawFilesAsZip(incoming) {
	// const ignored = (path) =>
	// 	path.startsWith("node_modules/") ||
	// 	path.startsWith(".git/") ||
	// 	path.endsWith(".gitkeep") ||
	// 	path.includes("/.pnpm/") ||
	// 	path.includes("/target/");

	// const filtered = incoming.filter((item) => !ignored(item.path));

	const zip = new JSZip();

	for (const item of incoming) {
		const content = await item.file.arrayBuffer();
		zip.file(item.path, content);
	}

	const blob = await zip.generateAsync({ type: "blob" });
	const formData = new FormData();
	formData.append("file", blob, "project.zip");

	const res = await fetch(`${BASE_URL}/api/projects/upload-zip`, {
		method: "POST",
		body: formData,
	});

	if (!res.ok) throw new Error("Upload failed");
	return await res.json(); // { projectId }
}

export async function downloadProjectAsFiles(projectId) {
	// returns { [path]: content string }
	const res = await fetch(`${BASE_URL}/api/projects/${projectId}/load`);
	if (!res.ok) throw new Error("Download failed");

	const blob = await res.blob();
	const zip = await JSZip.loadAsync(blob);
	const files = {};

	await Promise.all(
		Object.entries(zip.files).map(async ([path, zipEntry]) => {
			if (!zipEntry.dir) {
				files[path] = await zipEntry.async("string");
			}
		}),
	);

	return files; // { [path]: content }
}

export async function deleteProject(projectId) {
	await fetch(`${BASE_URL}/api/projects/${projectId}/delete`, {
		method: "POST",
		keepalive: true,
	});
}

export async function buildProject(projectId, files, workspaceName) {
	const zip = new JSZip();
	Object.entries(files).forEach(([path, content]) => {
		zip.file(path, content);
	});

	const blob = await zip.generateAsync({ type: "blob" });
	const formData = new FormData();
	formData.append("file", blob, `${workspaceName}.zip`);

	const response = await fetch(`${BASE_URL}/api/projects/${projectId}/build`, {
		method: "POST",
		body: formData,
	});

	const result = await response.json();
	return result;
}

export async function updateProject(projectId, files, workspaceName) {
	const zip = new JSZip();
	Object.entries(files).forEach(([path, content]) => {
		zip.file(path, content);
	});

	const blob = await zip.generateAsync({ type: "blob" });
	const formData = new FormData();
	formData.append("file", blob, `${workspaceName}.zip`);

	const response = await fetch(
		`${BASE_URL}/api/projects/upload-zip/${projectId}`,
		{ method: "PUT", body: formData },
	);

	if (!response.ok) throw new Error("Update failed");
	return response.json();
}

export const fetchRepoTree = async () => {
	const res = await fetch(
		"https://api.github.com/repos/stellar/soroban-examples/git/trees/main?recursive=1",
	);
	const data = await res.json();

	console.log({ data });
	return data.tree; // array of all files + folders
};
