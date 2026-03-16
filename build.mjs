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
    "#asciiflow/client/layer.js": "./client-repo/client/layer.ts",
    "#asciiflow/client/vector.js": "./client-repo/client/vector.ts",
    "#asciiflow/client/text_utils.js": "./client-repo/client/text_utils.ts",
    "#asciiflow/client/constants.js": "./client-repo/client/constants.ts",
    "#asciiflow/client/draw/utils.js": "./client-repo/client/draw/utils.ts",
    "#asciiflow/client/common.js": "./client-repo/client/common.ts",
  },
});

// Make executable
import { chmodSync } from "fs";
chmodSync("dist/index.js", 0o755);

console.log("✓ Built dist/index.js");
