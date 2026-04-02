import typescript from "@rollup/plugin-typescript";
import type { RollupOptions } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const input = "src/main.ts";
const extensions = [".ts", ".js", ".mjs"];

const config: RollupOptions[] = [
  // Main bundle
  {
    input,
    output: [
      {
        file: "dist/main.cjs",
        format: "cjs",
        exports: "auto",
        sourcemap: false,
      },
      {
        file: "dist/main.mjs",
        format: "esm",
        sourcemap: false,
      },
    ],
    external: [/node_modules/],
    plugins: [
      resolve({ extensions }),
      commonjs(),
      typescript({
        tsconfig: "tsconfig.json",
      }),
    ],
  },
];

export default config;
