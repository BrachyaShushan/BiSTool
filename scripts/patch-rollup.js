#!/usr/bin/env node

// Patch script to handle Rollup native module issues
console.log("🔧 Applying Rollup native module patch...");

const fs = require("fs");
const path = require("path");

// First, let's patch the Rollup native module loader directly
const rollupNativePath = path.join(
  __dirname,
  "../node_modules/rollup/dist/native.js"
);

if (fs.existsSync(rollupNativePath)) {
  console.log("🔧 Patching Rollup native module loader...");

  // Create a completely new native.js file that handles the error gracefully
  const patchedContent = `// Patched Rollup native module loader
// This version handles missing platform-specific modules gracefully

function requireWithFriendlyError(id) {
  try {
    return require(id);
  } catch (e) {
    // If it's a platform-specific Rollup module, return a mock
    if (id.includes('@rollup/rollup-') && (id.includes('-x64-') || id.includes('-arm64-'))) {
      console.log('🚫 Mocking native module:', id);
      return { default: null, __esModule: true };
    }
    throw e;
  }
}

// Export the patched function
module.exports = requireWithFriendlyError;
`;

  fs.writeFileSync(rollupNativePath, patchedContent);
  console.log("✅ Rollup native module loader patched");
}

// Also patch the module resolution at a lower level
console.log("🔧 Patching Node.js module resolution...");

// Create a patch for the module resolution
const modulePatchPath = path.join(
  __dirname,
  "../node_modules/rollup/dist/module-patch.js"
);
const modulePatchContent = `
// Module resolution patch for Rollup
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function(request, parent, isMain, options) {
  if (request.includes('@rollup/rollup-') && (request.includes('-x64-') || request.includes('-arm64-'))) {
    console.log('🚫 Blocked native module resolution:', request);
    throw new Error('Native module not available on this platform');
  }
  return originalResolveFilename(request, parent, isMain, options);
};
`;

fs.writeFileSync(modulePatchPath, modulePatchContent);
console.log("✅ Module resolution patch created");

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
