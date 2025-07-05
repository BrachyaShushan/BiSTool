import { URLData } from "../types/core/app.types";

// Define Segment interface
export interface Segment {
  value: string;
  isDynamic: boolean;
  paramName: string;
  description: string;
  required: boolean;
}

// Utility function to check if URLData is empty
export const isUrlDataEmpty = (urlData: any): boolean => {
  if (!urlData) return true;
  const {
    baseURL = "",
    segments = "",
    parsedSegments = [],
    processedURL = "",
    domain = "",
    protocol = "",
    builtUrl = "",
    environment = "",
    sessionDescription = "",
  } = urlData;
  return (
    !baseURL &&
    !segments &&
    (!parsedSegments || parsedSegments.length === 0) &&
    !processedURL &&
    !domain &&
    !protocol &&
    !builtUrl &&
    !environment &&
    !sessionDescription
  );
};

// Parse segments from string format
export const parseSegmentsFromString = (segmentsString: string): Segment[] => {
  if (!segmentsString?.trim()) return [];

  return segmentsString
    .split("/")
    .filter(Boolean)
    .map((segment: string) => {
      const isDynamic = segment.startsWith("{") && segment.endsWith("}");
      const paramName = isDynamic ? segment.slice(1, -1) : "";
      return {
        value: isDynamic ? "" : segment,
        isDynamic,
        paramName,
        description: "",
        required: false,
      };
    });
};

// Parse segments from parsed array format
export const parseSegmentsFromParsed = (parsedSegments: any[]): Segment[] => {
  if (!parsedSegments?.length) return [];

  return parsedSegments.map((segment: any) => ({
    value: segment.value || "",
    isDynamic: segment.isDynamic || false,
    paramName: segment.paramName || "",
    description: segment.description || "",
    required: segment.required || false,
  }));
};

// Build URL from segments
export const buildUrlFromSegments = (
  protocol: string,
  domain: string,
  segments: Segment[],
  globalVariables: Record<string, string>
): string => {
  // Resolve base_url from global variables if domain is {base_url}
  let resolvedDomain = domain;
  if (domain === "{base_url}" && globalVariables?.["base_url"]) {
    resolvedDomain = globalVariables["base_url"];
  }

  const segmentPath =
    segments.length > 0
      ? "/" +
        segments
          .map((segment) =>
            segment.isDynamic && segment.paramName
              ? `{${segment.paramName}}`
              : segment.value
          )
          .join("/")
      : "";

  return `${protocol}://${resolvedDomain}${segmentPath}`;
};

// Create URL data from current state
export const createURLData = (
  protocol: string,
  domain: string,
  segments: Segment[],
  sessionDescription: string,
  environment: string,
  builtUrl: string,
  queryParams: any[] = []
): URLData => {
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

  return {
    baseURL: domain,
    segments: segmentsString,
    parsedSegments: segments,
    queryParams: queryParams,
    segmentVariables: segmentVarsList,
    processedURL: builtUrl,
    sessionDescription: sessionDescription,
    domain: domain,
    protocol: protocol,
    builtUrl: builtUrl,
    environment: environment,
  };
};

// Get variable value from different sources
export const getVariableValue = (
  paramName: string,
  environment: string,
  sessionSegmentVariables: Record<string, string>,
  sharedVariables: Array<{ key: string; value: string }> = [],
  globalVariables: Record<string, string> = {}
): string | null => {
  // 1. Check session segment variables
  if (sessionSegmentVariables[paramName]) {
    return sessionSegmentVariables[paramName];
  }

  // 2. Check shared variables (session-specific variables)
  const sharedVar = sharedVariables.find((v) => v.key === paramName);
  if (sharedVar) {
    return sharedVar.value;
  }

  // 3. Check environment-specific global variable
  const envVar = globalVariables[`${paramName}_${environment}`];
  if (envVar) {
    return envVar;
  }

  // 4. Check global variables
  if (globalVariables[paramName]) {
    return globalVariables[paramName];
  }

  return null;
};

// Extract session segment variables from session data
export const getSessionSegmentVariables = (
  activeSessionUrlData?: URLData,
  fallbackUrlData?: URLData
): Record<string, string> => {
  if (activeSessionUrlData?.segmentVariables) {
    return activeSessionUrlData.segmentVariables.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  if (fallbackUrlData?.segmentVariables) {
    return fallbackUrlData.segmentVariables.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
  }

  return {};
};
