/**
 * Custom ESM loader to resolve extensionless imports in the dist/ directory.
 * Handles both #asciiflow/* package imports and bare extensionless file imports.
 *
 * Usage: node --loader ./mcp/loader.mjs mcp/test-canvas.mjs
 */

import { existsSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

export async function resolve(specifier, context, nextResolve) {
  // Handle #asciiflow/* package imports (from package.json imports field)
  // These get resolved to file:// URLs without .js by the package imports field
  // We intercept them here before they fail
  if (specifier.startsWith("#asciiflow/")) {
    const relative = specifier.slice("#asciiflow/".length);
    const loaderDir = new URL(".", import.meta.url).pathname;
    const candidates = [
      path.join(loaderDir, "dist", relative + ".js"),
      path.join(loaderDir, "dist", relative),
    ];
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return { url: pathToFileURL(candidate).href, shortCircuit: true };
      }
    }
  }

  // Handle extensionless file:// imports (e.g. from compiled dist/ files)
  if (context.parentURL && context.parentURL.startsWith("file://")) {
    const parentPath = fileURLToPath(context.parentURL);
    const parentDir = path.dirname(parentPath);

    // Only handle relative imports without extension
    if (
      (specifier.startsWith("./") || specifier.startsWith("../")) &&
      !path.extname(specifier)
    ) {
      const resolved = path.resolve(parentDir, specifier);
      const candidates = [resolved + ".js", resolved + "/index.js"];
      for (const candidate of candidates) {
        if (existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
  }

  return nextResolve(specifier, context);
}
