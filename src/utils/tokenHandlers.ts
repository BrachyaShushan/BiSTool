import { TokenConfig } from "../types/core/app.types";

// Token extraction patterns and utilities
export class TokenExtractor {
  private config: TokenConfig;
  private globalVariables: Record<string, string>;

  constructor(config: TokenConfig, globalVariables: Record<string, string>) {
    this.config = config;
    this.globalVariables = globalVariables;
  }

  // Extract token using all configured methods in priority order
  async extractToken(
    response: Response,
    responseText: string
  ): Promise<{
    token: string | null;
    refreshToken: string | null;
    source: string;
    metadata?: any;
  }> {
    const extractionMethods = [
      { method: "json", handler: () => this.extractFromJson(responseText) },
      {
        method: "nestedJson",
        handler: () => this.extractFromNestedJson(responseText),
      },
      { method: "cookies", handler: () => this.extractFromCookies(response) },
      { method: "headers", handler: () => this.extractFromHeaders(response) },
      { method: "regex", handler: () => this.extractFromRegex(responseText) },
      { method: "xpath", handler: () => this.extractFromXPath(responseText) },
      { method: "css", handler: () => this.extractFromCSS(responseText) },
    ];

    for (const { method, handler } of extractionMethods) {
      if (
        this.config.extractionMethods[
          method as keyof typeof this.config.extractionMethods
        ]
      ) {
        try {
          const result = await handler();
          if (result.token) {
            return {
              ...result,
              source: method,
            };
          }
        } catch (error) {
          console.warn(`Failed to extract token using ${method}:`, error);
        }
      }
    }

    return { token: null, refreshToken: null, source: "none" };
  }

  // JSON extraction with enhanced path support
  private extractFromJson(responseText: string): {
    token: string | null;
    refreshToken: string | null;
  } {
    try {
      const jsonData = JSON.parse(responseText);
      const token = this.findValueInObject(
        jsonData,
        this.config.extractionMethods.jsonPaths
      );
      const refreshToken = this.config.refreshToken
        ? this.findValueInObject(jsonData, [
            this.config.refreshTokenName,
            "refresh_token",
            "refreshToken",
          ])
        : null;

      return { token, refreshToken };
    } catch (error) {
      console.warn("Failed to parse JSON response:", error);
      return { token: null, refreshToken: null };
    }
  }

  // Nested JSON extraction with transformations
  private async extractFromNestedJson(
    responseText: string
  ): Promise<{ token: string | null; refreshToken: string | null }> {
    try {
      const jsonData = JSON.parse(responseText);

      for (const pathConfig of this.config.extractionMethods.nestedPaths) {
        const value = this.getNestedValue(jsonData, pathConfig.path);
        if (value) {
          const transformedValue = await this.transformValue(
            value,
            pathConfig.transform
          );
          if (transformedValue && this.isValidToken(transformedValue)) {
            return { token: transformedValue, refreshToken: null };
          }
        }
      }

      return { token: null, refreshToken: null };
    } catch (error) {
      console.warn("Failed to extract from nested JSON:", error);
      return { token: null, refreshToken: null };
    }
  }

  // Cookie extraction with enhanced parsing
  private extractFromCookies(response: Response): {
    token: string | null;
    refreshToken: string | null;
  } {
    // Try Set-Cookie header first
    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      const cookies = this.parseSetCookieHeader(setCookieHeader);
      const token = this.findTokenInCookies(cookies);
      const refreshToken = this.config.refreshToken
        ? this.findRefreshTokenInCookies(cookies)
        : null;

      if (token) return { token, refreshToken };
    }

    // Fallback to browser cookies
    const browserCookies = this.getBrowserCookies();
    const token = this.findTokenInCookies(browserCookies);
    const refreshToken = this.config.refreshToken
      ? this.findRefreshTokenInCookies(browserCookies)
      : null;

