#!/usr/bin/env node

// Comprehensive build script for Netlify deployment
// This script handles the Rollup native module issue by using a different approach

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting Netlify build process...");

// Set environment variables
process.env.ROLLUP_SKIP_NATIVE = "true";
process.env.ROLLUP_SKIP_NATIVE_BINARIES = "true";
process.env.ROLLUP_SKIP_NATIVE_MODULES = "true";
process.env.NODE_OPTIONS = "--max-old-space-size=4096";

// Step 1: Clean install dependencies
console.log("📦 Installing dependencies...");
try {
  execSync("npm ci --legacy-peer-deps", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Failed to install dependencies");
  process.exit(1);
}

// Step 2: Apply Rollup patches
console.log("🔧 Applying Rollup patches...");
try {
  execSync("node scripts/patch-rollup.js", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Failed to apply Rollup patches");
  process.exit(1);
}

// Step 3: Compile TypeScript
console.log("🔨 Compiling TypeScript...");
try {
  execSync("tsc", { stdio: "inherit" });
} catch (error) {
  console.error("❌ TypeScript compilation failed");
  process.exit(1);
}

// Step 4: Build with Vite (with fallback)
console.log("🏗️ Building with Vite...");
try {
  execSync("vite build", { stdio: "inherit" });
} catch (error) {
  console.error("❌ Vite build failed, trying alternative approach...");

  // Alternative: Try building with webpack (avoids Rollup entirely)
  console.log("🔄 Trying webpack build...");
  try {
    execSync("node scripts/build-webpack.js", { stdio: "inherit" });
    console.log("✅ Build completed with webpack");
  } catch (webpackError) {
    console.error("❌ All build methods failed");
    process.exit(1);
  }
}

console.log("✅ Build completed successfully!");
