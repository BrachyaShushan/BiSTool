import {
  URLData,
  RequestConfigData,
  QueryParam,
  Header,
  FormDataField,
} from "./app.types";

export interface URLBuilderProps {
  onSubmit: (data: URLData) => void;
}

export interface RequestConfigProps {
  onSubmit: (data: RequestConfigData) => void;
}

export interface YAMLGeneratorProps {
  onGenerate: (yaml: string) => void;
}

export interface AITestGeneratorProps {
  yamlData: string;
}

export interface SavedManagerProps {
  // Add saved manager specific props here
  [key: string]: any;
}

export interface EditorRef {
  current: any; // Monaco editor type
}

export interface RequestConfigState {
  activeTab: "params" | "headers" | "body";
  queryParams: QueryParam[];
  headers: Header[];
  method: string;
  bodyType: "none" | "json" | "form";
  jsonBody: string;
  formData: FormDataField[];
  tokenExpiration: number | null;
}