    return { token, refreshToken };
  }

  // Header extraction with Bearer token support
  private extractFromHeaders(response: Response): {
    token: string | null;
    refreshToken: string | null;
  } {
    const headerNames =
      this.config.extractionMethods.headerNames.length > 0
        ? this.config.extractionMethods.headerNames
        : ["authorization", "x-access-token", "x-auth-token", "token"];

    for (const headerName of headerNames) {
      const value = response.headers.get(headerName);
      if (value) {
        const token = this.extractBearerToken(value);
        if (token) {
          return { token, refreshToken: null };
        }
      }
    }

    return { token: null, refreshToken: null };
  }

  // Regex pattern extraction
  private extractFromRegex(responseText: string): {
    token: string | null;
    refreshToken: string | null;
  } {
    const patterns =
      this.config.extractionMethods.regexPatterns.length > 0
        ? this.config.extractionMethods.regexPatterns
        : [
            /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i,
            /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i,
            /"token"\s*:\s*"([^"]+)"/i,
            /'token'\s*:\s*'([^']+)'/i,
          ];

    for (const pattern of patterns) {
      const match = responseText.match(pattern);
      if (match && match[1]) {
        return { token: match[1], refreshToken: null };
      }
    }

    return { token: null, refreshToken: null };
  }

  // XPath extraction (for XML responses)
  private extractFromXPath(responseText: string): {
    token: string | null;
    refreshToken: string | null;
  } {
    // This would require a DOM parser for XML
    // For now, we'll implement a basic XML parsing approach
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, "text/xml");

      for (const xpath of this.config.extractionMethods.xpathExpressions) {
        try {
          const result = document.evaluate(
            xpath,
            xmlDoc,
            null,
            XPathResult.STRING_TYPE,
            null
          );
          const value = result.stringValue;
          if (value && this.isValidToken(value)) {
            return { token: value, refreshToken: null };
          }
        } catch (error) {
          console.warn(`Invalid XPath expression: ${xpath}`, error);
        }
      }
    } catch (error) {
      console.warn("Failed to parse XML response:", error);
    }

    return { token: null, refreshToken: null };
  }

  // CSS selector extraction (for HTML responses)
  private extractFromCSS(responseText: string): {
    token: string | null;
    refreshToken: string | null;
  } {
    try {
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(responseText, "text/html");

      for (const selector of this.config.extractionMethods.cssSelectors) {
        try {
          const element = htmlDoc.querySelector(selector);
          if (element) {
            const value =
              element.textContent ||
              element.getAttribute("value") ||
              element.getAttribute("data-token");
            if (value && this.isValidToken(value)) {
              return { token: value, refreshToken: null };
            }
          }
        } catch (error) {
          console.warn(`Invalid CSS selector: ${selector}`, error);
        }
      }
    } catch (error) {
      console.warn("Failed to parse HTML response:", error);
    }

    return { token: null, refreshToken: null };
  }

  // Helper methods
  private findValueInObject(obj: any, paths: string[]): string | null {
    for (const path of paths) {
      const value = this.getNestedValue(obj, path);
      if (value && typeof value === "string" && this.isValidToken(value)) {
        return value;
      }
    }
    return null;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  private async transformValue(
    value: any,
    transform?: string
  ): Promise<string | null> {
    if (!transform || transform === "none") return String(value);

    switch (transform) {
      case "base64_decode":
        try {
          return atob(String(value));
        } catch {
          return null;
        }
      case "url_decode":
        try {
          return decodeURIComponent(String(value));
        } catch {
          return null;
        }
      case "json_parse":
        try {
          const parsed = JSON.parse(String(value));
          return typeof parsed === "string" ? parsed : JSON.stringify(parsed);
        } catch {
          return null;
        }
      default:
        return String(value);
    }
  }

  private isValidToken(token: string): boolean {
    if (!token || typeof token !== "string") return false;

    // Check for JWT format (3 parts separated by dots)
    if (token.split(".").length === 3) {
      return /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token);
    }

    // Check for other token formats (minimum length, no spaces)
    return token.length >= 10 && !token.includes(" ");
  }

  private parseSetCookieHeader(
    setCookieHeader: string
  ): Array<{ name: string; value: string }> {
    return setCookieHeader
      .split(",")
      .map((cookie) => {
        const [nameValue] = cookie.split(";");
        const [name, value] = nameValue?.trim().split("=") ?? [];
        return { name: name?.trim() ?? "", value: value?.trim() ?? "" };
      })
      .filter((cookie) => cookie.name);
  }

  private getBrowserCookies(): Array<{ name: string; value: string }> {
    return document.cookie
      .split(";")
      .map((cookie) => {
        const [name, value] = cookie.trim().split("=");
        return {
          name: name?.trim() ?? "",
          value: decodeURIComponent(value?.trim() ?? ""),
        };
      })
      .filter((cookie) => cookie.name);
  }

  private findTokenInCookies(
    cookies: Array<{ name: string; value: string }>
  ): string | null {
    const searchNames =
      this.config.extractionMethods.cookieNames.length > 0
        ? this.config.extractionMethods.cookieNames
        : ["token", "access_token", "auth_token", "jwt"];

    for (const cookieName of searchNames) {
      const cookie = cookies.find((c) => c.name === cookieName);
      if (cookie?.value && this.isValidToken(cookie.value)) {
        return cookie.value;
      }
    }

    // Fallback: find any cookie with 'token' in the name
    const tokenCookie = cookies.find(
      (cookie) =>
        cookie.name.toLowerCase().includes("token") ||
        cookie.name.toLowerCase().includes("auth") ||
        cookie.name.toLowerCase().includes("jwt")
    );

    return tokenCookie?.value && this.isValidToken(tokenCookie.value)
      ? tokenCookie.value
      : null;
  }

  private findRefreshTokenInCookies(
    cookies: Array<{ name: string; value: string }>
  ): string | null {
    const refreshTokenNames = [
      this.config.refreshTokenName,
      "refresh_token",
      "refreshToken",
    ];

    for (const cookie of cookies) {
      if (
        refreshTokenNames.includes(cookie.name) ||
        cookie.name.toLowerCase().includes("refresh")
      ) {
        return cookie.value;
      }
    }

    return null;
  }

  private extractBearerToken(headerValue: string): string | null {
    const bearerMatch = headerValue.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch && bearerMatch[1]) {
      return bearerMatch[1];
    }

    // If no Bearer prefix, return the whole value if it looks like a token
    return this.isValidToken(headerValue) ? headerValue : null;
  }
}

