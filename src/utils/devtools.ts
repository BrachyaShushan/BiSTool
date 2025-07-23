// React DevTools integration for development
export const injectDevToolsScript = () => {
  // Disabled to prevent connection errors
  // Uncomment the code below if you need standalone React DevTools
  /*
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const script = document.createElement("script");
    script.src = "http://localhost:8097";
    script.async = true;
    document.head.appendChild(script);
  }
  */
};

// Initialize DevTools in development mode
export const initializeDevTools = () => {
  // Disabled to prevent connection errors
  // Uncomment the code below if you need standalone React DevTools
  /*
  if (import.meta.env.DEV) {
    // Use script injection method which is more reliable
    injectDevToolsScript();
  }
  */
};
