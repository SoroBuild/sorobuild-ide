import React, { useState, useEffect } from "react";
import LZString from "lz-string";
import JSZip from "jszip";

export default function ProjectUploader() {
  const [shareUrl, setShareUrl] = useState("");
  const [projectFiles, setProjectFiles] = useState({});

  // Load from URL hash
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const json = LZString.decompressFromEncodedURIComponent(hash);
        const project = JSON.parse(json);
        setProjectFiles(project.files);
      } catch (err) {
        console.error("Failed to load project from URL:", err);
      }
    }
  }, []);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files) return;

    const fileMap = {};

    for (const file of Array.from(files)) {
      const content = await file.text();
      const relativePath = file.webkitRelativePath || file.name;
      fileMap[relativePath] = content;
    }

    const project = {
      files: fileMap,
      entry: "src/lib.rs",
    };

    const json = JSON.stringify(project);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const url = `${window.location.origin}/#${compressed}`;

    setShareUrl(url);
    setProjectFiles(fileMap);
  };

  const handleDownload = async () => {
    const zip = new JSZip();

    for (const path in projectFiles) {
      zip.file(path, projectFiles[path]);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "soroban-project.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 border rounded-xl shadow bg-white">
      <h2 className="text-xl font-semibold mb-4">Upload Soroban Project</h2>

      <input
        type="file"
        webkitdirectory="true"
        multiple
        onChange={handleUpload}
        className="mb-4 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4
                   file:rounded-full file:border-0 file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />

      {shareUrl && (
        <div className="mt-4">
          <label className="block mb-1 text-gray-600 font-medium">
            Shareable Link:
          </label>
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full border px-3 py-2 rounded bg-gray-100 text-sm"
            onClick={(e) => e.target.select()}
          />
        </div>
      )}

      {Object.keys(projectFiles).length > 0 && (
        <div className="mt-6 text-sm">
          <h3 className="font-medium mb-2">📁 Files in project:</h3>
          <ul className="pl-4 list-disc text-gray-600 mb-4">
            {Object.keys(projectFiles).map((filename) => (
              <li key={filename}>{filename}</li>
            ))}
          </ul>
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700 transition"
          >
            Download Project as ZIP
          </button>
        </div>
      )}
    </div>
  );
}
