import js from "@eslint/js";
import globals from "globals";
import hooks from "eslint-plugin-react-hooks";
import react from "eslint-plugin-react";
export default [
  { ignores: ["dist/**", "node_modules/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    files: ["**/*.jsx"],
    plugins: { "react-hooks": hooks, react },
    rules: {
      ...hooks.configs.recommended.rules,
      "react/jsx-uses-vars": "error",
    },
  },
];
