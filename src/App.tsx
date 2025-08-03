import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { initializeDevTools } from "./utils/devtools";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import router from "./router";

// Global Monaco Editor CSS loader for VS Code extension
const loadMonacoEditorCSS = () => {
    // Check if we're in a VS Code extension environment
    const isVSCodeExtension = typeof window.acquireVsCodeApi === 'function';

    if (isVSCodeExtension) {
        // Try to find existing Monaco Editor CSS links and fix their paths
        const monacoCSSLinks = document.querySelectorAll('link[href*="monaco-editor"]');
        monacoCSSLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('/')) {
                // Convert absolute path to relative path
                const relativePath = '.' + href;
                link.setAttribute('href', relativePath);
            }
        });

        // Also try to load common Monaco Editor CSS patterns
        const possibleCSSFiles = [
            'monaco-editor-CVj9lebq.css',
            'monaco-editor.css',
            'monaco-editor-*.css'
        ];

        possibleCSSFiles.forEach(cssFile => {
            const cssPath = `./css/${cssFile}`;

            // Check if the CSS is already loaded
            const existingLink = document.querySelector(`link[href*="${cssFile.replace('*', '')}"]`);
            if (!existingLink) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.type = 'text/css';
                link.href = cssPath;
                link.onerror = () => {
                    console.warn('Failed to load Monaco Editor CSS:', cssPath);
                };
                link.onload = () => {
                    console.log('Successfully loaded Monaco Editor CSS:', cssPath);
                };
                document.head.appendChild(link);
            }
        });

        // Override any dynamic CSS loading
        const originalCreateElement = document.createElement;
        document.createElement = function (tagName: string) {
            const element = originalCreateElement.call(this, tagName);
            if (tagName.toLowerCase() === 'link') {
                const originalSetAttribute = element.setAttribute;
                element.setAttribute = function (name: string, value: string) {
                    if (name === 'href' && value && value.startsWith('/')) {
                        // Convert absolute paths to relative paths
                        value = '.' + value;
                    }
                    return originalSetAttribute.call(this, name, value);
                };
            }
            return element;
        };
    }
};

const App: React.FC = () => {
    useEffect(() => {
        initializeDevTools();
        // Load Monaco Editor CSS on app start
        loadMonacoEditorCSS();
    }, []);

    return (
        <ErrorBoundary>
            <ThemeProvider>
                <RouterProvider router={router} />
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App; 