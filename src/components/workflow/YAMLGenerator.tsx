import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAppContext } from '../../context/AppContext';
import { useTokenContext } from '../../context/TokenContext';
import { useVariablesContext } from '../../context/VariablesContext';
import { useParams, useNavigate } from "react-router-dom";
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
  FiServer,
  FiArrowLeft,
  FiEye,
  FiEyeOff
} from "react-icons/fi";
import {
  Button,
  Card,
  Badge,
  SectionHeader,
  MonacoEditor,
  Toggle,
  TestStatusBadge
} from "../ui";
import {
  ResponseData,
} from "../../types/components/yamlGenerator.types";
import { RequestConfigData, ResponseCondition } from "../../types/core/app.types";
import { ExtendedSession, TestCase } from "../../types/features/SavedManager";

const YAMLGenerator: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const projectId = params["projectId"];
  const sessionId = params["sessionId"];
  const { globalVariables, sharedVariables, replaceVariables } = useVariablesContext();
  const { urlData, requestConfig, setYamlOutput, segmentVariables, activeSession, handleSaveSession, openUnifiedManager, handleYAMLGenerated } = useAppContext();
  const { generateAuthHeaders } = useTokenContext();

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
  const copyTimeoutRef = useRef<number | null>(null);
  const expandTimeoutRef = useRef<number | null>(null);
  const [outputViewMode, setOutputViewMode] = useState<'yaml' | 'json'>('yaml');
  const [lastJsonResponse, setLastJsonResponse] = useState<any>(null);
  const [lastYamlOutput, setLastYamlOutput] = useState<string>("");
  const [showTests, setShowTests] = useState<boolean>(true);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      if (expandTimeoutRef.current) {
        clearTimeout(expandTimeoutRef.current);
      }
    };
  }, []);

  // Set initial load flag to false after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

        // Finally check shared variables from VariablesContext
        const sharedVar = sharedVariables.find(v => v.key === varName);
        if (sharedVar) {
          return sharedVar.value;
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

        // Finally check shared variables from VariablesContext
        const sharedVar = sharedVariables.find(v => v.key === varName);
        if (sharedVar) {
          return sharedVar.value;
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

      // Check shared variables from VariablesContext
      const sharedVar = sharedVariables.find(v => v.key === value);
      if (sharedVar) {
        return sharedVar.value;
      }

      return value;
    },
    [globalVariables, sharedVariables, segmentVariables]
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

      // Use replaceVariables for the URL
      let url = replaceVariables(urlData.builtUrl);
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
      handleYAMLGenerated(yamlStr);
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
      handleYAMLGenerated(yamlStr);
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

    // Add test information to description
    const tests = activeSession?.tests || [];
    const testInfo = tests.length > 0 ? `\n\nTest Coverage: This endpoint has ${tests.length} test case(s) covering various scenarios including ${tests.filter(t => t.expectedStatus !== '200').map(t => `${t.expectedStatus} responses`).join(', ')}.` : "";
    const finalDescription = description + testInfo;

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

    // Generate test-based parameters
    const generateTestBasedParameters = (): string => {
      const tests = activeSession?.tests || [];
      const testParameters: string[] = [];

      tests.forEach((test: TestCase) => {
        // Add path overrides as examples
        if (test.pathOverrides) {
          Object.entries(test.pathOverrides).forEach(([key, value]) => {
            const existingParam = pathParameters?.find(p => p.includes(`name: ${key}`));
            if (existingParam && value) {
              testParameters.push(`  # Test override for ${test.name || 'unnamed test'}: ${key} = ${value}`);
            }
          });
        }

        // Add query overrides as examples
        if (test.queryOverrides) {
          Object.entries(test.queryOverrides).forEach(([key, value]) => {
            const existingParam = queryParameters?.find(p => p.includes(`name: ${key}`));
            if (existingParam && value) {
              testParameters.push(`  # Test override for ${test.name || 'unnamed test'}: ${key} = ${value}`);
            }
          });
        }
      });

      return testParameters.length > 0 ? `\n    # Test-based parameter examples:\n${testParameters.join('\n')}` : '';
    };

    // Combine all parameters
    const allParameters = [
      ...(pathParameters || []),
      ...(headerParameters || []),
      ...(queryParameters || []),
      ...(formParameters || []),
    ].join("\n") + generateTestBasedParameters();

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

      // Add test-based responses
      const tests = activeSession?.tests || [];
      const testResponses = new Map<string, {
        description: string;
        examples: string[];
        testNames: string[];
        partialMatch: boolean;
      }>();

      tests.forEach((test: TestCase) => {
        const status = test.expectedStatus;
        if (!testResponses.has(status)) {
          testResponses.set(status, {
            description: `Response for test: ${test.name || 'Unnamed test'}`,
            examples: [],
            testNames: [],
            partialMatch: false
          });
        }

        const response = testResponses.get(status)!;
        response.testNames.push(test.name || `Test ${test.id.slice(0, 8)}`);

        if (test.expectedResponse) {
          response.examples.push(test.expectedResponse);
        }

        if (test.expectedPartialResponse) {
          response.partialMatch = true;
        }

        // Update description to be more comprehensive
        if (test.name) {
          response.description = `Response based on tests: ${response.testNames.join(', ')}`;
        }
      });

      // Add test-based responses to the YAML
      testResponses.forEach((response, status) => {
        if (status !== "200") {
          responses += `\n  ${status}:\n    description: ${response.description}`;

          // Add schema if we have examples
          if (response.examples.length > 0 && response.examples[0]) {
            try {
              const exampleData = JSON.parse(response.examples[0]);
              const exampleSchema = generateSchema(exampleData, "      ");
              responses += `\n    schema:\n${exampleSchema}`;
            } catch (e) {
              // If not valid JSON, add as string schema
              responses += `\n    schema:\n      type: string\n      example: "${response.examples[0]}"`;
            }
          }

          // Add examples
          if (response.examples.length > 0) {
            responses += `\n    examples:`;
            response.examples.forEach((example, index) => {
              const testName = response.testNames[index] || `test-${index + 1}`;
              responses += `\n      ${testName.replace(/[^a-zA-Z0-9-_]/g, '-')}:\n        summary: ${response.testNames[index] || 'Test example'}`;
              if (response.partialMatch) {
                responses += `\n        description: Partial match expected`;
              }
              responses += `\n        value: ${example}`;
            });
          }
        }
      });

      // Add response conditions
      responseConditions.filter(c => c.include && c.status !== "200").forEach((condition) => {
        // Only add if not already added by tests
        if (!testResponses.has(condition.status)) {
          responses += `\n  ${condition.status}:\n    description: ${condition.status} response`;
          if (condition.condition) {
            responses += `\n    x-condition: ${condition.condition}`;
          }
        }
      });

      return responses;
    };

    if (openApiVersion === "0.9.7.1") {
      // Generate OpenAPI 0.9.7.1 YAML with generic template structure
      yaml = `${method} ${title}
---
tags:
  - ${category}
description: ${finalDescription}
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
  description: ${finalDescription}
paths:
        ${url}:
        ${method.toLowerCase()}:
        tags:
        - ${title}
      summary: ${title}
      description: ${finalDescription}
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
  description: ${finalDescription}
paths:
        ${url}:
        ${method.toLowerCase()}:
        tags:
        - ${title}
      summary: ${title}
      description: ${finalDescription}
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

        // Clear any existing timeout
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }

        // Set new timeout with reference
        copyTimeoutRef.current = window.setTimeout(() => {
          setCopySuccess(false);
        }, 2000);
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

  const getResolvedUrl = useCallback(() => {
    if (!urlData?.builtUrl) return "";
    let url = replaceVariables(urlData.builtUrl);
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
    replaceVariables,
  ]);

  const getColoredUrl = useCallback(() => {
    const url = getResolvedUrl();
    if (!url) return null;
    // Split the URL into parts while preserving the structure
    const parts = url.split(/(?<=^[^:]+:\/\/)|(?<=\/)/);
    return parts.map((part, index) => {
      // Use replaceVariables for any remaining variables in the part
      const resolvedPart = replaceVariables(part);
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
  }, [getResolvedUrl, replaceVariables]);


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
    if (!isInitialLoad && activeSession && customResponse !== undefined) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        customResponse,
      };
      if (activeSession.customResponse !== customResponse) {
        handleSaveSession(activeSession.name, updatedSession, true); // Prevent navigation for auto-save
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customResponse, activeSession?.id, isInitialLoad]);

  const handleResetCustomResponse = () => {
    const defaultResponse = getDefaultCustomResponse();
    setCustomResponse(defaultResponse);
    if (activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        customResponse: defaultResponse,
      };
      handleSaveSession(activeSession.name, updatedSession, true); // Prevent navigation for auto-save
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

    // Clear any existing timeout
    if (expandTimeoutRef.current) {
      clearTimeout(expandTimeoutRef.current);
    }

    // Force editor to resize after state change
    expandTimeoutRef.current = window.setTimeout(() => {
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
    if (!isInitialLoad && activeSession) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        responseConditions,
      };
      if (JSON.stringify(activeSession.responseConditions) !== JSON.stringify(responseConditions)) {
        handleSaveSession(activeSession.name, updatedSession, true); // Prevent navigation for auto-save
      }
    }
  }, [responseConditions, activeSession?.id, isInitialLoad]);

  // Sync includeToken with session on session change
  useEffect(() => {
    setIncludeToken(activeSession?.includeToken ?? true);
  }, [activeSession?.id]);

  // Save includeToken to session when it changes
  useEffect(() => {
    if (!isInitialLoad && activeSession && includeToken !== undefined) {
      const updatedSession: ExtendedSession = {
        ...activeSession,
        includeToken,
      };
      if (activeSession.includeToken !== includeToken) {
        handleSaveSession(activeSession.name, updatedSession, true); // Prevent navigation for auto-save
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeToken, activeSession?.id, isInitialLoad]);

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

  // Test management functions
  const toggleTestExpansion = (testId: string) => {
    const newExpanded = new Set(expandedTests);
    if (newExpanded.has(testId)) {
      newExpanded.delete(testId);
    } else {
      newExpanded.add(testId);
    }
    setExpandedTests(newExpanded);
  };

  const getTestStatistics = () => {
    const tests = activeSession?.tests || [];
    return {
      total: tests.length,
      passed: tests.filter(test => test.lastResult === 'pass').length,
      failed: tests.filter(test => test.lastResult === 'fail').length,
      notRun: tests.filter(test => !test.lastResult).length,
      selectedForAI: tests.filter(test => test.includeInAIPrompt !== false).length,
      successRate: tests.length > 0 ? Math.round((tests.filter(test => test.lastResult === 'pass').length / tests.length) * 100) : 0
    };
  };

  const getStatusCodeColor = (statusCode: string) => {
    const colors = {
      "200": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "201": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "204": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      "400": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "401": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "403": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "404": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      "500": "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };
    return colors[statusCode as keyof typeof colors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

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
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
              <FiCode className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300">
              You need to create or select an active session before generating YAML specifications.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => window.history.back()}
                className="px-6 py-3 font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                icon={FiArrowLeft}
                variant="outline"
                iconPosition="right"
                children="Go Back"
              />
              <Button
                variant="primary"
                gradient
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openUnifiedManager('sessions');
                }}
                className="px-6 py-3 font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
                icon={FiPlus}
                iconPosition="right"
                children="Create Session"
              />
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
      <Card variant="gradient" padding="lg" className="overflow-hidden relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative justify-between items-center">
          <SectionHeader
            title="YAML Generator"
            description="Generate OpenAPI specifications from your API responses"
            icon={FiCode}
            className="mb-0"
          />

          <div className="flex items-center space-x-3">
            <Badge variant="info" className="px-4 py-2">
              <FiCpu className="mr-2 w-4 h-4" />
              OpenAPI
            </Badge>
            <Badge variant="success" className="px-4 py-2">
              <FiLayers className="mr-2 w-4 h-4" />
              Schema Generation
            </Badge>
          </div>
        </div>
      </Card>

      {/* Configuration Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Configuration */}
        <div className="space-y-6 lg:col-span-2">
          {/* Generation Controls */}
          <Card variant="elevated" padding="lg">
            <SectionHeader
              title="Generation Controls"
              description="Generate YAML specifications from API responses"
              icon={FiZap}
              className="mb-6"
            />

            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <Button
                variant="primary"
                gradient
                size="lg"
                icon={isGenerating ? FiRefreshCw : FiPlay}
                loading={isGenerating}
                disabled={isGenerating}
                onClick={handleFetchRequest}
                fullWidth
              >
                {isGenerating ? "Generating..." : "Fetch & Generate YAML"}
              </Button>

              <Button
                variant="success"
                gradient
                size="lg"
                icon={FiCode}
                onClick={handleGenerateFromCustomResponse}
                fullWidth
              >
                Generate from Custom Response
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-center p-3 space-x-2 bg-gray-50 rounded-lg dark:bg-gray-700">
                <FiShield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <Toggle
                  checked={includeToken && !!tokenExists}
                  onChange={() => setIncludeToken((prev) => !prev)}
                  label="Include Token"
                  disabled={!tokenExists}
                  colorScheme="purple"
                  size="md"
                  data-testid="include-token-toggle"
                />
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

              <Button
                variant="warning"
                gradient
                size="md"
                icon={FiRefreshCw}
                onClick={handleResetCustomResponse}
                fullWidth
              >
                Reset to Default
              </Button>
            </div>
          </Card>

          {/* Custom Response Editor */}
          <Card variant="elevated" padding="lg">
            <SectionHeader
              title="Custom Response"
              description="Edit your custom API response for YAML generation"
              icon={FiFileText}
              className="mb-6"
            />

            <MonacoEditor
              height="300px"
              language="json"
              value={customResponse ?? ""}
              onChange={(value: string | undefined) => setCustomResponse(value ?? "")}
              onMount={handleEditorDidMount}
              theme="auto"
              variant="outlined"
              colorTheme="bistool"
              allowCopy={true}
              allowDownload={false}
              allowFullscreen={true}
              allowSettings={true}
              fontSize={14}
              tabSize={2}
              showLineNumbers={true}
              showMinimap={false}
            />
          </Card>

          {/* Query Parameters */}
          {requestConfig?.queryParams?.length > 0 && (
            <Card variant="elevated" padding="lg">
              <SectionHeader
                title="Query Parameters"
                description="Select which query parameters to include in the request"
                icon={FiGlobe}
                className="mb-6"
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {requestConfig?.queryParams?.map((param) => (
                  <div key={param.key} className="flex items-center p-3 space-x-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                    <Toggle
                      checked={selectedQueries[param.key] || false}
                      disabled={param.required || false}
                      onChange={() => handleQueryToggle(param.key)}
                      label={param.key}
                      colorScheme="green"
                      size="sm"
                      position="left"
                      data-testid={`query-param-toggle-${param.key}`}
                    />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{param.value}</p>
                    </div>
                    {param.required && (
                      <Badge variant="danger" size="sm">
                        Required
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Request URL */}
          <Card variant="elevated" padding="lg">
            <SectionHeader
              title="Request URL"
              description="The complete URL that will be used for the API request"
              icon={FiWifi}
              className="mb-6"
            />

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
              <code className="text-sm text-gray-700 break-all dark:text-gray-300">
                {getColoredUrl()}
              </code>
            </div>
          </Card>
        </div>

        {/* Right Column - Response Conditions & Navigation */}
        <div className="space-y-6">
          {/* Response Conditions */}
          <Card variant="elevated" padding="lg">
            <SectionHeader
              title="Response Conditions"
              description="Define additional response status codes and conditions"
              icon={FiTarget}
              className="mb-6"
            />

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

              <Button
                variant="warning"
                gradient
                size="md"
                icon={FiPlus}
                onClick={() => setResponseConditions([...responseConditions, { status: "", condition: "", include: true }])}
                fullWidth
              >
                Add Status Code
              </Button>
            </div>
          </Card>

          {/* Navigation */}
          <Card variant="gradient" padding="lg" className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800">
            <SectionHeader
              title="Next Steps"
              description="Continue to the AI Test Generator"
              icon={FiActivity}
              className="mb-6"
            />

            <Button
              variant="primary"
              gradient
              size="lg"
              icon={FiArrowRight}
              onClick={() => navigate(`/project/${projectId}/session/${sessionId}/ai`)}
              fullWidth
            >
              Continue to AI Test Generator
            </Button>
          </Card>
        </div>
      </div>

      {/* Tests Section */}
      {activeSession?.tests && activeSession.tests.length > 0 && (
        <Card variant="elevated" padding="lg">
          <div className="flex justify-between items-center mb-6">
            <SectionHeader
              title="Test Cases"
              description="Review and manage your API test cases"
              icon={FiTarget}
              className="mb-0"
            />

            <div className="flex items-center space-x-3">
              <Button
                variant="secondary"
                size="sm"
                icon={showTests ? FiEyeOff : FiEye}
                onClick={() => setShowTests(!showTests)}
              >
                {showTests ? "Hide Tests" : "Show Tests"}
              </Button>

              <Button
                variant="primary"
                gradient
                size="sm"
                icon={FiArrowRight}
                onClick={() => navigate(`/project/${projectId}/session/${sessionId}/tests`)}
              >
                Edit Tests
              </Button>
            </div>
          </div>

          {showTests && (
            <>
              {/* Test Statistics */}
              <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-6">
                <div className="p-4 text-center bg-blue-50 rounded-xl dark:bg-blue-900">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {getTestStatistics().total}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Tests</div>
                </div>
                <div className="p-4 text-center bg-green-50 rounded-xl dark:bg-green-900">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {getTestStatistics().passed}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Passed</div>
                </div>
                <div className="p-4 text-center bg-red-50 rounded-xl dark:bg-red-900">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {getTestStatistics().failed}
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">Failed</div>
                </div>
                <div className="p-4 text-center bg-yellow-50 rounded-xl dark:bg-yellow-900">
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {getTestStatistics().notRun}
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">Not Run</div>
                </div>
                <div className="p-4 text-center bg-purple-50 rounded-xl dark:bg-purple-900">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {getTestStatistics().selectedForAI}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">For AI</div>
                </div>
                <div className="p-4 text-center bg-indigo-50 rounded-xl dark:bg-indigo-900">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {getTestStatistics().successRate}%
                  </div>
                  <div className="text-sm text-indigo-700 dark:text-indigo-300">Success Rate</div>
                </div>
              </div>

              {/* Test Cards */}
              <div className="space-y-4">
                {activeSession.tests.map((test: TestCase) => (
                  <Card key={test.id} variant="outlined" padding="md" className="border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                          <FiTarget className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {test.name || `Test ${test.id.slice(0, 8)}`}
                          </h4>
                          <div className="flex items-center mt-1 space-x-2">
                            <TestStatusBadge
                              status={test.lastResult || null}
                              size="sm"
                            />
                            <Badge
                              variant="primary"
                              size="sm"
                              className={getStatusCodeColor(test.expectedStatus)}
                            >
                              Expected: {test.expectedStatus}
                            </Badge>
                            {test.includeInAIPrompt !== false && (
                              <Badge variant="primary" size="sm">
                                <FiCode className="mr-1 w-3 h-3" />
                                AI
                              </Badge>
                            )}
                            {test.useToken !== false && (
                              <Badge variant="info" size="sm">
                                <FiShield className="mr-1 w-3 h-3" />
                                Auth
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={expandedTests.has(test.id) ? FiEyeOff : FiEye}
                          onClick={() => toggleTestExpansion(test.id)}
                        >
                          {expandedTests.has(test.id) ? "Hide" : "Details"}
                        </Button>
                      </div>
                    </div>

                    {/* Expanded Test Details */}
                    {expandedTests.has(test.id) && (
                      <div className="pt-4 mt-4 space-y-4 border-t border-gray-200 dark:border-gray-600">
                        {/* Path Overrides */}
                        {test.pathOverrides && Object.keys(test.pathOverrides).length > 0 && (
                          <div className="p-3 bg-blue-50 rounded-lg dark:bg-blue-900">
                            <h5 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                              Path Variable Overrides
                            </h5>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {Object.entries(test.pathOverrides).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{key}:</span>
                                  <span className="text-sm text-blue-800 dark:text-blue-200">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Query Overrides */}
                        {test.queryOverrides && Object.keys(test.queryOverrides).length > 0 && (
                          <div className="p-3 bg-green-50 rounded-lg dark:bg-green-900">
                            <h5 className="mb-2 text-sm font-semibold text-green-700 dark:text-green-300">
                              Query Parameter Overrides
                            </h5>
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                              {Object.entries(test.queryOverrides).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{key}:</span>
                                  <span className="text-sm text-green-800 dark:text-green-200">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Expected Response */}
                        {test.expectedResponse && (
                          <div className="p-3 bg-teal-50 rounded-lg dark:bg-teal-900">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-sm font-semibold text-teal-700 dark:text-teal-300">
                                Expected Response
                              </h5>
                              {test.expectedPartialResponse && (
                                <Badge variant="success" size="sm">Partial Match</Badge>
                              )}
                            </div>
                            <div className="p-2 bg-white rounded border dark:bg-gray-800 dark:border-gray-600">
                              <pre className="overflow-x-auto text-xs text-teal-800 dark:text-teal-200">
                                {test.expectedResponse}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Server Response */}
                        {test.serverResponse && (
                          <div className="p-3 bg-gray-50 rounded-lg dark:bg-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                Server Response
                              </h5>
                              {test.serverStatusCode && (
                                <Badge
                                  variant={test.serverStatusCode >= 200 && test.serverStatusCode < 300 ? 'success' : 'danger'}
                                  size="sm"
                                >
                                  {test.serverStatusCode}
                                </Badge>
                              )}
                            </div>
                            <div className="p-2 bg-white rounded border dark:bg-gray-800 dark:border-gray-600">
                              <pre className="overflow-x-auto text-xs text-gray-800 dark:text-gray-200">
                                {test.serverResponse}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Body Override */}
                        {test.bodyOverride && (
                          <div className="p-3 bg-purple-50 rounded-lg dark:bg-purple-900">
                            <h5 className="mb-2 text-sm font-semibold text-purple-700 dark:text-purple-300">
                              Request Body Override
                            </h5>
                            <div className="p-2 bg-white rounded border dark:bg-gray-800 dark:border-gray-600">
                              <pre className="overflow-x-auto text-xs text-purple-800 dark:text-purple-200">
                                {test.bodyOverride}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* No Tests Section */}
      {activeSession && (!activeSession.tests || activeSession.tests.length === 0) && (
        <Card variant="elevated" padding="lg">
          <div className="flex justify-between items-center mb-6">
            <SectionHeader
              title="Test Cases"
              description="Create test cases to validate your API endpoints"
              icon={FiTarget}
              className="mb-0"
            />

            <Button
              variant="primary"
              gradient
              size="sm"
              icon={FiPlus}
              onClick={() => navigate(`/project/${projectId}/session/${sessionId}/tests`)}
            >
              Create Tests
            </Button>
          </div>

          <div className="py-12 text-center">
            <div className="flex justify-center items-center mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full">
              <FiTarget className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
              No Test Cases Yet
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Create test cases to validate your API endpoints and ensure they work correctly.
            </p>
            <Button
              variant="primary"
              gradient
              icon={FiPlus}
              onClick={() => navigate(`/project/${projectId}/session/${sessionId}/tests`)}
            >
              Create Your First Test
            </Button>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {
        error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 dark:from-red-900 dark:to-red-800 dark:border-red-700">
            <div className="flex items-center space-x-2">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="font-medium text-red-800 dark:text-red-200">{error}</span>
            </div>
          </div>
        )
      }

      {/* Generated Output */}
      <Card variant="elevated" padding="lg">
        <div className="flex justify-between items-center mb-6">
          <SectionHeader
            title="Generated Output"
            description="View the generated YAML or JSON specification"
            icon={FiServer}
            className="mb-0"
          />

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
            <Button
              variant="primary"
              gradient
              size="md"
              icon={copySuccess ? FiCheck : FiCopy}
              onClick={handleCopyYAML}
              disabled={!localYamlOutput}
            >
              {copySuccess ? "Copied!" : "Copy YAML"}
            </Button>

            <Button
              variant="success"
              gradient
              size="md"
              icon={FiDownload}
              onClick={handleDownloadYAML}
              disabled={!localYamlOutput}
            >
              Download YAML
            </Button>
          </div>

          <Button
            variant="secondary"
            size="md"
            icon={isYamlExpanded ? FiMinimize2 : FiMaximize2}
            onClick={handleYamlExpand}
          >
            {isYamlExpanded ? "Collapse" : "Expand"}
          </Button>
        </div>

        <MonacoEditor
          height={isYamlExpanded ? "calc(100vh - 200px)" : `${editorHeight}px`}
          language={outputViewMode}
          value={getOutputEditorValue()}
          onMount={handleYamlEditorDidMount}
          theme="auto"
          variant="elevated"
          colorTheme="professional"
          label="Generated Output"
          description={`Generated ${outputViewMode.toUpperCase()} specification`}
          icon={FiServer}
          allowCopy={true}
          allowDownload={true}
          allowFullscreen={true}
          allowSettings={true}
          filename={`api-spec.${outputViewMode}`}
          readOnly={true}
          loading={isGenerating}
          fontSize={14}
          tabSize={2}
          showLineNumbers={true}
          showMinimap={false}
        />
      </Card>
    </div>
  );
};

export default YAMLGenerator;
