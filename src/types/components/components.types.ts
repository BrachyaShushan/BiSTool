import {
  URLData,
  RequestConfigData,
  QueryParam,
  Header,
  FormDataField,
} from "../core/app.types";

export interface URLBuilderProps {
  onSubmit: (data: URLData) => void;
}

export interface RequestConfigProps {
  onSubmit: (data: RequestConfigData) => void;
}

export interface TestManagerProps {
  onSubmit?: (data: any) => void;
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

export interface EditorMountParams {
  editor: any; // Monaco editor instance
  monaco: {
    languages: {
      register: (options: { id: string }) => void;
      setMonarchTokensProvider: (languageId: string, provider: any) => void;
    };
  };
}

export interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
  }>;
  role: string;
  _request_id?: string | null;
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
