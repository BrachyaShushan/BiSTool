# BiSTool VS Code Extension

This extension allows you to run BiSTool (API Testing Tool with YAML generation and AI test creation) directly within VS Code or Cursor IDE using a webview.

## Features

- **Integrated Webview**: Run BiSTool directly in VS Code/Cursor without opening a separate browser
- **Full Functionality**: All BiSTool features including API testing, YAML generation, and AI test creation
- **Seamless Integration**: Access BiSTool through the command palette

## Installation

### For Development

1. **Build the React Application**:

   ```bash
   npm run build
   ```

2. **Build the Extension**:

   ```bash
   npm run build:extension
   ```

3. **Install Dependencies** (if not already installed):
   ```bash
   npm install
   ```

### For Distribution

1. **Package the Extension**:

   ```bash
   npm install -g vsce
   vsce package
   ```

2. **Install the VSIX file**:
   - Open VS Code/Cursor
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu and select "Install from VSIX..."
   - Choose the generated `.vsix` file

## Usage

### Opening BiSTool

1. **Command Palette Method**:

   - Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
   - Type "Open BiSTool"
   - Select the command from the list

2. **Keyboard Shortcut** (if configured):
   - Use the configured keyboard shortcut

### Using BiSTool in the Webview

Once opened, BiSTool will appear in a new tab within VS Code/Cursor. You can:

- **API Testing**: Create and execute API requests
- **YAML Generation**: Generate YAML configurations
- **AI Test Creation**: Use AI to generate test cases
- **Project Management**: Manage your API testing projects
- **Variable Management**: Handle environment variables and tokens

### Webview Features

- **Full React App**: The entire BiSTool React application runs in the webview
- **Responsive Design**: Adapts to the webview size
- **Theme Integration**: Respects VS Code/Cursor theme settings
- **Message Communication**: Can communicate with the extension host

## Development

### Project Structure

```
BiSTool/
├── src/
│   ├── extension/          # VS Code extension code
│   │   └── extension.ts    # Main extension file
│   ├── components/         # React components
│   ├── context/           # React context providers
│   └── ...                # Other React app files
├── dist/                  # Built React app (generated)
├── package.json           # Extension + React app config
├── tsconfig.extension.json # Extension TypeScript config
└── vite.config.ts         # Vite build config
```

### Building

1. **Build React App**:

   ```bash
   npm run build
   ```

2. **Build Extension**:

   ```bash
   npm run build:extension
   ```

3. **Development Mode** (for React app):
   ```bash
   npm run dev
   ```

### Extension Development

The extension is located in `src/extension/extension.ts` and handles:

- **Webview Creation**: Creates and manages the webview panel
- **Asset Loading**: Loads the built React app into the webview
- **Message Handling**: Handles communication between webview and extension
- **Resource Management**: Manages extension lifecycle and cleanup

### Key Files

- **`src/extension/extension.ts`**: Main extension entry point
- **`package.json`**: Extension manifest and configuration
- **`tsconfig.extension.json`**: Extension TypeScript configuration
- **`vite.config.ts`**: React app build configuration

## Troubleshooting

### Common Issues

1. **"Build Required" Message**:

   - Run `npm run build` to build the React application
   - Ensure the `dist/` directory contains the built files

2. **Webview Not Loading**:

   - Check that the extension is properly built
   - Verify the `dist/` directory exists and contains `index.html`

3. **Assets Not Loading**:
   - Ensure all assets are properly built and included in the `dist/` directory
   - Check the webview's local resource roots configuration

### Debugging

1. **Extension Logs**:

   - Open the Developer Console (Help > Toggle Developer Tools)
   - Check for extension-related errors

2. **Webview Debugging**:
   - Right-click in the webview and select "Inspect Element"
   - Use browser developer tools to debug the React app

## Configuration

### Extension Settings

The extension can be configured through VS Code settings:

```json
{
  "bistool.enableTelemetry": false,
  "bistool.defaultView": "projects"
}
```

### Build Configuration

- **React App**: Configured in `vite.config.ts`
- **Extension**: Configured in `tsconfig.extension.json`
- **Package**: Configured in `package.json`

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
3. **Make your changes**
4. **Build and test the extension**
5. **Submit a pull request**

## License

This extension is part of the BiSTool project and follows the same license terms.

## Support

For issues and questions:

- Check the troubleshooting section above
- Review the main BiSTool documentation
- Open an issue in the repository
