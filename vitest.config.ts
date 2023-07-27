import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.ts"],
			reportsDirectory: './test-reports/'
		},
		globalSetup: [path.join(__dirname, "vitest.setup.ts")],
		passWithNoTests: true,
	},

	resolve: {
		alias: {
			"~src": path.join(__dirname, "src"),
		},
	},
});
