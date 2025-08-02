import {
  RequestConfigData,
  QueryParameter,
  HeaderParameter,
} from "@/types/shared";

export interface YAMLGeneratorProps {
  onGenerate: (yaml: string) => void;
}

export interface EditorOptions {
  minimap?: { enabled: boolean };
  scrollBeyondLastLine?: boolean;
  fontSize?: number;
  lineNumbers?: "on" | "off";
  roundedSelection?: boolean;
  scrollbar?: {
    vertical: "visible" | "hidden";
    horizontal: "visible" | "hidden";
    useShadows: boolean;
    verticalScrollbarSize: number;
    horizontalScrollbarSize: number;
  };
  automaticLayout?: boolean;
  formatOnPaste?: boolean;
  formatOnType?: boolean;
  tabSize?: number;
  readOnly?: boolean;
}

export interface ResponseData {
  [key: string]: any;
}

// Re-export types from shared for convenience
export type { RequestConfigData as RequestConfig, QueryParameter as QueryParam, HeaderParameter as Header };
