import * as esbuild from "esbuild";

const externals = [
  "fast-csv",
  "@fast-csv/format",
  "@fast-csv/parser",
  "axios",
  "dayjs",
  "tslib",
];
const commonEsbuildOptions: esbuild.BuildOptions = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  platform: "node",
  tsconfig: "tsconfig.json",
  external: externals,
};

async function build() {
  // Build CJS version
  await esbuild.build({
    ...commonEsbuildOptions,
    outfile: "dist/main.cjs",
    format: "cjs",
  });

  // Build ESM version
  await esbuild.build({
    ...commonEsbuildOptions,
    outfile: "dist/main.mjs",
    format: "esm",
  });
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
