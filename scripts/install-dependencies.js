#!/usr/bin/env node

const { execSync } = require('child_process');
const os = require('os');

console.log('Installing platform-specific dependencies...');

const platform = os.platform();
const arch = os.arch();

console.log(`Platform: ${platform}, Architecture: ${arch}`);

try {
  if (platform === 'win32' && arch === 'x64') {
    console.log('Installing Windows x64 Rollup dependency...');
    execSync('npm install --save-dev @rollup/rollup-win32-x64-msvc@^4.21.0', { stdio: 'inherit' });
  } else if (platform === 'linux' && arch === 'x64') {
    console.log('Installing Linux x64 Rollup dependency...');
    execSync('npm install --save-dev @rollup/rollup-linux-x64-gnu@^4.21.0', { stdio: 'inherit' });
  } else {
    console.log(`No specific Rollup dependency for platform ${platform}-${arch}`);
  }
  
  console.log('Platform-specific dependencies installed successfully!');
} catch (error) {
  console.log('Failed to install platform-specific dependencies:', error.message);
  console.log('This is not critical - the build will continue with fallback options.');
} 