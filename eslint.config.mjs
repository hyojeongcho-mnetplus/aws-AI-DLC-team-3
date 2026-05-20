export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.tsbuildinfo"],
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
];
