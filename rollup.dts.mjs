import dts from "rollup-plugin-dts";

export default [
  {
    input: "src/main.ts",
    output: { file: "dist/index.d.ts", format: "es" },
    plugins: [
      dts({
        tsconfig: "tsconfig.json",
      }),
    ],
  },
];
