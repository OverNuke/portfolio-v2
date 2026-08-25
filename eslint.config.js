import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", ".claude"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, jsxA11y.flatConfigs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // sessionStorage/localStorage access throws in Safari private mode /
      // storage-disabled environments; intentional silent-catch is the
      // correct behavior there, not a bug. (No live consumer of this
      // pattern remains in src/ as of sdd/drop-intro-hero-placeholder,
      // 2026-08-24 — the rule stays as defensive config for the next one.)
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  eslintConfigPrettier,
);
