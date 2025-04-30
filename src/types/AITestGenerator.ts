export interface AITestGeneratorProps {
  yamlData: string;
}

export interface EditorRef {
  current: any; // Monaco editor instance
}

export interface MonacoInstance {
  languages: {
    register: (options: { id: string }) => void;
    setMonarchTokensProvider: (languageId: string, provider: any) => void;
  };
}

export interface EditorMountParams {
  editor: any; // Monaco editor instance
  monaco: MonacoInstance;
}

export interface AnthropicResponse {
  content: Array<{
    text?: string;
    type: string;
  }>;
  role: string;
  _request_id?: string | null;
}
