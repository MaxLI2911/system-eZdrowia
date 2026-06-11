import { defineConfig } from "vitest/config";
import path from "path";

const alias = { "@": path.resolve(__dirname, "./src") };

export default defineConfig({
  test: {
    name: "unit",
    environment: "node",
    globals: true,
    include: ["tests/unit/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: { alias },
});
