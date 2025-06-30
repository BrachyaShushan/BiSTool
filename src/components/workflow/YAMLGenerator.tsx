import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import { Editor } from "@monaco-editor/react";
import {
  FiDownload,
  FiCopy,
  FiMaximize2,
  FiMinimize2,
  FiPlay,
  FiCheck,
  FiArrowRight,
  FiCode,
  FiSettings,
  FiZap,
  FiTarget,
  FiGlobe,
  FiFileText,
  FiShield,
  FiRefreshCw,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiCpu,
  FiLayers,
  FiActivity,
  FiWifi,
  FiServer
} from "react-icons/fi";
import { YAMLGeneratorProps } from "../../types/components/components.types";
import {
  EditorOptions,
  ResponseData,
} from "../../types/components/yamlGenerator.types";
import { RequestConfigData, ResponseCondition } from "../../types/core/app.types";
import { ExtendedSession } from "../../types/features/SavedManager";
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

// Extract variables from URL in {variable} format, excluding the base URL
const extractVariables = (url: string): string[] => {
  if (!url) return [];
  url = url.split("//")[1] ?? url;
  // Handle both {variable} and %7Bvariable%7D formats
  const matches = url.match(/(?:{([^}]+)}|%7B([^%]+)%7D)/g) || [];
  return matches.map((match) => {
    if (match.startsWith("{")) {
      return match.slice(1, -1);
    } else {
      return match.slice(3, -3);
    }
  });
};

