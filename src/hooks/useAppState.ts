import { useState, useCallback, useMemo } from "react";
import { URLData, RequestConfigData } from "../types";
import { DEFAULT_URL_DATA } from "../utils/storage";

// Custom hook for managing app state
export const useAppState = () => {
  const [urlData, setUrlData] = useState<URLData>(DEFAULT_URL_DATA);
  const [requestConfig, setRequestConfig] = useState<RequestConfigData | null>(
    null
  );
  const [yamlOutput, setYamlOutput] = useState<string>("");
  const [segmentVariables, setSegmentVariables] = useState<
    Record<string, string>
  >({});

  // Memoized app state object
  const appState = useMemo(
    () => ({
      urlData,
      requestConfig,
      yamlOutput,
      segmentVariables,
    }),
    [urlData, requestConfig, yamlOutput, segmentVariables]
  );

  // Reset app state to defaults
  const resetAppState = useCallback(() => {
    setUrlData(DEFAULT_URL_DATA);
    setRequestConfig(null);
    setYamlOutput("");
    setSegmentVariables({});
  }, []);

  // Load app state from external data
  const loadAppState = useCallback(
    (data: {
      urlData?: URLData;
      requestConfig?: RequestConfigData | null;
      yamlOutput?: string;
      segmentVariables?: Record<string, string>;
    }) => {
      if (data.urlData) setUrlData(data.urlData);
      if (data.requestConfig !== undefined)
        setRequestConfig(data.requestConfig);
      if (data.yamlOutput !== undefined) setYamlOutput(data.yamlOutput);
      if (data.segmentVariables) setSegmentVariables(data.segmentVariables);
    },
    []
  );

  return {
    // State
    urlData,
    requestConfig,
    yamlOutput,
    segmentVariables,
    appState,

    // Setters
    setUrlData,
    setRequestConfig,
    setYamlOutput,
    setSegmentVariables,

    // Actions
    resetAppState,
    loadAppState,
  };
};
