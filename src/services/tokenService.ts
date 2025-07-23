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

/**
 * Fetch a token using the provided config and variables, with auto-detect fallback.
 * Returns { success, token, error, details }
 */
export async function fetchTokenWithAutoDetect({
  globalVariables,
  tokenConfig,
  updateGlobalVariable,
  replaceVariables,
}: {
  globalVariables: Record<string, any>;
  tokenConfig: any;
  updateGlobalVariable: (name: string, value: string) => void;
  replaceVariables?: (text: string) => string;
}): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  details?: string;
}> {
  // Validate required fields
  const missingFields = [];
  if (!globalVariables?.["username"]) missingFields.push("username");
  if (!globalVariables?.["password"]) missingFields.push("password");
  if (!tokenConfig?.domain) missingFields.push("base_url/domain");
  if (missingFields.length > 0) {
    return {
      success: false,
      error: `Missing required fields: ${missingFields.join(", ")}`,
    };
  }

  // Prepare request
  const doReplace =
    replaceVariables ||
    ((text: string) => replaceVariablesInText(text, globalVariables));
  const requestUrl = doReplace(tokenConfig.domain);
  let requestBody = "";
  let contentType = "";
  if (tokenConfig.requestMapping?.contentType === "json") {
    const bodyData = {
      [tokenConfig.requestMapping.usernameField]: doReplace(
        globalVariables["username"]
      ),
      [tokenConfig.requestMapping.passwordField]: doReplace(
        globalVariables["password"]
      ),
    };
    requestBody = JSON.stringify(bodyData);
    contentType = "application/json";
  } else {
    requestBody =
      `${tokenConfig.requestMapping.usernameField}=${encodeURIComponent(
        doReplace(globalVariables["username"])
      )}` +
      `&${tokenConfig.requestMapping.passwordField}=${encodeURIComponent(
        doReplace(globalVariables["password"])
      )}`;
    contentType = "application/x-www-form-urlencoded";
  }

  // Helper to perform fetch and extraction
  async function tryFetchAndExtract(extractionMethods: any) {
    let response;
    try {
      response = await fetch(requestUrl, {
        method: tokenConfig.method,
        headers: {
          Accept: "*/*",
          "Content-Type": contentType,
        },
        body: requestBody,
      });
    } catch (fetchError) {
      if (
        fetchError instanceof TypeError &&
        fetchError.message.includes("fetch")
      ) {
        return { error: `Network Error: Unable to connect to ${requestUrl}.` };
      }
      return {
        error: `Request Failed: ${
          fetchError instanceof Error
            ? fetchError.message
            : "Unknown network error"
        }`,
      };
    }
    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      switch (response.status) {
        case 401:
          errorMessage += " - Authentication Failed: Check credentials.";
          break;
        case 403:
          errorMessage += " - Access Forbidden: Check permissions.";
          break;
        case 404:
          errorMessage += " - Not Found: Check endpoint.";
          break;
        case 429:
          errorMessage += " - Rate Limited: Too many requests.";
          break;
        case 500:
          errorMessage += " - Server Error: Try again later.";
          break;
        case 502:
        case 503:
        case 504:
          errorMessage += " - Service Unavailable: Try again later.";
          break;
        default:
          errorMessage += " - Check request configuration.";
      }
      return { error: errorMessage };
    }
    let responseText = await response.text();
    let jsonData = null;
    try {
      jsonData = JSON.parse(responseText);
    } catch {}
    // Try JSON
    if (extractionMethods.json && jsonData) {
      const result = TokenService.extractFromJson(
        jsonData,
        extractionMethods.jsonPaths
      );
      if (result.token) return { token: result.token, details: result.details };
    }
    // Try Set-Cookie header
    if (extractionMethods.cookies) {
      const result = TokenService.extractFromSetCookieHeader(
        response,
        extractionMethods.cookieNames
      );
      if (result.token) return { token: result.token, details: result.details };
    }
    // Try browser cookies
    if (extractionMethods.cookies) {
      const result = TokenService.extractFromCookies(
        extractionMethods.cookieNames
      );
      if (result.token) return { token: result.token, details: result.details };
    }
    // Try headers
    if (extractionMethods.headers) {
      const result = TokenService.extractFromHeaders(
        response,
        extractionMethods.headerNames
      );
      if (result.token) return { token: result.token, details: result.details };
    }
    // Try response text
    if (extractionMethods.cookies) {
      const result = TokenService.extractFromResponseText(responseText);
      if (result.token) return { token: result.token, details: result.details };
    }
    return {
      error: "Token Extraction Failed: No token found in the response.",
    };
  }

  // 1. Try with current extraction method
  let result = await tryFetchAndExtract(tokenConfig.extractionMethods);
  if (result.token) {
    updateGlobalVariable(tokenConfig.tokenName, result.token);
    updateGlobalVariable("tokenName", tokenConfig.tokenName);
    return {
      success: true,
      token: result.token,
      details: result.details || "",
    };
  }

  // 2. If failed, try auto-detect (all methods enabled)
  const autoDetectMethods = {
    json: true,
    cookies: true,
    headers: true,
    jsonPaths: tokenConfig.extractionMethods.jsonPaths || [],
    cookieNames: tokenConfig.extractionMethods.cookieNames || [],
    headerNames: tokenConfig.extractionMethods.headerNames || [],
  };
  result = await tryFetchAndExtract(autoDetectMethods);
  if (result.token) {
    updateGlobalVariable(tokenConfig.tokenName, result.token);
    updateGlobalVariable("tokenName", tokenConfig.tokenName);
    return {
      success: true,
      token: result.token,
      details: result.details || "",
    };
  }

  // 3. If still failed, return error
  return {
    success: false,
    error: result.error || "Token fetch and auto-detect failed.",
  };
}

