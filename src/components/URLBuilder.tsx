import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import { URLBuilderProps } from "../types/components.types";
import { URLData } from "../types/app.types";

interface Segment {
  value: string;
  isDynamic: boolean;
  paramName: string;
  description?: string;
  required?: boolean;
}

interface EditingSegment extends Segment {
  index: number;
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
        paramName: segment.paramName,
        description: segment.description,
        required: segment.required,
      }));
    }
    if (urlData?.parsedSegments) {
      return urlData.parsedSegments.map((segment) => ({
        value: segment.value || "",
        isDynamic: segment.isDynamic,
        paramName: segment.paramName,
        description: segment.description,
        required: segment.required,
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
  const [editingSegment, setEditingSegment] = useState<EditingSegment | null>(
    null
  );
  const [showSegmentEditor, setShowSegmentEditor] = useState<boolean>(false);

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
    const newUrl = `${protocol}://${domain}${
      segments.length > 0
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

  const handleSegmentChange = (index: number, value: string) => {
    const newSegments = [...segments];
    newSegments[index] = {
      ...newSegments[index],
      value,
      isDynamic: value.startsWith("{") && value.endsWith("}"),
    };
    setSegments(newSegments);
  };

  const handleSegmentAdd = () => {
    setSegments([...segments, { value: "", isDynamic: false, paramName: "" }]);
  };

  const handleSegmentRemove = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    setSegments(newSegments);
  };

  const handleEditSegment = (segment: Segment, index: number) => {
    setEditingSegment({ ...segment, index });
    setShowSegmentEditor(true);
  };

  const handleSaveSegment = () => {
    if (editingSegment) {
      const updatedSegments = [...segments];
      updatedSegments[editingSegment.index] = {
        value: editingSegment.value,
        isDynamic: editingSegment.isDynamic,
        paramName: editingSegment.paramName,
        description: editingSegment.description,
      };
      setSegments(updatedSegments);
      setShowSegmentEditor(false);
      setEditingSegment(null);
    }
  };

  return (
    <>
      <div
        className={`p-4 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        } rounded-lg shadow`}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                Protocol
              </label>
              <select
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
              </select>
            </div>
            <div className="flex-1 ml-4">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                Domain
              </label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>
            <div className="flex-1 ml-4">
              <label
                className={`block text-sm font-medium mb-1 ${
                  isDarkMode ? "text-white" : "text-gray-700"
                }`}
              >
                Environment
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  isDarkMode
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
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-white" : "text-gray-700"
              }`}
            >
              Session Description
            </label>
            <textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder="Enter a description for this API endpoint"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              rows={3}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-white" : "text-gray-700"
              }`}
            >
              Path Segments
            </label>
            <div className="space-y-2">
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={
                      segment.isDynamic
                        ? `{${segment.paramName}}`
                        : segment.value
                    }
                    onChange={(e) => handleSegmentChange(index, e.target.value)}
                    placeholder="Segment"
                    className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                    disabled={segment.isDynamic}
                  />
                  <button
                    type="button"
                    onClick={() => handleEditSegment(segment, index)}
                    className={`px-3 py-1 rounded-md ${
                      segment.isDynamic
                        ? "bg-purple-600 text-white hover:bg-purple-700"
                        : isDarkMode
                        ? "bg-gray-700 text-white hover:bg-gray-600"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSegmentRemove(index)}
                    className="px-3 py-2 text-white bg-red-600 rounded-md hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSegmentAdd}
              className={`mt-2 px-3 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Add Segment
            </button>
          </div>

          <div
            className={`p-4 ${
              isDarkMode ? "bg-gray-700" : "bg-gray-50"
            } rounded-md`}
          >
            <h3
              className={`text-sm font-medium ${
                isDarkMode ? "text-white" : "text-gray-700"
              }`}
            >
              URL Preview
            </h3>
            <div
              className={`mt-2 p-2 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-600"
                  : "bg-white border-gray-200"
              } rounded border`}
            >
              <code
                className={`text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-900"
                }`}
              >
                {builtUrl}
              </code>
            </div>
            {segments.some((s) => s.isDynamic) && (
              <div className="mt-4">
                <h4
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-white" : "text-gray-700"
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
                            className={`font-mono ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
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
              className={`px-4 py-2 rounded-md ${
                isDarkMode
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Continue to Request Configuration
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={showSegmentEditor}
        onClose={() => {
          setShowSegmentEditor(false);
          setEditingSegment(null);
        }}
        onSave={handleSaveSegment}
        title="Edit Segment"
      >
        {editingSegment && (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={editingSegment.isDynamic}
                onChange={(e) =>
                  setEditingSegment({
                    ...editingSegment,
                    isDynamic: e.target.checked,
                  })
                }
                className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${
                  isDarkMode ? "border-gray-600" : "border-gray-300"
                }`}
              />
              <label
                className={`ml-2 block text-sm ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Dynamic Segment
              </label>
            </div>
            {editingSegment.isDynamic ? (
              <div>
                <label
                  className={`block text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Parameter Name
                </label>
                <input
                  type="text"
                  value={editingSegment.paramName}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      paramName: e.target.value,
                    })
                  }
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            ) : (
              <div>
                <label
                  className={`block text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Value
                </label>
                <input
                  type="text"
                  value={editingSegment.value}
                  onChange={(e) =>
                    setEditingSegment({
                      ...editingSegment,
                      value: e.target.value,
                    })
                  }
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            )}
            <div>
              <label
                className={`block text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description
              </label>
              <textarea
                value={editingSegment.description}
                onChange={(e) =>
                  setEditingSegment({
                    ...editingSegment,
                    description: e.target.value,
                  })
                }
                rows={3}
                className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default URLBuilder;
