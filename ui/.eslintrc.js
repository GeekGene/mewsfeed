// eslint-disable-next-line no-undef
module.exports = {
    root: true,
    parser: "vue-eslint-parser",
    parserOptions: {
        parser: "@typescript-eslint/parser",
    },
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:vue/vue3-recommended",
    ],
    env: {
        "vue/setup-compiler-macros": true
    },
    rules: {
        semi: ["error", "always"],
    }
};
