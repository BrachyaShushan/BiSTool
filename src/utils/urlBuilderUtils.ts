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
  globalVariables: Record<string, string>,
  replaceVariables?: (text: string) => string
): string => {
  // Use replaceVariables if provided, otherwise fall back to basic variable replacement
  let resolvedDomain = domain;

  if (replaceVariables) {
    resolvedDomain = replaceVariables(domain);
  } else {
    // Basic fallback for non-React usage
    if (domain === "{base_url}" && globalVariables?.["base_url"]) {
      resolvedDomain = globalVariables["base_url"];
    }
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
