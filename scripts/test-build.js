#!/usr/bin/env node

// Simple test script to verify the build works locally
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const http = require("http");
const url = require("url");

console.log("🧪 Testing build locally...");

// First, run the build
console.log("🏗️ Running build...");
try {
  execSync("npm run build:simple", { stdio: "inherit" });
  console.log("✅ Build completed successfully!");
} catch (error) {
  console.error("❌ Build failed:", error.message);
  process.exit(1);
}

// Check if dist files exist
console.log("📁 Checking build output...");
const requiredFiles = ["index.html", "index.js", "index.css"];
const missingFiles = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join("dist", file))) {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error("❌ Missing required files:", missingFiles);
  process.exit(1);
}

console.log("✅ All required files present!");

// List dist contents
console.log("📋 Dist directory contents:");
const distContents = fs.readdirSync("dist");
distContents.forEach((item) => {
  const stats = fs.statSync(path.join("dist", item));
  const size = stats.isDirectory()
    ? "DIR"
    : `${(stats.size / 1024).toFixed(1)}KB`;
  console.log(`  ${item} (${size})`);
});

// Create a simple HTTP server to test the build
console.log("🌐 Starting test server on http://localhost:3000...");
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let filePath = path.join(
    "dist",
    parsedUrl.pathname === "/" ? "index.html" : parsedUrl.pathname
  );

  // Security: prevent directory traversal
  if (!filePath.startsWith(path.resolve("dist"))) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);

    let contentType = "text/plain";
    switch (ext) {
      case ".html":
        contentType = "text/html";
        break;
      case ".js":
        contentType = "application/javascript";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".woff2":
        contentType = "font/woff2";
        break;
    }

    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch (error) {
    res.writeHead(404);
    res.end("File not found");
  }
});

server.listen(3000, () => {
  console.log("✅ Test server running at http://localhost:3000");
  console.log("📝 Press Ctrl+C to stop the server");
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped");
    process.exit(0);
  });
});
