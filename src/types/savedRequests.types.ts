export interface SavedSession {
  id: string;
  name: string;
  timestamp: string;
  category?: string;
  urlData?: {
    baseURL: string;
    segments: string;
    queryParams: any[];
    segmentVariables: any[];
    processedURL: string;
  };
  requestConfig?: {
    method: string;
    queryParams: any[];
    headers: any[];
    bodyType: string;
    jsonBody: string | null;
    formData: any[] | null;
  };
  yamlOutput?: string;
  segmentVariables?: Record<string, string>;
  sharedVariables?: Record<string, string>;
  activeSection?: string;
}

export interface SavedRequestsProps {
  onLoadRequest: (session: SavedSession) => void;
}
