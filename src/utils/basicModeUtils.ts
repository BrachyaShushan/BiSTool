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
