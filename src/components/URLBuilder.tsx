import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import { URLBuilderProps } from "../types/components/components.types";
import { URLData } from "../types/core/app.types";
import { FiTrash2, FiPlus } from "react-icons/fi";

interface Segment {
  value: string;
  isDynamic: boolean;
  paramName: string;
  description?: string;
  required?: boolean;
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
  const { isDarkMode } = useTheme();

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
      return activeSession.urlData.parsedSegments.map((segment) => ({
        value: segment.value || "",
        isDynamic: segment.isDynamic,
        paramName: segment.paramName || "",
        description: segment.description || "",
        required: segment.required || false,
      }));
    }
    if (urlData?.parsedSegments) {
      return urlData.parsedSegments.map((segment) => ({
        value: segment.value || "",
        isDynamic: segment.isDynamic,
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
            .map((segment) => {
              const isDynamic =
                segment.startsWith("{") && segment.endsWith("}");
              const paramName = isDynamic ? segment.slice(1, -1) : "";
              return {
                value: isDynamic ? "" : segment,
                isDynamic,
                paramName,
                description: "",
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
            .map((segment) => {
              const isDynamic =
                segment.startsWith("{") && segment.endsWith("}");
              const paramName = isDynamic ? segment.slice(1, -1) : "";
              return {
                value: isDynamic ? "" : segment,
                isDynamic,
                paramName,
                description: "",
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
  }, [segments, domain, protocol, builtUrl, sessionDescription]);

  // Effect to handle session changes
  useEffect(() => {
    if (activeSession?.urlData) {
      const sessionUrlData = activeSession.urlData;

      // Update protocol
      if (sessionUrlData.processedURL?.startsWith("https")) {
        setProtocol("https");
      } else {
        setProtocol("http");
      }

      // Update domain
      setDomain(sessionUrlData.baseURL || "{base_url}");

      // Update segments
      if (sessionUrlData.parsedSegments) {
        setSegments(sessionUrlData.parsedSegments);
      } else if (
        sessionUrlData.segments &&
        typeof sessionUrlData.segments === "string"
      ) {
        const parsedSegments = sessionUrlData.segments
          .split("/")
          .filter(Boolean)
          .map((segment) => {
            const isDynamic = segment.startsWith("{") && segment.endsWith("}");
            const paramName = isDynamic ? segment.slice(1, -1) : "";
            return {
              value: isDynamic ? "" : segment,
              isDynamic,
              paramName,
              description: "",
            };
          });
        setSegments(parsedSegments);
      }

      // Update built URL
      if (sessionUrlData.processedURL) {
        setBuiltUrl(sessionUrlData.processedURL);
      }

      // Update session description
      if (sessionUrlData.sessionDescription) {
        setSessionDescription(sessionUrlData.sessionDescription);
      }

      // Update environment
      if (sessionUrlData.environment) {
        setEnvironment(sessionUrlData.environment);
      }
    }
  }, [activeSession?.id]);

  const getVariableValue = useCallback(
    (paramName: string, environment: string): string | null => {
      // First try environment-specific variable in global variables
      const globalEnvVar = globalVariables?.[`${paramName}_${environment}`];
      if (globalEnvVar) return globalEnvVar;

      // Then try base variable in global variables
      const globalBaseVar = globalVariables?.[paramName];
      if (globalBaseVar) return globalBaseVar;

      // Then try environment-specific variable in segment variables
      const segmentEnvVar = segmentVariables?.[`${paramName}_${environment}`];
      if (segmentEnvVar) return segmentEnvVar;

      // Then try base variable in segment variables
      const segmentBaseVar = segmentVariables?.[paramName];
      if (segmentBaseVar) return segmentBaseVar;

      // Then try environment-specific variable in session variables
      const sessionEnvVar =
        activeSession?.sharedVariables?.[`${paramName}_${environment}`];
      if (sessionEnvVar) return sessionEnvVar;

      // Finally try base variable in session variables
      const sessionBaseVar = activeSession?.sharedVariables?.[paramName];
      if (sessionBaseVar) return sessionBaseVar;

      return null;
    },
    [globalVariables, segmentVariables, activeSession]
  );

  const handleSubmit = (): void => {
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

  return (
    <div
      className={`p-4 dark:bg-gray-800 bg-white rounded-lg shadow`}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label
              className={`block text-sm font-medium mb-1 dark:text-white text-gray-700`}
            >
              Protocol
            </label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-white border-gray-300 text-gray-900`}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div className="flex-1 ml-4">
            <label
              className={`block text-sm font-medium mb-1 dark:text-white text-gray-700`}
            >
              Domain
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
                }`}
            />
          </div>
          <div className="flex-1 ml-4">
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-700"
                }`}
            >
              Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
                }`}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-700"
              }`}
          >
            Session Description
          </label>
          <textarea
            value={sessionDescription}
            onChange={(e) => setSessionDescription(e.target.value)}
            placeholder="Enter a description for this API endpoint"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300 text-gray-900"
              }`}
            rows={3}
          />
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-white" : "text-gray-700"
              }`}
          >
            Path Segments
          </label>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-[30%]">
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
                      placeholder="Parameter name"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                        }`}
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
                      placeholder="Segment value"
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                        }`}
                    />
                  )}
                </div>
                <div className="w-[50%]">
                  <input
                    type="text"
                    value={segment.description || ""}
                    onChange={(e) => {
                      const newSegments = [...segments];
                      newSegments[index] = {
                        ...segment,
                        description: e.target.value
                      };
                      setSegments(newSegments);
                    }}
                    placeholder="Description"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                      }`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
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
                      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? "border-gray-600" : "border-gray-300"}`}
                    />
                    <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      Dynamic
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleSegmentRemove(index)}
                    className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                  >
                    <FiTrash2 />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => handleSegmentAdd()}
            className={`mt-2 px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
              }`}
          >
            <FiPlus />
            <span>Add Segment</span>
          </button>
        </div>

        <div
          className={`p-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"
            } rounded-md`}
        >
          <h3
            className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
              }`}
          >
            URL Preview
          </h3>
          <div
            className={`mt-2 p-2 ${isDarkMode
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-200"
              } rounded border`}
          >
            <code
              className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-900"
                }`}
            >
              {builtUrl}
            </code>
          </div>
          {segments.some((s) => s.isDynamic) && (
            <div className="mt-4">
              <h4
                className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-700"
                  }`}
              >
                Variable Values
              </h4>
              <ul className="mt-2 space-y-1">
                {segments
                  .filter((s) => s.isDynamic && s.paramName)
                  .map((segment, i) => {
                    const value =
                      getVariableValue(segment.paramName, environment) ||
                      "Not set";
                    return (
                      <li
                        key={i}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <span
                          className={`font-mono ${isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                        >
                          {segment.paramName}:
                        </span>
                        <span
                          className={
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }
                        >
                          {value}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className={`px-4 py-2 rounded-md dark:bg-blue-600 dark:text-white bg-blue-100 text-blue-700 hover:bg-blue-200 dark:hover:bg-blue-700`}
          >
            Continue to Request Configuration
          </button>
        </div>
      </form>
    </div>
  );
};

export default URLBuilder;
