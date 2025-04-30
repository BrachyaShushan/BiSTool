import {
  URLData as AppURLData,
  RequestConfigData,
  QueryParam as AppQueryParam,
  Header as AppHeader,
  FormDataField as AppFormDataField,
} from "./app.types";

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

// Re-export types from app.types.ts
export type URLData = AppURLData;
export type RequestConfig = RequestConfigData;
export type QueryParam = AppQueryParam;
export type Header = AppHeader;
export type FormDataField = AppFormDataField;
