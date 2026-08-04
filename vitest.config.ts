import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/main.ts"],
      reporter: ["text", "html", "lcov"],
    },
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
        },
      },
      {
        test: {
          name: "browser",
          environment: "jsdom",
          include: ["tests/browser/**/*.test.ts"],
        },
      },
    ],
  },
});
