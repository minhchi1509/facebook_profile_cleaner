import typescript from "@rollup/plugin-typescript";
import type { RollupOptions } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

const input = "src/main.ts";
const extensions = [".ts", ".js", ".mjs"];

const config: RollupOptions[] = [
  // Main bundle
  {
    input,
    output: [
      {
        file: "dist/index.cjs",
        format: "cjs",
        exports: "auto",
        sourcemap: false,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: false,
      },
    ],
    plugins: [
      resolve({ extensions }),
      commonjs(),
      json(),
      typescript({
        tsconfig: "tsconfig.json",
      }),
    ],
  },
];

export default config;
