/**
 * Centralized JSON utilities to eliminate duplicate JSON handling patterns
 */

/**
 * Safely parse JSON with a default value
 */
export const safeJsonParse = <T>(jsonString: string, defaultValue: T): T => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn("Failed to parse JSON:", error);
    return defaultValue;
  }
};

/**
 * Safely stringify JSON with error handling
 */
export const safeJsonStringify = (value: any, space?: number): string => {
  try {
    return JSON.stringify(value, null, space);
  } catch (error) {
    console.error("Failed to stringify JSON:", error);
    return "";
  }
};

/**
 * Check if two JSON objects are equal by stringifying them
 */
export const jsonEquals = (a: any, b: any): boolean => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch (error) {
    console.warn("Failed to compare JSON objects:", error);
    return false;
  }
};

/**
 * Deep clone an object using JSON serialization
 */
export const deepClone = <T>(obj: T): T => {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error("Failed to deep clone object:", error);
    return obj;
  }
};

/**
 * Format JSON with proper indentation
 */
export const formatJson = (jsonString: string, indent: number = 2): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, indent);
  } catch (error) {
    console.warn("Failed to format JSON:", error);
    return jsonString;
  }
};

/**
 * Validate if a string is valid JSON
 */
export const isValidJson = (str: string): boolean => {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
};
