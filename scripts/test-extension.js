#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🧪 Testing BiSTool VS Code Extension...\n");

try {
  // Step 1: Verify all required files exist
  console.log("📁 Checking required files...");

  const requiredFiles = [
    "dist/index.html",
    "dist/index.js",
    "dist/extension/extension.js",
    "dist/icon.png",
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file not found: ${file}`);
    }
    console.log(`✅ ${file}`);
  }

  // Step 2: Check if index.html has proper content
  console.log("\n📄 Checking index.html content...");
  const indexContent = fs.readFileSync("dist/index.html", "utf8");

  if (!indexContent.includes('<div id="root"></div>')) {
    throw new Error("index.html missing root div");
  }

  if (!indexContent.includes("<script")) {
    throw new Error("index.html missing script tags");
  }

  console.log("✅ index.html has proper structure");

  // Step 3: Check extension compilation
  console.log("\n🔧 Checking extension compilation...");
  const extensionContent = fs.readFileSync(
    "dist/extension/extension.js",
    "utf8"
  );

  if (!extensionContent.includes("BiSToolPanel")) {
    throw new Error("Extension missing BiSToolPanel class");
  }

  if (!extensionContent.includes("createOrShow")) {
    throw new Error("Extension missing createOrShow method");
  }

  console.log("✅ Extension compiled correctly");

  // Step 4: Check icon file
  console.log("\n🖼️  Checking icon file...");
  const iconStats = fs.statSync("dist/icon.png");

  if (iconStats.size < 1000) {
    throw new Error("Icon file seems too small");
  }

  console.log("✅ Icon file exists and has proper size");

  console.log("\n✅ All tests passed! Extension should work correctly.");
  console.log("\n💡 To test the extension:");
  console.log("   1. Open this project in VS Code");
  console.log("   2. Press F5 to launch extension development host");
  console.log("   3. In the new window, press Ctrl+Shift+P");
  console.log("   4. Type 'Open BiSTool' and select the command");
  console.log("   5. Check the developer console (F12) for any errors");
} catch (error) {
  console.error("\n❌ Test failed:", error.message);
  process.exit(1);
}
