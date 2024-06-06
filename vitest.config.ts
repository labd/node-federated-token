import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		slowTestThreshold: 100,
		coverage: {
			provider: "v8",
			reporter: [
				"text",
				["json-summary", { file: "coverage-summary.json" }],
				["json", { file: "coverage.json" }],
			],
			reportsDirectory: "./coverage",
			all: true,
			include: [
				"packages/**/src/**/*.ts",
			],

			// Ignore a number of type-only files. These files are included due to the
			// usage of the `all: true`. We should eventually remove that
			// See https://github.com/vitest-dev/vitest/issues/3605
			exclude: ["**/src/**/*.generated.ts", "**/src/**/generated/**"],
			// statements: 50,
			// branches: 50,
			// functions: 30,
			// lines: 50,
		},
	},
});
