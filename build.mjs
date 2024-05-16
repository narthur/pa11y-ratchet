import * as esbuild from "esbuild";

const js = `#!/usr/bin/env node

import { createRequire } from 'module';
import * as url from 'url';

const require = createRequire(import.meta.url);
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = url.fileURLToPath(new URL('.', import.meta.url));
`;

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "esnext",
  format: "esm",
  outfile: "dist/index.js",
  banner: {
    js,
  },
});
