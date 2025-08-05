#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Setting up BiSTool VS Code Extension for development...\n");

try {
  // Step 1: Install dependencies if needed
  console.log("📦 Checking dependencies...");
  if (!fs.existsSync("node_modules")) {
    console.log("Installing dependencies...");
    execSync("npm install", { stdio: "inherit" });
  }

  // Step 2: Build React application
  console.log("\n🔨 Building React application...");
  execSync("npm run build:simple", { stdio: "inherit" });

  // Step 3: Copy icon to dist folder
  console.log("\n🖼️  Copying icon to dist folder...");
  const iconSource = path.join(process.cwd(), "public", "icon.webp");
  const iconDest = path.join(process.cwd(), "dist", "icon.webp");

  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, iconDest);
    console.log("✅ Icon copied successfully");
  } else {
    console.warn("⚠️  Icon not found at:", iconSource);
  }

  // Step 4: Build extension
  console.log("\n🔧 Building VS Code extension...");
  execSync("npm run build:extension", { stdio: "inherit" });

  // Step 5: Verify files exist
  console.log("\n🔍 Verifying extension files...");
  const extensionFile = path.join(
    process.cwd(),
    "dist",
    "extension",
    "extension.js"
  );
  const indexFile = path.join(process.cwd(), "dist", "index.html");
  const iconFile = path.join(process.cwd(), "dist", "icon.webp");

  if (!fs.existsSync(extensionFile)) {
    throw new Error("Extension file not found: " + extensionFile);
  }
  if (!fs.existsSync(indexFile)) {
    throw new Error("Index.html not found: " + indexFile);
  }
  if (!fs.existsSync(iconFile)) {
    throw new Error("Icon file not found: " + iconFile);
  }

  console.log("✅ All required files found");

  console.log("\n✅ Extension development setup complete!");
  console.log("\n🔧 To test the extension:");
  console.log("   1. Open this project in VS Code");
  console.log("   2. Press F5 to launch extension development host");
  console.log("   3. In the new VS Code window, press Ctrl+Shift+P");
  console.log("   4. Type 'Open BiSTool' and select the command");
  console.log("   5. The extension should open in a new tab");
  console.log("\n💡 If you see a 404 error:");
  console.log("   - Check the developer console (F12) for errors");
  console.log("   - Verify that dist/index.html exists and is valid");
  console.log("   - Make sure all assets are properly built");
} catch (error) {
  console.error("\n❌ Setup failed:", error.message);
  process.exit(1);
}
