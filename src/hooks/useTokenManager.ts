import { useState, useCallback } from "react";
import { TokenConfig } from "../types";
import { DEFAULT_TOKEN_CONFIG } from "../utils/storage";
import { useVariablesContext } from "../context/VariablesContext";

// Custom hook for managing tokens and authentication
export const useTokenManager = () => {
  const [tokenConfig, setTokenConfig] =
    useState<TokenConfig>(DEFAULT_TOKEN_CONFIG);
  const { replaceVariables, globalVariables } = useVariablesContext();

  // Regenerate token
  const regenerateToken = useCallback(async (): Promise<{
    token: string;
    tokenName: string;
    refreshToken?: string;
    refreshTokenName?: string;
  }> => {
    try {
      if (!globalVariables["username"] || !globalVariables["password"]) {
        throw new Error("Please set username and password in global variables");
      }

      // Evaluate all string fields in tokenConfig using replaceVariables
      const evaluatedTokenConfig = {
        ...tokenConfig,
        domain: replaceVariables(tokenConfig.domain || ""),
        path: replaceVariables(tokenConfig.path || ""),
        headerKey: replaceVariables(tokenConfig.headerKey || ""),
        headerValueFormat: replaceVariables(
          tokenConfig.headerValueFormat || ""
        ),
        ...(tokenConfig.oauth2
          ? {
              oauth2: {
                ...tokenConfig.oauth2,
                clientId:
                  replaceVariables?.(tokenConfig.oauth2.clientId || "") ||
                  tokenConfig.oauth2.clientId ||
                  "",
                clientSecret:
                  replaceVariables?.(tokenConfig.oauth2.clientSecret || "") ||
                  tokenConfig.oauth2.clientSecret ||
                  "",
                redirectUri:
                  replaceVariables?.(tokenConfig.oauth2.redirectUri || "") ||
                  tokenConfig.oauth2.redirectUri ||
                  "",
                scope:
                  replaceVariables?.(tokenConfig.oauth2.scope || "") ||
                  tokenConfig.oauth2.scope ||
                  "",
                authorizationUrl:
                  replaceVariables?.(
                    tokenConfig.oauth2.authorizationUrl || ""
                  ) ||
                  tokenConfig.oauth2.authorizationUrl ||
                  "",
                tokenUrl:
                  replaceVariables?.(tokenConfig.oauth2.tokenUrl || "") ||
                  tokenConfig.oauth2.tokenUrl ||
                  "",
                ...(tokenConfig.oauth2.refreshUrl !== undefined &&
                replaceVariables?.(tokenConfig.oauth2.refreshUrl || "")
                  ? {
                      refreshUrl:
                        replaceVariables?.(
                          tokenConfig.oauth2.refreshUrl || ""
                        ) ||
                        tokenConfig.oauth2.refreshUrl ||
                        "",
                    }
                  : {}),
              },
            }
          : {}),
        ...(tokenConfig.apiKey
          ? {
              apiKey: {
                ...tokenConfig.apiKey,
                keyName:
                  replaceVariables?.(tokenConfig.apiKey.keyName || "") ||
                  tokenConfig.apiKey.keyName ||
                  "",
                keyValue:
                  replaceVariables?.(tokenConfig.apiKey.keyValue || "") ||
                  tokenConfig.apiKey.keyValue ||
                  "",
                prefix:
                  replaceVariables?.(tokenConfig.apiKey.prefix || "") ||
                  tokenConfig.apiKey.prefix ||
                  "",
              },
            }
          : {}),
        ...(tokenConfig.session
          ? {
              session: {
                ...tokenConfig.session,
                sessionIdField:
                  replaceVariables?.(
                    tokenConfig.session.sessionIdField || ""
                  ) ||
                  tokenConfig.session.sessionIdField ||
                  "",
                sessionTokenField:
                  replaceVariables?.(
                    tokenConfig.session.sessionTokenField || ""
                  ) ||
                  tokenConfig.session.sessionTokenField ||
                  "",
              },
            }
          : {}),
      };

      // Use the same fetch logic as TokenGenerator
      const domain = evaluatedTokenConfig.domain;
      if (!domain) {
        throw new Error("Please set a valid domain");
      }
      const requestUrl = `${domain}${evaluatedTokenConfig.path}`;
      let requestBody: string;
      let contentType: string;
      if (evaluatedTokenConfig.requestMapping.contentType === "json") {
        const bodyData = {
          [evaluatedTokenConfig.requestMapping.usernameField]:
            globalVariables["username"],
          [evaluatedTokenConfig.requestMapping.passwordField]:
            globalVariables["password"],
        };
        requestBody = JSON.stringify(bodyData);
        contentType = "application/json";
      } else {
        requestBody =
          `${
            evaluatedTokenConfig.requestMapping.usernameField
          }=${encodeURIComponent(globalVariables["username"])}` +
          `&${
            evaluatedTokenConfig.requestMapping.passwordField
          }=${encodeURIComponent(globalVariables["password"])}`;
        contentType = "application/x-www-form-urlencoded";
      }
      const response = await fetch(requestUrl, {
        method: evaluatedTokenConfig.method,
        headers: {
          Accept: "*/*",
          "Content-Type": contentType,
        },
        body: requestBody,
      });
      let responseText = await response.text();
      let token: string | null = null;

      // Try to extract from JSON response first
      if (evaluatedTokenConfig.extractionMethods.json) {
        try {
          let jsonData: any;
          try {
            jsonData = JSON.parse(responseText);
          } catch (e) {}
          if (jsonData) {
            const defaultPaths = [
              "token",
              "access_token",
              "accessToken",
              "jwt",
              "auth_token",
            ];
            const searchPaths =
              evaluatedTokenConfig.extractionMethods.jsonPaths.length > 0
                ? evaluatedTokenConfig.extractionMethods.jsonPaths
                : defaultPaths;
            for (const path of searchPaths) {
              const value = jsonData[path];
              if (value && typeof value === "string") {
                token = value;
                break;
              }
            }
          }
        } catch (e) {}
      }

      // Try to extract from cookies if JSON extraction failed
      if (!token && evaluatedTokenConfig.extractionMethods.cookies) {
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          const cookies = setCookieHeader.split(",").map((cookie) => {
            const [nameValue] = cookie.split(";");
            const [name, value] = nameValue?.trim().split("=") ?? [];
            return { name: name?.trim(), value: value?.trim() };
          });
          const defaultNames = ["token", "access_token", "auth_token", "jwt"];
          const searchNames =
            evaluatedTokenConfig.extractionMethods.cookieNames.length > 0
              ? evaluatedTokenConfig.extractionMethods.cookieNames
              : defaultNames;
          for (const cookieName of searchNames) {
            const cookie = cookies.find((c) => c.name === cookieName);
            if (cookie?.value) {
              token = cookie.value;
              break;
            }
          }
          if (!token) {
            const tokenCookie = cookies.find(
              (cookie) =>
                cookie.name?.toLowerCase().includes("token") ||
                cookie.name?.toLowerCase().includes("auth") ||
                cookie.name?.toLowerCase().includes("jwt")
            );
            if (tokenCookie?.value) {
              token = tokenCookie.value;
            }
          }
        }
        // Try browser cookies if still not found
        if (!token) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const allCookies = document.cookie
            .split(";")
            .map((cookie) => {
              const [name, value] = cookie.trim().split("=");
              return { name: name?.trim(), value: value?.trim() };
            })
            .filter((cookie) => cookie.name);
          const defaultNames = ["token", "access_token", "auth_token", "jwt"];
          const searchNames =
            evaluatedTokenConfig.extractionMethods.cookieNames.length > 0
              ? evaluatedTokenConfig.extractionMethods.cookieNames
              : defaultNames;
          for (const cookieName of searchNames) {
            const value = allCookies.find((c) => c.name === cookieName)?.value;
            if (value) {
              token = value;
              break;
            }
          }
          if (!token) {
            const tokenCookie = allCookies.find(
              (cookie) =>
                cookie.name?.toLowerCase().includes("token") ||
                cookie.name?.toLowerCase().includes("auth") ||
                cookie.name?.toLowerCase().includes("jwt")
            );
            if (tokenCookie?.value) {
              token = tokenCookie.value;
            }
          }
        }
      }

      // Try to extract from response headers if previous methods failed
      if (!token && evaluatedTokenConfig.extractionMethods.headers) {
        const defaultNames = [
          "authorization",
          "x-access-token",
          "x-auth-token",
          "token",
        ];
        const searchNames =
          evaluatedTokenConfig.extractionMethods.headerNames.length > 0
            ? evaluatedTokenConfig.extractionMethods.headerNames
            : defaultNames;
        for (const headerName of searchNames) {
          const value = response.headers.get(headerName);
          if (value) {
            token = value.replace(/^Bearer\s+/i, "");
            break;
          }
        }
      }

      // Try to extract from response text if previous methods failed
      if (!token && evaluatedTokenConfig.extractionMethods.cookies) {
        const jwtPattern =
          /jwt[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
        const match = responseText.match(jwtPattern);
        if (match) {
          token = match[1] ?? null;
        }
        if (!token) {
          const tokenPattern =
            /(?:token|access_token|auth_token)[=:]\s*([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/i;
          const tokenMatch = responseText.match(tokenPattern);
          if (tokenMatch) {
            token = tokenMatch[1] ?? null;
          }
        }
      }

      if (!token) {
        throw new Error(
          "Token not found in response. Check your extraction configuration."
        );
      }

      // Extract refresh token if needed
      let refreshToken: string | null = null;
      if (evaluatedTokenConfig.refreshToken) {
        refreshToken = await extractRefreshToken(
          responseText,
          evaluatedTokenConfig
        );
      }

      return {
        token,
        tokenName: evaluatedTokenConfig.tokenName,
        ...(refreshToken && {
          refreshToken,
          refreshTokenName: evaluatedTokenConfig.refreshTokenName,
        }),
      };
    } catch (error) {
      console.error("Token regeneration error:", error);
      throw error;
    }
  }, [tokenConfig, globalVariables, replaceVariables]);

  // Generate authentication headers for API requests
  const generateAuthHeaders = useCallback((): Record<string, string> => {
    const headers: Record<string, string> = {};

    switch (tokenConfig.authType) {
      case "bearer":
        const token = globalVariables[tokenConfig.tokenName];
        if (token) {
          const headerKey = tokenConfig.headerKey || "Authorization";
          const headerValue = tokenConfig.headerValueFormat.replace(
            "{token}",
            token
          );
          headers[headerKey] = headerValue;
        }
        break;

      case "basic":
        const username = globalVariables["username"];
        const password = globalVariables["password"];
        if (username && password) {
          const credentials = btoa(`${username}:${password}`);
          headers["Authorization"] = `Basic ${credentials}`;
        }
        break;

      case "oauth2":
        const oauthToken = globalVariables[tokenConfig.tokenName];
        if (oauthToken) {
          headers["Authorization"] = `Bearer ${oauthToken}`;
        }
        break;

      case "api_key":
        const apiKey =
          tokenConfig.apiKey?.keyValue ||
          globalVariables[tokenConfig.apiKey?.keyName || "api_key"];
        if (apiKey) {
          const keyName = tokenConfig.apiKey?.keyName || "X-API-Key";
          const prefix = tokenConfig.apiKey?.prefix || "";
          headers[keyName] = `${prefix}${apiKey}`;
        }
        break;

      case "session":
        const sessionId =
          globalVariables[tokenConfig.session?.sessionIdField || "session_id"];
        const sessionToken =
          globalVariables[
            tokenConfig.session?.sessionTokenField || "session_token"
          ];
        if (sessionId) {
          headers["Cookie"] = `${
            tokenConfig.session?.sessionIdField || "session_id"
          }=${sessionId}`;
        }
        if (sessionToken) {
          headers["X-Session-Token"] = sessionToken;
        }
        break;

      case "custom":
        const customToken = globalVariables[tokenConfig.tokenName];
        if (customToken) {
          const headerKey = tokenConfig.headerKey || "Authorization";
          const headerValue = tokenConfig.headerValueFormat.replace(
            "{token}",
            customToken
          );
          headers[headerKey] = headerValue;
        }
        break;
    }

    return headers;
  }, [tokenConfig, globalVariables]);

  // Get the current token value
  const getCurrentToken = useCallback((): string | null => {
    return globalVariables[tokenConfig.tokenName] || null;
  }, [globalVariables, tokenConfig.tokenName]);

  // Check if authentication is configured
  const isAuthenticated = useCallback((): boolean => {
    const token = getCurrentToken();
    return !!token;
  }, [getCurrentToken]);

  return {
    tokenConfig,
    setTokenConfig,
    regenerateToken,
    generateAuthHeaders,
    getCurrentToken,
    isAuthenticated,
    replaceVariables,
  };
};

// Helper function to extract refresh token
const extractRefreshToken = async (
  responseText: string,
  tokenConfig: TokenConfig
): Promise<string | null> => {
  let refreshToken: string | null = null;

  if (tokenConfig.extractionMethods.json && responseText) {
    try {
      const jsonData = JSON.parse(responseText);
      refreshToken = jsonData.refresh_token || jsonData.refreshToken;
    } catch (e) {}
  }

  if (!refreshToken && tokenConfig.extractionMethods.cookies) {
    const allCookies = document.cookie
      .split(";")
      .map((cookie) => {
        const [name, value] = cookie.trim().split("=");
        return { name: name?.trim(), value: value?.trim() };
      })
      .filter((cookie) => cookie.name);
    refreshToken =
      allCookies.find((c) => c.name === tokenConfig.refreshTokenName)?.value ||
      null;
  }

  return refreshToken;
};
