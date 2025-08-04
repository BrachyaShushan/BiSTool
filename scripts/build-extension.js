#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Building BiSTool VS Code Extension...\n");

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

  // Step 2.5: Copy icon to dist folder
  console.log("\n🖼️  Copying icon to dist folder...");
  const iconSource = path.join(process.cwd(), "public", "icon.png");
  const iconDest = path.join(process.cwd(), "dist", "icon.png");

  if (fs.existsSync(iconSource)) {
    fs.copyFileSync(iconSource, iconDest);
    console.log("✅ Icon copied successfully");
  } else {
    console.warn("⚠️  Icon not found at:", iconSource);
  }

  // Step 3: Build extension
  console.log("\n🔧 Building VS Code extension...");
  execSync("npm run build:extension", { stdio: "inherit" });

  // Step 4: Verify extension files exist
  console.log("\n🔍 Verifying extension files...");
  const extensionFile = path.join(
    process.cwd(),
    "dist",
    "extension",
    "extension.js"
  );
  const indexFile = path.join(process.cwd(), "dist", "index.html");
  const iconFile = path.join(process.cwd(), "dist", "icon.png");

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

  // Step 5: Check if vsce is installed
  console.log("\n📦 Checking for vsce...");
  try {
    execSync("vsce --version", { stdio: "pipe" });
  } catch (error) {
    console.log("Installing vsce globally...");
    execSync("npm install -g vsce", { stdio: "inherit" });
  }

  // Step 6: Package extension
  console.log("\n📦 Packaging extension...");
  try {
    execSync('echo "y\ny" | vsce package', { stdio: "inherit" });
  } catch (error) {
    console.log("Trying alternative packaging method...");
    execSync("vsce package --no-yarn", { stdio: "inherit" });
  }

  console.log("\n✅ Extension built successfully!");
  console.log("📁 Look for the .vsix file in the current directory");
  console.log("💡 To install in VS Code/Cursor:");
  console.log("   1. Open VS Code/Cursor");
  console.log("   2. Go to Extensions (Ctrl+Shift+X)");
  console.log('   3. Click "..." and select "Install from VSIX..."');
  console.log("   4. Choose the generated .vsix file");
  console.log("\n🔧 To test the extension:");
  console.log("   1. Press F5 in VS Code to launch extension development host");
  console.log("   2. Use Ctrl+Shift+P and type 'Open BiSTool'");
} catch (error) {
  console.error("\n❌ Build failed:", error.message);
  process.exit(1);
}
