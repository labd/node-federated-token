import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
	test: {
		coverage: {
			provider: "v8",
			all: true,
			include: ["src/**/*.ts"],
			reportsDirectory: "./test-reports/",
		},
		passWithNoTests: true,
	},

	resolve: {
		alias: {
			"~src": path.join(__dirname, "src"),
		},
	},
});
