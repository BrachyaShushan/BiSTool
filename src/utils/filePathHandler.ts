/**
 * Utility functions to handle file path URLs when opening BiSTool in Cursor IDE
 */

export const isFilePath = (): boolean => {
  const href = window.location.href;
  const pathname = window.location.pathname;

  return (
    href.includes("file://") ||
    href.includes("cursor/resources") ||
    pathname.includes("\\") ||
    pathname.includes("/c:/") ||
    pathname.includes("/C:/")
  );
};

export const handleFilePathRedirect = (): void => {
  if (isFilePath()) {
    // Store the original URL for potential future use
    const originalUrl = window.location.href;
    localStorage.setItem("bistool_original_url", originalUrl);

    // For VS Code extension, don't redirect - just continue with current path
    // The extension will handle the routing internally
    console.log("BiSTool detected file path environment, continuing without redirect");
    return;
  }
};
