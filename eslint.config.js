// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  // Node.js backend files
  {
    files: ["server.js", "config/**/*.js", "routes/**/*.js", "controllers/**/*.js", "models/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.node, // enable process, __dirname, etc.
      },
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
    },
  },

  // Browser frontend files
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser, // enable document, window, etc.
        axios: true,        // custom global
        Toastify: true      // custom global
      },
    },
  },
];
