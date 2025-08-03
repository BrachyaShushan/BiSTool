#!/usr/bin/env node

// Patch script to handle Rollup native module issues
console.log("🔧 Applying Rollup native module patch...");

const fs = require("fs");
const path = require("path");

// Create mock modules for all problematic native modules
const mockModules = [
  "@rollup/rollup-linux-x64-gnu",
  "@rollup/rollup-darwin-x64",
  "@rollup/rollup-win32-x64-msvc",
  "@rollup/rollup-win32-arm64-msvc",
  "@rollup/rollup-darwin-arm64",
];

const mockIndexJs = `
// Mock module for platform-specific Rollup native modules
// This prevents the native module error on platforms where they're not available
module.exports = {
  default: null,
  __esModule: true
};
`;

mockModules.forEach((moduleName) => {
  const mockModulePath = path.join(__dirname, "../node_modules", moduleName);
  const mockModuleDir = path.dirname(mockModulePath);

  // Create the directory if it doesn't exist
  if (!fs.existsSync(mockModuleDir)) {
    fs.mkdirSync(mockModuleDir, { recursive: true });
  }

  // Create a mock package.json
  const mockPackageJson = {
    name: moduleName,
    version: "1.0.0",
    main: "index.js",
    type: "commonjs",
  };

  // Write the mock files
  fs.writeFileSync(
    path.join(mockModuleDir, "package.json"),
    JSON.stringify(mockPackageJson, null, 2)
  );
  fs.writeFileSync(path.join(mockModuleDir, "index.js"), mockIndexJs);

  console.log(`✅ Created mock for: ${moduleName}`);
});

console.log("✅ Rollup native module patch applied successfully");
