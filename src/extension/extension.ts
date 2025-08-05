import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  console.log("BiSTool extension is now active!");

  // Register the command
  let disposable = vscode.commands.registerCommand("bistool.open", () => {
    console.log("BiSTool command executed!");
    vscode.window.showInformationMessage("Opening BiSTool...");
    BiSToolPanel.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(disposable);
}

class BiSToolPanel {
  public static currentPanel: BiSToolPanel | undefined;
  public static readonly viewType = "bistool";

  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it.
    if (BiSToolPanel.currentPanel) {
      BiSToolPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel.
    const panel = vscode.window.createWebviewPanel(
      BiSToolPanel.viewType,
      "BiSTool - API Testing Tool",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "dist"),
          vscode.Uri.joinPath(extensionUri, "dist", "js"),
          vscode.Uri.joinPath(extensionUri, "dist", "css"),
          vscode.Uri.joinPath(extensionUri, "dist", "assets"),
          vscode.Uri.joinPath(extensionUri, "dist", "fonts"),
        ],
        retainContextWhenHidden: true,
      }
    );

    // Set the panel icon
    panel.iconPath = vscode.Uri.joinPath(extensionUri, "dist", "icon.png");

    BiSToolPanel.currentPanel = new BiSToolPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "alert":
            vscode.window.showInformationMessage(message.text);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  public dispose() {
    BiSToolPanel.currentPanel = undefined;

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._panel.webview.html = this._getHtmlForWebview(webview);
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Get the path to the built React app
    const reactAppPath = vscode.Uri.joinPath(this._extensionUri, "dist");
    const reactAppUri = webview.asWebviewUri(reactAppPath);

    // Read the built index.html file
    const indexPath = path.join(
      this._extensionUri.fsPath,
      "dist",
      "index.html"
    );

    if (!fs.existsSync(indexPath)) {
      console.warn("Index.html not found at:", indexPath);
      return this._getFallbackHtml();
    }

    let htmlContent = fs.readFileSync(indexPath, "utf8");

    // More comprehensive path replacement for VS Code extension environment
    // Handle absolute paths starting with /
    htmlContent = htmlContent.replace(/href="\//g, `href="${reactAppUri}/`);
    htmlContent = htmlContent.replace(/src="\//g, `src="${reactAppUri}/`);

    // Handle relative paths starting with ./
    htmlContent = htmlContent.replace(/href="\.\//g, `href="${reactAppUri}/`);
    htmlContent = htmlContent.replace(/src="\.\//g, `src="${reactAppUri}/`);

    // Handle font-face declarations with absolute paths (most comprehensive)
    htmlContent = htmlContent.replace(
      /url\(\/fonts\/([^)]+)\)/g,
      `url(${reactAppUri}/fonts/$1)`
    );

    // Handle any remaining absolute font paths in different formats
    htmlContent = htmlContent.replace(
      /url\("\/fonts\/([^"]+)"\)/g,
      `url("${reactAppUri}/fonts/$1")`
    );
    htmlContent = htmlContent.replace(
      /url\('\/fonts\/([^']+)'\)/g,
      `url('${reactAppUri}/fonts/$1')`
    );

    // Handle any remaining absolute CSS paths in different formats
    htmlContent = htmlContent.replace(
      /url\(\/css\/([^)]+)\)/g,
      `url(${reactAppUri}/css/$1)`
    );
    htmlContent = htmlContent.replace(
      /url\("\/css\/([^"]+)"\)/g,
      `url("${reactAppUri}/css/$1")`
    );
    htmlContent = htmlContent.replace(
      /url\('\/css\/([^']+)'\)/g,
      `url('${reactAppUri}/css/$1')`
    );

    // Handle specific asset paths that might be missed
    htmlContent = htmlContent.replace(
      /href="\/css\//g,
      `href="${reactAppUri}/css/`
    );
    htmlContent = htmlContent.replace(
      /href="\/js\//g,
      `href="${reactAppUri}/js/`
    );
    htmlContent = htmlContent.replace(
      /href="\/assets\//g,
      `href="${reactAppUri}/assets/`
    );
    htmlContent = htmlContent.replace(
      /href="\/fonts\//g,
      `href="${reactAppUri}/fonts/`
    );

    htmlContent = htmlContent.replace(
      /src="\/css\//g,
      `src="${reactAppUri}/css/`
    );
    htmlContent = htmlContent.replace(
      /src="\/js\//g,
      `src="${reactAppUri}/js/`
    );
    htmlContent = htmlContent.replace(
      /src="\/assets\//g,
      `src="${reactAppUri}/assets/`
    );
    htmlContent = htmlContent.replace(
      /src="\/fonts\//g,
      `src="${reactAppUri}/fonts/`
    );

    // Handle Monaco Editor specific CSS paths - more comprehensive
    htmlContent = htmlContent.replace(
      /href="\/css\/monaco-editor-[^"]+\.css"/g,
      (match) => {
        const cssFileName = match.match(/monaco-editor-[^"]+\.css/)?.[0];
        if (cssFileName) {
          return `href="${reactAppUri}/css/${cssFileName}"`;
        }
        return match;
      }
    );

    // Handle any Monaco Editor CSS paths that might be missed
    htmlContent = htmlContent.replace(
      /href="\/css\/monaco-editor\.css"/g,
      `href="${reactAppUri}/css/monaco-editor.css"`
    );

    // Handle dynamic Monaco Editor CSS loading
    htmlContent = htmlContent.replace(
      /url\(\/css\/monaco-editor-[^)]+\.css\)/g,
      (match) => {
        const cssFileName = match.match(/monaco-editor-[^)]+\.css/)?.[0];
        if (cssFileName) {
          return `url(${reactAppUri}/css/${cssFileName})`;
        }
        return match;
      }
    );

    // Handle any remaining absolute paths that might be missed
    htmlContent = htmlContent.replace(
      /(href|src)="\/[^"]*"/g,
      (match, attr) => {
        const path = match.match(/"[^"]*"/)?.[0]?.slice(1, -1);
        if (path && path.startsWith("/")) {
          return `${attr}="${reactAppUri}${path}"`;
        }
        return match;
      }
    );

    // Final catch-all for any remaining absolute paths in url() functions
    htmlContent = htmlContent.replace(/url\(\/([^)]+)\)/g, (match, path) => {
      return `url(${reactAppUri}/${path})`;
    });

    // Handle any remaining absolute paths in CSS @font-face declarations
    htmlContent = htmlContent.replace(
      /@font-face\s*{[^}]*url\s*\(\s*["']?\/fonts\/([^"')]+)["']?\s*\)[^}]*}/g,
      (match, fontFile) => {
        return match.replace(
          /url\s*\(\s*["']?\/fonts\/([^"')]+)["']?\s*\)/g,
          `url(${reactAppUri}/fonts/$1)`
        );
      }
    );

    // Handle any remaining absolute paths in CSS @import statements
    htmlContent = htmlContent.replace(
      /@import\s+["']?\/[^"']+["']?/g,
      (match) => {
        return match.replace(/\/[^"']+/, `${reactAppUri}$&`);
      }
    );

    // Handle font-face declarations with absolute paths
    htmlContent = htmlContent.replace(
      /url\(\/fonts\/([^)]+)\)/g,
      `url(${reactAppUri}/fonts/$1)`
    );

    // Handle any remaining absolute font paths
    htmlContent = htmlContent.replace(
      /url\("\/fonts\/([^"]+)"\)/g,
      `url("${reactAppUri}/fonts/$1")`
    );
    htmlContent = htmlContent.replace(
      /url\('\/fonts\/([^']+)'\)/g,
      `url('${reactAppUri}/fonts/$1')`
    );

    // Handle any remaining CSS paths that might be missed
    htmlContent = htmlContent.replace(
      /url\("\/css\/([^"]+)"\)/g,
      `url("${reactAppUri}/css/$1")`
    );
    htmlContent = htmlContent.replace(
      /url\('\/css\/([^']+)'\)/g,
      `url('${reactAppUri}/css/$1')`
    );
    htmlContent = htmlContent.replace(
      /url\(\/css\/([^)]+)\)/g,
      `url(${reactAppUri}/css/$1)`
    );

    // Add comprehensive debugging and error handling script
    const errorHandlerScript = `
      <script>
        // Enhanced debugging for VS Code extension
        console.log('🔧 BiSTool Extension Debug Mode Active');
        console.log('📍 Base URI:', window.location.href);
        console.log('🌐 User Agent:', navigator.userAgent);
        console.log('🔗 React App URI:', '${reactAppUri}');
        
        // Global error handler for all resource loading issues
        window.addEventListener('error', function(e) {
          console.warn('🚨 Resource loading error:', e.message);
          console.warn('📁 Target:', e.target);
          console.warn('🔗 URL:', e.target?.src || e.target?.href);
          
          if (e.target && e.target.tagName === 'LINK' && e.target.rel === 'stylesheet') {
            console.warn('🎨 CSS loading failed:', e.target.href);
          }
          if (e.target && e.target.tagName === 'SCRIPT') {
            console.warn('📜 Script loading failed:', e.target.src);
          }
          if (e.target && e.target.tagName === 'IMG') {
            console.warn('🖼️ Image loading failed:', e.target.src);
          }
        }, true);

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', function(e) {
          console.warn('💥 Unhandled promise rejection:', e.reason);
          console.warn('📋 Stack:', e.reason?.stack);
        });

        // Monitor all resource loads
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              console.log('📦 Resource loaded:', entry.name, 'Type:', entry.initiatorType);
            }
          }
        });
        observer.observe({ entryTypes: ['resource'] });

        // Override fetch to handle relative paths
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          if (typeof url === 'string' && url.startsWith('/')) {
            console.log('🔄 Converting absolute path to relative:', url);
            url = '.' + url;
          }
          return originalFetch.call(this, url, options);
        };

        // Handle Monaco Editor CSS loading errors specifically
        window.addEventListener('unhandledrejection', function(e) {
          if (e.reason && e.reason.message && e.reason.message.includes('Unable to preload CSS')) {
            console.warn('🎨 Monaco Editor CSS loading error caught:', e.reason.message);
            e.preventDefault();
            return false;
          }
        });

        // Override Monaco Editor's CSS loading to use relative paths
        if (window.monaco) {
          const originalLoadCSS = window.monaco.editor?.create?.prototype?.loadCSS;
          if (originalLoadCSS) {
            window.monaco.editor.create.prototype.loadCSS = function(cssPath) {
              console.log('🎨 Monaco CSS path conversion:', cssPath);
              if (cssPath.startsWith('/')) {
                cssPath = '.' + cssPath;
              }
              return originalLoadCSS.call(this, cssPath);
            };
          }
        }

        // Intercept dynamic CSS loading
        const originalCreateElement = document.createElement;
        document.createElement = function(tagName) {
          const element = originalCreateElement.call(this, tagName);
          if (tagName.toLowerCase() === 'link') {
            const originalSetAttribute = element.setAttribute;
            element.setAttribute = function(name, value) {
              if (name === 'href' && value && value.startsWith('/')) {
                console.log('🔗 Converting CSS href:', value);
                value = '.' + value;
              }
              return originalSetAttribute.call(this, name, value);
            };
          }
          return element;
        };

        // Add keyboard shortcut for debugging (Ctrl+Shift+D)
        document.addEventListener('keydown', function(e) {
          if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('🔧 Debug Info:');
            console.log('📍 Current URL:', window.location.href);
            console.log('📁 Document ready state:', document.readyState);
            console.log('🎨 Stylesheets loaded:', document.styleSheets.length);
            console.log('📜 Scripts loaded:', document.scripts.length);
            console.log('🖼️ Images loaded:', document.images.length);
          }
        });

        // Log when DOM is ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', function() {
            console.log('✅ DOM fully loaded');
          });
        } else {
          console.log('✅ DOM already loaded');
        }

        // Log when window is fully loaded
        window.addEventListener('load', function() {
          console.log('🚀 Window fully loaded');
          console.log('📊 Performance metrics:', performance.getEntriesByType('navigation')[0]);
        });
      </script>
    `;

    // Insert the error handler script before the closing head tag
    htmlContent = htmlContent.replace(
      "</head>",
      `${errorHandlerScript}</head>`
    );

    return htmlContent;
  }

  private _getFallbackHtml() {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BiSTool - API Testing Tool</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
                color: #333;
            }
            .container {
                max-width: 600px;
                margin: 50px auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
            }
            .icon {
                font-size: 48px;
                margin-bottom: 20px;
            }
            h1 {
                color: #2c3e50;
                margin-bottom: 10px;
            }
            p {
                color: #7f8c8d;
                line-height: 1.6;
            }
            .error {
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                border-radius: 4px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="icon">🚀</div>
            <h1>BiSTool</h1>
            <p>API Testing Tool with YAML generation and AI test creation</p>
            <div class="error">
                <strong>Application Error</strong><br>
                The application failed to load properly. Please try refreshing the panel or restarting VS Code.
            </div>
            <p>If the problem persists, please check the developer console for more details.</p>
        </div>
    </body>
    </html>`;
  }
}

export function deactivate() {}
