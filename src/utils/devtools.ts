// React DevTools integration for development
export const injectDevToolsScript = () => {
  if (import.meta.env.DEV && typeof window !== "undefined") {
    const script = document.createElement("script");
    script.src = "http://localhost:8097";
    script.async = true;
    document.head.appendChild(script);
  }
};

// Initialize DevTools in development mode
export const initializeDevTools = () => {
  if (import.meta.env.DEV) {
    // Use script injection method which is more reliable
    injectDevToolsScript();
  }
};
