import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    ignores: ["handlebars/dist/**", "precompiled.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        Handlebars: "readonly",
        module: "readonly",
        exports: "readonly",
        define: "readonly"
      }
    }
  }
]);