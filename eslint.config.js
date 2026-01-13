import globals from "globals";

export default [
  //  IGNORE public folder completely
  {
    ignores: ["public/**"],
  },

  //  Backend / app linting
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "off",
      "no-undef": "error",
    },
  },
];
