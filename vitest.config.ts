import { defineConfig } from "vitest/config"

// The GUI build preset configures a DOM test environment for component tests. The path helpers are
// pure, so they run in plain Node without loading the app's plugin runtime.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
})
