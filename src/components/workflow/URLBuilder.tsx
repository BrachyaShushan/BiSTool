import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { URLBuilderProps } from "../../types/components/components.types";
import { URLData } from "../../types/core/app.types";
import { FiPlus, FiTrash2, FiGlobe, FiLink, FiCopy, FiCheck, FiSettings, FiEye, FiEyeOff, FiArrowRight, FiInfo } from "react-icons/fi";

// Define Segment interface based on the parsedSegments type in URLData
interface Segment {
  value: string;
  isDynamic: boolean;
  paramName: string;
  description: string;
  required: boolean;
}

const URLBuilder: React.FC<URLBuilderProps> = ({ onSubmit }) => {
  const {
    urlData,
    setUrlData,
    globalVariables,
    segmentVariables,
    activeSession,
    handleSaveSession,
  } = useAppContext();

  const [protocol, setProtocol] = useState<string>(() => {
    if (activeSession?.urlData?.processedURL?.startsWith("https"))
      return "https";
    if (urlData?.processedURL?.startsWith("https")) return "https";
    return "http";
  });

  const [domain, setDomain] = useState<string>(() => {
    if (activeSession?.urlData?.baseURL) return activeSession.urlData.baseURL;
    if (urlData?.baseURL) return urlData.baseURL;
    return "{base_url}";
  });

  const [segments, setSegments] = useState<Segment[]>(() => {
    if (activeSession?.urlData?.parsedSegments) {
      return activeSession.urlData.parsedSegments.map((segment: any) => ({
        value: segment.value || "",
        isDynamic: segment.isDynamic || false,
        paramName: segment.paramName || "",
        description: segment.description || "",
        required: segment.required || false,
      }));
    }
    if (urlData?.parsedSegments) {
      return urlData.parsedSegments.map((segment: any) => ({
        value: segment.value || "",
        isDynamic: segment.isDynamic || false,
        paramName: segment.paramName || "",
        description: segment.description || "",
        required: segment.required || false,
      }));
    }
    return [];
  });

  const [builtUrl, setBuiltUrl] = useState<string>(() => {
    if (activeSession?.urlData?.processedURL)
      return activeSession.urlData.processedURL;
    if (urlData?.processedURL) return urlData.processedURL;
    return "";
  });

  const [sessionDescription, setSessionDescription] = useState<string>(() => {
    if (activeSession?.urlData?.sessionDescription)
      return activeSession.urlData.sessionDescription;
    if (urlData?.sessionDescription) return urlData.sessionDescription;
    return "";
  });

  const [environment, setEnvironment] = useState<string>("development");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const initialLoadDone = useRef(false);

  // Effect to handle initial load and session changes
  useEffect(() => {
    const initializeState = () => {
      if (activeSession?.urlData) {
        const sessionUrlData = activeSession.urlData;
        let parsedSegments: Segment[] = [];
        if (
          typeof sessionUrlData.segments === "string" &&
          sessionUrlData.segments.trim()
        ) {
          parsedSegments = sessionUrlData.segments
            .split("/")
            .filter(Boolean)
            .map((segment: string) => {
              const isDynamic =
                segment.startsWith("{") && segment.endsWith("}");
              const paramName = isDynamic ? segment.slice(1, -1) : "";
              return {
                value: isDynamic ? "" : segment,
                isDynamic,
                paramName,
                description: "",
                required: false,
              };
            });
        }
        setSegments(parsedSegments);
        setDomain(sessionUrlData.baseURL || "{base_url}");
        setProtocol(
          sessionUrlData.processedURL?.startsWith("https") ? "https" : "http"
        );
      } else if (urlData) {
        let parsedSegments: Segment[] = [];
        if (typeof urlData.segments === "string" && urlData.segments.trim()) {
          parsedSegments = urlData.segments
            .split("/")
            .filter(Boolean)
            .map((segment: string) => {
              const isDynamic =
                segment.startsWith("{") && segment.endsWith("}");
              const paramName = isDynamic ? segment.slice(1, -1) : "";
              return {
                value: isDynamic ? "" : segment,
                isDynamic,
                paramName,
                description: "",
                required: false,
              };
            });
        }
        setSegments(parsedSegments);
        setDomain(urlData.baseURL || "{base_url}");
        setProtocol(
          urlData.processedURL?.startsWith("https") ? "https" : "http"
        );
      }
    };

    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      initializeState();
    }
  }, [urlData, activeSession]);

  // Reset initialLoadDone when session changes
  useEffect(() => {
    initialLoadDone.current = false;
  }, [activeSession?.id]);

  // Effect to update builtUrl when segments, domain, or protocol changes
  useEffect(() => {
    const newUrl = `${protocol}://${domain}${segments.length > 0
      ? "/" +
      segments
        .map((segment) =>
          segment.isDynamic && segment.paramName
            ? `{${segment.paramName}}`
            : segment.value
        )
        .join("/")
      : ""
      }`;
    setBuiltUrl(newUrl);
  }, [segments, domain, protocol]);

  // Effect to update context and save session when local state changes
  useEffect(() => {
    if (!segments.length && !domain) return;

    const segmentsString = segments
      .map((segment) =>
        segment.isDynamic ? `{${segment.paramName}}` : segment.value
      )
      .join("/");

    const segmentVarsList = segments
      .filter((segment) => segment.isDynamic)
      .map((segment) => ({
        key: segment.paramName,
        value: segment.value,
      }));

    const newUrlData: URLData = {
      baseURL: domain,
      segments: segmentsString,
      parsedSegments: segments,
      queryParams: urlData?.queryParams || [],
      segmentVariables: segmentVarsList,
      processedURL: builtUrl,
      sessionDescription: sessionDescription,
      domain: domain,
      protocol: protocol,
      builtUrl: builtUrl,
      environment: environment,
    };

    // Always update the context
    setUrlData(newUrlData);

    // Save to active session if exists
    if (activeSession) {
      const updatedSession = {
        ...activeSession,
        urlData: newUrlData,
      };
      handleSaveSession(activeSession.name, updatedSession);
    }
  }, [
    segments,
    domain,
    protocol,
    builtUrl,
    sessionDescription,
    environment,
    activeSession?.name, // Only depend on the session name, not the entire object
  ]);

  const getVariableValue = useCallback(
    (paramName: string, env: string) => {
      // Check global variables first
      if (globalVariables[paramName]) {
        return globalVariables[paramName];
      }

      // Check segment variables (as object)
      if (segmentVariables && segmentVariables[paramName]) {
        return segmentVariables[paramName];
      }

      // Check environment-specific variables
      const envVar = globalVariables[`${paramName}_${env}`];
      if (envVar) {
        return envVar;
      }

      return null;
    },
    [globalVariables, segmentVariables]
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const segmentsString = segments
      .map((segment) =>
        segment.isDynamic ? `{${segment.paramName}}` : segment.value
      )
      .join("/");

    const segmentVarsList = segments
      .filter((segment) => segment.isDynamic)
      .map((segment) => ({
        key: segment.paramName,
        value: segment.value,
      }));

    const newUrlData: URLData = {
      baseURL: domain,
      segments: segmentsString,
      parsedSegments: segments,
      queryParams: urlData?.queryParams || [],
      segmentVariables: segmentVarsList,
      processedURL: builtUrl,
      sessionDescription: sessionDescription,
      domain: domain,
      protocol: protocol,
      builtUrl: builtUrl,
      environment: environment,
    };

    onSubmit(newUrlData);
  };

  const handleSegmentAdd = () => {
    setSegments([...segments, { value: "", isDynamic: false, paramName: "", description: "", required: false }]);
  };

  const handleSegmentRemove = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden relative p-6 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
            <FiGlobe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              URL Builder
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Construct dynamic URLs with variables and path segments
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Configuration Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center mb-6 space-x-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
              <FiSettings className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuration</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Protocol */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
            </div>

            {/* Domain */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com or {base_url}"
                className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Environment */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="development">Development</option>
                <option value="staging">Staging</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>

          {/* Session Description */}
          <div className="mt-6">
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Session Description
            </label>
            <textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder="Enter a description for this API endpoint..."
              className="px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
        </div>

        {/* Path Segments Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                <FiLink className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Path Segments</h3>
            </div>
            <button
              type="button"
              onClick={handleSegmentAdd}
              className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
            >
              <FiPlus className="w-4 h-4" />
              <span>Add Segment</span>
            </button>
          </div>

          {segments.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600">
              <FiLink className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <p className="mb-4 text-gray-500 dark:text-gray-400">No path segments added yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">Add segments to build your URL path</p>
            </div>
          ) : (
            <div className="space-y-4">
              {segments.map((segment, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                  <div className="grid gap-4 items-center md:grid-cols-12">
                    {/* Segment Type Toggle */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={segment.isDynamic}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index] = {
                              ...segment,
                              isDynamic: e.target.checked,
                              value: e.target.checked ? "" : segment.value,
                              paramName: e.target.checked ? segment.paramName : ""
                            };
                            setSegments(newSegments);
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 rounded border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {segment.isDynamic ? "Variable" : "Static"}
                        </span>
                      </div>
                    </div>

                    {/* Segment Value/Parameter Name */}
                    <div className="md:col-span-4">
                      {segment.isDynamic ? (
                        <input
                          type="text"
                          value={segment.paramName}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index] = {
                              ...segment,
                              paramName: e.target.value
                            };
                            setSegments(newSegments);
                          }}
                          placeholder="Variable name (e.g., user_id)"
                          className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <input
                          type="text"
                          value={segment.value}
                          onChange={(e) => {
                            const newSegments = [...segments];
                            newSegments[index] = {
                              ...segment,
                              value: e.target.value
                            };
                            setSegments(newSegments);
                          }}
                          placeholder="Segment value (e.g., api)"
                          className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={segment.description ?? ""}
                        onChange={(e) => {
                          const newSegments = [...segments];
                          newSegments[index] = {
                            ...segment,
                            description: e.target.value
                          };
                          setSegments(newSegments);
                        }}
                        placeholder="Description (optional)"
                        className="px-3 py-2 w-full text-gray-900 bg-white rounded-lg border border-gray-300 transition-all duration-200 dark:bg-gray-600 dark:text-white dark:border-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleSegmentRemove(index)}
                        className="p-2 text-red-600 bg-red-100 rounded-lg transition-all duration-200 group dark:bg-red-900 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 hover:scale-105"
                        title="Remove segment"
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

        {/* URL Preview Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                <FiEye className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">URL Preview</h3>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                title={showPreview ? "Hide preview" : "Show preview"}
              >
                {showPreview ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={copyToClipboard}
                className="p-2 text-gray-600 rounded-lg transition-all duration-200 group dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900"
                title="Copy URL"
              >
                {copiedUrl ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showPreview && (
            <div className="space-y-4">
              {/* Generated URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Generated URL</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Click to copy</span>
                </div>
                <div
                  onClick={copyToClipboard}
                  className="p-3 bg-white rounded-lg border border-gray-200 transition-all duration-200 cursor-pointer dark:bg-gray-600 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-500"
                >
                  <code className="text-sm text-gray-900 break-all dark:text-gray-100">
                    {builtUrl}
                  </code>
                </div>
              </div>

              {/* Variable Values */}
              {segments.some((s) => s.isDynamic) && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                  <div className="flex items-center mb-3 space-x-2">
                    <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">Variable Values</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {segments
                      .filter((s) => s.isDynamic && s.paramName)
                      .map((segment, i) => {
                        const value = getVariableValue(segment.paramName, environment) || "Not set";
                        return (
                          <div key={i} className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                            <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                              {segment.paramName}:
                            </span>
                            <span className={`text-sm px-2 py-1 rounded ${value === "Not set"
                              ? "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300"
                              : "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300"
                              }`}>
                              {value}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-8 py-4 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
          >
            <span>Continue to Request Configuration</span>
            <FiArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default URLBuilder;
