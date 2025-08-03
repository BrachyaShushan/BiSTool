#!/usr/bin/env node

// Simplified Vite build script that avoids Rollup native module issues
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Creating simplified Vite configuration...");

// Create a minimal Vite config that avoids problematic Rollup features
const viteConfig = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress all warnings to avoid issues
        return;
      },
      external: (id) => {
        // Externalize problematic modules
        if (id.includes('@rollup/rollup-') || id.includes('native.js')) {
          return true;
        }
        return false;
      },
    },
  },
  optimizeDeps: {
    exclude: ['@rollup/rollup-linux-x64-gnu', '@rollup/rollup-darwin-x64', '@rollup/rollup-win32-x64-msvc'],
  },
});
`;

// Create the config file
fs.writeFileSync("vite.config.simple.js", viteConfig);
console.log("✅ Simplified Vite config created");

// Run the build
console.log("🏗️ Building with simplified Vite...");
try {
  execSync("vite build --config vite.config.simple.js", { stdio: "inherit" });
  console.log("✅ Simplified Vite build completed");
} catch (error) {
  console.error("❌ Simplified Vite build failed");
  throw error;
} finally {
  // Clean up
  if (fs.existsSync("vite.config.simple.js")) {
    fs.unlinkSync("vite.config.simple.js");
  }
}