// Simple variable replacement utility for use outside React context
function replaceVariablesInText(
  text: string,
  variables: Record<string, any>
): string {
  if (!text) return text;
  return text.replace(/\{([^}]+)\}/g, (match, varName) => {
    if (variables[varName]) {
      return variables[varName];
    }
    return match;
  });
}

/**
 * Shared core token generation logic for both TokenGenerator and header shortcut.
 * Returns { success, token, error, details, extractionSource, debugInfo, refreshToken }
 */
export async function generateTokenCore({
  globalVariables,
  tokenConfig,
  updateGlobalVariable,
  replaceVariables,
  setResponseInfo,
  setTokenDuration,
}: {
  globalVariables: Record<string, any>;
  tokenConfig: any;
  updateGlobalVariable: (name: string, value: string) => void;
  replaceVariables: (text: string) => string;
  setResponseInfo?: (info: any) => void;
  setTokenDuration?: (duration: number) => void;
}): Promise<{
  success: boolean;
  token?: string;
  error?: string;
  details?: string;
  extractionSource?: string;
  debugInfo?: any;
  refreshToken?: string;
}> {
  try {
    // Validate required global variables
    if (!globalVariables["username"] || !globalVariables["password"]) {
      return {
        success: false,
        error: "❌ Missing variables:'username' and 'password'.",
      };
    }
    // Use replaceVariables to interpolate domain and path
    const domain = replaceVariables(tokenConfig.domain);
    const path = replaceVariables(tokenConfig.path);
    if (!domain) {
      return {
        success: false,
        error:
          "❌ Invalid Domain: Please set a valid domain in your token configuration. The domain should be a complete URL (e.g., https://api.example.com).",
      };
    }
    // Validate domain format
    try {
      new URL(domain);
    } catch {
      return {
        success: false,
        error:
          "❌ Invalid Domain Format: The domain must be a valid URL. Please include the protocol (http:// or https://) and ensure it's properly formatted.",
      };
    }
    const requestUrl = `${domain}${path}`;
    // Build request body based on content type and field mappings
    let requestBody: string;
    let contentType: string;
    if (tokenConfig.requestMapping.contentType === "json") {
      const bodyData = {
        [tokenConfig.requestMapping.usernameField]: globalVariables["username"],
        [tokenConfig.requestMapping.passwordField]: globalVariables["password"],
      };
      requestBody = JSON.stringify(bodyData);
      contentType = "application/json";
    } else {
      requestBody =
        `${tokenConfig.requestMapping.usernameField}=${encodeURIComponent(
          globalVariables["username"]
        )}` +
        `&${tokenConfig.requestMapping.passwordField}=${encodeURIComponent(
          globalVariables["password"]
        )}`;
      contentType = "application/x-www-form-urlencoded";
    }
    let response: Response;
    try {
      response = await fetch(requestUrl, {
        method: tokenConfig.method,
        headers: {
          Accept: "*/*",
          "Content-Type": contentType,
        },
        body: requestBody,
      });
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        return { success: false, error: "Request was aborted." };
      }
      if (
        fetchError instanceof TypeError &&
        fetchError.message.includes("fetch")
      ) {
        return {
          success: false,
          error: `❌ Network Error: Unable to connect to ${requestUrl}. Please check your internet connection, server, and URL.`,
        };
      }
      return {
        success: false,
        error: `❌ Request Failed: ${
          fetchError instanceof Error
            ? fetchError.message
            : "Unknown network error"
        }`,
      };
    }
    // Check for HTTP error status codes
    if (!response.ok) {
      let errorMessage = `❌ HTTP Error ${response.status}: ${response.statusText}`;
      switch (response.status) {
        case 401:
          errorMessage +=
            "\n\n🔐 Authentication Failed: Your credentials are incorrect or have expired. Please check:\n• Username and password are correct\n• Account is not locked or disabled\n• Credentials have proper permissions";
          break;
        case 403:
          errorMessage +=
            "\n\n🚫 Access Forbidden: You don't have permission to access this resource. Please check:\n• Your account has the required permissions\n• The API endpoint is correct\n• Your IP is not blocked";
          break;
        case 404:
          errorMessage +=
            "\n\n🔍 Not Found: The authentication endpoint was not found. Please check:\n• The URL path is correct\n• The API endpoint exists\n• You're using the right API version";
          break;
        case 429:
          errorMessage +=
            "\n\n⏱️ Rate Limited: Too many requests. Please wait before trying again.";
          break;
        case 500:
          errorMessage +=
            "\n\n🔧 Server Error: The authentication server is experiencing issues. Please try again later.";
          break;
        case 502:
        case 503:
        case 504:
          errorMessage +=
            "\n\n🌐 Service Unavailable: The authentication service is temporarily unavailable. Please try again later.";
          break;
        default:
          errorMessage +=
            "\n\nPlease check your request configuration and try again.";
      }
      return { success: false, error: errorMessage };
    }
    // Capture response information for debugging
    const allHeaders: Array<{ name: string; value: string }> = [];
    response.headers.forEach((value, key) => {
      allHeaders.push({ name: key, value });
    });
    const setCookieHeader = response.headers.get("set-cookie");
    // Wait a moment for cookies to be set by the browser
    await new Promise((resolve) => setTimeout(resolve, 100));
    // Get all cookies from document.cookie
    const allCookies = document.cookie
      .split(";")
      .map((cookie) => {
        const [name, value] = cookie.trim().split("=");
        return { name: name?.trim() ?? "", value: value?.trim() ?? "" };
      })
      .filter((cookie) => cookie.name);
    let token: string | null = null;
    let extractionSource = "";
    let responseText = "";
    // 1. Try to extract from JSON response first
    if (tokenConfig.extractionMethods.json) {
      try {
        responseText = await response.text();
        let jsonData: any;
        try {
          jsonData = JSON.parse(responseText);
        } catch (e) {
          // Not JSON, try other methods
        }
        if (jsonData) {
          token = TokenService.extractFromJson(
            jsonData,
            tokenConfig.extractionMethods.jsonPaths
          ).token;
          if (token) extractionSource = "JSON response";
        }
      } catch (e) {}
    }
    // 2. Try to extract from cookies if JSON extraction failed
    if (!token && tokenConfig.extractionMethods.cookies) {
      token = TokenService.extractFromSetCookieHeader(
        response,
        tokenConfig.extractionMethods.cookieNames
      ).token;
      if (token) {
        extractionSource = "Set-Cookie header";
      } else {
        await new Promise((resolve) => setTimeout(resolve, 500));
        token = TokenService.extractFromCookies(
          tokenConfig.extractionMethods.cookieNames
        ).token;
        if (token) extractionSource = "response cookies";
      }
    }
    // 3. Try to extract from response headers if previous methods failed
    if (!token && tokenConfig.extractionMethods.headers) {
      token = TokenService.extractFromHeaders(
        response,
        tokenConfig.extractionMethods.headerNames
      ).token;
      if (token) extractionSource = "response headers";
    }
    // 4. Try to extract from response text if previous methods failed
    if (!token && tokenConfig.extractionMethods.cookies) {
      if (!responseText) {
        responseText = await response.text();
      }
      token = TokenService.extractFromResponseText(responseText).token;
      if (token) extractionSource = "response text";
    }
    if (!token) {
      let extractionError =
        "❌ Token Extraction Failed: No token found in the response.\n\n";
      extractionError += "🔍 Debugging Steps:\n";
      extractionError +=
        "1. Check the 'Debug' tab to see the actual response\n";
      extractionError += "2. Verify your extraction method settings\n";
      extractionError +=
        "3. Ensure the API returns tokens in the expected format\n\n";
      extractionError += "📋 Current Extraction Settings:\n";
      extractionError += `• JSON Extraction: ${
        tokenConfig.extractionMethods.json ? "Enabled" : "Disabled"
      }\n`;
      extractionError += `• Cookie Extraction: ${
        tokenConfig.extractionMethods.cookies ? "Enabled" : "Disabled"
      }\n`;
      extractionError += `• Header Extraction: ${
        tokenConfig.extractionMethods.headers ? "Enabled" : "Disabled"
      }\n`;
      extractionError += `• JSON Paths: ${
        tokenConfig.extractionMethods.jsonPaths.join(", ") || "Default paths"
      }\n`;
      extractionError += `• Cookie Names: ${
        tokenConfig.extractionMethods.cookieNames.join(", ") || "Default names"
      }\n`;
      extractionError += `• Header Names: ${
        tokenConfig.extractionMethods.headerNames.join(", ") || "Default names"
      }\n\n`;
      extractionError +=
        "💡 Try using the 'Auto Detect' feature to automatically configure extraction settings.";
      if (setResponseInfo)
        setResponseInfo({
          cookies: allCookies,
          headers: allHeaders,
          responseText,
          setCookieHeader,
        });
      return {
        success: false,
        error: extractionError,
        debugInfo: {
          cookies: allCookies,
          headers: allHeaders,
          responseText,
          setCookieHeader,
        },
      };
    }
    updateGlobalVariable(tokenConfig.tokenName, token);
    updateGlobalVariable("tokenName", tokenConfig.tokenName);
    // Handle refresh token extraction
    let refreshToken: string | null = null;
    if (tokenConfig.refreshToken) {
      // Try to extract refresh token using the same methods
      if (tokenConfig.extractionMethods.json && responseText) {
        try {
          const jsonData = JSON.parse(responseText);
          refreshToken = jsonData.refresh_token || jsonData.refreshToken;
        } catch (e) {}
      }
      const foundCookie = allCookies.find(
        (c) => c.name === tokenConfig.refreshTokenName
      );
      if (
        foundCookie &&
        typeof foundCookie.value === "string" &&
        foundCookie.value
      ) {
        refreshToken = foundCookie.value;
      }
      if (typeof refreshToken === "string" && refreshToken.length > 0) {
        updateGlobalVariable(tokenConfig.refreshTokenName, refreshToken);
      }
    }
    // Set debug info if provided
    if (setResponseInfo)
      setResponseInfo({
        cookies: allCookies,
        headers: allHeaders,
        responseText,
        setCookieHeader,
      });
    // Set token duration if provided
    if (setTokenDuration && token) {
      try {
        const parts = token.split(".");
        if (parts.length > 1 && typeof parts[1] === "string") {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          const exp = payload.exp;
          const duration = (exp - now) / 60;
          setTokenDuration(duration);
        }
      } catch {}
    }
    return {
      success: true,
      token,
      details: `Token extracted from ${extractionSource} successfully!`,
      extractionSource,
      debugInfo: {
        cookies: allCookies,
        headers: allHeaders,
        responseText,
        setCookieHeader,
      },
      refreshToken: refreshToken ?? "",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "❌ Failed to generate token: Unknown error occurred",
    };
  }
}
