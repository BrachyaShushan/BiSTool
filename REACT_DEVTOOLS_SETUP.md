# React DevTools Setup

This project now includes React DevTools for enhanced debugging and development experience.

## Setup Options

### Option 1: Browser Extension (Recommended)

1. **Install the browser extension:**

   - **Chrome/Edge:** [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi)
   - **Firefox:** [React Developer Tools](https://addons.mozilla.org/en-US/firefox/addon/react-devtools/)

2. **Usage:**
   - Open your browser's developer tools (F12)
   - Look for the "Components" and "Profiler" tabs
   - The extension will automatically detect React components in your app

### Option 2: Standalone DevTools

1. **Launch the standalone DevTools:**

   ```bash
   npm run devtools
   ```

2. **Start your development server:**

   ```bash
   npm run dev
   ```

3. **Connect to your app:**
   - The standalone DevTools will open in a separate window
   - It will automatically connect to your React app running on `localhost:5173`

### Option 3: Automatic Integration (Already Configured)

The app is already configured to automatically load React DevTools in development mode. When you run `npm run dev`, the DevTools will be automatically injected into your app.

## Features Available

- **Component Tree:** View the hierarchy of React components
- **Props Inspector:** Examine component props and state
- **State Management:** Debug context providers and state changes
- **Performance Profiling:** Analyze component render performance
- **Component Search:** Quickly find specific components
- **Hooks Debugging:** Inspect React hooks and their values

## Development Workflow

1. Start your development server: `npm run dev`
2. Open browser DevTools (F12)
3. Navigate to the "Components" tab
4. Explore your component tree and debug as needed

## Troubleshooting

### DevTools not showing up?

- Make sure you're running in development mode (`npm run dev`)
- Check that the browser extension is installed and enabled
- Try refreshing the page

### Standalone DevTools not connecting?

- Ensure both `npm run dev` and `npm run devtools` are running
- Check that your app is running on the expected port (usually 5173)
- Try restarting both processes

### Performance issues?

- The DevTools are only loaded in development mode
- They won't affect your production build
- If you experience slowdowns, you can temporarily disable the automatic loading by commenting out the `initializeDevTools()` call in `src/App.tsx`

## Additional Resources

- [React DevTools Documentation](https://react.dev/learn/react-developer-tools)
- [React DevTools GitHub](https://github.com/facebook/react/tree/main/packages/react-devtools)
