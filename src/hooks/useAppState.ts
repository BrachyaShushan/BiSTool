import { useState, useCallback, useMemo } from "react";
import { URLData, RequestConfigData, SectionId, Variable } from "../types";
import { DEFAULT_URL_DATA } from "../utils/storage";

// Custom hook for managing app state
export const useAppState = () => {
  const [urlData, setUrlData] = useState<URLData>(DEFAULT_URL_DATA);
  const [requestConfig, setRequestConfig] = useState<RequestConfigData | null>(
    null
  );
  const [yamlOutput, setYamlOutput] = useState<string>("");
  const [activeSection, setActiveSection] = useState<SectionId>("url");
  const [segmentVariables, setSegmentVariables] = useState<
    Record<string, string>
  >({});
  const [globalVariables, setGlobalVariables] = useState<
    Record<string, string>
  >({});
  const [sharedVariables, setSharedVariables] = useState<Variable[]>([]);

  // Memoized app state object
  const appState = useMemo(
    () => ({
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables,
      globalVariables,
    }),
    [
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables,
      globalVariables,
    ]
  );

  // Reset app state to defaults
  const resetAppState = useCallback(() => {
    setUrlData(DEFAULT_URL_DATA);
    setRequestConfig(null);
    setYamlOutput("");
    setActiveSection("url");
    setSegmentVariables({});
    setGlobalVariables({});
    setSharedVariables([]);
  }, []);

  // Load app state from external data
  const loadAppState = useCallback(
    (data: {
      urlData?: URLData;
      requestConfig?: RequestConfigData | null;
      yamlOutput?: string;
      activeSection?: SectionId;
      segmentVariables?: Record<string, string>;
      globalVariables?: Record<string, string>;
    }) => {
      if (data.urlData) setUrlData(data.urlData);
      if (data.requestConfig !== undefined)
        setRequestConfig(data.requestConfig);
      if (data.yamlOutput !== undefined) setYamlOutput(data.yamlOutput);
      if (data.activeSection) setActiveSection(data.activeSection);
      if (data.segmentVariables) setSegmentVariables(data.segmentVariables);
      if (data.globalVariables) setGlobalVariables(data.globalVariables);
    },
    []
  );

  return {
    // State
    urlData,
    requestConfig,
    yamlOutput,
    activeSection,
    segmentVariables,
    globalVariables,
    sharedVariables,
    appState,

    // Setters
    setUrlData,
    setRequestConfig,
    setYamlOutput,
    setActiveSection,
    setSegmentVariables,
    setGlobalVariables,
    setSharedVariables,

    // Actions
    resetAppState,
    loadAppState,
  };
};
