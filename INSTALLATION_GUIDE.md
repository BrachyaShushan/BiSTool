# BiSTool VS Code Extension - Installation Guide

## 🎉 Success! Your BiSTool VS Code Extension is Ready

The extension has been successfully built and packaged. You now have a `BiSTool-1.0.0.vsix` file that can be installed in VS Code or Cursor IDE.

## 📦 Installation Steps

### Method 1: Install from VSIX File (Recommended)

1. **Open VS Code or Cursor IDE**
2. **Open Extensions Panel**:
   - Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
   - Or click the Extensions icon in the sidebar
3. **Install from VSIX**:
   - Click the "..." (three dots) menu in the Extensions panel
   - Select "Install from VSIX..."
   - Navigate to your project folder and select `BiSTool-1.0.0.vsix`
   - Click "Install"

### Method 2: Command Line Installation

```bash
# Install the extension using the command line
code --install-extension BiSTool-1.0.0.vsix
```

## 🚀 Using the Extension

### Opening BiSTool

1. **Command Palette Method**:

   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
   - Type "Open BiSTool"
   - Select the command from the list

2. **Extension Panel**:
   - Go to the Extensions panel
   - Find "BiSTool" in your installed extensions
   - Click "Open BiSTool"

### What You'll See

- **Webview Panel**: BiSTool will open in a new tab within VS Code/Cursor
- **Full Functionality**: All BiSTool features are available:
  - API Testing and Request Building
  - YAML Generation
  - AI Test Creation
  - Project Management
  - Variable Management
  - Token Management

## 🔧 Development

### Building for Development

```bash
# Build React app
npm run build

# Build extension
npm run build:extension

# Full build with packaging
npm run build:full
```

### Development Setup

```bash
# Set up for development
npm run dev:extension
```

### Debugging

1. Open the project in VS Code
2. Press `F5` to start debugging
3. A new Extension Development Host window will open
4. Use the command palette to test the extension

## 📁 Project Structure

```
BiSTool/
├── src/
│   ├── extension/          # VS Code extension code
│   │   └── extension.ts    # Main extension file
│   ├── components/         # React components
│   ├── context/           # React context providers
│   └── ...                # Other React app files
├── dist/                  # Built files
│   ├── extension/         # Extension files
│   ├── index.html         # React app
│   └── ...               # Other built assets
├── BiSTool-1.0.0.vsix    # Extension package
├── package.json           # Extension + React app config
├── tsconfig.extension.json # Extension TypeScript config
└── vite.config.ts         # React app build config
```

## 🛠️ Customization

### Modifying the Extension

- **Extension Logic**: Edit `src/extension/extension.ts`
- **React App**: Edit files in `src/components/`, `src/context/`, etc.
- **Build Configuration**: Modify `vite.config.ts` for React app, `tsconfig.extension.json` for extension

### Adding Features

1. **Extension Features**: Add commands, views, or webview panels in `src/extension/extension.ts`
2. **React App Features**: Add components, contexts, or utilities in the `src/` directory
3. **Rebuild**: Run `npm run build:full` to rebuild and package

## 🔍 Troubleshooting

### Common Issues

1. **"Build Required" Message**:

   - Run `npm run build` to build the React application
   - Ensure the `dist/` directory contains the built files

2. **Extension Not Loading**:

   - Check that the extension is properly built
   - Verify the `dist/extension/extension.js` file exists

3. **Webview Not Displaying**:
   - Check browser console for errors (right-click in webview → Inspect)
   - Ensure all assets are properly built

### Debugging

1. **Extension Logs**:

   - Open Developer Console (Help > Toggle Developer Tools)
   - Check for extension-related errors

2. **Webview Debugging**:
   - Right-click in the webview and select "Inspect Element"
   - Use browser developer tools to debug the React app

## 📝 Next Steps

1. **Test the Extension**: Install and test all features
2. **Customize**: Modify the extension to suit your needs
3. **Distribute**: Share the `.vsix` file with others
4. **Publish**: Consider publishing to the VS Code Marketplace

## 🎯 Features Available

- ✅ **API Testing**: Create and execute HTTP requests
- ✅ **YAML Generation**: Generate YAML configurations
- ✅ **AI Test Creation**: Use AI to generate test cases
- ✅ **Project Management**: Organize your API testing projects
- ✅ **Variable Management**: Handle environment variables
- ✅ **Token Management**: Secure token storage and usage
- ✅ **Monaco Editor Integration**: Rich code editing
- ✅ **Theme Integration**: Respects VS Code/Cursor themes

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Review the `VSCODE_EXTENSION_README.md` for detailed documentation
3. Check the browser console for error messages
4. Ensure all dependencies are properly installed

---

**🎉 Congratulations!** Your BiSTool is now available as a VS Code/Cursor extension. Enjoy using it for your API testing needs!
