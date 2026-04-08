import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import importMetaUrlPlugin from "@codingame/esbuild-import-meta-url-plugin";

// https://vitejs.dev/config/

export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		include: ["vscode-textmate", "vscode-oniguruma"],
		rolldownOptions: {
			plugins: [importMetaUrlPlugin],
		},
	},
	worker: {
		format: "es",
	},
	build: {
		target: "esnext",
	},
	define: {
		global: "window",
	},
	server: {
		proxy: {
			"/api": {
				target: "https://stellar-sdk-server.sorobuild.io",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
});
