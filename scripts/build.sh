#!/bin/bash

# Build script for Netlify deployment
# This script handles platform-specific Rollup dependencies

echo "🚀 Starting build process..."

# Set environment variables to handle Rollup issues
export ROLLUP_SKIP_NATIVE=true
export NODE_OPTIONS="--max-old-space-size=4096"

# Clean install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Check for platform-specific dependencies
echo "🔍 Checking platform-specific dependencies..."
node -e "
const platforms = [
  '@rollup/rollup-linux-x64-gnu',
  '@rollup/rollup-darwin-x64', 
  '@rollup/rollup-win32-x64-msvc',
  '@rollup/rollup-win32-arm64-msvc',
  '@rollup/rollup-darwin-arm64'
];

let found = false;
for (const platform of platforms) {
  try {
    require(platform);
    console.log('✅ ' + platform + ' found');
    found = true;
    break;
  } catch(e) {
    console.log('❌ ' + platform + ' not found - this is normal');
  }
}

if (!found) {
  console.log('⚠️  No platform-specific Rollup dependency found - using fallback');
}
"

# Run the build
echo "🔨 Running build..."
npm run build

echo "✅ Build completed!" 