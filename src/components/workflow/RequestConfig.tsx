import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { RequestConfigData, Header, QueryParam, FormDataField } from "../../types";
import { FiSettings, FiArrowRight } from "react-icons/fi";
import { Button } from "../ui";
import {
  HTTPMethodSelector,
  QueryParametersSection,
  RequestHeadersSection,
  RequestBodySection,
  TokenStatusDisplay
} from "./";
import {
  METHODS_WITH_BODY,
  TAB_CONFIG,
  DEFAULT_JSON_BODY,
  DEFAULT_FORM_DATA,
} from "../../constants/requestConfig";

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

const RequestConfig: React.FC = () => {

  const {
    requestConfig: savedConfig,
    setRequestConfig,
    activeSession,
    handleSaveSession,
    openUnifiedManager,
    handleRequestConfigSubmit
  } = useAppContext();


  const [activeTab, setActiveTab] = useState<RequestConfigState["activeTab"]>(
    () => {
      // Check if the method supports body and if there's body content
      const supportsBody = METHODS_WITH_BODY.includes(
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
    return DEFAULT_JSON_BODY;
  });

  const [formData, setFormData] = useState<FormDataField[]>(() => {
    if (activeSession?.requestConfig?.formData)
      return activeSession.requestConfig.formData;
    if (savedConfig?.formData) return savedConfig.formData;
    return DEFAULT_FORM_DATA;
  });

  const [textBody, setTextBody] = useState<string>("");

  // Function to check if HTTP method supports a body
  const methodSupportsBody = (httpMethod: string): boolean => {
    return METHODS_WITH_BODY.includes(httpMethod.toUpperCase());
  };

  // Effect to handle method changes and body tab visibility
  useEffect(() => {
    if (!methodSupportsBody(method)) {
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
          handleSaveSession(activeSession.name, updatedSession, true); // Prevent navigation for auto-save
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

  // Query Parameters handlers
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

  // Headers handlers
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

    handleRequestConfigSubmit(config);
  };

  // Check if there's an active session
  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="overflow-hidden relative p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500 rounded-full -translate-x-12 translate-y-12"></div>
          </div>

          <div className="flex relative items-center space-x-4">
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
        </div>

        {/* No Active Session Warning */}
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
              <FiSettings className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300">
              You need to create or select an active session before configuring request settings.
              Please go back to the URL Builder or Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="text-gray-700 dark:text-gray-300"
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                gradient
                onClick={() => {
                  openUnifiedManager('sessions');
                }}
                className="text-white"
              >
                Create Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden relative p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
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
            {/* Token Status Display */}
            <TokenStatusDisplay
              compact={false}
            />

            {/* HTTP Method Selector */}
            <HTTPMethodSelector
              selectedMethod={method}
              onMethodChange={setMethod}
              className="flex-shrink w-1/3 min-w-0"
              compact={false}
            />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Request Configuration</h3>
          <div className="flex items-center p-1 space-x-1 bg-gray-100 rounded-xl dark:bg-gray-700">
            {TAB_CONFIG.map((tab) => {
              const TabIcon = tab.icon;
              const isVisible = tab.id === "body" ? methodSupportsBody(method) : true;

              if (!isVisible) return null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as "params" | "headers" | "body")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === tab.id
                    ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <TabIcon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Query Parameters Tab */}
          {activeTab === "params" && (
            <QueryParametersSection
              queryParams={queryParams}
              onAdd={addQueryParam}
              onRemove={removeQueryParam}
              onUpdate={updateQueryParam}
            />
          )}

          {/* Headers Tab */}
          {activeTab === "headers" && (
            <RequestHeadersSection
              headers={headers}
              onAdd={addHeader}
              onRemove={removeHeader}
              onUpdate={updateHeader}
            />
          )}

          {/* Body Tab */}
          {activeTab === "body" && methodSupportsBody(method) && (
            <RequestBodySection
              bodyType={bodyType}
              jsonBody={jsonBody}
              formData={formData}
              textBody={textBody}
              onBodyTypeChange={setBodyType}
              onJsonBodyChange={setJsonBody}
              onFormDataChange={setFormData}
              onTextBodyChange={setTextBody}
            />
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          variant="primary"
          size="xl"
          icon={FiArrowRight}
          iconPosition="right"
          onClick={handleSubmit}
          className="text-white"
          gradient
        >
          Continue to YAML Generator
        </Button>
      </div>
    </div>
  );
};

export default RequestConfig;
