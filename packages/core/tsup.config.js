import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: ["src/index.ts", "src/tokensource/index.ts"],
		clean: true,
		splitting: false,
		dts: true,
		sourcemap: true,
		format: ["esm"],
		outDir: "dist",
	},
]);
