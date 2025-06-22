import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Editor, { OnMount } from "@monaco-editor/react";
import TokenGenerator from "./utils/TokenGenerator";
import {
  RequestConfigProps,
  RequestConfigState,
} from "../types/components/components.types";
import {
  AppContextType,
  ThemeContextType,
  QueryParam,
  Header,
  FormDataField,
  RequestConfigData,
} from "../types/core/app.types";
import { editor } from "monaco-editor";
import { FiPlus, FiTrash2 } from "react-icons/fi";

const RequestConfig: React.FC<RequestConfigProps> = ({ onSubmit }) => {
  const { isDarkMode } = useTheme() as ThemeContextType;
  const {
    requestConfig: savedConfig,
    setRequestConfig,
    globalVariables,
    activeSession,
    handleSaveSession,
  } = useAppContext() as AppContextType;
  const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<RequestConfigState["activeTab"]>(
    () => {
      if (activeSession?.requestConfig?.bodyType === "json") return "body";
      if (activeSession?.requestConfig?.bodyType === "form") return "body";
      return "params";
    }
  );

  const [queryParams, setQueryParams] = useState<QueryParam[]>(() => {
    if (activeSession?.requestConfig?.queryParams)
      return activeSession.requestConfig.queryParams;
    if (savedConfig?.queryParams) return savedConfig.queryParams;
    return [];
  });

  const [headers, setHeaders] = useState<Header[]>(() => {
    if (activeSession?.requestConfig?.headers)
      return activeSession.requestConfig.headers;
    if (savedConfig?.headers) return savedConfig.headers;
    return [];
  });

  const [method, setMethod] = useState<string>(() => {
    if (activeSession?.requestConfig?.method)
      return activeSession.requestConfig.method;
    if (savedConfig?.method) return savedConfig.method;
    return "GET";
  });

  const [bodyType, setBodyType] = useState<"none" | "json" | "form" | "text">(() => {
    if (activeSession?.requestConfig?.bodyType)
      return activeSession.requestConfig.bodyType;
    if (savedConfig?.bodyType) return savedConfig.bodyType;
    return "none";
  });

  const [jsonBody, setJsonBody] = useState<string>(() => {
    if (activeSession?.requestConfig?.jsonBody)
      return activeSession.requestConfig.jsonBody;
    if (savedConfig?.jsonBody) return savedConfig.jsonBody;
    return "{\n  \n}";
  });

  const [formData, setFormData] = useState<FormDataField[]>(() => {
    if (activeSession?.requestConfig?.formData)
      return activeSession.requestConfig.formData;
    if (savedConfig?.formData) return savedConfig.formData;
    return [{ key: "", value: "", type: "text", required: false }];
  });

  const [textBody, setTextBody] = useState<string>("");

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const [jsonEditorHeight, setJsonEditorHeight] = useState<number>(200);
  const jsonEditorContainerRef = useRef<HTMLDivElement>(null);

  const decodeString = useCallback((encodedString: string): string | null => {
    try {
      return atob(encodedString.replace(/-/g, "+").replace(/_/g, "/"));
    } catch (e) {
      console.error("Error decoding string:", e);
      return null;
    }
  }, []);

  const checkTokenExpiration = useCallback((): boolean => {
    if (!globalVariables) return false;

    const tokenName = globalVariables['tokenName'];
    if (!tokenName) return false;

    const tokenValue = globalVariables[tokenName as keyof typeof globalVariables];
    if (typeof tokenValue !== 'string' || !tokenValue) return false;

    const token = tokenValue as string;
    if (token.trim() === "") {
      setTokenExpiration(null);
      return false;
    }

    try {
      const tokenPart = token.split(".")[1];
      if (!tokenPart) return false;
      const payload = JSON.parse(decodeString(tokenPart) || "{}");
      const now = Math.floor(Date.now() / 1000);
      const exp = payload.exp;
      const duration = (exp - now) / 60; // duration in minutes
      setTokenExpiration(duration);
      return duration > 1;
    } catch (e) {
      console.error("Error checking token expiration:", e);
      setTokenExpiration(null);
      return false;
    }
  }, [globalVariables, decodeString]);

  // Check token expiration periodically
  useEffect(() => {
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkTokenExpiration]);

  // Save state to context whenever it changes
  useEffect(() => {
    const config: RequestConfigData = {
      method,
      queryParams,
      headers,
      bodyType,
      ...(bodyType === "json" && { jsonBody }),
      ...(bodyType === "form" && { formData }),
      ...(bodyType === "text" && { textBody }),
    };

    // Only update if the config has actually changed
    if (JSON.stringify(config) !== JSON.stringify(savedConfig)) {
      // Debounce the context update
      const timeoutId = setTimeout(() => {
        setRequestConfig(config);

        // Save to active session if exists
        if (activeSession) {
          const updatedSession = {
            ...activeSession,
            requestConfig: config,
          };
          handleSaveSession(activeSession.name, updatedSession);
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [method,
    queryParams,
    headers,
    bodyType,
    jsonBody,
    formData,
    textBody,
    savedConfig,
    activeSession,
    setRequestConfig,
    handleSaveSession,
  ]);

  // Effect to handle session changes
  useEffect(() => {
    if (activeSession?.requestConfig) {
      const sessionConfig = activeSession.requestConfig;

      // Only update if the session config is different from current state
      if (
        JSON.stringify(sessionConfig) !==
        JSON.stringify({
          method,
          queryParams,
          headers,
          bodyType,
          jsonBody: bodyType === "json" ? jsonBody : undefined,
          formData: bodyType === "form" ? formData : undefined,
          textBody: bodyType === "text" ? textBody : undefined,
        })
      ) {
        setMethod(sessionConfig.method || "GET");
        setQueryParams(sessionConfig.queryParams || []);
        setHeaders(sessionConfig.headers || []);
        setBodyType(sessionConfig.bodyType || "none");
        setJsonBody(sessionConfig.jsonBody || "{\n  \n}");
        setFormData(
          sessionConfig.formData || [
            { key: "", value: "", type: "text", required: false },
          ]
        );
        setTextBody(sessionConfig.textBody || "");

        // Update active tab based on body type
        if (
          sessionConfig.bodyType === "json" ||
          sessionConfig.bodyType === "form" ||
          sessionConfig.bodyType === "text"
        ) {
          setActiveTab("body");
        } else {
          setActiveTab("params");
        }
      }
    }
  }, [activeSession?.id]);

  const addQueryParam = (): void => {
    setQueryParams([
      ...queryParams,
      { key: "", value: "", description: "", required: false },
    ]);
  };

  const removeQueryParam = (index: number): void => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  const updateQueryParam = (
    index: number,
    field: keyof QueryParam,
    value: string | boolean
  ): void => {
    const updatedParams = [...queryParams];
    const currentParam = updatedParams[index];
    if (currentParam) {
      updatedParams[index] = {
        key: field === "key" ? value as string : currentParam.key || "",
        value: field === "value" ? value as string : currentParam.value || "",
        description: field === "description" ? value as string : currentParam.description || "",
        required: field === "required" ? value as boolean : currentParam.required || false,
      };
      setQueryParams(updatedParams);
    }
  };

  const addHeader = (): void => {
    setHeaders([
      ...headers,
      { key: "", value: "", description: "", required: false, in: "header" },
    ]);
  };

  const removeHeader = (index: number): void => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const updateHeader = (
    index: number,
    field: keyof Header,
    value: string | boolean
  ): void => {
    const updatedHeaders = [...headers];
    const currentHeader = updatedHeaders[index];
    if (currentHeader) {
      updatedHeaders[index] = {
        key: field === "key" ? value as string : currentHeader.key || "",
        value: field === "value" ? value as string : currentHeader.value || "",
        description: field === "description" ? value as string : currentHeader.description || "",
        required: field === "required" ? value as boolean : currentHeader.required || false,
        in: field === "in" ? value as "header" | "path" | "query" : currentHeader.in || "header",
      };
      setHeaders(updatedHeaders);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
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

  const handleEditorChange = (value: string | undefined): void => {
    if (value) setJsonBody(value);
  };

  const addFormDataField = (): void => {
    setFormData([
      ...formData,
      { key: "", value: "", type: "text", required: false },
    ]);
  };

  const removeFormDataField = (index: number): void => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const updateFormDataField = (
    index: number,
    field: keyof FormDataField,
    value: string | boolean
  ): void => {
    const updatedFormData = [...formData];
    const currentField = updatedFormData[index];
    if (currentField) {
      if (field === "required") {
        updatedFormData[index] = {
          key: currentField.key || "",
          value: currentField.value || "",
          type: currentField.type || "text",
          required: value as boolean,
          description: currentField.description || "",
        };
      } else {
        updatedFormData[index] = {
          key: field === "key" ? value as string : currentField.key || "",
          value: field === "value" ? value as string : currentField.value || "",
          type: field === "type" ? value as "text" | "file" : currentField.type || "text",
          required: currentField.required || false,
          description: field === "description" ? value as string : currentField.description || "",
        };
      }
      setFormData(updatedFormData);
    }
  };

  const handleJsonEditorMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    const startY = e.pageY;
    const startHeight = jsonEditorContainerRef.current?.getBoundingClientRect().height || 0;

    function onMouseMove(e: MouseEvent): void {
      const deltaY = e.pageY - startY;
      const newHeight = Math.max(100, startHeight + deltaY);
      if (jsonEditorContainerRef.current) {
        jsonEditorContainerRef.current.style.height = `${newHeight}px`;
      }
      setJsonEditorHeight(newHeight);
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

  const getBodyContent = (): React.ReactElement => {
    switch (bodyType) {
      case "json":
        return (
          <div className="mt-4">
            <label id="jsonBodyLabel" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              JSON Body
            </label>
            <div
              ref={jsonEditorContainerRef}
              className="overflow-hidden border rounded-md relative"
              style={{ height: `${jsonEditorHeight}px` }}
              aria-labelledby="jsonBodyLabel"
            >
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonBody}
                theme={isDarkMode ? "vs-dark" : "vs"}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
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
                }}
              />
              <div
                className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 cursor-ns-resize hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                onMouseDown={handleJsonEditorMouseDown}
              />
            </div>
          </div>
        );
      case "form":
        return (
          <div className="mt-4">
            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Form Data
            </label>
            <div className="space-y-2">
              {formData.map((field, index) => (
                <div
                  key={`form-field-${index}`}
                  className="flex items-center p-2 space-x-2 rounded-md bg-gray-50 dark:bg-gray-700"
                >
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) =>
                      updateFormDataField(index, "key", e.target.value)
                    }
                    placeholder="Key"
                    className="block w-1/2 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) =>
                      updateFormDataField(index, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="block w-1/2 px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:text-white"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateFormDataField(index, "required", e.target.checked)
                      }
                      className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                    />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      Required
                    </span>
                  </div>
                  <button
                    onClick={() => removeFormDataField(index)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFormDataField}
              className="inline-flex items-center px-3 py-2 mt-2 text-sm font-medium leading-4 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm dark:border-gray-600 dark:text-gray-300 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Form Field
            </button>
          </div>
        );
      case "text":
        return (
          <div className="mt-4">
            <label
              className={`block text-sm font-medium dark:text-white text-gray-700`}
            >
              Text Body
            </label>
            <textarea
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder="Enter text body"
              className={`mt-2 block w-full rounded-md border-gray-300 dark:bg-gray-800 dark:text-white bg-white text-gray-900`}
            />
          </div>
        );
      case "none":
      default:
        return (
          <div className="p-4 text-sm text-center text-gray-500 border border-gray-300 border-dashed rounded dark:text-gray-400">
            No body content for this request.
          </div>
        );
    }
  };

  const handleSubmit = (): void => {
    const config: RequestConfigData = {
      method,
      queryParams,
      headers,
      bodyType,
      ...(bodyType === "json" && { jsonBody }),
      ...(bodyType === "form" && { formData }),
      ...(bodyType === "text" && { textBody }),
    };

    onSubmit(config);
  };
  const methodOptions =
  {
    GET: { value: "GET", label: "GET", color: "dark:text-green-400 dark:bg-green-900 bg-green-50 text-green-500" },
    POST: { value: "POST", label: "POST", color: "dark:text-blue-400 dark:bg-blue-900 bg-blue-50 text-blue-500" },
    PUT: { value: "PUT", label: "PUT", color: "dark:text-yellow-400 dark:bg-yellow-900 bg-yellow-50 text-yellow-500" },
    DELETE: { value: "DELETE", label: "DELETE", color: "dark:text-red-400 dark:bg-red-900 bg-red-50 text-red-500" },
    PATCH: { value: "PATCH", label: "PATCH", color: "dark:text-yellow-400 dark:bg-yellow-900 bg-yellow-50 text-yellow-500" },
    HEAD: { value: "HEAD", label: "HEAD", color: "dark:text-blue-400 dark:bg-blue-900 bg-blue-50 text-blue-500" },
    OPTIONS: { value: "OPTIONS", label: "OPTIONS", color: "dark:text-purple-400 dark:bg-purple-900 bg-purple-50 text-purple-500" },
  }

  return (
    <div
      className={`p-4 dark:bg-gray-800 bg-white rounded-lg shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2
          className={`text-xl font-bold dark:text-white text-gray-900`}
        >
          Request Configuration
        </h2>
        <div className="flex items-center space-x-2">
          <TokenGenerator />
          {tokenExpiration !== null && (
            <div
              className={`px-3 py-1 rounded-md text-sm ${tokenExpiration > 5
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : tokenExpiration > 1
                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
            >
              Token expires in: {Math.floor(tokenExpiration)} minutes
            </div>
          )}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-32 px-3 py-2 rounded-md border-none text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${methodOptions[method as keyof typeof methodOptions].color}`}
          >
            {Object.values(methodOptions).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab("params")}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "params"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            Query Parameters
          </button>
          <button
            onClick={() => setActiveTab("headers")}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "headers"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            Headers
          </button>
          <button
            onClick={() => setActiveTab("body")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === "body"
              ? "border-blue-500 text-blue-600 dark:text-blue-400"
              : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
          >
            Body
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Query Parameters Tab */}
        {activeTab === "params" && (
          <div>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium dark:text-white text-gray-700`}
                >
                  Query Parameters
                </label>
                <div className="space-y-2">
                  {queryParams.map((param, index) => (
                    <div
                      key={`query-param-${index}`}
                      className={`flex items-center space-x-2 p-2 rounded-md dark:bg-gray-700 bg-gray-50`}
                    >
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) =>
                          updateQueryParam(index, "key", e.target.value)
                        }
                        placeholder="Key"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) =>
                          updateQueryParam(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) =>
                          updateQueryParam(index, "description", e.target.value)
                        }
                        placeholder="Description (optional)"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) =>
                            updateQueryParam(
                              index,
                              "required",
                              e.target.checked
                            )
                          }
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded dark:border-gray-600 dark:bg-gray-800 border-gray-300 bg-white`}
                        />
                        <span
                          className={`ml-2 text-sm dark:text-gray-400 text-gray-500`}
                        >
                          Required
                        </span>
                      </div>
                      <button
                        onClick={() => removeQueryParam(index)}
                        className={`p-2 dark:text-gray-400 text-gray-500 hover:text-gray-700`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addQueryParam()}
                  className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 dark:bg-blue-600 dark:text-white hover:bg-blue-700 bg-blue-100 text-blue-700 hover:bg-blue-200`}
                >
                  <FiPlus />
                  <span>Add Query Parameter</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === "headers" && (
          <div>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium dark:text-white text-gray-700`}
                >
                  Headers
                </label>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div
                      key={`header-${index}`}
                      className={`flex items-center space-x-2 p-2 rounded-md dark:bg-gray-700 bg-gray-50`}
                    >
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) =>
                          updateHeader(index, "key", e.target.value)
                        }
                        placeholder="Key"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) =>
                          updateHeader(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <input
                        type="text"
                        value={header.description}
                        onChange={(e) =>
                          updateHeader(index, "description", e.target.value)
                        }
                        placeholder="Description (optional)"
                        className={`block w-1/3 border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={header.required}
                          onChange={(e) =>
                            updateHeader(index, "required", e.target.checked)
                          }
                          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border rounded dark:border-gray-600 dark:bg-gray-800 border-gray-300 bg-white`}
                        />
                        <span
                          className={`ml-2 text-sm dark:text-gray-400 text-gray-500`}
                        >
                          Required
                        </span>
                      </div>
                      <button
                        onClick={() => removeHeader(index)}
                        className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 dark:bg-red-600 dark:text-white hover:bg-red-700 bg-red-100 text-red-700 hover:bg-red-200`}
                      >
                        <FiTrash2 />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => addHeader()}
                  className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 dark:bg-blue-600 dark:text-white hover:bg-blue-700 bg-blue-100 text-blue-700 hover:bg-blue-200`}
                >
                  <FiPlus />
                  <span>Add Header</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body Tab */}
        {activeTab === "body" && (
          <div>
            <div className="mb-4">
              <label
                className={`block text-sm font-medium dark:text-white text-gray-700 mb-2`}
              >
                Body Type
              </label>
              <select
                value={bodyType}
                onChange={(e) =>
                  setBodyType(e.target.value as "none" | "json" | "form" | "text")
                }
                className={`w-full md:w-1/3 rounded-md border shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
              >
                <option value="none">None</option>
                <option value="json">JSON</option>
                <option value="form">Form Data</option>
                <option value="text">Text</option>
              </select>
            </div>

            <div className="mt-4">{getBodyContent()}</div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium dark:text-white dark:bg-blue-600 hover:bg-blue-200 dark:hover:bg-blue-700 bg-blue-100 text-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue to YAML Generator
        </button>
      </div>
    </div >
  );
};

export default RequestConfig;
