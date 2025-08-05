# VSCode Extension Troubleshooting Guide

## Common Issues and Solutions

### 1. 404 Error When Opening Extension

**Problem**: The extension opens but shows a 404 "Page Not Found" error.

**Causes**:

- React app not properly built for VSCode extension environment
- Incorrect path resolution in the webview
- Missing or corrupted build files

**Solutions**:

1. **Rebuild the extension properly**:

   ```bash
   npm run dev:extension
   ```

2. **Check if all required files exist**:

   - `dist/index.html` - Main React app
   - `dist/index.js` - React app bundle
   - `dist/extension/extension.js` - Extension code
   - `dist/icon.webp` - Extension icon

3. **Verify the build process**:

   ```bash
   # Check if files exist
   ls dist/
   ls dist/extension/
   ```

4. **Test in development mode**:

   - Open the project in VSCode
   - Press F5 to launch extension development host
   - Use Ctrl+Shift+P and type "Open BiSTool"

5. **Check the developer console**:
   - In the extension webview, press F12
   - Look for errors in the Console tab
   - Check the Network tab for failed resource loads

### 2. Missing Icon in Extension Tab

**Problem**: The extension tab shows no icon or a generic icon.

**Causes**:

- Icon file not properly copied to dist folder
- Incorrect icon path in package.json
- Icon file corrupted or missing

**Solutions**:

1. **Verify icon exists**:

   ```bash
   ls public/icon.webp
   ls dist/icon.webp
   ```

2. **Check package.json icon path**:

   ```json
   {
     "icon": "dist/icon.webp"
   }
   ```

3. **Rebuild with icon copy**:

   ```bash
   npm run dev:extension
   ```

4. **Force rebuild everything**:
   ```bash
   rm -rf dist/
   npm run dev:extension
   ```

### 3. Extension Not Loading

**Problem**: The extension doesn't appear in VSCode or fails to activate.

**Causes**:

- Missing activation events
- Incorrect main file path
- TypeScript compilation errors

**Solutions**:

1. **Check package.json configuration**:

   ```json
   {
     "main": "./dist/extension/extension.js",
     "activationEvents": ["onCommand:bistool.open"],
     "contributes": {
       "commands": [
         {
           "command": "bistool.open",
           "title": "Open BiSTool",
           "category": "BiSTool"
         }
       ]
     }
   }
   ```

2. **Verify extension compilation**:

   ```bash
   npm run build:extension
   ```

3. **Check for TypeScript errors**:
   ```bash
   npx tsc -p tsconfig.extension.json --noEmit
   ```

### 4. Development Setup

**To test the extension in development mode**:

1. **Setup the project**:

   ```bash
   npm run dev:extension
   ```

2. **Open in VSCode**:

   - Open the project folder in VSCode
   - Press F5 to launch extension development host
   - A new VSCode window will open

3. **Test the extension**:
   - In the new window, press Ctrl+Shift+P
   - Type "Open BiSTool"
   - Select the command
   - The extension should open in a new tab

### 5. Debugging Tips

**Enable developer tools**:

- In the extension webview, press F12 to open developer tools
- Check the Console tab for errors
- Check the Network tab for failed resource loads

**Common error patterns**:

- `Failed to load resource`: Check if assets are properly built
- `404 Not Found`: Verify file paths in dist folder
- `CORS errors`: Check webview security settings

**Check extension logs**:

- Open VSCode Output panel (View > Output)
- Select "Extension Host" from dropdown
- Look for error messages

### 6. Build Process

**Complete build process**:

```bash
# 1. Build React app
npm run build:simple

# 2. Copy icon
cp public/icon.webp dist/icon.webp

# 3. Build extension
npm run build:extension

# 4. Package extension (optional)
npm run build:full
```

**File structure after build**:

```
dist/
├── index.html          # React app
├── index.js           # React app bundle
├── icon.webp           # Extension icon
└── extension/
    └── extension.js   # Extension code
```

### 7. Testing Checklist

Before reporting issues, verify:

- [ ] All build files exist in `dist/` folder
- [ ] Icon file is copied to `dist/icon.webp`
- [ ] Extension compiles without TypeScript errors
- [ ] React app builds successfully
- [ ] Extension activates when command is run
- [ ] Webview loads without 404 errors
- [ ] Icon appears in extension tab

### 8. Environment Requirements

- Node.js 18+
- VSCode 1.99.0+
- TypeScript 5.8+
- All dependencies installed (`npm install`)

### 9. Quick Fix Commands

```bash
# Clean and rebuild everything
rm -rf dist/
npm install
npm run dev:extension

# Test in development
# Press F5 in VSCode, then Ctrl+Shift+P and type "Open BiSTool"
```

### 10. Specific Fixes for 404 and Icon Issues

**For 404 errors**:

1. The extension.ts file has been updated with better path resolution
2. All absolute paths are now properly converted to webview URIs
3. Added comprehensive error handling and debugging

**For missing icons**:

1. Icon path in package.json is now correctly set to `"dist/icon.webp"`
2. Build script ensures icon is copied to dist folder
3. Icon file is verified during build process

**Run the test script to verify everything works**:

```bash
node scripts/test-extension.js
```

If issues persist, check the VSCode extension development documentation and ensure all paths are correctly configured for the VSCode webview environment.
