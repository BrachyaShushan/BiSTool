#!/usr/bin/env node

// Webpack-based build script as an alternative to Vite
// This avoids the Rollup native module issues entirely

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔧 Creating webpack build configuration...");

// Create a simple webpack config
const webpackConfig = `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name]-[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  module: {
    rules: [
      {
        test: /\\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name]-[contenthash][ext]',
        },
      },
      {
        test: /\\.(png|svg|jpg|jpeg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name]-[contenthash][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name]-[contenthash].css',
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\\\/]node_modules[\\\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
};
`;

// Create webpack config file
fs.writeFileSync("webpack.config.js", webpackConfig);
console.log("✅ Webpack config created");

// Install webpack dependencies if needed
console.log("📦 Installing webpack dependencies...");
try {
  execSync(
    "npm install --save-dev webpack webpack-cli ts-loader html-webpack-plugin mini-css-extract-plugin css-loader postcss-loader",
    { stdio: "inherit" }
  );
} catch (error) {
  console.log("⚠️ Webpack dependencies already installed or failed to install");
}

// Run webpack build
console.log("🏗️ Building with webpack...");
try {
  execSync("npx webpack --config webpack.config.js", { stdio: "inherit" });
  console.log("✅ Webpack build completed successfully");
} catch (error) {
  console.error("❌ Webpack build failed");
  process.exit(1);
}

// Clean up webpack config
fs.unlinkSync("webpack.config.js");
console.log("✅ Build completed successfully!");
