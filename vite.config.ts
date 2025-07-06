import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate React and React DOM into their own chunk
          "react-vendor": ["react", "react-dom"],
          // Separate Monaco Editor into its own chunk (it's very large)
          "monaco-editor": ["@monaco-editor/react", "monaco-editor"],
          // Separate UI libraries
          "ui-vendor": [
            "@headlessui/react",
            "@radix-ui/react-dialog",
            "react-icons",
            "react-loading-skeleton",
          ],
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
