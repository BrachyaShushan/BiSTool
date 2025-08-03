#!/usr/bin/env node

// Webpack build script as fallback for Netlify deployment
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🔄 Trying webpack build...");

// Create webpack configuration
const webpackConfig = `
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'js/[name]-[contenthash].js',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
  module: {
    rules: [
      {
        test: /\\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      {
        test: /\\.(png|svg|jpg|jpeg|gif)$/,
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
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
  performance: {
    hints: false,
  },
};
`;

// Create webpack config file
fs.writeFileSync("webpack.config.js", webpackConfig);
console.log("🔧 Creating webpack build configuration...");

// Install webpack dependencies
console.log("📦 Installing webpack dependencies...");
try {
  execSync(
    "npm install --save-dev webpack webpack-cli ts-loader html-webpack-plugin mini-css-extract-plugin css-loader postcss-loader",
    { stdio: "inherit" }
  );
} catch (error) {
  console.error("❌ Failed to install webpack dependencies");
  throw error;
}

// Build with webpack
console.log("🏗️ Building with webpack...");
try {
  execSync("npx webpack --config webpack.config.js", { stdio: "inherit" });
  console.log("✅ Webpack build completed successfully");
} catch (error) {
  console.error("❌ Webpack build failed");
  throw error;
} finally {
  // Clean up
  if (fs.existsSync("webpack.config.js")) {
    fs.unlinkSync("webpack.config.js");
  }
}
