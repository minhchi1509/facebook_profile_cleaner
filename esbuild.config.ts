import * as esbuild from "esbuild";

async function build() {
  // Build CJS version
  await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/index.cjs",
    format: "cjs",
    platform: "node",
    tsconfig: "tsconfig.json",
  });

  // Build ESM version
  await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/index.esm.js",
    format: "esm",
    platform: "node",
    tsconfig: "tsconfig.json",
  });
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
