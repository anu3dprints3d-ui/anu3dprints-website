import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";

export default [
  { ignores: ["client/dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["client/**/*.{js,jsx}"],
    languageOptions: { globals: { ...globals.browser, __MAX_UPLOAD_MB__: "readonly" }, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "react-hooks": reactHooks, react },
    rules: {
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_|^React$" }],
    },
  },
  {
    files: ["server/**/*.js", "shared/**/*.js", "scripts/**/*.mjs", "*.js"],
    languageOptions: { globals: { ...globals.node, File: "readonly", FormData: "readonly" } },
    rules: { "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }] },
  },
  {
    files: ["client/vite.config.js", "netlify/**/*.js", "api/**/*.js"],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ["e2e/**/*.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];