const YAMLGenerator: React.FC<YAMLGeneratorProps> = ({ onGenerate }) => {
  const {
    urlData,
    requestConfig,
    setYamlOutput,
    globalVariables,
    segmentVariables,
    activeSession,
    handleSaveSession,
    setActiveSection,
    generateAuthHeaders,
    openSessionManager,
  } = useAppContext();

  const { isDarkMode } = useTheme();
  const [localYamlOutput, setLocalYamlOutput] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [statusCode, setStatusCode] = useState<string>("200");
  const [error, setError] = useState<string | null>(null);
  const [selectedQueries, setSelectedQueries] = useState<
    Record<string, boolean>
  >(() => {
    if (requestConfig?.queryParams) {
      const initialQueries: Record<string, boolean> = {};
      requestConfig.queryParams.forEach((param: any) => {
        initialQueries[param.key] = param.required ?? false;
      });
      return initialQueries;
    }
    return {};
  });
  const [openApiVersion, setOpenApiVersion] = useState<string>("0.9.7.1");
  const [customResponse, setCustomResponse] = useState<string>("");
  const [isYamlExpanded, setIsYamlExpanded] = useState<boolean>(false);
  const [editorHeight, setEditorHeight] = useState<number>(400);
  const [responseConditions, setResponseConditions] = useState<ResponseCondition[]>(() => {
    return activeSession?.responseConditions ?? [];
  });
  const [includeToken, setIncludeToken] = useState<boolean>(activeSession?.includeToken ?? true);
  const tokenExists = globalVariables["tokenName"];
  const editorRef = useRef<any>(null);
  const yamlEditorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const yamlContainerRef = useRef<HTMLDivElement>(null);
  const [outputViewMode, setOutputViewMode] = useState<'yaml' | 'json'>('yaml');
  const [lastJsonResponse, setLastJsonResponse] = useState<any>(null);
  const [lastYamlOutput, setLastYamlOutput] = useState<string>("");

  // Initialize selectedQueries when requestConfig changes
  useEffect(() => {
    if (requestConfig?.queryParams) {
      const initialQueries: Record<string, boolean> = {};
      requestConfig.queryParams.forEach((param: any) => {
        initialQueries[param.key] = selectedQueries[param.key] ?? false;
      });
      setSelectedQueries(initialQueries);
    } else {
      setSelectedQueries({});
    }
  }, [requestConfig]);

  // Helper function to get value from variables
  const getValueFromVariables = useCallback(
    (
      value: string | number | boolean | null | undefined
    ): string | number | boolean | null => {
      if (value === undefined || value === null) return null;
      // If value is not a string or doesn't contain a variable reference, return as is
      if (typeof value !== "string") return value;

      // Handle ${variable} format
      if (value.startsWith("${") && value.endsWith("}")) {
        const varName = value.slice(2, -1);

        // Check global variables first
        if (globalVariables && varName in globalVariables) {
          return globalVariables[varName] ?? null;
        }

        // Then check segment variables
        if (segmentVariables && varName in segmentVariables) {
          return segmentVariables[varName] ?? null;
        }

        // Finally check session variables
        if (
          activeSession?.sharedVariables &&
          varName in activeSession.sharedVariables
        ) {
          return activeSession.sharedVariables[varName] ?? null;
        }

        return value;
      }

      // Handle {variable} format
      if (value.startsWith("{") && value.endsWith("}")) {
        const varName = value.slice(1, -1);

        // Check global variables first
        if (globalVariables && varName in globalVariables) {
          return globalVariables[varName] ?? null;
        }

        // Then check segment variables
        if (segmentVariables && varName in segmentVariables) {
          return segmentVariables[varName] ?? null;
        }

        // Finally check session variables
        if (
          activeSession?.sharedVariables &&
          varName in activeSession.sharedVariables
        ) {
          return activeSession.sharedVariables[varName] ?? null;
        }

        return value;
      }

      // If the value is a direct variable name, try to find it
      if (globalVariables && value in globalVariables) {
        return globalVariables[value] ?? null;
      }

      if (segmentVariables && value in segmentVariables) {
        return segmentVariables[value] ?? null;
      }

      if (
        activeSession?.sharedVariables &&
        value in activeSession.sharedVariables
      ) {
        return activeSession.sharedVariables[value] ?? null;
      }

      return value;
    },
    [globalVariables, segmentVariables, activeSession]
  );

  const handleEditorDidMount = (editor: any, monaco: any): void => {
    editorRef.current = editor;
    // Configure JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [
        {
          uri: "http://myserver/foo-schema.json",
          schema: {
            type: "object",
            properties: {
              "*": {
                type: "object",
              },
            },
          },
        },
      ],
    });
  };

  const handleMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight =
      containerRef.current?.getBoundingClientRect().height ?? 0;

    function onMouseMove(e: MouseEvent): void {
      const deltaY = e.pageY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      if (containerRef.current) {
        containerRef.current.style.height = `${newHeight}px`;
      }
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }

    function onMouseUp(): void {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleYamlMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight =
      yamlContainerRef.current?.getBoundingClientRect().height ?? 0;

    function onMouseMove(e: MouseEvent): void {
      const deltaY = e.pageY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      if (yamlContainerRef.current) {
        yamlContainerRef.current.style.height = `${newHeight}px`;
      }
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }

    function onMouseUp(): void {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const handleYamlEditorDidMount = (editor: any): void => {
    yamlEditorRef.current = editor;
  };

  // Update YAML editor height when content changes
  useEffect(() => {
    if (yamlEditorRef.current && localYamlOutput) {
      // Add any necessary layout updates here
    }
  }, [localYamlOutput]);

  const handleFetchRequest = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      // Build URL with selected query parameters
      const selectedParams =
        requestConfig?.queryParams?.filter(
          (param) => selectedQueries[param.key]
        ) || [];

      const queryString = selectedParams
        .map((param) => {
          const resolvedValue = getValueFromVariables(param.value);
          return `${param.key}=${resolvedValue}`;
        })
        .join("&");

      let url = urlData.builtUrl;
      const variables = extractVariables(url);
      variables.forEach((variable) => {
        const value = getValueFromVariables(variable);
        if (value) {
          url = url.replace(`{${variable}}`, value as string);
          url = url.replace(`%7B${variable}%7D`, value as string);
        }
      });
      url = queryString
        ? `${url}?${queryString}`
        : url;

      // Generate authentication headers based on the chosen auth method
      const authHeaders = generateAuthHeaders();

      // Combine headers and ensure authentication is included
      const combinedHeaders = [
        ...(requestConfig?.headers ?? [])
      ].filter(Boolean);

      // Convert headers to the format expected by fetch
      const headers = combinedHeaders.reduce((acc, header) => {
        if (header?.key) {
          const value = getValueFromVariables(header.value);
          if (value !== null && value !== undefined) {
            acc[header.key] = value as string;
          }
        }
        return acc;
      }, {} as Record<string, string>);

      // Add authentication headers
      Object.assign(headers, authHeaders);

      // Function to check if HTTP method supports a body
      const methodSupportsBody = (httpMethod: string): boolean => {
        const methodsWithBody = ["POST", "PUT", "PATCH"];
        return methodsWithBody.includes(httpMethod.toUpperCase());
      };

      let body = null;
      // Only add body if method supports it
      if (methodSupportsBody(requestConfig?.method ?? "GET")) {
        if (requestConfig?.bodyType === "json" && requestConfig.jsonBody) {
          body = requestConfig.jsonBody;
        } else if (requestConfig?.bodyType === "form" && requestConfig.formData) {
          body = requestConfig.formData.map(field => `${field.key}=${field.value}`).join("&");
        } else if (requestConfig?.bodyType === "text" && requestConfig.textBody) {
          body = requestConfig.textBody;
        }
      }

      if (body && requestConfig?.bodyType === "json") {
        headers["Content-Type"] = "application/json; charset=utf-8";
      } else if (body && requestConfig?.bodyType === "form") {
        headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
      } else if (body && requestConfig?.bodyType === "text") {
        headers["Content-Type"] = "text/plain; charset=utf-8";
      }
      // Make the API request
      const response = await fetch(url, {
        method: requestConfig?.method ?? "GET",
        headers: headers,
        body
      });
      setStatusCode(response.status.toString());
      if (response.status === 204) {
        setOutputViewMode('json');
        setLastJsonResponse({});
        return;
      }
      if (!response.ok) {
        if (response.text) {
          setOutputViewMode('json');
          setLastJsonResponse(JSON.parse(await response.text()));
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const yamlStr = generateYAML(data, requestConfig);
      setLastJsonResponse(data);
      setLastYamlOutput(yamlStr);
      setLocalYamlOutput(yamlStr);
      setYamlOutput(yamlStr);
      // Call onGenerate to trigger navigation to next section
      onGenerate(yamlStr);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      if (statusCode === "200") {
        setStatusCode("500");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateFromCustomResponse = () => {
    try {
      const responseData = JSON.parse(customResponse);
      if (!requestConfig) {
        setError("No request configuration available");
        return;
      }
      const yamlStr = generateYAML(responseData, requestConfig);
      setLastJsonResponse(responseData);
      setLastYamlOutput(yamlStr);
      setLocalYamlOutput(yamlStr);
      setYamlOutput(yamlStr);
      // Call onGenerate to trigger navigation to next section
      onGenerate(yamlStr);
    } catch (err) {
      setError("Invalid JSON format ERROR: " + err);
    }
  };

  const generateYAML = (
    responseData: ResponseData,
    config: RequestConfigData | null
  ): string => {
    if (!responseData || !config) {
      return "";
    }

    // Function to check if HTTP method supports a body
    const methodSupportsBody = (httpMethod: string): boolean => {
      const methodsWithBody = ["POST", "PUT", "PATCH"];
      return methodsWithBody.includes(httpMethod.toUpperCase());
    };

    // Get the URL from urlData
    const url = urlData?.builtUrl || "";
    const { method, queryParams, formData } = config;
    let headers = config?.headers ?? [];

    // Use active session name or fallback to endpoint name
    const title = activeSession?.name ?? "API Endpoint";
    const category = activeSession?.category ?? "API";
    const description = activeSession?.urlData?.sessionDescription?.split("\n").map(line => line.trim()).join(". ") ?? "";

    // Add authentication headers to YAML if authentication is configured
    const authHeaders = generateAuthHeaders();
    if (Object.keys(authHeaders).length > 0) {
      Object.entries(authHeaders).forEach(([key, value]) => {
        headers.push({
          key,
          value: value.includes('.') ? value.split('.').map(() => 'xxx').join('.') : 'xxx',
          type: "string",
          in: "header",
          required: true,
          description: `Authentication header for ${key}`,
        });
      });
    }

    // Generate path parameters from dynamic segments
    const pathParameters = urlData?.parsedSegments
      ?.filter((segment) => segment.isDynamic)
      .map((segment) => {
        return `  - name: ${segment.paramName}
    in: path
    type: string
    example: ${activeSession?.sharedVariables?.[segment.paramName]}
    required: true${segment.description ? `\n    description: ${segment.description}` : ""
          }`;
      });

    // Generate header parameters
    const headerParameters = headers?.map((header) => {
      return `  - name: ${header.key}
    in: header
    type: ${header.type ?? "string"}
    required: ${header.required || false}
    description: ${header.description ?? ""}
    example: ${header.value}`;
    });

    // Generate query parameters
    const queryParameters = queryParams?.map((param) => {
      return `  - name: ${param.key}
    in: query
    type: ${param.type ?? "string"}
    required: ${param.required ?? false}
    description: ${param.description ?? ""}
    example: ${param.value}`;
    });

    // Generate form data parameters
    const formParameters = formData?.map((field) => {
      return `  - name: ${field.key}
    in: formData
    type: ${field.type}
    required: ${field.required}
    description: ${field.description ?? ""}
    example: ${field.value}`;
    });

    // Combine all parameters
    const allParameters = [
      ...(pathParameters || []),
      ...(headerParameters || []),
      ...(queryParameters || []),
      ...(formParameters || []),
    ].join("\n");

    // Function to generate schema from response data
    const generateSchema = (data: any, indent: string = ""): string => {
      if (data === null) return `${indent}type: null`;
      if (data === undefined) return `${indent}type: string`;

      const type = Array.isArray(data) ? "array" : typeof data;

      if (type === "object") {
        const properties = Object.entries(data)
          .map(([key, value]) => {
            const childSchema = generateSchema(value, `${indent}    `);
            return `${indent}  ${key}:\n${childSchema}`;
          })
          .join("\n");

        return `${indent}type: object\n${indent}properties:\n${properties}`;
      } else if (type === "array") {
        if (data.length === 0) {
          return `${indent}type: array\n${indent}items:\n${indent}    type: string`;
        }
        return `${indent}type: array\n${indent}items:\n${generateSchema(data[0], `${indent}  `)}`;
      } else {
        const example = type === "string" ? `"${data}"` : data;
        return `${indent}type: ${type}\n${indent}example: ${example}`;
      }
    };

    // Generate schema from response data
    const schema = generateSchema(responseData, "      ");
    let yaml = "";

    // Generate request body schema if method supports body
    const generateRequestBody = (): string => {
      if (!methodSupportsBody(method)) return "";

      let bodySchema = "\n";
      if (config.bodyType === "json" && config.jsonBody) {
        try {
          const jsonBody = JSON.parse(config.jsonBody);
          bodySchema += `  - in: body
    name: body
    required: true
${generateSchema(jsonBody, "    ")}`;
        } catch (e) {
          console.error("Error parsing JSON body:", e);
        }
      } else if (config.bodyType === "form" && config.formData) {
        bodySchema += `  - in: body
    name: body
    required: true
    type: object
    properties:
${config.formData.map(field => `      ${field.key}:
        type: ${field.type}
        required: ${field.required}
        description: ${field.description ?? ""}
        example: ${field.value}`).join("\n")}`;
      } else if (config.bodyType === "text") {
        bodySchema += `  - in: body
    name: body
    required: true
    type: string
    example: "${config.jsonBody}"`;
      }
      else {
        return "";
      }

      return bodySchema;
    };

    // Generate responses section
    const generateResponses = (): string => {
      let responses = `  200:\n    description: Successful response\n    schema:\n${schema}`;
      responseConditions.filter(c => c.include && c.status !== "200").forEach((condition) => {
        responses += `\n  ${condition.status}:\n    description: ${condition.status} response\n    ${condition.condition ? `condition: ${condition.condition}` : ""
          }`;
      });
      return responses;
    };

    if (openApiVersion === "0.9.7.1") {
      // Generate OpenAPI 0.9.7.1 YAML with generic template structure
      yaml = `${method} ${title}
---
tags:
  - ${category}
description: ${description}
url: ${url}
security:
  - ApiKeyAuth: []
parameters:
${allParameters}${generateRequestBody()}
responses:
${generateResponses()}`;
    } else if (openApiVersion === "2.0.0") {
      // Generate OpenAPI 2.0 YAML
      yaml = `swagger: '2.0'
info:
        title: ${title}
  version: '1.0'
paths:
        ${url}:
        ${method.toLowerCase()}:
        tags:
        - ${title}
      produces:
        - application/json
      parameters:
        ${allParameters}
${generateRequestBody()}
      responses:
        ${generateResponses()}`;
    } else {
      // Generate OpenAPI 3.0 YAML
      yaml = `openapi: 3.0.0
info:
        title: ${title}
  version: '1.0'
paths:
        ${url}:
        ${method.toLowerCase()}:
        tags:
        - ${title}
      parameters:
        ${allParameters}
${generateRequestBody()}
      responses:
        ${generateResponses()}`;
    }

    return yaml;
  };

  const handleCopyYAML = () => {
    navigator.clipboard
      .writeText(localYamlOutput)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        setError("Failed to copy YAML to clipboard ERROR: " + err);
      });
  };

  const handleDownloadYAML = () => {
    const blob = new Blob([localYamlOutput], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-spec.yaml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const editorOptions: EditorOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: "on",
    roundedSelection: false,
    scrollbar: {
      vertical: "visible",
      horizontal: "visible",
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
  };

  const getResolvedUrl = useCallback(() => {
    if (!urlData?.builtUrl) return "";
    let url = urlData.builtUrl;

    // Replace variables in the URL path
    const variables = extractVariables(url);
    variables.forEach((variable) => {
      const value = getValueFromVariables(variable);
      if (value) {
        url = url.replace(`{${variable}}`, value as string);
        url = url.replace(`%7B${variable}%7D`, value as string);
      }
    });

    // Add selected query parameters
    const selectedParams =
      requestConfig?.queryParams?.filter(
        (param) => selectedQueries[param.key]
      ) || [];

    const queryString = selectedParams
      .map((param) => {
        const resolvedValue = getValueFromVariables(param.value);
        return `${param.key}=${resolvedValue}`;
      })
      .join("&");

    return queryString ? `${url}?${queryString}` : url;
  }, [
    urlData?.builtUrl,
    requestConfig?.queryParams,
    selectedQueries,
    getValueFromVariables,
  ]);

  const getColoredUrl = useCallback(() => {
    const url = getResolvedUrl();
    if (!url) return null;

    // Split the URL into parts while preserving the structure
    const parts = url.split(/(?<=^[^:]+:\/\/)|(?<=\/)/);

    return parts.map((part, index) => {
      // Replace any remaining variables in the part
      const resolvedPart = part.replace(/\{([^}]+)\}/g, (match, variable) => {
        const value = getValueFromVariables(variable);
        return (value as string) || match;
      });

      if (part.includes("://")) {
        return (
          <span key={`${index}-${resolvedPart}`} className="text-blue-500">
            {resolvedPart}
          </span>
        );
      } else if (index === 1) {
        return (
          <span key={`${index}-${resolvedPart}`} className="text-green-500">
            {resolvedPart}
          </span>
        );
      } else {
        return (
          <span key={`${index}-${resolvedPart}`} className="text-purple-500">
            {resolvedPart}
          </span>
        );
      }
    });
  }, [getResolvedUrl, getValueFromVariables]);


  // Helper to get the default custom response
  const getDefaultCustomResponse = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return JSON.stringify({
      data: { Hello: "World" },
      token: "xxx.xxx.xxx",
      data_effective_tstamp: `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`,
    }, null, 2);
  }, []);

  // Load custom response from session or default when session changes
  useEffect(() => {
    if (activeSession?.customResponse) {
      setCustomResponse(activeSession?.customResponse);
    } else {
      setCustomResponse(getDefaultCustomResponse());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession?.id]);

  // Save custom response to session when it changes
  useEffect(() => {
    if (activeSession && customResponse !== undefined) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        customResponse,
      };
      if (activeSession.customResponse !== customResponse) {
        handleSaveSession(activeSession.name, updatedSession);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customResponse, activeSession?.id]);

  const handleResetCustomResponse = () => {
    const defaultResponse = getDefaultCustomResponse();
    setCustomResponse(defaultResponse);
    if (activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        customResponse: defaultResponse,
      };
      handleSaveSession(activeSession.name, updatedSession);
    }
  };

  const handleQueryToggle = (queryKey: string): void => {
    setSelectedQueries((prev) => ({
      ...prev,
      [queryKey]: !prev[queryKey],
    }));
  };

  const calculateEditorHeight = useCallback(() => {
    if (!localYamlOutput) return 400;
    const lineCount = localYamlOutput.split("\n").length;
    const lineHeight = 20; // Approximate line height in pixels
    const padding = 40; // Additional padding for editor UI
    const minHeight = 400;
    const calculatedHeight = Math.max(
      minHeight,
      lineCount * lineHeight + padding
    );
    return calculatedHeight;
  }, [localYamlOutput]);

  useEffect(() => {
    const newHeight = calculateEditorHeight();
    setEditorHeight(newHeight);
  }, [localYamlOutput, calculateEditorHeight]);

  const handleYamlExpand = () => {
    setIsYamlExpanded(!isYamlExpanded);
    // Force editor to resize after state change
    setTimeout(() => {
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }, 0);
  };

  // Load response conditions when session changes
  useEffect(() => {
    if (activeSession) {
      setResponseConditions(activeSession.responseConditions ?? []);
    }
  }, [activeSession?.id]);

  // Save response conditions to session when they change
  useEffect(() => {
    if (activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        responseConditions,
      };
      if (JSON.stringify(activeSession.responseConditions) !== JSON.stringify(responseConditions)) {
        handleSaveSession(activeSession.name, updatedSession);
      }
    }
  }, [responseConditions, activeSession?.id]);

  // Sync includeToken with session on session change
  useEffect(() => {
    setIncludeToken(activeSession?.includeToken ?? true);
  }, [activeSession?.id]);

  // Save includeToken to session when it changes
  useEffect(() => {
    if (activeSession && includeToken !== undefined) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        includeToken,
      };
      if (activeSession.includeToken !== includeToken) {
        handleSaveSession(activeSession.name, updatedSession);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeToken, activeSession?.id]);

  // Define status code options with descriptions
  const statusOptions = [
    { value: "201", label: "201 - Created" },
    { value: "204", label: "204 - No Content" },
    { value: "400", label: "400 - Bad Request" },
    { value: "401", label: "401 - Unauthorized" },
    { value: "403", label: "403 - Forbidden" },
    { value: "404", label: "404 - Not Found" },
    { value: "500", label: "500 - Internal Server Error" },
  ];

  // Output editor value
  const getOutputEditorValue = () => {
    if (outputViewMode === 'yaml') {
      return lastYamlOutput;
    } else {
      try {
        return lastJsonResponse ? JSON.stringify(lastJsonResponse, null, 2) : '';
      } catch {
        return '// Invalid JSON';
      }
    }
  };

  // Check if there's an active session
  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="overflow-hidden relative p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full -translate-x-12 translate-y-12"></div>
          </div>

          <div className="flex relative justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
                <FiCode className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  YAML Generator
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate OpenAPI specifications from your API responses
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl dark:from-blue-900 dark:to-blue-800">
                <FiCpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">OpenAPI</span>
              </div>
              <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
                <FiLayers className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">Schema Generation</span>
              </div>
            </div>
          </div>
        </div>

        {/* No Active Session Warning */}
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <FiCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              You need to create or select an active session before generating YAML specifications.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openSessionManager({ tab: 'sessions' });
                }}
                className="px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!requestConfig) {
    return <div>No request configuration available</div>;
  }
  const statusCodeColor = {
    "200": "dark:bg-blue-500 bg-blue-200",
    "201": "dark:bg-green-500 bg-green-200",
    "204": "dark:bg-green-500 bg-green-200",
    "400": "dark:bg-red-500 bg-red-200",
    "401": "dark:bg-red-500 bg-red-200",
    "403": "dark:bg-red-500 bg-red-200",
    "404": "dark:bg-red-500 bg-red-200",
    "500": "dark:bg-red-500 bg-red-200",
  }


  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden relative p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg">
              <FiCode className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                YAML Generator
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Generate OpenAPI specifications from your API responses
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl dark:from-blue-900 dark:to-blue-800">
              <FiCpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">OpenAPI</span>
            </div>
            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
              <FiLayers className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">Schema Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Generation Controls */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FiZap className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generation Controls</h3>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <button
                onClick={handleFetchRequest}
                disabled={isGenerating}
                className="flex overflow-hidden relative justify-center items-center p-4 space-x-2 font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 border-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                {isGenerating ? (
                  <>
                    <FiRefreshCw className="w-5 h-5 animate-spin" />
                    <span className="relative">Generating...</span>
                  </>
                ) : (
                  <>
                    <FiPlay className="w-5 h-5" />
                    <span className="relative">Fetch & Generate YAML</span>
                  </>
                )}
              </button>

              <button
                onClick={handleGenerateFromCustomResponse}
                className="flex overflow-hidden relative justify-center items-center p-4 space-x-2 font-semibold text-white bg-gradient-to-br from-green-500 to-green-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-green-500/25 border-green-400/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
                <FiCode className="w-5 h-5" />
                <span className="relative">Generate from Custom Response</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                <FiShield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <input
                  type="checkbox"
                  checked={includeToken && !!tokenExists}
                  onChange={() => setIncludeToken((prev) => !prev)}
                  id="include-token-checkbox"
                  disabled={!tokenExists}
                  className="w-4 h-4 text-purple-600 bg-white rounded border-gray-300 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <label
                  htmlFor="include-token-checkbox"
                  className="text-sm font-medium text-gray-700 dark:text-white"
                >
                  Include Token
                </label>
              </div>

              <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                <FiSettings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <select
                  value={openApiVersion}
                  onChange={(e) => setOpenApiVersion(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                >
                  <option value="3.0.0">OpenAPI 3.0.0</option>
                  <option value="2.0.0">OpenAPI 2.0.0</option>
                  <option value="0.9.7.1">OpenAPI 0.9.7.1</option>
                </select>
              </div>

              <button
                onClick={handleResetCustomResponse}
                className="flex justify-center items-center p-3 space-x-2 font-medium text-amber-700 bg-gradient-to-r from-amber-100 to-amber-200 rounded-lg transition-all duration-200 group dark:from-amber-900 dark:to-amber-800 dark:text-amber-300 hover:scale-105"
              >
                <FiRefreshCw className="w-4 h-4" />
                <span>Reset to Default</span>
              </button>
            </div>
          </div>

          {/* Custom Response Editor */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FiFileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Custom Response</h3>
            </div>

            <div
              ref={containerRef}
              className="overflow-hidden relative bg-gray-50 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              style={{ height: "300px" }}
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={customResponse ?? ""}
                onChange={(value) => setCustomResponse(value ?? "")}
                onMount={handleEditorDidMount}
                theme={isDarkMode ? "vs-dark" : "light"}
                options={{
                  ...editorOptions,
                  scrollBeyondLastLine: false,
                  minimap: { enabled: false },
                  padding: { top: 10, bottom: 10 }
                }}
              />
              <div
                className="absolute right-0 bottom-0 left-0 h-2 bg-gray-200 transition-colors duration-200 cursor-ns-resize hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
                onMouseDown={handleMouseDown}
              />
            </div>
          </div>

          {/* Query Parameters */}
          {requestConfig?.queryParams?.length > 0 && (
            <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center mb-4 space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <FiGlobe className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Query Parameters</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {requestConfig?.queryParams?.map((param) => (
                  <div key={param.key} className="flex items-center p-3 space-x-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <input
                      type="checkbox"
                      checked={selectedQueries[param.key]}
                      disabled={param.required}
                      onChange={() => handleQueryToggle(param.key)}
                      className="w-4 h-4 text-green-600 bg-white rounded border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{param.key}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{param.value}</p>
                    </div>
                    {param.required && (
                      <span className="px-2 py-1 text-xs text-red-800 bg-red-100 rounded-full dark:bg-red-900 dark:text-red-200">
                        Required
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Request URL */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FiWifi className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request URL</h3>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
              <code className="text-sm text-gray-700 break-all dark:text-gray-300">
                {getColoredUrl()}
              </code>
            </div>
          </div>
        </div>

        {/* Right Column - Response Conditions & Navigation */}
        <div className="space-y-6">
          {/* Response Conditions */}
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <FiTarget className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Response Conditions</h3>
            </div>

            <div className="space-y-3">
              {responseConditions.map((condition, idx) => (
                <div key={`${idx}-${condition.status}`} className="p-3 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <select
                        value={condition.status}
                        onChange={e => {
                          const updated = [...responseConditions];
                          updated[idx] = { ...condition, status: e.target.value };
                          setResponseConditions(updated);
                        }}
                        className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                      >
                        <option disabled value="">Select Status Code</option>
                        {statusOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        <option value="custom">Custom Status Code</option>
                        {condition.status && !statusOptions.some(opt => opt.value === condition.status) && (
                          <option value={condition.status}>{condition.status}</option>
                        )}
                      </select>
                      <button
                        type="button"
                        onClick={() => {
                          setResponseConditions(responseConditions.filter((_, i) => i !== idx));
                        }}
                        className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {condition.status === "custom" && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          id={`custom-status-${idx}`}
                          defaultValue={condition.status}
                          className="flex-1 px-3 py-2 text-sm text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`custom-status-${idx}`) as HTMLInputElement;
                            const updated = [...responseConditions];
                            updated[idx] = { ...condition, status: input.value };
                            setResponseConditions(updated);
                          }}
                          className="p-2 text-green-600 bg-green-100 rounded-lg transition-all duration-200 dark:bg-green-900 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                        >
                          <FiCheck className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <input
                      type="text"
                      value={condition.condition}
                      onChange={e => {
                        const updated = [...responseConditions];
                        updated[idx] = { ...condition, condition: e.target.value };
                        setResponseConditions(updated);
                      }}
                      placeholder="Condition (optional)"
                      className="px-3 py-2 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                    />

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={condition.include}
                        onChange={e => {
                          const updated = [...responseConditions];
                          updated[idx] = { ...condition, include: e.target.checked };
                          setResponseConditions(updated);
                        }}
                        className="w-4 h-4 text-orange-600 bg-white rounded border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Include this response</span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setResponseConditions([...responseConditions, { status: "", condition: "", include: true }])}
                className="flex justify-center items-center p-3 space-x-2 w-full font-medium text-orange-700 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg transition-all duration-200 dark:from-orange-900 dark:to-orange-800 dark:text-orange-300 hover:scale-105"
              >
                <FiPlus className="w-4 h-4" />
                <span>Add Status Code</span>
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200 dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
            <div className="flex items-center mb-4 space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FiActivity className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Next Steps</h3>
            </div>

            <button
              onClick={() => setActiveSection("ai")}
              className="flex justify-center items-center p-4 space-x-2 w-full font-semibold text-white bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl border transition-all duration-300 group hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 border-blue-400/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-transparent transition-transform duration-700 -translate-x-full via-white/10 group-hover:translate-x-full"></div>
              <FiArrowRight className="w-5 h-5" />
              <span className="relative">Continue to AI Test Generator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 dark:from-red-900 dark:to-red-800 dark:border-red-700">
          <div className="flex items-center space-x-2">
            <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="font-medium text-red-800 dark:text-red-200">{error}</span>
          </div>
        </div>
      )}

      {/* Generated Output */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg">
              <FiServer className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generated Output</h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center px-3 py-1 space-x-1 bg-gray-100 rounded-lg dark:bg-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
              <span className={`px-2 py-1 text-sm font-semibold rounded ${statusCodeColor[statusCode as keyof typeof statusCodeColor]}`}>
                {statusCode}
              </span>
            </div>

            <div className="flex items-center p-1 bg-gray-100 rounded-lg dark:bg-gray-700">
              <button
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${outputViewMode === 'yaml'
                  ? 'bg-white text-gray-900 dark:bg-gray-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                onClick={() => setOutputViewMode('yaml')}
              >
                YAML
              </button>
              <button
                className={`px-3 py-1 rounded text-sm font-medium transition-all duration-200 ${outputViewMode === 'json'
                  ? 'bg-white text-gray-900 dark:bg-gray-600 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                onClick={() => setOutputViewMode('json')}
              >
                JSON
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyYAML}
              disabled={!localYamlOutput}
              className="flex items-center px-4 py-2 space-x-2 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-200 group hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {copySuccess ? (
                <>
                  <FiCheck className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <FiCopy className="w-4 h-4" />
                  <span>Copy YAML</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadYAML}
              disabled={!localYamlOutput}
              className="flex items-center px-4 py-2 space-x-2 font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg transition-all duration-200 group hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <FiDownload className="w-4 h-4" />
              <span>Download YAML</span>
            </button>
          </div>

          <button
            onClick={handleYamlExpand}
            className="flex items-center px-4 py-2 space-x-2 font-medium text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg transition-all duration-200 group dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 hover:scale-105"
          >
            {isYamlExpanded ? (
              <>
                <FiMinimize2 className="w-4 h-4" />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <FiMaximize2 className="w-4 h-4" />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>

        <div
          ref={yamlContainerRef}
          className="overflow-hidden relative bg-gray-50 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700"
          style={{ height: isYamlExpanded ? "calc(100vh - 200px)" : editorHeight }}
        >
          {isGenerating ? (
            <div className="p-4">
              <Skeleton
                height={isYamlExpanded ? 'calc(100vh - 200px)' : editorHeight}
                width="100%"
                count={isYamlExpanded ? 20 : Math.max(10, Math.floor(editorHeight / 20))}
                style={{ borderRadius: 8 }}
              />
            </div>
          ) : (
            <Editor
              height="100%"
              defaultLanguage={outputViewMode}
              language={outputViewMode}
              value={getOutputEditorValue()}
              onMount={handleYamlEditorDidMount}
              theme={isDarkMode ? "vs-dark" : "light"}
              options={{
                ...editorOptions,
                scrollBeyondLastLine: false,
                minimap: { enabled: false },
                padding: {
                  top: 10,
                  bottom: 10
                }
              }}
            />
          )}
          <div
            className="absolute right-0 bottom-0 left-0 h-2 bg-gray-200 transition-colors duration-200 cursor-ns-resize hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500"
            onMouseDown={handleYamlMouseDown}
          />
        </div>
      </div>
    </div>
  );
};

export default YAMLGenerator;
