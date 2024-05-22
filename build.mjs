import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "esnext",
  format: "esm",
  outfile: "index.js",
  packages: "external",
});
