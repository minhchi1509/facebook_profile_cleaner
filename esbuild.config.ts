import * as esbuild from "esbuild";

async function build() {
  // Build CJS version
  await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/main.cjs",
    format: "cjs",
    minify: true,
    treeShaking: true,
    platform: "node",
    tsconfig: "tsconfig.json",
  });

  // Build ESM version
  await esbuild.build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/main.esm.js",
    format: "esm",
    platform: "node",
    tsconfig: "tsconfig.json",
    minify: true,
    treeShaking: true,
  });
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
