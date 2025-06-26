import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";
import Editor, { OnMount } from "@monaco-editor/react";
import TokenGenerator from "../utils/TokenGenerator";
import { RequestConfigProps } from "../../types/components/components.types";
import { RequestConfigData, Header, QueryParam, FormDataField, AppContextType, ThemeContextType } from "../../types";
import { editor } from "monaco-editor";
import {
  FiPlus,
  FiTrash2,
  FiSettings,
  FiCode,
  FiHash,
  FiFileText,
  FiArrowRight,
  FiClock,
  FiShield,
  FiZap,
  FiGlobe,
  FiDatabase,
  FiLayers
} from "react-icons/fi";
import Modal from "../core/Modal";

interface RequestConfigState {
  method: string;
  headers: Header[];
  queryParams: QueryParam[];
  bodyType: "none" | "json" | "form" | "text";
  jsonBody: string;
  formData: FormDataField[];
  textBody: string;
  activeTab: "params" | "headers" | "body";
}

const RequestConfig: React.FC<RequestConfigProps> = ({ onSubmit }) => {
  const { isDarkMode } = useTheme() as ThemeContextType;
  const {
    requestConfig: savedConfig,
    setRequestConfig,
    globalVariables,
    activeSession,
    handleSaveSession,
    methodColor,
  } = useAppContext() as AppContextType;
  const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<RequestConfigState["activeTab"]>(
    () => {
      // Check if the method supports body and if there's body content
      const supportsBody = ["POST", "PUT", "PATCH"].includes(
        (activeSession?.requestConfig?.method || savedConfig?.method || "GET").toUpperCase()
      );

      if (supportsBody) {
        if (activeSession?.requestConfig?.bodyType === "json") return "body";
        if (activeSession?.requestConfig?.bodyType === "form") return "body";
        if (activeSession?.requestConfig?.bodyType === "text") return "body";
        if (savedConfig?.bodyType === "json") return "body";
        if (savedConfig?.bodyType === "form") return "body";
        if (savedConfig?.bodyType === "text") return "body";
      }
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

  const [showTokenModal, setShowTokenModal] = useState(false);
  const [decodedToken, setDecodedToken] = useState<any>(null);

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

  // Function to check if HTTP method supports a body
  const methodSupportsBody = (httpMethod: string): boolean => {
    const methodsWithBody = ["POST", "PUT", "PATCH"];
    return methodsWithBody.includes(httpMethod.toUpperCase());
  };

  // Effect to handle method changes and body tab visibility
  useEffect(() => {
    if (!methodSupportsBody(method)) {
      // If current method doesn't support body, reset body type and switch tab if needed
      if (bodyType !== "none") {
        setBodyType("none");
      }
      if (activeTab === "body") {
        setActiveTab("params");
      }
    }
  }, [method, bodyType, activeTab]);

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
  }, [
    method,
    queryParams,
    headers,
    bodyType,
    jsonBody,
    formData,
    textBody,
    savedConfig,
    setRequestConfig,
    activeSession,
    handleSaveSession,
  ]);

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
    const newQueryParams = [...queryParams];
    const currentParam = newQueryParams[index];
    if (!currentParam) return;
    newQueryParams[index] = {
      key: currentParam.key,
      value: currentParam.value,
      description: currentParam.description || "",
      required: currentParam.required || false,
      [field]: value,
    };
    setQueryParams(newQueryParams);
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
    const newHeaders = [...headers];
    const currentHeader = newHeaders[index];
    if (!currentHeader) return;
    newHeaders[index] = {
      key: currentHeader.key,
      value: currentHeader.value,
      description: currentHeader.description || "",
      required: currentHeader.required || false,
      in: currentHeader.in,
      [field]: value,
    };
    setHeaders(newHeaders);
  };

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const handleEditorChange = (value: string | undefined): void => {
    setJsonBody(value || "");
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
    const newFormData = [...formData];
    const currentField = newFormData[index];
    if (!currentField) return;
    newFormData[index] = {
      key: currentField.key,
      value: currentField.value,
      type: currentField.type,
      required: currentField.required,
      [field]: value,
    };
    setFormData(newFormData);
  };

  const handleJsonEditorMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = jsonEditorHeight;

    function onMouseMove(e: MouseEvent): void {
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(100, Math.min(500, startHeight + deltaY));
      setJsonEditorHeight(newHeight);
    }

    function onMouseUp(): void {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const getBodyContent = (): React.ReactElement => {
    switch (bodyType) {
      case "json":
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                  <FiCode className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">JSON Body</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    try {
                      const formatted = JSON.stringify(JSON.parse(jsonBody), null, 2);
                      setJsonBody(formatted);
                    } catch (e) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="px-3 py-1 text-xs font-medium text-purple-600 bg-purple-100 rounded-lg transition-all duration-200 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
                >
                  Format JSON
                </button>
              </div>
            </div>
            <div
              ref={jsonEditorContainerRef}
              className="overflow-hidden relative rounded-xl border border-gray-200 shadow-sm dark:border-gray-600"
              style={{ height: `${jsonEditorHeight}px` }}
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
                className="absolute right-0 bottom-0 left-0 h-2 bg-gradient-to-r from-gray-200 to-gray-300 transition-all duration-200 dark:from-gray-600 dark:to-gray-700 cursor-ns-resize hover:from-gray-300 hover:to-gray-400 dark:hover:from-gray-500 dark:hover:to-gray-600"
                onMouseDown={handleJsonEditorMouseDown}
              />
            </div>
          </div>
        );
      case "form":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                <FiDatabase className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Form Data</span>
            </div>
            <div className="space-y-3">
              {formData.map((field, index) => (
                <div
                  key={`form-field-${index}`}
                  className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm dark:from-gray-700 dark:to-gray-800 dark:border-gray-600"
                >
                  <div className="grid gap-4 items-center md:grid-cols-12">
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={field.key}
                        onChange={(e) =>
                          updateFormDataField(index, "key", e.target.value)
                        }
                        placeholder="Field name"
                        className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <input
                        type="text"
                        value={field.value}
                        onChange={(e) =>
                          updateFormDataField(index, "value", e.target.value)
                        }
                        placeholder="Field value"
                        className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) =>
                            updateFormDataField(index, "required", e.target.checked)
                          }
                          className="w-4 h-4 text-green-600 bg-white rounded border-gray-300 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800"
                        />
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Required</span>
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <button
                        onClick={() => removeFormDataField(index)}
                        className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 group dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 hover:scale-105"
                        title="Remove field"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={addFormDataField}
              className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Form Field</span>
            </button>
          </div>
        );
      case "text":
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                <FiFileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Text Body</span>
            </div>
            <textarea
              value={textBody}
              onChange={(e) => setTextBody(e.target.value)}
              placeholder="Enter your text body content here..."
              className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={8}
            />
          </div>
        );
      case "none":
      default:
        return (
          <div className="p-8 text-center bg-gray-50 rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600 dark:bg-gray-700">
            <FiLayers className="mx-auto mb-4 w-12 h-12 text-gray-400" />
            <p className="mb-2 text-gray-500 dark:text-gray-400">No body content for this request</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">This HTTP method doesn't support a request body</p>
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

  const handleShowTokenModal = () => {
    const tokenName = globalVariables ? globalVariables["tokenName"] : undefined;
    const tokenValue = tokenName ? globalVariables[tokenName] : undefined;
    if (typeof tokenValue === "string" && tokenValue.split(".").length === 3) {
      try {
        const base64Url = tokenValue.split(".")[1];
        if (!base64Url) {
          setDecodedToken({ error: "Invalid token format" });
        } else {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split("")
              .map(function (c) {
                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
              })
              .join("")
          );
          setDecodedToken(JSON.parse(jsonPayload));
        }
      } catch (e) {
        setDecodedToken({ error: "Invalid token format" });
      }
    } else {
      setDecodedToken({ error: "No valid token found in global variables." });
    }
    setShowTokenModal(true);
  };

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
              <FiSettings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Request Configuration
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Configure HTTP method, headers, parameters, and request body
              </p>
            </div>
          </div>

          <div className="flex justify-end items-center space-x-3 w-8/12">
            <TokenGenerator />
            <button
              type="button"
              onClick={handleShowTokenModal}
              className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
              title="Token Details"
            >
              <FiShield className="w-4 h-4" />
              <span>Token Details</span>
            </button>
            {tokenExpiration !== null && (
              <div className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 ${tokenExpiration > 5
                ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                : tokenExpiration > 1
                  ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                }`}
              >
                <FiClock className="w-4 h-4" />
                <span>{Math.floor(tokenExpiration)}m</span>
              </div>
            )}
            {/* Expert HTTP Method Selector */}
            <div className="flex-shrink p-4 w-1/3 min-w-0 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                    <FiZap className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">HTTP Method</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Select method</div>
              </div>

              {/* Scrollable Method Container */}
              <div className="relative w-full group">
                {/* Left Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const container = document.getElementById('http-methods-scroll');
                    if (container) {
                      container.scrollBy({ left: -200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:shadow-xl"
                  title="Scroll left"
                >
                  <FiArrowRight className="w-3 h-3 text-gray-600 rotate-180 dark:text-gray-300" />
                </button>

                {/* Right Arrow */}
                <button
                  type="button"
                  onClick={() => {
                    const container = document.getElementById('http-methods-scroll');
                    if (container) {
                      container.scrollBy({ left: 200, behavior: 'smooth' });
                    }
                  }}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:shadow-xl"
                  title="Scroll right"
                >
                  <FiArrowRight className="w-3 h-3 text-gray-600 dark:text-gray-300" />
                </button>

                {/* Scrollable Content */}
                <div
                  id="http-methods-scroll"
                  className="flex overflow-x-auto items-center px-6 space-x-2 w-full scrollbar-hide scroll-smooth"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {Object.values(methodColor).map((option: any) => {
                    const isSelected = method === option.value;
                    // Map method to icon
                    const methodIcons: Record<string, string> = {
                      GET: '🔍',
                      POST: '➕',
                      PUT: '♻️',
                      PATCH: '🩹',
                      DELETE: '🗑️',
                      HEAD: '🧠',
                      OPTIONS: '⚙️',
                    };
                    const icon = methodIcons[option.value] || '🔗';
                    return (
                      <button
                        key={option.value}
                        onClick={() => setMethod(option.value)}
                        className={`relative px-3 py-2 rounded-lg font-semibold text-sm transition-all duration-300 transform hover:scale-105 group overflow-hidden flex-shrink-0 ${isSelected
                          ? `${option.color} shadow-lg shadow-opacity-25`
                          : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                          }`}
                      >
                        <div className={`absolute inset-0 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                          }`}>
                          <div className="absolute top-0 right-0 w-8 h-8 bg-current rounded-full opacity-20 translate-x-4 -translate-y-4"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 bg-current rounded-full opacity-20 -translate-x-3 translate-y-3"></div>
                        </div>
                        <span className="flex relative z-10 items-center space-x-1">
                          <span className="text-lg">{icon}</span>
                          <span>{option.label}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Scroll Indicator */}
                <div className="flex justify-center mt-2 space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                  <div className="w-1.5 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Configuration</h3>
          <div className="flex items-center p-1 space-x-1 bg-gray-100 rounded-xl dark:bg-gray-700">
            <button
              onClick={() => setActiveTab("params")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === "params"
                ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <FiHash className="w-4 h-4" />
              <span>Parameters</span>
            </button>
            <button
              onClick={() => setActiveTab("headers")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === "headers"
                ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              <FiGlobe className="w-4 h-4" />
              <span>Headers</span>
            </button>
            {methodSupportsBody(method) && (
              <button
                onClick={() => setActiveTab("body")}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === "body"
                  ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
              >
                <FiZap className="w-4 h-4" />
                <span>Body</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Query Parameters Tab */}
          {activeTab === "params" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                    <FiHash className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Query Parameters</span>
                </div>
                <button
                  onClick={addQueryParam}
                  className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Parameter</span>
                </button>
              </div>

              {queryParams.length === 0 ? (
                <div className="p-8 text-center rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600">
                  <FiHash className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="mb-4 text-gray-500 dark:text-gray-400">No query parameters added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add parameters to include in your request URL</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queryParams.map((param, index) => (
                    <div
                      key={`query-param-${index}`}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm dark:from-gray-700 dark:to-gray-800 dark:border-gray-600"
                    >
                      <div className="grid gap-4 items-center md:grid-cols-12">
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={param.key}
                            onChange={(e) =>
                              updateQueryParam(index, "key", e.target.value)
                            }
                            placeholder="Parameter name"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={param.value}
                            onChange={(e) =>
                              updateQueryParam(index, "value", e.target.value)
                            }
                            placeholder="Parameter value"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={param.description}
                            onChange={(e) =>
                              updateQueryParam(index, "description", e.target.value)
                            }
                            placeholder="Description (optional)"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={param.required}
                              onChange={(e) =>
                                updateQueryParam(index, "required", e.target.checked)
                              }
                              className="w-4 h-4 text-orange-600 bg-white rounded border-gray-300 focus:ring-orange-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Required</span>
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <button
                            onClick={() => removeQueryParam(index)}
                            className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 group dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 hover:scale-105"
                            title="Remove parameter"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Headers Tab */}
          {activeTab === "headers" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <FiGlobe className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Headers</span>
                </div>
                <button
                  onClick={addHeader}
                  className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add Header</span>
                </button>
              </div>

              {headers.length === 0 ? (
                <div className="p-8 text-center rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600">
                  <FiGlobe className="mx-auto mb-4 w-12 h-12 text-gray-400" />
                  <p className="mb-4 text-gray-500 dark:text-gray-400">No headers added yet</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">Add headers to include in your request</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {headers.map((header, index) => (
                    <div
                      key={`header-${index}`}
                      className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 shadow-sm dark:from-gray-700 dark:to-gray-800 dark:border-gray-600"
                    >
                      <div className="grid gap-4 items-center md:grid-cols-12">
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={header.key}
                            onChange={(e) =>
                              updateHeader(index, "key", e.target.value)
                            }
                            placeholder="Header name"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={header.value}
                            onChange={(e) =>
                              updateHeader(index, "value", e.target.value)
                            }
                            placeholder="Header value"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-3">
                          <input
                            type="text"
                            value={header.description}
                            onChange={(e) =>
                              updateHeader(index, "description", e.target.value)
                            }
                            placeholder="Description (optional)"
                            className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={header.required}
                              onChange={(e) =>
                                updateHeader(index, "required", e.target.checked)
                              }
                              className="w-4 h-4 text-blue-600 bg-white rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                            />
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">Required</span>
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <button
                            onClick={() => removeHeader(index)}
                            className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 group dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 hover:scale-105"
                            title="Remove header"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Body Tab */}
          {activeTab === "body" && methodSupportsBody(method) && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                    <FiZap className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Body</span>
                </div>
                {/* Modern Dataset Tab Interface for Body Type */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    {
                      id: 'none',
                      label: 'None',
                      description: 'No body',
                      icon: '🚫',
                      color: 'gray'
                    },
                    {
                      id: 'json',
                      label: 'JSON',
                      description: 'JSON data',
                      icon: '🔧',
                      color: 'purple'
                    },
                    {
                      id: 'form',
                      label: 'Form Data',
                      description: 'Form fields',
                      icon: '📝',
                      color: 'green'
                    },
                    {
                      id: 'text',
                      label: 'Text',
                      description: 'Plain text',
                      icon: '📄',
                      color: 'blue'
                    }
                  ].map((option) => {
                    const isSelected = bodyType === option.id;
                    const colorClasses = {
                      gray: {
                        selected: isDarkMode
                          ? "bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/25"
                          : "bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/25",
                        unselected: isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                      },
                      purple: {
                        selected: isDarkMode
                          ? "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25"
                          : "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25",
                        unselected: isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-purple-500"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300"
                      },
                      green: {
                        selected: isDarkMode
                          ? "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25"
                          : "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25",
                        unselected: isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-green-500"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300"
                      },
                      blue: {
                        selected: isDarkMode
                          ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25"
                          : "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
                        unselected: isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-blue-500"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300"
                      }
                    };

                    return (
                      <button
                        key={option.id}
                        onClick={() => setBodyType(option.id as "none" | "json" | "form" | "text")}
                        className={`relative p-3 rounded-lg border-2 transition-all duration-300 transform hover:scale-105 group overflow-hidden ${isSelected
                          ? colorClasses[option.color as keyof typeof colorClasses].selected
                          : colorClasses[option.color as keyof typeof colorClasses].unselected
                          }`}
                      >
                        {/* Background Pattern */}
                        <div className={`absolute inset-0 opacity-5 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                          }`}>
                          <div className={`absolute top-0 right-0 w-8 h-8 rounded-full translate-x-4 -translate-y-4 ${option.color === 'gray' ? 'bg-gray-500' :
                            option.color === 'purple' ? 'bg-purple-500' :
                              option.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                            }`}></div>
                          <div className={`absolute bottom-0 left-0 w-6 h-6 rounded-full -translate-x-3 translate-y-3 ${option.color === 'gray' ? 'bg-gray-400' :
                            option.color === 'purple' ? 'bg-purple-400' :
                              option.color === 'green' ? 'bg-green-400' : 'bg-blue-400'
                            }`}></div>
                        </div>

                        <div className="flex relative z-10 flex-col items-center space-y-1 text-center">
                          <div className={`text-lg transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'
                            }`}>
                            {option.icon}
                          </div>
                          <div>
                            <h4 className={`font-semibold text-xs ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                              }`}>
                              {option.label}
                            </h4>
                            <p className={`text-xs ${isSelected
                              ? 'text-gray-100 dark:text-gray-200'
                              : 'text-gray-500 dark:text-gray-400'
                              }`}>
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${option.color === 'gray' ? 'bg-gray-200' :
                            option.color === 'purple' ? 'bg-purple-200' :
                              option.color === 'green' ? 'bg-green-200' : 'bg-blue-200'
                            } flex items-center justify-center`}>
                            <div className={`w-1 h-1 rounded-full ${option.color === 'gray' ? 'bg-gray-600' :
                              option.color === 'purple' ? 'bg-purple-600' :
                                option.color === 'green' ? 'bg-green-600' : 'bg-blue-600'
                              }`}></div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                {getBodyContent()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          className="flex items-center px-8 py-4 space-x-2 font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
        >
          <span>Continue to YAML Generator</span>
          <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </button>
      </div>

      <Modal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        title="Decoded Token"
        showSaveButton={false}
        size="lg"
      >
        {decodedToken ? (
          decodedToken.error ? (
            <div className="p-4 font-semibold text-center text-red-600 dark:text-red-400">{decodedToken.error}</div>
          ) : (
            <pre className="overflow-x-auto p-4 text-xs text-left bg-gray-100 rounded dark:bg-gray-900">
              {JSON.stringify(decodedToken, null, 2)}
            </pre>
          )
        ) : (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">No token decoded.</div>
        )}
      </Modal>
    </div>
  );
};

export default RequestConfig;
