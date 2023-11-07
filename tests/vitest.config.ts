import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    threads: false,
    testTimeout: 600 * 1000 * 10, // 10  mins
    outputDiffLines: 100,
    outputDiffMaxSize: 100000,
  },
});
