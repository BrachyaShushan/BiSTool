#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

console.log("🔧 Setting up BiSTool Extension for Development...\n");

try {
  // Step 1: Build React app
  console.log("📦 Building React application...");
  execSync("npm run build", { stdio: "inherit" });

  // Step 2: Build extension
  console.log("\n🔧 Building VS Code extension...");
  execSync("npm run build:extension", { stdio: "inherit" });

  console.log("\n✅ Development setup complete!");
  console.log("\n📋 Next steps:");
  console.log("1. Open this folder in VS Code/Cursor");
  console.log("2. Press F5 to start debugging the extension");
  console.log("3. In the new Extension Development Host window:");
  console.log("   - Press Ctrl+Shift+P (or Cmd+Shift+P on Mac)");
  console.log('   - Type "Open BiSTool" and select it');
  console.log("4. The extension will open in a webview");
  console.log("\n💡 To make changes:");
  console.log("- Edit React components in src/components/");
  console.log("- Edit extension code in src/extension/");
  console.log('- Run "npm run build" to rebuild React app');
  console.log('- Run "npm run build:extension" to rebuild extension');
  console.log("- Press F5 again to reload the extension");
} catch (error) {
  console.error("\n❌ Setup failed:", error.message);
  process.exit(1);
}