// Authentication strategy classes
export abstract class AuthStrategy {
  protected config: TokenConfig;
  protected globalVariables: Record<string, string>;

  constructor(config: TokenConfig, globalVariables: Record<string, string>) {
    this.config = config;
    this.globalVariables = globalVariables;
  }

  abstract buildRequest(): Promise<{
    url: string;
    method: string;
    headers: Record<string, string>;
    body?: string;
  }>;

  abstract validateResponse(response: Response): Promise<boolean>;
}

export class BasicAuthStrategy extends AuthStrategy {
  async buildRequest() {
    const url = `${this.config.domain}${this.config.path}`;
    const username = this.globalVariables["username"];
    const password = this.globalVariables["password"];

    if (!username || !password) {
      throw new Error(
        "Username and password are required for basic authentication"
      );
    }

    const credentials = btoa(`${username}:${password}`);
    const headers: Record<string, string> = {
      Authorization: `Basic ${credentials}`,
      Accept: "*/*",
    };

    // Add custom headers
    this.config.requestMapping.customHeaders.forEach((header) => {
      const value =
        header.type === "variable"
          ? this.globalVariables[header.value] || header.value
          : header.value;
      headers[header.name] = value;
    });

    return { url, method: this.config.method, headers };
  }

  async validateResponse(response: Response): Promise<boolean> {
    return response.status >= 200 && response.status < 300;
  }
}

export class BearerAuthStrategy extends AuthStrategy {
  async buildRequest() {
    const url = `${this.config.domain}${this.config.path}`;
    const headers: Record<string, string> = {
      Accept: "*/*",
      "Content-Type": this.getContentType(),
    };

    // Add custom headers
    this.config.requestMapping.customHeaders.forEach((header) => {
      const value =
        header.type === "variable"
          ? this.globalVariables[header.value] || header.value
          : header.value;
      headers[header.name] = value;
    });

    const body = this.buildRequestBody();

    return { url, method: this.config.method, headers, body };
  }

  private getContentType(): string {
    switch (this.config.requestMapping.contentType) {
      case "json":
        return "application/json";
      case "xml":
        return "application/xml";
      case "multipart":
        return "multipart/form-data";
      default:
        return "application/x-www-form-urlencoded";
    }
  }

