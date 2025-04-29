import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Editor from '@monaco-editor/react';

// Extract variables from URL in {variable} format, excluding the base URL
const extractVariables = (url) => {
  if (!url) return [];
  // Remove the base URL part before looking for variables
  const pathPart = url.split('/api/')[1] || '';
  // Handle both {variable} and %7Bvariable%7D formats
  const matches = pathPart.match(/(?:{([^}]+)}|%7B([^%]+)%7D)/g) || [];
  return matches.map(match => {
    if (match.startsWith('{')) {
      return match.slice(1, -1);
    } else {
      return match.slice(3, -3);
    }
  });
};

const YAMLGenerator = ({ onGenerate }) => {
  const {
    urlData,
    requestConfig,
    segmentVariables,
    setYamlOutput,
    handleYAMLGenerated,
    setActiveSection,
    sharedVariables,
    updateSharedVariable,
    activeSession
  } = useAppContext();

  const { isDarkMode } = useTheme();

  const [yamlOutput, setLocalYamlOutput] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedQueries, setSelectedQueries] = useState(() => {
    const initialQueries = {};
    if (requestConfig?.queryParams) {
      requestConfig.queryParams.forEach(param => {
        initialQueries[param.key] = false;
      });
    }
    return initialQueries;
  });
  const [openApiVersion, setOpenApiVersion] = useState('1.0.0');
  const [customResponse, setCustomResponse] = useState(`{
  "data": [
    {
      "key":"value"
    }
  ],
  "token": "fff.fff.fff",
  "data_effective_tstamp": "2025-04-28 07:00:00"
}
  `);
  const [isCustomResponseValid, setIsCustomResponseValid] = useState(true);
  const [editorHeight, setEditorHeight] = useState('200px');
  const [yamlEditorHeight, setYamlEditorHeight] = useState('200px');
  const editorRef = useRef(null);
  const yamlEditorRef = useRef(null);
  const containerRef = useRef(null);
  const yamlContainerRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isYamlResizing, setIsYamlResizing] = useState(false);

  // Initialize variables with empty strings to prevent uncontrolled input warning
  const [variableValues, setVariableValues] = useState(() => {
    const initialVariables = {};
    const variables = extractVariables(urlData.builtUrl);
    variables.forEach(variable => {
      initialVariables[variable] = '';
    });
    return initialVariables;
  });

  const handleQueryToggle = (queryKey) => {
    setSelectedQueries(prev => ({
      ...prev,
      [queryKey]: !prev[queryKey]
    }));
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Configure JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "http://myserver/foo-schema.json",
        schema: {
          type: "object",
          properties: {
            "*": {
              type: "object"
            }
          }
        }
      }]
    });
  };

  const handleEditorChange = (value) => {
    setCustomResponse(value);
    try {
      JSON.parse(value);
      setIsCustomResponseValid(true);
    } catch (e) {
      setIsCustomResponseValid(false);
    }
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.pageY;
    const startHeight = containerRef.current.getBoundingClientRect().height;

    function onMouseMove(e) {
      const deltaY = e.pageY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      containerRef.current.style.height = `${newHeight}px`;
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }

    function onMouseUp() {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleYamlMouseDown = (e) => {
    e.preventDefault();
    setIsYamlResizing(true);
    const startY = e.pageY;
    const startHeight = yamlContainerRef.current.getBoundingClientRect().height;

    function onMouseMove(e) {
      const deltaY = e.pageY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      yamlContainerRef.current.style.height = `${newHeight}px`;
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }

    function onMouseUp() {
      setIsYamlResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (yamlEditorRef.current) {
        yamlEditorRef.current.layout();
      }
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleYamlEditorDidMount = (editor, monaco) => {
    yamlEditorRef.current = editor;
    // Set initial height based on content
    const contentHeight = editor.getModel().getLineCount() * 19; // 19px per line
    setYamlEditorHeight(`${Math.max(200, contentHeight)}px`);
  };

  // Update YAML editor height when content changes
  useEffect(() => {
    if (yamlEditorRef.current && yamlOutput) {
      const contentHeight = yamlEditorRef.current.getModel().getLineCount() * 19;
      setYamlEditorHeight(`${Math.max(200, contentHeight)}px`);
    }
  }, [yamlOutput]);

  const makeRequest = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      if (!urlData || !urlData.domain || !urlData.protocol) {
        throw new Error('Missing URL configuration. Please check your URL settings.');
      }

      // Replace variables in domain using values from shared variables
      let domain = urlData.domain;
      const domainVars = domain.match(/{([^}]+)}/g) || [];
      domainVars.forEach(varMatch => {
        const varName = varMatch.slice(1, -1);
        const value = sharedVariables[varName] || segmentVariables[varName] || variableValues[varName];
        if (value) {
          // Remove any ${} wrapping if present
          const cleanValue = value.replace(/^\${(.*)}$/, '$1');
          domain = domain.replace(varMatch, cleanValue);
        } else {
          setError(`Missing value for domain variable: ${varName}`);
          throw new Error(`Missing value for domain variable: ${varName}`);
        }
      });

      // Build base URL from protocol and resolved domain
      const baseUrl = `${urlData.protocol}://${domain}`;

      // Get the path part from the built URL, removing any base URL template
      let pathPart = '';
      if (urlData.builtUrl) {
        pathPart = urlData.builtUrl
          .replace(/^https?:\/\/[^/]+/, '')
          .replace(/^https?:\/\/{{base_url}}/, '')
          .replace(/^https?:\/\/{base_url}/, '');
      }

      // Extract path segments and replace variables
      const segments = pathPart ? pathPart.split('/').filter(segment => segment) : [];
      const finalPath = segments.map(segment => {
        const isVariable = segment.match(/(?:{([^}]+)}|%7B([^%]+)%7D)/);
        if (isVariable) {
          const varName = isVariable[1] || isVariable[2];
          // Try to get value from sharedVariables first, then fall back to others
          const value = sharedVariables[varName] || segmentVariables[varName] || variableValues[varName];
          if (!value) {
            setError(`Missing value for path variable: ${varName}`);
            throw new Error(`Missing value for path variable: ${varName}`);
          }
          // Remove any ${} wrapping if present
          return value.replace(/^\${(.*)}$/, '$1');
        }
        return segment;
      }).join('/');

      // Construct the final URL
      const url = `${baseUrl}${finalPath ? `/${finalPath}` : ''}`;

      // Build query parameters from selected queries
      const queryParams = new URLSearchParams();
      if (requestConfig.queryParams) {
        requestConfig.queryParams.forEach(param => {
          if (selectedQueries[param.key]) {
            // If the value is a variable reference, use its value from shared variables
            let value = param.value;
            if (value.startsWith('{') && value.endsWith('}')) {
              const varName = value.slice(1, -1);
              value = sharedVariables[varName] || segmentVariables[varName] || variableValues[varName];
            }
            if (value) {
              queryParams.append(param.key, value);
            }
          }
        });
      }

      // Build headers
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      // Add custom headers from request config
      if (requestConfig.headers) {
        requestConfig.headers.forEach(header => {
          if (header.key) {
            let value = header.value;
            if (value.startsWith('{') && value.endsWith('}')) {
              const varName = value.slice(1, -1);
              value = sharedVariables[varName] || segmentVariables[varName] || variableValues[varName];
            }
            if (value) {
              headers[header.key] = value;
            }
          }
        });
      }

      // Add authentication headers from shared variables
      Object.entries(sharedVariables).forEach(([key, value]) => {
        if (value && typeof value === 'string' &&
          (key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('auth') ||
            key.toLowerCase().includes('bearer'))) {
          headers[key] = value;
        }
      });

      // Prepare request body
      let body = null;
      if (requestConfig.bodyType === 'json' && requestConfig.jsonBody) {
        try {
          let jsonBody = requestConfig.jsonBody;
          // Replace variables in the JSON body
          Object.entries(sharedVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            jsonBody = jsonBody.replace(regex, value);
          });
          Object.entries(segmentVariables).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            jsonBody = jsonBody.replace(regex, value);
          });
          Object.entries(variableValues).forEach(([key, value]) => {
            const regex = new RegExp(`{${key}}`, 'g');
            jsonBody = jsonBody.replace(regex, value);
          });
          body = JSON.stringify(JSON.parse(jsonBody));
        } catch (e) {
          console.error('Error parsing JSON body:', e);
          throw new Error('Invalid JSON body format');
        }
      }

      // Prepare request options
      const requestOptions = {
        method: requestConfig.method || 'GET',
        headers,
        credentials: 'omit',
        mode: 'cors'
      };

      // Add body for POST, PUT, PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(requestConfig.method?.toUpperCase()) && body) {
        requestOptions.body = body;
      }

      // Add query parameters to URL
      const queryString = queryParams.toString();
      const urlWithQuery = queryString ? `${url}?${queryString}` : url;

      // Make the request
      const response = await fetch(urlWithQuery, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // Try to parse response as JSON
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        throw new Error('Invalid JSON response from server');
      }

      // Generate YAML from response
      const yaml = generateYAML(responseData, requestConfig);
      setLocalYamlOutput(yaml);
      setYamlOutput(yaml);
    } catch (error) {
      console.error('Error making request:', error);
      setError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFromCustomResponse = () => {
    try {
      setIsGenerating(true);
      setError(null);

      if (!customResponse) {
        throw new Error('Please enter a JSON response');
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(customResponse);
      } catch (e) {
        setIsCustomResponseValid(false);
        throw new Error('Invalid JSON format');
      }

      setIsCustomResponseValid(true);

      // Create a properly structured response data
      const mockResponseData = parsedResponse;

      // Generate YAML with the complete response structure
      const yaml = generateYAML(mockResponseData, requestConfig);
      setLocalYamlOutput(yaml);
      setYamlOutput(yaml);
    } catch (err) {
      setError(err.message);
      console.error('Error generating YAML:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateYAML = (responseData, requestConfig) => {
    if (!responseData || !requestConfig) {
      return '';
    }

    // Helper function to get value from shared variables if it starts with ${
    const getValueFromVariables = (value) => {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        return sharedVariables[varName] || segmentVariables[varName] || variableValues[varName] || value;
      }
      return value;
    };

    // Helper function to determine parameter type
    const getParameterType = (value) => {
      if (typeof value === 'number') {
        return 'integer';
      } else if (typeof value === 'boolean') {
        return 'boolean';
      } else if (Array.isArray(value)) {
        return 'array';
      } else if (typeof value === 'object' && value !== null) {
        return 'object';
      }
      return 'string';
    };

    // Helper function to generate response schema
    const generateResponseSchema = (data, indent = 0) => {
      const spaces = '  '.repeat(indent);
      let yaml = '';

      if (Array.isArray(data)) {
        if (data.length > 0) {
          yaml += `${spaces}type: array\n`;
          yaml += `${spaces}items:\n`;
          yaml += generateResponseSchema(data[0], indent + 1);
        } else {
          yaml += `${spaces}type: array\n`;
          yaml += `${spaces}items:\n`;
          yaml += `${spaces}  type: object\n`;
        }
      } else if (data && typeof data === 'object') {
        yaml += `${spaces}type: object\n`;
        yaml += `${spaces}properties:\n`;

        for (const [key, value] of Object.entries(data)) {
          yaml += `${spaces}  ${key}:\n`;
          if (value === null) {
            yaml += `${spaces}    type: null\n`;
          } else if (Array.isArray(value)) {
            yaml += generateResponseSchema(value, indent + 2);
          } else if (value && typeof value === 'object') {
            yaml += generateResponseSchema(value, indent + 2);
          } else {
            yaml += `${spaces}    type: ${typeof value}\n`;
          }
          // Add description for each property
          yaml += `${spaces}    description: ${key}\n`;
          if (value !== null && typeof value !== 'object') {
            yaml += `${spaces}    example: ${JSON.stringify(value)}\n`;
          }
        }
      } else {
        yaml += `${spaces}type: ${typeof data}\n`;
        if (data !== null) {
          yaml += `${spaces}example: ${JSON.stringify(data)}\n`;
        }
      }

      return yaml;
    };

    // Get the URL from urlData
    const url = urlData?.builtUrl || '';
    const { method, headers, body } = requestConfig;

    // Use active session name or fallback to endpoint name
    const title = activeSession?.name || (url ? url.split('/').pop().replace(/[^a-zA-Z0-9]/g, '_') : 'endpoint');

    let yaml = '';

    if (openApiVersion === '1.0.0') {
      // Generate OpenAPI 1.0 YAML with generic template structure
      yaml = `${requestConfig.method} ${title}
---
tags:
  - ${title}
url: ${url}
description: ${urlData.sessionDescription ?? `API documentation of ${title}`}
security:
  - ApiKeyAuth: []
parameters:`;
      const tokenName = sharedVariables.tokenName
      if (tokenName) {
        yaml += `
  - name: ${tokenName}
    in: header
    description: Authentication token
    required: true
    type: string
    example: "xxx.xxx.xxx"`;
      }

      // Add header parameters from Request Config
      if (requestConfig.headers && requestConfig.headers.length > 0) {
        requestConfig.headers.forEach(header => {
          if (header.key) {
            const headerValue = getValueFromVariables(header.value || '');
            const type = header.type || getParameterType(headerValue);
            yaml += `
  - name: ${header.key}
    in: header
    description: ${header.description || header.key}
    required: ${header.required || false}
    type: ${type}
    example: ${headerValue}`;
          }
        });
      }

      // Add path parameters from URL Builder
      const pathParams = extractVariables(urlData.builtUrl);
      pathParams.forEach(param => {
        const paramValue = getValueFromVariables(segmentVariables[param] || sharedVariables[param] || variableValues[param] || `${param}_value`);
        const type = getParameterType(paramValue);
        const segment = urlData.segments.find(s => s.paramName === param);
        yaml += `
  - name: ${param}
    in: path
    description: ${segment?.description || param}
    required: true
    type: ${type}
    example: ${paramValue}`;
      });

      // Add query parameters from Request Config
      if (requestConfig.queryParams && requestConfig.queryParams.length > 0) {
        requestConfig.queryParams.forEach(param => {
          if (param.key) {
            const paramValue = getValueFromVariables(param.value || '');
            const type = param.type || getParameterType(paramValue);
            yaml += `
  - name: ${param.key}
    in: query
    description: ${param.description || param.key}
    required: ${param.required || false}
    type: ${type}
    example: ${paramValue}`;
          }
        });
      }

      // Add request body from Request Config
      if (requestConfig.bodyType === 'json' && requestConfig.jsonBody) {
        try {
          const bodyData = JSON.parse(requestConfig.jsonBody);
          yaml += `
  - name: body
    in: body
    description: Request body
    required: true
    schema:
      type: object
      properties:`;

          const addBodyProperties = (obj, indent = '              ') => {
            Object.entries(obj).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                yaml += `
${indent}${key}:
${indent}  type: array
${indent}  description: Array of ${key}
${indent}  items:
${indent}    type: object
${indent}    properties:`;
                if (value.length > 0) {
                  addBodyProperties(value[0], indent + '    ');
                }
              } else if (typeof value === 'object' && value !== null) {
                yaml += `
${indent}${key}:
${indent}  type: object
${indent}  description: ${key} object
${indent}  properties:`;
                addBodyProperties(value, indent + '  ');
              } else {
                const type = getParameterType(value);
                const exampleValue = getValueFromVariables(value);
                yaml += `
${indent}${key}:
${indent}  type: ${type}
${indent}  description: ${key}
${indent}  example: ${exampleValue}`;
              }
            });
          };

          addBodyProperties(bodyData);
        } catch (e) {
          console.error('Error parsing JSON body:', e);
        }
      }

      // Add responses dynamically based on actual response data
      yaml += `
responses:
  ${responseData.status || '200'}:`;
      yaml += `
    description: ${responseData.statusText || 'Successful response'}`;
      yaml += `    
    schema:\n`;
      yaml += generateResponseSchema(responseData, 3);
      // Add standard error responses
      yaml += ` 204:
    description: No Content
  400:
    description: Bad Request
    schema:
      type: object
      properties:
        status:
          type: string
          example: error
        message:
          type: string
          example: Invalid request parameters
  500:
    description: Internal Server Error
    schema:
      type: object
      properties:
        status:
          type: string
          example: error
        message:
          type: string
          example: Internal server error occurred`;
    } else {
      // Generate OpenAPI 2.0 or 3.0 YAML
      yaml = `openapi: ${openApiVersion}
info:
  title: ${title} API
  version: 1.0.0
  description: ${urlData.sessionDescription || 'API documentation generated from URL'}

servers:
  - url: ${urlData.protocol}://${urlData.domain}
    description: ${urlData.environment} server

paths:
  ${url}:
    ${method.toLowerCase()}:
      tags:
        - ${title}
      security:
        - ApiKeyAuth: []
      parameters:`;

      // Add header parameters dynamically
      if (headers && Object.keys(headers).length > 0) {
        Object.entries(headers).forEach(([key, value]) => {
          const headerValue = typeof value === 'object' ? JSON.stringify(value) : value;
          yaml += `
        - in: header
          name: ${key}
          schema:
            type: string
          example: ${headerValue}
          required: ${headers[key].required || false}
          description: ${key} header`;
        });
      }

      // Add body parameters dynamically
      if (body && Object.keys(body).length > 0) {
        yaml += `
        - in: body
          name: body
          required: true
          description: Request body
          content:
            application/json:
              schema:
                type: object
                properties:`;

        const addBodyProperties = (obj, indent = '                    ') => {
          Object.entries(obj).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              yaml += `
${indent}${key}:
${indent}  type: array
${indent}  items:
${indent}    type: object
${indent}    properties:`;
              if (value.length > 0) {
                addBodyProperties(value[0], indent + '    ');
              }
            } else if (typeof value === 'object' && value !== null) {
              yaml += `
${indent}${key}:
${indent}  type: object
${indent}  properties:`;
              addBodyProperties(value, indent + '  ');
            } else {
              const type = typeof value === 'number' ? 'integer' : 'string';
              const exampleValue = typeof value === 'object' ? JSON.stringify(value) : value;
              yaml += `
${indent}${key}:
${indent}  type: ${type}
${indent}  example: ${exampleValue}
${indent}  description: ${key}`;
            }
          });
        };

        addBodyProperties(body);
      }

      // Add path parameters dynamically
      const pathParams = extractVariables(url);
      pathParams.forEach(param => {
        const segment = urlData.segments.find(s => s.paramName === param);
        yaml += `
        - in: path
          name: ${param}
          schema:
            type: string
          required: ${segment?.required || false}
          description: ${param} parameter in the URL path`;
      });

      // Add query parameters dynamically
      if (requestConfig.queryParams) {
        requestConfig.queryParams.forEach(param => {
          if (selectedQueries[param.key]) {
            const paramValue = typeof param.value === 'object' ? JSON.stringify(param.value) : param.value;
            yaml += `
        - in: query
          name: ${param.key}
          schema:
            type: string
          example: ${paramValue}
          required: ${param.required || false}
          description: ${param.key}`;
          }
        });
      }

      // Add responses dynamically based on actual response data
      yaml += `
      responses:
        ${responseData.status || '200'}:\n`;
      yaml += `    description: ${responseData.statusText || 'Successful response'}\n`;
      yaml += `    content:\n`;
      yaml += `      application/json:\n`;
      yaml += `        schema:\n`;
      yaml += generateResponseSchema(responseData, 4);

      // Add error response dynamically
      yaml += `
        '400':
          description: Error`;
    }

    return yaml;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(yamlOutput)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const downloadYAML = () => {
    const blob = new Blob([yamlOutput], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // Use active session name as filename, fallback to 'api_config' if no session name
    const filename = activeSession?.name ? `${activeSession.name}.yml` : 'api_config.yml';
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg shadow`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>YAML Output</h2>
        <div className="flex space-x-2">
          <select
            value={openApiVersion}
            onChange={(e) => setOpenApiVersion(e.target.value)}
            className={`px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
          >
            <option value="1.0.0">OpenAPI 1.0</option>
            <option value="2.0.0">OpenAPI 2.0</option>
            <option value="3.0.0">OpenAPI 3.0</option>
          </select>
          <button
            onClick={makeRequest}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
          >
            {isGenerating ? 'Fetching...' : 'Fetch & Generate'}
          </button>
          <button
            onClick={generateFromCustomResponse}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
          >
            {isGenerating ? 'Generating...' : 'Generate No Fetch'}
          </button>
          <button
            onClick={() => setActiveSection('ai')}
            disabled={!yamlOutput}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-purple-300"
          >
            AI Test Generator
          </button>
        </div>
      </div>

      {/* Custom Response Input */}
      <div className={`mb-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow`}>
        <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Custom Response</h3>
        <div className="space-y-2">
          <div
            className="border rounded-md overflow-hidden relative"
            style={{ height: editorHeight }}
            ref={containerRef}
          >
            <Editor
              height="100%"
              defaultLanguage="json"
              value={customResponse}
              onChange={handleEditorChange}
              onMount={handleEditorDidMount}
              theme={isDarkMode ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10
                },
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
                tabSize: 2
              }}
            />
            <div
              className={`absolute bottom-0 left-0 w-full h-6 cursor-ns-resize ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                } flex items-center justify-center`}
              onMouseDown={handleMouseDown}
              style={{ userSelect: 'none', touchAction: 'none', zIndex: 10 }}
            >
              <div className={`w-8 h-2 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded`}></div>
            </div>
          </div>
          {!isCustomResponseValid && (
            <p className="text-red-500 text-sm">Invalid JSON format</p>
          )}
        </div>
      </div>

      {/* Path Segments Section */}
      <div className={`mb-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow`}>
        <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Path Segments</h3>
        <div className="space-y-2">
          <div className="flex items-center space-x-1">
            {(() => {
              const segments = urlData.builtUrl.split('/').filter(segment => segment);
              return segments.map((segment, index) => {
                const isVariable = segment.match(/(?:{([^}]+)}|%7B([^%]+)%7D)/);
                if (isVariable) {
                  const varName = isVariable[1] || isVariable[2];
                  const value = sharedVariables[varName] || segmentVariables[varName] || variableValues[varName] || '';
                  const cleanValue = value.replace(/^\${(.*)}$/, '$1');
                  return (
                    <React.Fragment key={index}>
                      {/* <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{segment}</span> */}
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>({cleanValue})</span>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/</span>
                    </React.Fragment>
                  );
                }
                return (
                  <React.Fragment key={index}>
                    <span className="font-medium">{segment}</span>
                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>/</span>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </div>
      </div>

      {/* Query Parameters Section */}
      {requestConfig?.queryParams?.length > 0 && (
        <div className={`mb-4 p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow`}>
          <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Query Parameters</h3>
          <div className="space-y-2">
            {requestConfig.queryParams.map(param => (
              <div key={param.key} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={!!selectedQueries[param.key]}
                  onChange={() => handleQueryToggle(param.key)}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    } rounded`}
                />
                <label className="flex-1">
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{param.key}</span>
                  {param.value && (
                    <span className={`ml-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      = {param.value.startsWith('{') && param.value.endsWith('}')
                        ? sharedVariables[param.value.slice(1, -1)] || segmentVariables[param.value.slice(1, -1)] || variableValues[param.value.slice(1, -1)] || param.value
                        : param.value}
                    </span>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}

      <div className={`p-4 rounded border ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
        } overflow-auto`}>
        <div className='flex justify-around'>
          <button
            onClick={copyToClipboard}
            disabled={!yamlOutput}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
          >
            {copySuccess ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={downloadYAML}
            disabled={!yamlOutput}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-green-300"
          >
            Download
          </button>
        </div>
        <div
          className="border rounded-md overflow-hidden relative"
          style={{ height: yamlEditorHeight }}
          ref={yamlContainerRef}
        >
          <Editor
            height="100%"
            defaultLanguage="yaml"
            value={yamlOutput || 'No YAML generated yet. Click any of the generate buttons to create configuration.'}
            onMount={handleYamlEditorDidMount}
            theme={isDarkMode ? 'vs-dark' : 'light'}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                useShadows: false,
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
              },
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true,
              tabSize: 2,
              readOnly: true
            }}
          />
          <div
            className={`absolute bottom-0 left-0 w-full h-6 cursor-ns-resize ${isDarkMode ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
              } flex items-center justify-center`}
            onMouseDown={handleYamlMouseDown}
            style={{ userSelect: 'none', touchAction: 'none', zIndex: 10 }}
          >
            <div className={`w-8 h-2 ${isDarkMode ? 'bg-gray-400' : 'bg-gray-400'} rounded`}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

YAMLGenerator.propTypes = {
  onGenerate: PropTypes.func.isRequired
};

export default YAMLGenerator;