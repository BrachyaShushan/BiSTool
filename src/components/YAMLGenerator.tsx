import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Editor } from "@monaco-editor/react";
import { FiDownload, FiCopy, FiMaximize2, FiMinimize2, FiPlay, FiCheck } from "react-icons/fi";
import {
  YAMLGeneratorProps,
  EditorOptions,
  ResponseData,
} from "../types/yamlGenerator.types";
import { Header, RequestConfigData } from "../types/app.types";
import { ExtendedSession } from "../types/SavedManager";

// Extract variables from URL in {variable} format, excluding the base URL
const extractVariables = (url: string): string[] => {
  if (!url) return [];
  url = url.split("//")[1] || url;
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

const YAMLGenerator: React.FC<YAMLGeneratorProps> = () => {
  const {
    urlData,
    requestConfig,
    setYamlOutput,
    globalVariables,
    segmentVariables,
    activeSession,
    handleSaveSession,
  } = useAppContext();

  const { isDarkMode } = useTheme();
  const [yamlOutput, setLocalYamlOutput] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedQueries, setSelectedQueries] = useState<
    Record<string, boolean>
  >(() => {
    if (requestConfig?.queryParams) {
      const initialQueries: Record<string, boolean> = {};
      requestConfig.queryParams.forEach((param) => {
        initialQueries[param.key] = param.required ?? false;
      });
      return initialQueries;
    }
    return {};
  });
  const [openApiVersion, setOpenApiVersion] = useState<string>("1.0.0");
  const [customResponse, setCustomResponse] = useState<string>("");
  const [isYamlExpanded, setIsYamlExpanded] = useState<boolean>(false);
  const [editorHeight, setEditorHeight] = useState<number>(400);
  const [include204, setInclude204] = useState<boolean>(() => {
    return activeSession?.include204 ?? false;
  });
  const [include400, setInclude400] = useState<boolean>(() => {
    return activeSession?.include400 ?? false;
  });
  const [response204Condition, setResponse204Condition] = useState<string>(() => {
    return activeSession?.response204Condition ?? "";
  });
  const [response400Condition, setResponse400Condition] = useState<string>(() => {
    return activeSession?.response400Condition ?? "";
  });

  const editorRef = useRef<any>(null);
  const yamlEditorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const yamlContainerRef = useRef<HTMLDivElement>(null);

  // Initialize selectedQueries when requestConfig changes
  useEffect(() => {
    if (requestConfig?.queryParams) {
      const initialQueries: Record<string, boolean> = {};
      requestConfig.queryParams.forEach((param) => {
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
      containerRef.current?.getBoundingClientRect().height || 0;

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
      yamlContainerRef.current?.getBoundingClientRect().height || 0;

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
    if (yamlEditorRef.current && yamlOutput) {
      // Add any necessary layout updates here
    }
  }, [yamlOutput]);

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
      const tokenName = getValueFromVariables("tokenName") as string;
      let tokenHeader: Header | null = null;
      if (tokenName) {
        const tokenValue = getValueFromVariables(tokenName);
        if (tokenValue) {
          tokenHeader = {
            key: tokenName,
            type: "string",
            in: "header",
            required: true,
            description: tokenName,
            value: tokenValue as string,
          };
        }
      }

      // Combine headers and ensure token is included
      const combinedHeaders = [
        ...(tokenHeader ? [tokenHeader] : []),
        ...(requestConfig?.headers ?? [])
      ].filter(Boolean);

      // Convert headers to the format expected by fetch
      const headers = combinedHeaders.reduce((acc, header) => {
        if (header && header.key) {
          const value = getValueFromVariables(header.value);
          if (value !== null && value !== undefined) {
            acc[header.key] = value as string;
          }
        }
        return acc;
      }, {} as Record<string, string>);

      console.log('Request headers:', headers); // Debug log

      // Make the API request
      const response = await fetch(url, {
        method: requestConfig?.method || "GET",
        headers: headers,
        body: requestConfig?.bodyType === "json" && requestConfig.jsonBody
          ? requestConfig.jsonBody
          : null
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const yaml = generateYAML(data, requestConfig);
      setLocalYamlOutput(yaml); // Set local state
      setYamlOutput(yaml); // Set global state
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
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

      const yaml = generateYAML(responseData, requestConfig);
      setLocalYamlOutput(yaml);
      setYamlOutput(yaml);
    } catch (err) {
      setError("Invalid JSON format");
    }
  };

  const generateYAML = (
    responseData: ResponseData,
    config: RequestConfigData | null
  ): string => {
    if (!responseData || !config) {
      return "";
    }

    // Get the URL from urlData
    const url = urlData?.builtUrl || "";
    const { method, headers, queryParams, formData } = config;

    // Use active session name or fallback to endpoint name
    const title = activeSession?.name || "API Endpoint";
    const description = activeSession?.urlData.sessionDescription?.split("\n").map(line => line.trim()).join(". ") || "";
    // let token: string[] = [];
    // if (globalVariables?.tokenName) {
    //   token = [
    //     `  - name: ${globalVariables.tokenName}
    // in: header
    // type: string
    // required: true
    // description: ${globalVariables.tokenDescription || ""}
    // example: ${globalVariables[globalVariables.tokenName]
    //       .split(".")
    //       .map(() => "xxx")
    //       .join(".")}`,
    //   ];
    // }
    // Generate path parameters from dynamic segments
    const pathParameters = urlData?.parsedSegments
      ?.filter((segment) => segment.isDynamic)
      .map((segment) => {
        return `  - name: ${segment.paramName}
    in: path
    type: string
    example: ${activeSession?.sharedVariables[segment.paramName]}
    required: true${segment.description ? `\n    description: ${segment.description}` : ""
          }`;
      });

    // Generate header parameters
    const headerParameters = headers?.map((header) => {
      return `  - name: ${header.key}
    in: header
    type: ${header.type || "string"}
    required: ${header.required || false}
    description: ${header.description || ""}
    example: ${header.value}`;
    });

    // Generate query parameters
    const queryParameters = queryParams?.map((param) => {
      return `  - name: ${param.key}
    in: query
    type: ${param.type || "string"}
    required: ${param.required || false}
    description: ${param.description || ""}
    example: ${param.value}`;
    });

    // Generate form data parameters
    const formParameters = formData?.map((field) => {
      return `  - name: ${field.key}
    in: formData
    type: ${field.type}
    required: ${field.required}
    description: ${field.description || ""}
    example: ${field.value}`;
    });

    // Combine all parameters
    const allParameters = [
      // ...(token || []),
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

    // Generate request body schema if method is not GET
    const generateRequestBody = (): string => {
      if (method === "GET") return "";

      let bodySchema = "";
      if (config.bodyType === "json" && config.jsonBody) {
        try {
          const jsonBody = JSON.parse(config.jsonBody);
          bodySchema = `  - in: body
    name: body
    required: true
${generateSchema(jsonBody, "    ")}`;
        } catch (e) {
          console.error("Error parsing JSON body:", e);
        }
      } else if (config.bodyType === "form" && config.formData) {
        bodySchema = `  - in: body
    name: body
    required: true
    type: object
    properties:
${config.formData.map(field => `      ${field.key}:
        type: ${field.type}
        required: ${field.required}
        description: ${field.description || ""}
        example: ${field.value}`).join("\n")}`;
      } else if (config.bodyType === "text") {
        bodySchema = `  - in: body
    name: body
    required: true
    type: string
    example: "${config.jsonBody}"`;
      }

      return bodySchema;
    };

    // Generate responses section
    const generateResponses = (): string => {
      let responses = `  200:
    description: Successful response
    schema:
${schema}`;

      if (include204) {
        responses += `
  204:
    description: No content
    ${response204Condition ? `condition: ${response204Condition}` : ''}`;
      }

      if (include400) {
        responses += `
  400:
    description: Bad request
    ${response400Condition ? `condition: ${response400Condition}` : ''}
    schema:
      type: object
      properties:
        message:
          type: string
          example: "The request could not be processed due to invalid parameters"`;
      }

      return responses;
    };

    if (openApiVersion === "1.0.0") {
      // Generate OpenAPI 1.0 YAML with generic template structure
      yaml = `${method} ${title}
---
tags:
  - ${title}
description: ${description}
url: ${url}
security:
  - ApiKeyAuth: []
parameters:
${allParameters}
${generateRequestBody()}
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
      .writeText(yamlOutput)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => {
        setError("Failed to copy YAML to clipboard ERROR: " + err);
      });
  };

  const handleDownloadYAML = () => {
    const blob = new Blob([yamlOutput], { type: "text/yaml" });
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
          <span key={index} className="text-blue-500">
            {resolvedPart}
          </span>
        );
      } else if (index === 1) {
        return (
          <span key={index} className="text-green-500">
            {resolvedPart}
          </span>
        );
      } else {
        return (
          <span key={index} className="text-purple-500">
            {resolvedPart}
          </span>
        );
      }
    });
  }, [getResolvedUrl, getValueFromVariables]);

  const getCurrentTimestamp = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear(); // Next year
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }, []);

  useEffect(() => {
    const initialData = {
      data: {
        Hello: "World",
      },
      token: "xxx.xxx.xxx",
      data_effective_tstamp: getCurrentTimestamp(),
    };
    setCustomResponse(JSON.stringify(initialData, null, 2));
  }, []);

  const handleQueryToggle = (queryKey: string): void => {
    setSelectedQueries((prev) => ({
      ...prev,
      [queryKey]: !prev[queryKey],
    }));
  };

  const calculateEditorHeight = useCallback(() => {
    if (!yamlOutput) return 400;
    const lineCount = yamlOutput.split("\n").length;
    const lineHeight = 20; // Approximate line height in pixels
    const padding = 40; // Additional padding for editor UI
    const minHeight = 400;
    const calculatedHeight = Math.max(
      minHeight,
      lineCount * lineHeight + padding
    );
    return calculatedHeight;
  }, [yamlOutput]);

  useEffect(() => {
    const newHeight = calculateEditorHeight();
    setEditorHeight(newHeight);
  }, [yamlOutput, calculateEditorHeight]);

  const handleYamlExpand = () => {
    setIsYamlExpanded(!isYamlExpanded);
    // Force editor to resize after state change
    setTimeout(() => {
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }, 0);
  };

  // Save response conditions to session when they change
  useEffect(() => {
    if (activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        include204,
        include400,
        response204Condition,
        response400Condition,
      };
      // Only save if the values have actually changed
      if (
        activeSession.include204 !== include204 ||
        activeSession.include400 !== include400 ||
        activeSession.response204Condition !== response204Condition ||
        activeSession.response400Condition !== response400Condition
      ) {
        handleSaveSession(activeSession.name, updatedSession);
      }
    }
  }, [include204, include400, response204Condition, response400Condition, activeSession?.id]);

  // Load response conditions when session changes
  useEffect(() => {
    if (activeSession) {
      if (activeSession.include204 !== include204) {
        setInclude204(activeSession.include204 ?? false);
      }
      if (activeSession.include400 !== include400) {
        setInclude400(activeSession.include400 ?? false);
      }
      if (activeSession.response204Condition !== response204Condition) {
        setResponse204Condition(activeSession.response204Condition ?? "");
      }
      if (activeSession.response400Condition !== response400Condition) {
        setResponse400Condition(activeSession.response400Condition ?? "");
      }
    }
  }, [activeSession?.id]);

  if (!requestConfig) {
    return <div>No request configuration available</div>;
  }

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFetchRequest}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${isDarkMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-500 text-white hover:bg-blue-600"
              } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin">
                  <FiPlay size={16} />
                </div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <FiPlay />
                <span>Fetch & Generate YAML</span>
              </>
            )}
          </button>

          <select
            value={openApiVersion}
            onChange={(e) => setOpenApiVersion(e.target.value)}
            className={`px-3 py-2 border rounded-md ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300 text-gray-900"
              }`}
          >
            <option value="3.0.0">OpenAPI 3.0.0</option>
            <option value="2.0.0">OpenAPI 2.0.0</option>
            <option value="1.0.0">OpenAPI 1.0.0</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Custom Response
        </label>
        <div
          ref={containerRef}
          className={`border ${isDarkMode ? "border-gray-600" : "border-gray-300"
            } rounded-lg overflow-hidden relative`}
          style={{ height: "200px" }}
        >
          <Editor
            height="100%"
            defaultLanguage="json"
            value={customResponse || ""}
            onChange={(value) => setCustomResponse(value || "")}
            onMount={handleEditorDidMount}
            theme={isDarkMode ? "vs-dark" : "light"}
            options={editorOptions}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 cursor-ns-resize hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            onMouseDown={handleMouseDown}
          />
        </div>
        <button
          onClick={handleGenerateFromCustomResponse}
          className={`mt-2 px-4 py-2 rounded-md flex items-center space-x-2 ${isDarkMode
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-green-500 text-white hover:bg-green-600"
            }`}
        >
          <FiPlay />
          <span>Generate from Custom Response</span>
        </button>
      </div>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Query Parameters
        </label>
        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
        >
          {requestConfig?.queryParams?.map((param) => (
            <div key={param.key} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedQueries[param.key]}
                disabled={param.required}
                onChange={() => handleQueryToggle(param.key)}
                className={`mr-2 ${isDarkMode ? "text-blue-500" : "text-blue-600"
                  }`}
              />
              <span
                className={`${isDarkMode ? "text-white" : "text-gray-700"}`}
              >
                {param.key}: {param.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Request URL
        </label>
        <div
          className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
        >
          <div className="flex items-center space-x-2">
            <code
              className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
            >
              {getColoredUrl()}
            </code>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Response Conditions
        </label>
        <div
          className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
            }`}
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={include204}
                onChange={(e) => setInclude204(e.target.checked)}
                className={`${isDarkMode ? "text-blue-500" : "text-blue-600"
                  }`}
              />
              <span className={`${isDarkMode ? "text-white" : "text-gray-700"}`}>
                Include 204 (No Content) Response
              </span>
            </div>
            {include204 && (
              <div className="ml-6">
                <input
                  type="text"
                  value={response204Condition}
                  onChange={(e) => setResponse204Condition(e.target.value)}
                  placeholder="Condition for 204 response (e.g., 'when resource is deleted')"
                  className={`w-full px-3 py-2 rounded-md ${isDarkMode
                    ? "bg-gray-600 border-gray-500 text-white"
                    : "bg-white border-gray-300"
                    } border`}
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={include400}
                onChange={(e) => setInclude400(e.target.checked)}
                className={`${isDarkMode ? "text-blue-500" : "text-blue-600"
                  }`}
              />
              <span className={`${isDarkMode ? "text-white" : "text-gray-700"}`}>
                Include 400 (Bad Request) Response
              </span>
            </div>
            {include400 && (
              <div className="ml-6">
                <input
                  type="text"
                  value={response400Condition}
                  onChange={(e) => setResponse400Condition(e.target.value)}
                  placeholder="Condition for 400 response (e.g., 'when required parameters are missing')"
                  className={`w-full px-3 py-2 rounded-md ${isDarkMode
                    ? "bg-gray-600 border-gray-500 text-white"
                    : "bg-white border-gray-300"
                    } border`}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label
            className={`block text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
              }`}
          >
            Generated YAML
          </label>
          <button
            onClick={handleCopyYAML}
            disabled={!yamlOutput}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${isDarkMode
              ? yamlOutput
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
              : yamlOutput
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            {copySuccess ? (
              <>
                <FiCheck />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <FiCopy />
                <span>Copy YAML</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadYAML}
            disabled={!yamlOutput}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 ${isDarkMode
              ? yamlOutput
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
              : yamlOutput
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
          >
            <FiDownload />
            <span>Download YAML</span>
          </button>
          <button
            onClick={handleYamlExpand}
            className={`px-2 py-1 text-sm rounded-md flex items-center space-x-2 ${isDarkMode
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
          >
            {isYamlExpanded ? (
              <>
                <FiMinimize2 />
                <span>Collapse</span>
              </>
            ) : (
              <>
                <FiMaximize2 />
                <span>Expand</span>
              </>
            )}
          </button>
        </div>
        <div
          ref={yamlContainerRef}
          className={`border ${isDarkMode ? "border-gray-600" : "border-gray-300"
            } rounded-lg overflow-hidden relative`}
          style={{
            height: isYamlExpanded ? "calc(100vh - 200px)" : editorHeight,
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={yamlOutput}
            onChange={(value) => setYamlOutput(value || "")}
            onMount={handleYamlEditorDidMount}
            theme={isDarkMode ? "vs-dark" : "light"}
            options={{
              ...editorOptions,
              scrollBeyondLastLine: false,
              minimap: { enabled: false },
            }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 cursor-ns-resize hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
            onMouseDown={handleYamlMouseDown}
          />
        </div>
      </div>
    </div>
  );
};

export default YAMLGenerator;
