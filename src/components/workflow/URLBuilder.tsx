import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAppContext } from "../../context/AppContext";
import { URLBuilderProps } from "../../types/components/components.types";
import { URLData } from "../../types/core/app.types";
import { FiPlus, FiTrash2, FiCopy, FiCheck, FiEyeOff, FiArrowRight, FiInfo } from "react-icons/fi";
import {
  Button,
  Input,
  IconButton,
  Textarea
} from "../ui";
import {
  PROTOCOL_OPTIONS,
  ENVIRONMENT_OPTIONS,
  SECTION_CONFIG,
  DEFAULT_VALUES,
  COPY_TIMEOUT,
  VARIABLE_STATUS_STYLES,
  BUTTON_VARIANTS,
  INPUT_PLACEHOLDERS,
  LABELS
} from "../../constants/urlBuilder";

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
    openSessionManager,
  } = useAppContext();

  const [protocol, setProtocol] = useState<string>(() => {
    if (activeSession?.urlData?.processedURL?.startsWith("https"))
      return "https";
    if (urlData?.processedURL?.startsWith("https")) return "https";
    return DEFAULT_VALUES.protocol;
  });

  const [domain, setDomain] = useState<string>(() => {
    if (activeSession?.urlData?.baseURL) return activeSession.urlData.baseURL;
    if (urlData?.baseURL) return urlData.baseURL;
    return DEFAULT_VALUES.domain;
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
    return DEFAULT_VALUES.segments;
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
    return DEFAULT_VALUES.sessionDescription;
  });

  const [environment, setEnvironment] = useState<string>(DEFAULT_VALUES.environment);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const initialLoadDone = useRef(false);

  // Check if there's an active session
  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className={`overflow-hidden relative p-6 bg-gradient-to-r ${SECTION_CONFIG.header.bgGradient} rounded-2xl border border-blue-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600`}>
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
          </div>

          <div className="flex relative items-center space-x-4">
            <div className={`p-3 bg-gradient-to-br ${SECTION_CONFIG.header.iconBgGradient} rounded-xl shadow-lg`}>
              <SECTION_CONFIG.header.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${SECTION_CONFIG.header.titleGradient} dark:from-blue-400 dark:to-indigo-400`}>
                {SECTION_CONFIG.header.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {SECTION_CONFIG.header.description}
              </p>
            </div>
          </div>
        </div>

        {/* No Active Session Warning */}
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <SECTION_CONFIG.header.icon className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              You need to create or select an active session before building URLs.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openSessionManager({ tab: 'sessions' });
                }}
              >
                Create Session
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        setDomain(sessionUrlData.baseURL || DEFAULT_VALUES.domain);
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
        setDomain(urlData.baseURL || DEFAULT_VALUES.domain);
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
    // Resolve base_url from global variables if domain is {base_url}
    let resolvedDomain = domain;
    if (domain === "{base_url}" && globalVariables?.['base_url']) {
      resolvedDomain = globalVariables['base_url'];
    }

    const newUrl = `${protocol}://${resolvedDomain}${segments.length > 0
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
  }, [segments, domain, protocol, globalVariables]);

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(builtUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), COPY_TIMEOUT);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const renderOptionButton = (
    options: typeof PROTOCOL_OPTIONS | typeof ENVIRONMENT_OPTIONS,
    selectedValue: string,
    onSelect: (value: string) => void,
    ringColor: string
  ) => {
    return options.map((option) => {
      const isSelected = selectedValue === option.id;
      return (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 focus:outline-none group shadow-sm overflow-hidden
            bg-gradient-to-br ${isSelected ? option.selectedColor + ' border-transparent shadow-lg scale-105' : option.color + ' border-gray-200 dark:border-gray-600 hover:scale-105 hover:shadow-md'}
            ${isSelected ? `ring-2 ring-offset-2 ${ringColor}` : ''}
          `}
          aria-pressed={isSelected}
        >
          <span className="text-2xl mb-1">{option.icon}</span>
          <span className={`font-bold text-base ${isSelected ? 'text-white' : 'text-gray-800 dark:text-gray-100'}`}>{option.label}</span>
          <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>{option.description}</span>
          {isSelected && (
            <span className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-900"></span>
          )}
        </button>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className={`overflow-hidden relative p-6 bg-gradient-to-r ${SECTION_CONFIG.header.bgGradient} rounded-2xl border border-blue-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative items-center space-x-4">
          <div className={`p-3 bg-gradient-to-br ${SECTION_CONFIG.header.iconBgGradient} rounded-xl shadow-lg`}>
            <SECTION_CONFIG.header.icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${SECTION_CONFIG.header.titleGradient} dark:from-blue-400 dark:to-indigo-400`}>
              {SECTION_CONFIG.header.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {SECTION_CONFIG.header.description}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center mb-6 space-x-3">
            <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.configuration.iconBgGradient} rounded-lg`}>
              <SECTION_CONFIG.configuration.icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.configuration.title}</h3>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Protocol */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.protocol}
              </label>
              <div className="grid grid-cols-2 gap-3">
                {renderOptionButton(PROTOCOL_OPTIONS, protocol, setProtocol, 'ring-blue-400')}
              </div>
            </div>

            {/* Domain */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.domain}
              </label>
              <Input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={INPUT_PLACEHOLDERS.domain}
                fullWidth
              />
            </div>

            {/* Environment */}
            <div>
              <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                {LABELS.environment}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {renderOptionButton(ENVIRONMENT_OPTIONS, environment, setEnvironment, 'ring-green-400')}
              </div>
            </div>
          </div>

          {/* Session Description */}
          <div className="mt-6">
            <label className="block mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
              {LABELS.sessionDescription}
            </label>
            <Textarea
              value={sessionDescription}
              onChange={(e) => setSessionDescription(e.target.value)}
              placeholder={INPUT_PLACEHOLDERS.sessionDescription}
              rows={3}
              fullWidth
            />
          </div>
        </div>

        {/* Path Segments Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.pathSegments.iconBgGradient} rounded-lg`}>
                <SECTION_CONFIG.pathSegments.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.pathSegments.title}</h3>
            </div>
            <Button
              variant={BUTTON_VARIANTS.addSegment.variant}
              icon={FiPlus}
              onClick={handleSegmentAdd}
            >
              {LABELS.addSegment}
            </Button>
          </div>

          {segments.length === 0 ? (
            <div className="p-8 text-center rounded-xl border-2 border-gray-300 border-dashed dark:border-gray-600">
              <SECTION_CONFIG.pathSegments.icon className="mx-auto mb-4 w-12 h-12 text-gray-400" />
              <p className="mb-4 text-gray-500 dark:text-gray-400">{LABELS.noSegments}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">{LABELS.noSegmentsDescription}</p>
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
                        <Input
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
                          placeholder={INPUT_PLACEHOLDERS.dynamicSegment}
                          fullWidth
                        />
                      ) : (
                        <Input
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
                          placeholder={INPUT_PLACEHOLDERS.staticSegment}
                          fullWidth
                        />
                      )}
                    </div>

                    {/* Description */}
                    <div className="md:col-span-4">
                      <Input
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
                        placeholder={INPUT_PLACEHOLDERS.description}
                        fullWidth
                      />
                    </div>

                    {/* Actions */}
                    <div className="md:col-span-2">
                      <IconButton
                        icon={FiTrash2}
                        variant={BUTTON_VARIANTS.removeSegment.variant}
                        size={BUTTON_VARIANTS.removeSegment.size}
                        onClick={() => handleSegmentRemove(index)}
                        title="Remove segment"
                      />
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
              <div className={`p-2 bg-gradient-to-br ${SECTION_CONFIG.urlPreview.iconBgGradient} rounded-lg`}>
                <SECTION_CONFIG.urlPreview.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{SECTION_CONFIG.urlPreview.title}</h3>
            </div>
            <div className="flex items-center space-x-2">
              <IconButton
                icon={showPreview ? FiEyeOff : SECTION_CONFIG.urlPreview.icon}
                variant={BUTTON_VARIANTS.togglePreview.variant}
                onClick={() => setShowPreview(!showPreview)}
                title={showPreview ? "Hide preview" : "Show preview"}
              />
              <IconButton
                icon={copiedUrl ? FiCheck : FiCopy}
                variant={BUTTON_VARIANTS.copyUrl.variant}
                onClick={copyToClipboard}
                title="Copy URL"
              />
            </div>
          </div>

          {showPreview && (
            <div className="space-y-4">
              {/* Generated URL */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{LABELS.generatedUrl}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{LABELS.clickToCopy}</span>
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
              {(segments.some((s) => s.isDynamic) || domain === "{base_url}") && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
                  <div className="flex items-center mb-3 space-x-2">
                    <FiInfo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{LABELS.variableValues}</span>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {/* Show base_url variable if it's being used */}
                    {domain === "{base_url}" && (
                      <div className="flex justify-between items-center p-2 bg-white rounded-lg dark:bg-gray-700">
                        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">
                          base_url:
                        </span>
                        <span className={`text-sm px-2 py-1 rounded ${globalVariables?.['base_url']
                          ? VARIABLE_STATUS_STYLES.set
                          : VARIABLE_STATUS_STYLES.notSet
                          }`}>
                          {globalVariables?.['base_url'] || "Not set"}
                        </span>
                      </div>
                    )}
                    {/* Show segment variables */}
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
                              ? VARIABLE_STATUS_STYLES.notSet
                              : VARIABLE_STATUS_STYLES.set
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
          <Button
            variant={BUTTON_VARIANTS.submit.variant}
            size={BUTTON_VARIANTS.submit.size}
            icon={FiArrowRight}
            iconPosition="right"
            onClick={handleSubmit}
          >
            Continue to Request Configuration
          </Button>
        </div>
      </div>
    </div>
  );
};

export default URLBuilder;
