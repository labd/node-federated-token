import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts"],
		clean: true,
		splitting: false,
		dts: true,
		sourcemap: true,
		format: ["esm"],
		outDir: "dist",
	},
]);
