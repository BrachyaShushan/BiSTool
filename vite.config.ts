import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Enhanced plugin to handle asset paths for VS Code extension
function vsCodeExtensionPlugin() {
  return {
    name: "vscode-extension-assets",
    generateBundle(options, bundle) {
      // Update asset references in JS files to use relative paths
      for (const fileName in bundle) {
        const file = bundle[fileName];
        if (file.type === "chunk" && file.code) {
          // Replace absolute CSS paths with relative paths
          file.code = file.code.replace(/href="\/css\//g, 'href="./css/');
          file.code = file.code.replace(/href="\/js\//g, 'href="./js/');
          file.code = file.code.replace(/href="\/assets\//g, 'href="./assets/');
          file.code = file.code.replace(/href="\/fonts\//g, 'href="./fonts/');

          // Handle Monaco Editor specific CSS paths with multiple strategies
          file.code = file.code.replace(
            /href="\/css\/monaco-editor-[^"]+\.css"/g,
            (match) => {
              const cssFileName = match.match(/monaco-editor-[^"]+\.css/)?.[0];
              if (cssFileName) {
                return `href="./css/${cssFileName}"`;
              }
              return match;
            }
          );

          // Handle any remaining absolute paths
          file.code = file.code.replace(
            /(href|src)="\/[^"]*"/g,
            (match, attr) => {
              const path = match.match(/"[^"]*"/)?.[0]?.slice(1, -1);
              if (path && path.startsWith("/")) {
                return `${attr}="./${path.slice(1)}"`;
              }
              return match;
            }
          );

          // Add Monaco Editor CSS loading fallback
          if (file.code.includes("monaco-editor")) {
            file.code = file.code.replace(
              /(import.*monaco-editor.*)/g,
              `$1
              // Monaco Editor CSS loading fallback for VS Code extension
              if (typeof window !== 'undefined' && typeof window.acquireVsCodeApi === 'function') {
                const loadMonacoCSS = () => {
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.type = 'text/css';
                  link.href = './css/monaco-editor-CVj9lebq.css';
                  link.onerror = () => {
                    console.warn('Failed to load Monaco Editor CSS, trying alternative path');
                    const altLink = document.createElement('link');
                    altLink.rel = 'stylesheet';
                    altLink.type = 'text/css';
                    altLink.href = './css/monaco-editor.css';
                    document.head.appendChild(altLink);
                  };
                  document.head.appendChild(link);
                };
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', loadMonacoCSS);
                } else {
                  loadMonacoCSS();
                }
              }`
            );
          }
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    vsCodeExtensionPlugin(),
    {
      name: "copy-icon",
      generateBundle() {
        // Copy icon to dist folder
        const iconSource = path.join(__dirname, "public", "icon.png");
        const iconDest = path.join(__dirname, "dist", "icon.png");

        if (fs.existsSync(iconSource)) {
          fs.copyFileSync(iconSource, iconDest);
          console.log("✅ Icon copied to dist folder");
        }
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React and React DOM into their own chunk
          "react-vendor": ["react", "react-dom"],
          // Separate Monaco Editor into its own chunk (it's very large)
          "monaco-editor": ["@monaco-editor/react", "monaco-editor"],
          // Separate UI libraries
          "ui-vendor": ["react-icons", "react-loading-skeleton"],
          // Separate utility libraries
          "utils-vendor": ["jsonata", "uuid"],
          // Separate AI SDK
          "ai-vendor": ["@anthropic-ai/sdk"],
        },
        // Optimize chunk naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split("/").pop()
            : "chunk";
          return `js/[name]-[hash].js`;
        },
        entryFileNames: "js/[name]-[hash].js",
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return `css/[name]-[hash].${ext}`;
          }
          if (/\.(png|jpe?g|gif|svg|ico|webp)$/.test(assetInfo.name)) {
            return `images/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Increase chunk size warning limit if needed
    chunkSizeWarningLimit: 1000,
    // Enable minification
    minify: "terser",
    // Enable tree shaking
    target: "esnext",
  },
  esbuild: {
    loader: "tsx",
    include: /\.[jt]sx?$/,
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".ts": "tsx",
      },
    },
    // Pre-bundle Monaco Editor to improve performance
    include: ["@monaco-editor/react", "monaco-editor"],
  },
});
