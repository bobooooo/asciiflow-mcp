#!/usr/bin/env node
import { existsSync } from "fs";
import { execSync } from "child_process";

// Only build if we're in a development environment
// (i.e., esbuild is available and client directory exists)
try {
  await import("esbuild");
  if (existsSync("../client")) {
    console.log("Building...");
    execSync("npm run build", { stdio: "inherit" });
  } else {
    console.log("Skipping build: client directory not found (using pre-built dist/index.js)");
  }
} catch (e) {
  console.log("Skipping build: esbuild not available (using pre-built dist/index.js)");
}
