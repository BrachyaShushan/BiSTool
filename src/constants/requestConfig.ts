import {
  FiHash,
  FiGlobe,
  FiZap,
  FiCode,
  FiDatabase,
  FiFileText,
  FiLayers,
} from "react-icons/fi";
import { FormDataField } from "../types";
import monaco from "monaco-editor";

export const HTTP_METHODS = [
  { value: "GET", label: "GET", color: "!bg-green-500 text-white" },
  { value: "POST", label: "POST", color: "!bg-blue-500 text-white" },
  { value: "PUT", label: "PUT", color: "!bg-yellow-500 text-white" },
  { value: "PATCH", label: "PATCH", color: "!bg-orange-500 text-white" },
  { value: "DELETE", label: "DELETE", color: "!bg-red-500 text-white" },
  { value: "HEAD", label: "HEAD", color: "!bg-purple-500 text-white" },
  {
    value: "OPTIONS",
    label: "OPTIONS",
    color: "!bg-indigo-500 text-white",
  },
];

export const METHOD_ICONS: Record<string, string> = {
  GET: "🔍",
  POST: "➕",
  PUT: "♻️",
  PATCH: "🩹",
  DELETE: "🗑️",
  HEAD: "🧠",
  OPTIONS: "⚙️",
};

export const BODY_TYPE_OPTIONS = [
  {
    id: "none",
    label: "None",
    description: "No body",
    icon: "🚫",
    color: "gray",
  },
  {
    id: "json",
    label: "JSON",
    description: "JSON data",
    icon: "🔧",
    color: "purple",
  },
  {
    id: "form",
    label: "Form Data",
    description: "Form fields",
    icon: "📝",
    color: "green",
  },
  {
    id: "text",
    label: "Text",
    description: "Plain text",
    icon: "📄",
    color: "blue",
  },
];

export const TAB_CONFIG = [
  {
    id: "params",
    label: "Parameters",
    icon: FiHash,
    color: "orange",
  },
  {
    id: "headers",
    label: "Headers",
    icon: FiGlobe,
    color: "blue",
  },
  {
    id: "body",
    label: "Body",
    icon: FiZap,
    color: "purple",
  },
];

export const BODY_CONTENT_CONFIG = {
  json: {
    icon: FiCode,
    label: "JSON Body",
    color: "purple",
    bgGradient: "from-purple-500 to-purple-600",
  },
  form: {
    icon: FiDatabase,
    label: "Form Data",
    color: "green",
    bgGradient: "from-green-500 to-green-600",
  },
  text: {
    icon: FiFileText,
    label: "Text Body",
    color: "blue",
    bgGradient: "from-blue-500 to-blue-600",
  },
  none: {
    icon: FiLayers,
    label: "No Body",
    color: "gray",
    bgGradient: "from-gray-500 to-gray-600",
  },
};

export const METHODS_WITH_BODY = ["POST", "PUT", "PATCH"];

export const DEFAULT_JSON_BODY = "{\n  \n}";

export const DEFAULT_FORM_DATA: FormDataField[] = [
  { key: "", value: "", type: "text", required: false },
];

export const TOKEN_CHECK_INTERVAL = 30000; // 30 seconds

export const EDITOR_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions =
  {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    lineNumbers: "on" as const,
    roundedSelection: false,
    scrollbar: {
      vertical: "visible",
      horizontal: "visible",
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    automaticLayout: true,
    formatOnPaste: true,
    formatOnType: true,
    tabSize: 2,
  };

export const COLOR_CLASSES = {
  gray: {
    selected:
      "bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/25",
    unselected:
      "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-gray-500",
  },
  purple: {
    selected:
      "bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25",
    unselected:
      "bg-white border-gray-300 text-gray-700 hover:bg-purple-50 hover:border-purple-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-purple-500",
  },
  green: {
    selected:
      "bg-green-600 border-green-500 text-white shadow-lg shadow-green-500/25",
    unselected:
      "bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-green-500",
  },
  blue: {
    selected:
      "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25",
    unselected:
      "bg-white border-gray-300 text-gray-700 hover:bg-blue-50 hover:border-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600 dark:hover:border-blue-500",
  },
};

export const TOKEN_EXPIRATION_STYLES = {
  valid: "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200",
  warning:
    "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200",
  expired: "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200",
};
