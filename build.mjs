#!/usr/bin/env node
import { build } from "esbuild";
import { readFileSync, writeFileSync } from "fs";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: "dist/index.js",
  external: ["@modelcontextprotocol/sdk", "zod"],
  banner: {
    js: "#!/usr/bin/env node\n",
  },
  alias: {
    "#asciiflow/client/layer.js": "../client/layer.ts",
    "#asciiflow/client/vector.js": "../client/vector.ts",
    "#asciiflow/client/text_utils.js": "../client/text_utils.ts",
    "#asciiflow/client/constants.js": "../client/constants.ts",
    "#asciiflow/client/draw/utils.js": "../client/draw/utils.ts",
    "#asciiflow/client/common.js": "../client/common.ts",
  },
});

// Make executable
import { chmodSync } from "fs";
chmodSync("dist/index.js", 0o755);

console.log("✓ Built dist/index.js");
