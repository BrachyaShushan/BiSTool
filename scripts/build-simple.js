#!/usr/bin/env node

// Simple build script using esbuild to avoid Rollup issues
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Starting simple build process...");

// Set environment variables to avoid native module issues
process.env.ROLLUP_SKIP_NATIVE = "true";
process.env.ROLLUP_SKIP_NATIVE_BINARIES = "true";
process.env.ROLLUP_SKIP_NATIVE_MODULES = "true";

// Create dist directory
if (!fs.existsSync("dist")) {
  fs.mkdirSync("dist", { recursive: true });
}

// Copy public assets
console.log("📁 Copying public assets...");
if (fs.existsSync("public")) {
  // Use cross-platform file copying
  const copyDir = (src, dest) => {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (fs.statSync(srcPath).isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  };

  copyDir("public", "dist");
}

// Process CSS file with Tailwind CSS
console.log("📄 Processing CSS file with Tailwind...");
let cssContent = "";
if (fs.existsSync("src/index.css")) {
  // Use Tailwind CSS CLI to process the CSS
  try {
    const tailwindOutput = execSync(
      "npx tailwindcss -i src/index.css -o dist/temp.css --minify",
      { encoding: "utf8" }
    );
    cssContent = fs.readFileSync("dist/temp.css", "utf8");

    // Fix font paths to be relative
    cssContent = cssContent.replace(/url\("\/fonts\//g, 'url("./fonts/');

    // Clean up temp file
    if (fs.existsSync("dist/temp.css")) {
      fs.unlinkSync("dist/temp.css");
    }
  } catch (error) {
    console.warn(
      "⚠️ Tailwind CSS processing failed, using original CSS:",
      error.message
    );
    cssContent = fs.readFileSync("src/index.css", "utf8");
    // Fix font paths to be relative
    cssContent = cssContent.replace(/url\("\/fonts\//g, 'url("./fonts/');
  }
}

// Create a simple HTML file with inline CSS
const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BiSTool - API Testing Tool</title>
    <link rel="icon" type="image/svg+xml" href="./icon.webp">
    <style>
${cssContent}
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./index.js"></script>
</body>
</html>`;

fs.writeFileSync("dist/index.html", htmlContent);

// Create a temporary entry point without CSS imports
console.log("📄 Creating temporary entry point...");
const originalEntryContent = fs.readFileSync("src/index.tsx", "utf8");
const tempEntryContent = originalEntryContent.replace(
  /import\s+['"]\.\/index\.css['"];?\s*/g,
  ""
);

const tempEntryPath = "src/index.temp.tsx";
fs.writeFileSync(tempEntryPath, tempEntryContent);

// Build with esbuild
console.log("🏗️ Building with esbuild...");
try {
  execSync(
    `npx esbuild ${tempEntryPath} --bundle --outdir=dist --format=esm --target=esnext --loader:.woff2=file --loader:.ttf=file --loader:.png=file --loader:.jpg=file --loader:.jpeg=file --loader:.gif=file --loader:.svg=file --loader:.ico=file --public-path=./ --minify`,
    { stdio: "inherit" }
  );

  // Rename the output file
  if (fs.existsSync("dist/index.temp.js")) {
    fs.renameSync("dist/index.temp.js", "dist/index.js");
  }

  // Clean up temporary CSS file if it exists
  if (fs.existsSync("dist/index.temp.css")) {
    fs.unlinkSync("dist/index.temp.css");
  }

  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
} finally {
  // Clean up temporary file
  if (fs.existsSync(tempEntryPath)) {
    fs.unlinkSync(tempEntryPath);
  }
}