  private buildRequestBody(): string {
    const { usernameField, passwordField, contentType } =
      this.config.requestMapping;
    const username = this.globalVariables[usernameField];
    const password = this.globalVariables[passwordField];

    if (!username || !password) {
      throw new Error(
        `Missing ${usernameField} or ${passwordField} in global variables`
      );
    }

    switch (contentType) {
      case "json":
        return JSON.stringify({
          [usernameField]: username,
          [passwordField]: password,
        });

      case "xml":
        return this.objectToXML({
          [usernameField]: username,
          [passwordField]: password,
        });

      case "form":
        return this.objectToFormData({
          [usernameField]: username,
          [passwordField]: password,
        });

      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  private objectToXML(obj: Record<string, any>): string {
    const xmlParts = Object.entries(obj).map(
      ([key, value]) => `<${key}>${value}</${key}>`
    );
    return `<request>${xmlParts.join("")}</request>`;
  }

  private objectToFormData(obj: Record<string, any>): string {
    return Object.entries(obj)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
  }

  async validateResponse(response: Response): Promise<boolean> {
    return response.status >= 200 && response.status < 300;
  }
}

export class OAuth2Strategy extends AuthStrategy {
  async buildRequest() {
    if (!this.config.oauth2) {
      throw new Error("OAuth2 configuration is required");
    }

    const { oauth2 } = this.config;
    const url = oauth2.tokenUrl;
    const headers: Record<string, string> = {
      Accept: "*/*",
      "Content-Type": "application/x-www-form-urlencoded",
    };

    let body: string;

    switch (oauth2.grantType) {
      case "client_credentials":
        body = new URLSearchParams({
          grant_type: "client_credentials",
          client_id: oauth2.clientId,
          client_secret: oauth2.clientSecret,
          scope: oauth2.scope,
        }).toString();
        break;

      case "password":
        const username = this.globalVariables["username"];
        const password = this.globalVariables["password"];
        if (!username || !password) {
          throw new Error(
            "Username and password are required for password grant type"
          );
        }
        body = new URLSearchParams({
          grant_type: "password",
          username,
          password,
          client_id: oauth2.clientId,
          client_secret: oauth2.clientSecret,
          scope: oauth2.scope,
        }).toString();
        break;

      case "authorization_code":
        // This requires user interaction, so we'll need to handle it differently
        throw new Error("Authorization code flow requires user interaction");

      case "implicit":
        // This also requires user interaction
        throw new Error("Implicit flow requires user interaction");

      default:
        throw new Error(`Unsupported grant type: ${oauth2.grantType}`);
    }

    return { url, method: "POST", headers, body };
  }

  async validateResponse(response: Response): Promise<boolean> {
    if (response.status !== 200) return false;

    try {
      const data = await response.json();
      return !!(data.access_token || data.token);
    } catch {
      return false;
    }
  }
}

export class ApiKeyStrategy extends AuthStrategy {
  async buildRequest() {
    if (!this.config.apiKey) {
      throw new Error("API Key configuration is required");
    }

    const url = `${this.config.domain}${this.config.path}`;
    const headers: Record<string, string> = {
      Accept: "*/*",
    };

    const { apiKey } = this.config;
    const keyValue = apiKey.prefix
      ? `${apiKey.prefix}${apiKey.keyValue}`
      : apiKey.keyValue;

    switch (apiKey.location) {
      case "header":
        headers[apiKey.keyName] = keyValue;
        break;
      case "query":
        // Handle query parameter in URL
        const urlObj = new URL(url);
        urlObj.searchParams.append(apiKey.keyName, keyValue);
        return {
          url: urlObj.toString(),
          method: this.config.method,
          headers,
        };
      case "cookie":
        // Set cookie in document
        document.cookie = `${apiKey.keyName}=${keyValue}; path=/`;
        break;
    }

    return { url, method: this.config.method, headers };
  }

  async validateResponse(response: Response): Promise<boolean> {
    return response.status >= 200 && response.status < 300;
  }
}

export class SessionAuthStrategy extends AuthStrategy {
  async buildRequest() {
    if (!this.config.session) {
      throw new Error("Session configuration is required");
    }

    const url = `${this.config.domain}${this.config.path}`;
    const headers: Record<string, string> = {
      Accept: "*/*",
      "Content-Type": this.getContentType(),
    };

    // Add session ID if available
    const sessionId = this.globalVariables[this.config.session.sessionIdField];
    if (sessionId) {
      headers["X-Session-ID"] = sessionId;
    }

    const body = this.buildRequestBody();

    return { url, method: this.config.method, headers, body };
  }

  private getContentType(): string {
    switch (this.config.requestMapping.contentType) {
      case "json":
        return "application/json";
      case "xml":
        return "application/xml";
      case "multipart":
        return "multipart/form-data";
      default:
        return "application/x-www-form-urlencoded";
    }
  }

  private buildRequestBody(): string {
    const { usernameField, passwordField, contentType } =
      this.config.requestMapping;
    const username = this.globalVariables[usernameField];
    const password = this.globalVariables[passwordField];

    if (!username || !password) {
      throw new Error(
        `Missing ${usernameField} or ${passwordField} in global variables`
      );
    }

    switch (contentType) {
      case "json":
        return JSON.stringify({
          [usernameField]: username,
          [passwordField]: password,
        });

      case "xml":
        return this.objectToXML({
          [usernameField]: username,
          [passwordField]: password,
        });

      case "form":
        return this.objectToFormData({
          [usernameField]: username,
          [passwordField]: password,
        });

      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
  }

  private objectToXML(obj: Record<string, any>): string {
    const xmlParts = Object.entries(obj).map(
      ([key, value]) => `<${key}>${value}</${key}>`
    );
    return `<request>${xmlParts.join("")}</request>`;
  }

  private objectToFormData(obj: Record<string, any>): string {
    return Object.entries(obj)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      )
      .join("&");
  }

  async validateResponse(response: Response): Promise<boolean> {
    return response.status >= 200 && response.status < 300;
  }
}

// Token validation and refresh utilities
export class TokenValidator {
  private config: TokenConfig;
  private globalVariables: Record<string, string>;

  constructor(config: TokenConfig, globalVariables: Record<string, string>) {
    this.config = config;
    this.globalVariables = globalVariables;
  }

  async validateToken(token: string): Promise<boolean> {
    if (!this.config.validation.validateOnExtract) return true;
    if (!this.config.validation.validationEndpoint) return true;

    try {
      const headers: Record<string, string> = {
        Accept: "*/*",
      };

      // Add validation headers
      this.config.validation.validationHeaders.forEach((header) => {
        headers[header.name] = header.value;
      });

      // Add token to headers
      const tokenHeaderName = this.config.headerKey;
      const tokenHeaderValue = this.config.headerValueFormat.replace(
        "{token}",
        token
      );
      headers[tokenHeaderName] = tokenHeaderValue;

      const response = await fetch(this.config.validation.validationEndpoint, {
        method: this.config.validation.validationMethod,
        headers,
      });

      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.warn("Token validation failed:", error);
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<string | null> {
    if (!this.config.refreshToken || !this.config.oauth2?.refreshUrl) {
      return null;
    }

    try {
      const response = await fetch(this.config.oauth2.refreshUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: this.config.oauth2.clientId,
          client_secret: this.config.oauth2.clientSecret,
        }).toString(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.access_token || data.token;
      }
    } catch (error) {
      console.warn("Token refresh failed:", error);
    }

    return null;
  }

  shouldRefreshToken(token: string): boolean {
    if (!this.config.validation.autoRefresh) return false;

    try {
      const parts = token.split(".");
      if (parts.length < 2) return false;

      const part = parts[1];
      if (!part) return false;

      const payload = JSON.parse(atob(part));
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      const timeUntilExpiry = (exp - now) / 60; // minutes

      return timeUntilExpiry <= this.config.validation.refreshThreshold;
    } catch {
      return false;
    }
  }
}

// Main token manager class
export class TokenManager {
  private config: TokenConfig;
  private globalVariables: Record<string, string>;
  private extractor: TokenExtractor;
  private validator: TokenValidator;
  private strategy: AuthStrategy;

  constructor(config: TokenConfig, globalVariables: Record<string, string>) {
    this.config = config;
    this.globalVariables = globalVariables;
    this.extractor = new TokenExtractor(config, globalVariables);
    this.validator = new TokenValidator(config, globalVariables);
    this.strategy = this.createAuthStrategy();
  }

  private createAuthStrategy(): AuthStrategy {
    switch (this.config.authType) {
      case "basic":
        return new BasicAuthStrategy(this.config, this.globalVariables);
      case "bearer":
        return new BearerAuthStrategy(this.config, this.globalVariables);
      case "oauth2":
        return new OAuth2Strategy(this.config, this.globalVariables);
      case "api_key":
        return new ApiKeyStrategy(this.config, this.globalVariables);
      case "session":
        return new SessionAuthStrategy(this.config, this.globalVariables);
      default:
        return new BearerAuthStrategy(this.config, this.globalVariables);
    }
  }

  async generateToken(): Promise<{
    token: string;
    refreshToken?: string;
    source: string;
    metadata?: any;
  }> {
    let attempts = 0;
    const maxAttempts = this.config.errorHandling.maxRetries + 1;

    while (attempts < maxAttempts) {
      try {
        // Build request
        const request = await this.strategy.buildRequest();

        // Make request
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body || null,
        });

        // Validate response
        const isValid = await this.strategy.validateResponse(response);
        if (!isValid) {
          throw new Error(
            `Invalid response: ${response.status} ${response.statusText}`
          );
        }

        // Extract token
        const responseText = await response.text();
        const extraction = await this.extractor.extractToken(
          response,
          responseText
        );

        if (!extraction.token) {
          throw new Error("No token found in response");
        }

        // Validate token if configured
        const isTokenValid = await this.validator.validateToken(
          extraction.token
        );
        if (!isTokenValid) {
          throw new Error("Token validation failed");
        }

        return {
          token: extraction.token,
          ...(extraction.refreshToken && {
            refreshToken: extraction.refreshToken,
          }),
          source: extraction.source,
          metadata: extraction.metadata,
        };
      } catch (error) {
        attempts++;
        console.warn(`Token generation attempt ${attempts} failed:`, error);

        if (attempts >= maxAttempts) {
          throw error;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, this.config.errorHandling.retryDelay)
        );
      }
    }

    throw new Error("Token generation failed after all attempts");
  }

