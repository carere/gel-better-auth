import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./src/index.ts"],
  format: ["esm"],
  clean: true,
  sourcemap: true,
  dts: true,
  treeshake: true,
  minify: true,
  target: "es2024",
});
