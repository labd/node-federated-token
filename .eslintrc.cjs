module.exports = {
	extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
	plugins: ["unused-imports"],
	rules: {
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-unused-vars": [
			"warn",
			{
				args: "none",
				argsIgnorePattern: "^_",
			},
		],
		"unused-imports/no-unused-imports": "error",
		"no-console": [
			"error",
			{
				allow: ["warn", "error", "info"],
			},
		],
	},
};