  async refreshTokenIfNeeded(token: string): Promise<string> {
    if (this.validator.shouldRefreshToken(token)) {
      const refreshToken = this.globalVariables[this.config.refreshTokenName];
      if (refreshToken) {
        const newToken = await this.validator.refreshToken(refreshToken);
        if (newToken) {
          this.globalVariables[this.config.tokenName] = newToken;
          return newToken;
        }
      }
    }
    return token;
  }

  // Generate authentication headers for API requests
  generateAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    switch (this.config.authType) {
      case "bearer":
        const token = this.globalVariables[this.config.tokenName];
        if (token) {
          const headerKey = this.config.headerKey || "Authorization";
          const headerValue = this.config.headerValueFormat.replace(
            "{token}",
            token
          );
          headers[headerKey] = headerValue;
        }
        break;

      case "basic":
        const username = this.globalVariables["username"];
        const password = this.globalVariables["password"];
        if (username && password) {
          const credentials = btoa(`${username}:${password}`);
          headers["Authorization"] = `Basic ${credentials}`;
        }
        break;

      case "oauth2":
        const oauthToken = this.globalVariables[this.config.tokenName];
        if (oauthToken) {
          headers["Authorization"] = `Bearer ${oauthToken}`;
        }
        break;

      case "api_key":
        const apiKey =
          this.config.apiKey?.keyValue ||
          this.globalVariables[this.config.apiKey?.keyName || "api_key"];
        if (apiKey) {
          const keyName = this.config.apiKey?.keyName || "X-API-Key";
          const prefix = this.config.apiKey?.prefix || "";
          headers[keyName] = `${prefix}${apiKey}`;
        }
        break;

      case "session":
        const sessionId =
          this.globalVariables[
            this.config.session?.sessionIdField || "session_id"
          ];
        const sessionToken =
          this.globalVariables[
            this.config.session?.sessionTokenField || "session_token"
          ];
        if (sessionId) {
          headers["Cookie"] = `${
            this.config.session?.sessionIdField || "session_id"
          }=${sessionId}`;
        }
        if (sessionToken) {
          headers["X-Session-Token"] = sessionToken;
        }
        break;

      case "custom":
        // For custom auth, use the configured header key and value format
        const customToken = this.globalVariables[this.config.tokenName];
        if (customToken) {
          const headerKey = this.config.headerKey || "Authorization";
          const headerValue = this.config.headerValueFormat.replace(
            "{token}",
            customToken
          );
          headers[headerKey] = headerValue;
        }
        break;
    }

    return headers;
  }

  // Get the current token value
  getCurrentToken(): string | null {
    return this.globalVariables[this.config.tokenName] ?? null;
  }

  // Check if authentication is configured
  isAuthenticated(): boolean {
    const token = this.getCurrentToken();
    return !!token;
  }
}
