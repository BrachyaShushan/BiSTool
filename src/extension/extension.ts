import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  console.log("BiSTool extension is now active!");

  // Register the command
  let disposable = vscode.commands.registerCommand("bistool.open", () => {
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
      }
    );

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

    // Handle Monaco Editor specific CSS paths
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

    // Add global error handler for CSS loading issues
    const errorHandlerScript = `
      <script>
        // Global error handler for CSS loading issues
        window.addEventListener('error', function(e) {
          if (e.message && e.message.includes('Unable to preload CSS')) {
            console.warn('CSS loading error caught and handled:', e.message);
            // Don't throw the error, just log it
            e.preventDefault();
            return false;
          }
        }, true);

        // Handle Monaco Editor CSS loading errors specifically
        window.addEventListener('unhandledrejection', function(e) {
          if (e.reason && e.reason.message && e.reason.message.includes('Unable to preload CSS')) {
            console.warn('Monaco Editor CSS loading error caught:', e.reason.message);
            e.preventDefault();
            return false;
          }
        });

        // Override Monaco Editor's CSS loading to use relative paths
        if (window.monaco) {
          const originalLoadCSS = window.monaco.editor?.create?.prototype?.loadCSS;
          if (originalLoadCSS) {
            window.monaco.editor.create.prototype.loadCSS = function(cssPath) {
              // Convert absolute paths to relative paths for VS Code extension
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
                // Convert absolute paths to relative paths
                value = '.' + value;
              }
              return originalSetAttribute.call(this, name, value);
            };
          }
          return element;
        };
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
