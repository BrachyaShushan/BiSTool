#!/usr/bin/env node

// Esbuild fallback build script for Netlify deployment
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔄 Trying esbuild fallback...");

// Create a simple HTML template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BiSTool</title>
    <link rel="stylesheet" href="./index.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./index.js"></script>
</body>
</html>`;

// Create dist directory if it doesn't exist
if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist", { recursive: true });
}

// Copy public assets
console.log("📁 Copying public assets...");
if (fs.existsSync("public")) {
  execSync("cp -r public/* dist/", { stdio: "inherit" });
}

// Copy CSS file
console.log("📄 Copying CSS file...");
if (fs.existsSync("src/index.css")) {
  fs.copyFileSync("src/index.css", "dist/index.css");
}

// Create HTML file
console.log("📄 Creating HTML file...");
fs.writeFileSync("dist/index.html", htmlTemplate);

// Build with esbuild
console.log("🏗️ Building with esbuild...");
try {
  execSync(
    "npx esbuild src/index.tsx --bundle --outdir=dist --format=esm --target=esnext --loader:.css=css --loader:.woff2=file --loader:.ttf=file --loader:.png=file --loader:.jpg=file --loader:.jpeg=file --loader:.gif=file --loader:.svg=file --loader:.ico=file --public-path=/",
    { stdio: "inherit" }
  );
  console.log("✅ Esbuild build completed successfully");
} catch (error) {
  console.error("❌ Esbuild build failed");
  throw error;
}
