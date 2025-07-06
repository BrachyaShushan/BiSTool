/**
 * Centralized token service to eliminate duplicate token extraction logic
 */

export interface TokenExtractionResult {
  token: string | null;
  source: "json" | "cookies" | "headers" | "response-text" | "set-cookie";
  details?: string;
}

export class TokenService {
  /**
   * Extract token from JSON response
   */
  static extractFromJson(
    jsonData: any,
    paths: string[] = []
  ): TokenExtractionResult {
    const defaultPaths = [
      "token",
      "access_token",
      "accessToken",
      "jwt",
      "auth_token",
    ];
    const searchPaths = paths.length > 0 ? paths : defaultPaths;

    for (const path of searchPaths) {
      const value = jsonData[path];
      if (value && typeof value === "string") {
        return {
          token: value,
          source: "json",
          details: `Found in path: ${path}`,
        };
      }
    }

    return { token: null, source: "json" };
  }

  /**
   * Extract token from browser cookies
   */
  static extractFromCookies(cookieNames: string[] = []): TokenExtractionResult {
    const defaultNames = ["token", "access_token", "auth_token", "jwt"];
    const searchNames = cookieNames.length > 0 ? cookieNames : defaultNames;

    for (const cookieName of searchNames) {
      const value = this.getCookieValue(cookieName);
      if (value) {
        return {
          token: value,
          source: "cookies",
          details: `Found in cookie: ${cookieName}`,
        };
      }
    }

    // Try to find any cookie that might contain the token
    const allCookies = document.cookie
      .split(";")
      .map((cookie) => {
        const [name, value] = cookie.trim().split("=");
        return { name: name?.trim(), value: value?.trim() };
      })
      .filter((cookie) => cookie.name);

    const tokenCookie = allCookies.find(
      (cookie) =>
        cookie.name?.toLowerCase().includes("token") ||
        cookie.name?.toLowerCase().includes("auth") ||
        cookie.name?.toLowerCase().includes("jwt")
    );

    if (tokenCookie?.value) {
      return {
        token: tokenCookie.value,
        source: "cookies",
        details: `Found in cookie: ${tokenCookie.name}`,
      };
    }

    return { token: null, source: "cookies" };
  }

  /**
   * Extract token from Set-Cookie header
   */
  static extractFromSetCookieHeader(
    response: Response,
    cookieNames: string[] = []
  ): TokenExtractionResult {
    const setCookieHeader = response.headers.get("set-cookie");
    if (!setCookieHeader) {
      return { token: null, source: "set-cookie" };
    }

    // Parse the Set-Cookie header
    const cookies = setCookieHeader.split(",").map((cookie) => {
      const [nameValue] = cookie.split(";");
      const [name, value] = nameValue?.trim().split("=") ?? [];
      return { name: name?.trim(), value: value?.trim() };
    });

    const defaultNames = ["token", "access_token", "auth_token", "jwt"];
    const searchNames = cookieNames.length > 0 ? cookieNames : defaultNames;

    for (const cookieName of searchNames) {
      const cookie = cookies.find((c) => c.name === cookieName);
      if (cookie?.value) {
        return {
          token: cookie.value,
          source: "set-cookie",
          details: `Found in Set-Cookie: ${cookieName}`,
        };
      }
    }

    // Try to find any cookie that might contain the token
    const tokenCookie = cookies.find(
      (cookie) =>
        cookie.name?.toLowerCase().includes("token") ||
        cookie.name?.toLowerCase().includes("auth") ||
        cookie.name?.toLowerCase().includes("jwt")
    );

    if (tokenCookie?.value) {
      return {
        token: tokenCookie.value,
        source: "set-cookie",
        details: `Found in Set-Cookie: ${tokenCookie.name}`,
      };
    }

    return { token: null, source: "set-cookie" };
  }

  /**
   * Extract token from response headers
   */
  static extractFromHeaders(
    response: Response,
    headerNames: string[] = []
  ): TokenExtractionResult {
    const defaultNames = [
      "authorization",
      "x-access-token",
      "x-auth-token",
      "token",
    ];
    const searchNames = headerNames.length > 0 ? headerNames : defaultNames;

    for (const headerName of searchNames) {
      const value = response.headers.get(headerName);
      if (value) {
        // Remove 'Bearer ' prefix if present
        const token = value.replace(/^Bearer\s+/i, "");
        return {
          token,
          source: "headers",
          details: `Found in header: ${headerName}`,
        };
      }
    }

    return { token: null, source: "headers" };
  }

  /**
   * Extract token from response text
   */
  static extractFromResponseText(responseText: string): TokenExtractionResult {
    // Try to find JWT pattern in the response text
    const jwtPattern =
      /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
    const match = responseText.match(jwtPattern);
    if (match) {
      return {
        token: match[1] ?? null,
        source: "response-text",
        details: "Found JWT pattern in response text",
      };
    }

    // Try to find any token pattern
    const tokenPattern =
      /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
    const tokenMatch = responseText.match(tokenPattern);
    if (tokenMatch) {
      return {
        token: tokenMatch[1] ?? null,
        source: "response-text",
        details: "Found token pattern in response text",
      };
    }

    return { token: null, source: "response-text" };
  }

  /**
   * Extract token using all available methods
   */
  static extractToken(
    response: Response,
    responseText: string,
    options: {
      jsonPaths?: string[];
      cookieNames?: string[];
      headerNames?: string[];
    } = {}
  ): TokenExtractionResult {
    // Try JSON first
    try {
      const jsonData = JSON.parse(responseText);
      const jsonResult = this.extractFromJson(jsonData, options.jsonPaths);
      if (jsonResult.token) {
        return jsonResult;
      }
    } catch (e) {
      // JSON parsing failed, continue with other methods
    }

    // Try Set-Cookie header
    const cookieResult = this.extractFromSetCookieHeader(
      response,
      options.cookieNames
    );
    if (cookieResult.token) {
      return cookieResult;
    }

    // Try response headers
    const headerResult = this.extractFromHeaders(response, options.headerNames);
    if (headerResult.token) {
      return headerResult;
    }

    // Try response text
    const textResult = this.extractFromResponseText(responseText);
    if (textResult.token) {
      return textResult;
    }

    // Try browser cookies as last resort
    const browserCookieResult = this.extractFromCookies(options.cookieNames);
    if (browserCookieResult.token) {
      return browserCookieResult;
    }

    return { token: null, source: "response-text" };
  }

  /**
   * Get cookie value by name
   */
  private static getCookieValue(cookieName: string): string | null {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === cookieName && value) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Decode JWT token payload
   */
  static decodeJwtPayload(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = atob(
        parts[1]?.replace(/-/g, "+").replace(/_/g, "/") || ""
      );
      return JSON.parse(payload);
    } catch (e) {
      console.error("Error decoding JWT payload:", e);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(token: string): boolean {
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return true;
    }

    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  }

  /**
   * Get token expiration time in minutes
   */
  static getTokenExpirationMinutes(token: string): number {
    const payload = this.decodeJwtPayload(token);
    if (!payload || !payload.exp) {
      return 0;
    }

    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, Math.floor((payload.exp - now) / 60));
  }
}
