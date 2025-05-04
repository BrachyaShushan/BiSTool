import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { Editor } from "@monaco-editor/react";
import {
  YAMLGeneratorProps,
  EditorOptions,
  ResponseData,
} from "../types/yamlGenerator.types";
import { RequestConfigData } from "../types/app.types";

// Extract variables from URL in {variable} format, excluding the base URL
const extractVariables = (url: string): string[] => {
  if (!url) return [];
  // Remove the base URL part before looking for variables
  const pathPart = url.split("/api/")[1] || "";
  // Handle both {variable} and %7Bvariable%7D formats
  const matches = pathPart.match(/(?:{([^}]+)}|%7B([^%]+)%7D)/g) || [];
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
        initialQueries[param.key] = false;
      });
      return initialQueries;
    }
    return {};
  });
  const [openApiVersion, setOpenApiVersion] = useState<string>("1.0.0");
  const [customResponse, setCustomResponse] = useState<string>("");
  const [isYamlExpanded, setIsYamlExpanded] = useState<boolean>(false);
  const [editorHeight, setEditorHeight] = useState<number>(400);

  const editorRef = useRef<any>(null);
  const yamlEditorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const yamlContainerRef = useRef<HTMLDivElement>(null);

  // Initialize selectedQueries when requestConfig changes
  useEffect(() => {
    console.log(requestConfig);
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
        .map(
          (param) =>
            `${encodeURIComponent(param.key)}=${encodeURIComponent(
              param.value
            )}`
        )
        .join("&");

      const url = queryString
        ? `${urlData.builtUrl}?${queryString}`
        : urlData.builtUrl;

      // Make the API request
      const response = await fetch(url, {
        method: requestConfig?.method || "GET",
        headers:
          requestConfig?.headers?.reduce((acc, header) => {
            acc[header.key] = header.value;
            return acc;
          }, {} as Record<string, string>) || {},
        body:
          requestConfig?.bodyType === "json"
            ? requestConfig.jsonBody
            : undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const yaml = generateYAML(data, requestConfig);
      setYamlOutput(yaml);
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
    const description = activeSession?.urlData.sessionDescription || "";
    let token: string[] = [];
    if (globalVariables?.tokenName) {
      token = [
        `  - name: ${globalVariables.tokenName}
    in: header
    type: string
    required: true
    description: ${globalVariables.tokenDescription || ""}
    example: ${globalVariables[globalVariables.tokenName]
      .split(".")
      .map(() => "xxx")
      .join(".")}`,
      ];
    }
    // Generate path parameters from dynamic segments
    const pathParameters = urlData?.parsedSegments
      ?.filter((segment) => segment.isDynamic)
      .map((segment) => {
        return `  - name: ${segment.paramName}
    in: path
    type: string
    example: ${activeSession?.sharedVariables[segment.paramName]}
    required: true${
      segment.description ? `\n    description: ${segment.description}` : ""
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
      ...(token || []),
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
        const itemSchema = generateSchema(data[0], `${indent}    `);
        return `${indent}type: array\n${indent}items:\n${itemSchema}`;
      } else {
        const example = type === "string" ? `"${data}"` : data;
        return `${indent}type: ${type}\n${indent}example: ${example}`;
      }
    };

    // Generate schema from response data
    const schema = generateSchema(responseData, "      ");
    let yaml = "";

    if (openApiVersion === "1.0.0") {
      // Generate OpenAPI 1.0 YAML with generic template structure
      yaml = `${method} ${title}
---
tags:
  - ${title}
description: ${description}
parameters:
${allParameters}
responses:
  200:
    description: Successful response
    schema:
${schema}`;
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
      responses:
        200:
          description: Successful response
          schema:
${schema}`;
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
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
${schema}`;
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
        return `${encodeURIComponent(param.key)}=${encodeURIComponent(
          resolvedValue as string
        )}`;
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

  if (!requestConfig) {
    return <div>No request configuration available</div>;
  }

  return (
    <div
      className={`p-4 ${
        isDarkMode ? "bg-gray-800" : "bg-white"
      } rounded-lg shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleFetchRequest}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            } ${isGenerating ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isGenerating ? "Generating..." : "Fetch & Generate YAML"}
          </button>

          <select
            value={openApiVersion}
            onChange={(e) => setOpenApiVersion(e.target.value)}
            className={`px-3 py-2 border rounded-md ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="3.0.0">OpenAPI 3.0.0</option>
            <option value="2.0.0">OpenAPI 2.0.0</option>
            <option value="1.0.0">OpenAPI 1.0.0</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyYAML}
            disabled={!yamlOutput}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? yamlOutput
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                : yamlOutput
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {copySuccess ? "Copied!" : "Copy YAML"}
          </button>
          <button
            onClick={handleDownloadYAML}
            disabled={!yamlOutput}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? yamlOutput
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
                : yamlOutput
                ? "bg-blue-500 text-white hover:bg-blue-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Download YAML
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-white" : "text-gray-700"
          }`}
        >
          Custom Response
        </label>
        <div
          ref={containerRef}
          className={`border ${
            isDarkMode ? "border-gray-600" : "border-gray-300"
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
          className={`mt-2 px-4 py-2 rounded-md ${
            isDarkMode
              ? "bg-green-600 text-white hover:bg-green-700"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
        >
          Generate from Custom Response
        </button>
      </div>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-white" : "text-gray-700"
          }`}
        >
          Query Parameters
        </label>
        <div
          className={`p-4 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
          }`}
        >
          {requestConfig?.queryParams?.map((param) => (
            <div key={param.key} className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={selectedQueries[param.key]}
                onChange={() => handleQueryToggle(param.key)}
                className={`mr-2 ${
                  isDarkMode ? "text-blue-500" : "text-blue-600"
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
          className={`block text-sm font-medium mb-2 ${
            isDarkMode ? "text-white" : "text-gray-700"
          }`}
        >
          Request URL
        </label>
        <div
          className={`p-3 rounded-lg ${
            isDarkMode ? "bg-gray-700" : "bg-gray-50"
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

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <label
            className={`block text-sm font-medium ${
              isDarkMode ? "text-white" : "text-gray-700"
            }`}
          >
            Generated YAML
          </label>
          <button
            onClick={handleYamlExpand}
            className={`px-2 py-1 text-sm rounded-md ${
              isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            {isYamlExpanded ? "Expand" : "Collapse"}
          </button>
        </div>
        <div
          ref={yamlContainerRef}
          className={`border ${
            isDarkMode ? "border-gray-600" : "border-gray-300"
          } rounded-lg overflow-hidden relative`}
          style={{
            height: isYamlExpanded ? "calc(100vh - 200px)" : editorHeight,
          }}
        >
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={yamlOutput}
            onMount={handleYamlEditorDidMount}
            theme={isDarkMode ? "vs-dark" : "light"}
            options={{
              ...editorOptions,
              readOnly: true,
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
