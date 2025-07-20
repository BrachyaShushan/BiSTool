// Array update function
export const updateArrayItem = (
  array: any[],
  index: number,
  field: string,
  value: any
): any[] => {
  const newArray = [...array];
  newArray[index] = { ...newArray[index], [field]: value };
  return newArray;
};

// Add item function
export const addArrayItem = (array: any[], newItem: any): any[] => {
  return [...array, newItem];
};

// Remove item function
export const removeArrayItem = (array: any[], index: number): any[] => {
  return array.filter((_, i) => i !== index);
};

// Variable editing utilities
export interface VariableEditState {
  editingKey: string | null;
  editingNewKey: string;
  editingValue: string;
}

export const createVariableEditState = (): VariableEditState => ({
  editingKey: null,
  editingNewKey: "",
  editingValue: "",
});

export const startEditingVariable = (
  key: string,
  value: string,
  setState: (state: VariableEditState) => void
) => {
  setState({
    editingKey: key,
    editingNewKey: key,
    editingValue: value,
  });
};

export const cancelEditingVariable = (
  setState: (state: VariableEditState) => void
) => {
  setState({
    editingKey: null,
    editingNewKey: "",
    editingValue: "",
  });
};

// State initialization utilities
export const getInitialStateValue = (
  sessionValue: any,
  propValue: any,
  defaultValue: any
): any => {
  if (sessionValue !== undefined) return sessionValue;
  if (propValue !== undefined) return propValue;
  return defaultValue;
};

// HTTP method color mapping
export const getMethodColor = (httpMethod: string) => {
  const colors: Record<string, string> = {
    GET: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    POST: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    PUT: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    PATCH:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };
  return (
    colors[httpMethod] ||
    "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  );
};

// Method configuration
export const METHOD_CONFIG = {
  GET: { color: "emerald", icon: "FiDownload" },
  POST: { color: "blue", icon: "FiSend" },
  PUT: { color: "yellow", icon: "LuReplace" },
  PATCH: { color: "purple", icon: "FiEdit2" },
  DELETE: { color: "red", icon: "FiTrash2" },
} as const;

// Body type configuration
export const BODY_TYPE_CONFIG = [
  { type: "none", label: "None", color: "gray", icon: "FiX" },
  { type: "json", label: "JSON", color: "blue", icon: "FiCode" },
  { type: "form", label: "Form", color: "green", icon: "FiMail" },
  { type: "text", label: "Text", color: "purple", icon: "FiType" },
] as const;

// Environment configuration
export const ENVIRONMENT_CONFIG = [
  {
    id: "dev",
    name: "Development",
    color: "green",
    icon: "GiTrafficLightsRed",
    tooltip:
      "Use for local testing and development work. Variables will be resolved using the pattern: {variable}_dev",
  },
  {
    id: "staging",
    name: "Staging",
    color: "yellow",
    icon: "GiTrafficLightsOrange",
    tooltip:
      "Use for pre-production testing. Variables will be resolved using the pattern: {variable}_staging",
  },
  {
    id: "prod",
    name: "Production",
    color: "red",
    icon: "GiTrafficLightsReadyToGo",
    tooltip:
      "Use for live production APIs. Variables will be resolved using the pattern: {variable}_prod",
  },
] as const;
