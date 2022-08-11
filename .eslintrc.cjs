// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:vue/vue3-recommended",
    "plugin:prettier/recommended",
  ],
  rules: {
    "vue/attribute-hyphenation": [
      "warn",
      "always",
      { ignore: ["agentPubKey"] },
    ],
  },
  env: {
    "vue/setup-compiler-macros": true,
  },
};
