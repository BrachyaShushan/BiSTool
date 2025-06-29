import * as monaco from "monaco-editor";

export interface JsonataSuggestion {
  label: string;
  kind: monaco.languages.CompletionItemKind;
  insertText: string;
  insertTextRules?: monaco.languages.CompletionItemInsertTextRule | undefined;
  documentation: string;
  range: monaco.IRange;
  sortText: string;
  detail?: string;
  examples?: string[];
  command?: monaco.languages.Command;
}

export interface JsonataFunctionDoc {
  description: string;
  examples: string[];
  category: string;
  signature: string;
  parameters: JsonataParameter[];
}

export interface JsonataParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: string;
}

// Enhanced JSONata function documentation with signatures and parameters
export const jsonataFunctionDocs: { [key: string]: JsonataFunctionDoc } = {
  // Array functions
  $map: {
    description: "Transform each item in an array using a function",
    signature: "$map(array, function)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to transform",
        required: true,
      },
      {
        name: "function",
        type: "function",
        description: "Function to apply to each item",
        required: true,
      },
    ],
    examples: [
      '$map(data, { "id": id, "name": name })',
      "$map(numbers, $ * 2)",
      '$map(users, { "fullName": firstName & " " & lastName })',
    ],
    category: "Array",
  },
  $filter: {
    description: "Filter array items based on a condition",
    signature: "$filter(array, condition)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to filter",
        required: true,
      },
      {
        name: "condition",
        type: "boolean",
        description: "Condition to test each item",
        required: true,
      },
    ],
    examples: [
      '$filter(data, status = "active")',
      "$filter(users, age > 18)",
      "$filter(products, price < 100)",
    ],
    category: "Array",
  },
  $reduce: {
    description: "Reduce an array to a single value",
    signature: "$reduce(array, function, initialValue?)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to reduce",
        required: true,
      },
      {
        name: "function",
        type: "function",
        description: "Reduction function",
        required: true,
      },
      {
        name: "initialValue",
        type: "any",
        description: "Initial value for reduction",
        required: false,
      },
    ],
    examples: [
      "$reduce(numbers, $sum)",
      "$reduce(data, $merge)",
      "$reduce(values, $max)",
    ],
    category: "Array",
  },
  $sort: {
    description: "Sort array items",
    signature: "$sort(array, key, order?)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to sort",
        required: true,
      },
      {
        name: "key",
        type: "string|function",
        description: "Sort key or function",
        required: true,
      },
      {
        name: "order",
        type: "string",
        description: "Sort order: 'asc' or 'desc'",
        required: false,
        defaultValue: "asc",
      },
    ],
    examples: [
      "$sort(data, name)",
      "$sort(users, -age)",
      "$sort(products, price)",
    ],
    category: "Array",
  },
  $distinct: {
    description: "Remove duplicate items from an array",
    signature: "$distinct(array, key?)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to deduplicate",
        required: true,
      },
      {
        name: "key",
        type: "string|function",
        description: "Key or function to determine uniqueness",
        required: false,
      },
    ],
    examples: [
      "$distinct(categories)",
      "$distinct(data.status)",
      "$distinct(users.department)",
    ],
    category: "Array",
  },
  $count: {
    description: "Count the number of items in an array",
    signature: "$count(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to count",
        required: true,
      },
    ],
    examples: [
      "$count(data)",
      "$count($filter(users, active = true))",
      "$count($distinct(categories))",
    ],
    category: "Array",
  },
  $sum: {
    description: "Calculate the sum of array values",
    signature: "$sum(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array of numbers to sum",
        required: true,
      },
    ],
    examples: [
      "$sum(prices)",
      "$sum($map(data, amount))",
      "$sum($filter(values, $ > 0))",
    ],
    category: "Array",
  },
  $avg: {
    description: "Calculate the average of array values",
    signature: "$avg(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array of numbers to average",
        required: true,
      },
    ],
    examples: [
      "$avg(scores)",
      "$avg($map(data, rating))",
      "$avg($filter(values, $isNumber($)))",
    ],
    category: "Array",
  },
  $min: {
    description: "Find the minimum value in an array",
    signature: "$min(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array to find minimum value",
        required: true,
      },
    ],
    examples: [
      "$min(prices)",
      "$min($map(data, value))",
      "$min($filter(numbers, $ > 0))",
    ],
    category: "Array",
  },
  $max: {
    description: "Find the maximum value in an array",
    signature: "$max(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array to find maximum value",
        required: true,
      },
    ],
    examples: [
      "$max(scores)",
      "$max($map(data, amount))",
      "$max($filter(values, $isNumber($)))",
    ],
    category: "Array",
  },
  $append: {
    description: "Add an item to the end of an array",
    signature: "$append(array, item)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to append to",
        required: true,
      },
      {
        name: "item",
        type: "any",
        description: "Item to append",
        required: true,
      },
    ],
    examples: [
      "$append(array, newItem)",
      '$append(users, { "id": 999, "name": "New User" })',
    ],
    category: "Array",
  },
  $prepend: {
    description: "Add an item to the beginning of an array",
    signature: "$prepend(array, item)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to prepend to",
        required: true,
      },
      {
        name: "item",
        type: "any",
        description: "Item to prepend",
        required: true,
      },
    ],
    examples: [
      "$prepend(array, newItem)",
      '$prepend(users, { "id": 0, "name": "First User" })',
    ],
    category: "Array",
  },
  $reverse: {
    description: "Reverse the order of items in an array",
    signature: "$reverse(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to reverse",
        required: true,
      },
    ],
    examples: ["$reverse(array)", "$reverse($sort(data, name))"],
    category: "Array",
  },
  $shuffle: {
    description: "Randomly shuffle the items in an array",
    signature: "$shuffle(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to shuffle",
        required: true,
      },
    ],
    examples: ["$shuffle(array)", "$shuffle(users)"],
    category: "Array",
  },
  $zip: {
    description: "Combine multiple arrays into an array of objects",
    signature: "$zip(array1, array2, ...)",
    parameters: [
      {
        name: "array1",
        type: "array",
        description: "First array",
        required: true,
      },
      {
        name: "array2",
        type: "array",
        description: "Second array",
        required: true,
      },
    ],
    examples: ["$zip(names, ages)", "$zip(ids, names, emails)"],
    category: "Array",
  },
  $slice: {
    description: "Extract a portion of an array",
    signature: "$slice(array, start, end?)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to slice",
        required: true,
      },
      {
        name: "start",
        type: "number",
        description: "Start index (inclusive)",
        required: true,
      },
      {
        name: "end",
        type: "number",
        description: "End index (exclusive)",
        required: false,
      },
    ],
    examples: ["$slice(array, 0, 10)", "$slice(users, 5, 15)"],
    category: "Array",
  },
  $sift: {
    description: "Remove null and undefined values from an array",
    signature: "$sift(array)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to sift",
        required: true,
      },
    ],
    examples: ["$sift(array)", "$sift($map(data, optionalField))"],
    category: "Array",
  },
  $join: {
    description: "Join array items into a string",
    signature: "$join(array, separator)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "The array to join",
        required: true,
      },
      {
        name: "separator",
        type: "string",
        description: "String to use as separator",
        required: true,
      },
    ],
    examples: ['$join(array, ", ")', '$join(names, " and ")'],
    category: "Array",
  },

  // Object functions
  $merge: {
    description: "Merge multiple objects into one",
    signature: "$merge(object1, object2, ...)",
    parameters: [
      {
        name: "object1",
        type: "object",
        description: "First object",
        required: true,
      },
      {
        name: "object2",
        type: "object",
        description: "Second object",
        required: true,
      },
    ],
    examples: [
      "$merge(obj1, obj2)",
      '$merge($map(data, { "id": id }), { "type": "item" })',
      "$merge(defaults, overrides)",
    ],
    category: "Object",
  },
  $keys: {
    description: "Get all keys from an object as an array",
    signature: "$keys(object)",
    parameters: [
      {
        name: "object",
        type: "object",
        description: "The object to get keys from",
        required: true,
      },
    ],
    examples: [
      "$keys(user)",
      "$keys($first(data))",
      "$keys($merge(obj1, obj2))",
    ],
    category: "Object",
  },
  $values: {
    description: "Get all values from an object as an array",
    signature: "$values(object)",
    parameters: [
      {
        name: "object",
        type: "object",
        description: "The object to get values from",
        required: true,
      },
    ],
    examples: [
      "$values(user)",
      "$values($first(data))",
      "$values($merge(obj1, obj2))",
    ],
    category: "Object",
  },
  $lookup: {
    description: "Look up a value in an object using a key",
    signature: "$lookup(object, key)",
    parameters: [
      {
        name: "object",
        type: "object",
        description: "The object to lookup in",
        required: true,
      },
      {
        name: "key",
        type: "string",
        description: "The key to lookup",
        required: true,
      },
    ],
    examples: ['$lookup(obj, "key")', '$lookup(user, "name")'],
    category: "Object",
  },
  $spread: {
    description: "Spread object properties into the current context",
    signature: "$spread(object)",
    parameters: [
      {
        name: "object",
        type: "object",
        description: "The object to spread",
        required: true,
      },
    ],
    examples: ["$spread(user)", "$spread($first(data))"],
    category: "Object",
  },
  $each: {
    description: "Iterate over object key-value pairs",
    signature: "$each(object, function)",
    parameters: [
      {
        name: "object",
        type: "object",
        description: "The object to iterate over",
        required: true,
      },
      {
        name: "function",
        type: "function",
        description: "Function to apply to each key-value pair",
        required: true,
      },
    ],
    examples: [
      '$each(user, { "key": $key, "value": $value })',
      '$each(config, { "setting": $key, "enabled": $value.enabled })',
    ],
    category: "Object",
  },

  // String functions
  $string: {
    description: "Convert a value to a string",
    signature: "$string(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to convert to string",
        required: true,
      },
    ],
    examples: ["$string(123)", "$string(user.id)", "$string(true)"],
    category: "String",
  },
  $length: {
    description: "Get the length of a string or array",
    signature: "$length(value)",
    parameters: [
      {
        name: "value",
        type: "string|array",
        description: "String or array to get length of",
        required: true,
      },
    ],
    examples: ['$length("hello")', "$length(array)", "$length(user.name)"],
    category: "String",
  },
  $substring: {
    description: "Extract a substring from a string",
    signature: "$substring(string, start, length?)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "The string to extract from",
        required: true,
      },
      {
        name: "start",
        type: "number",
        description: "Start position (0-based)",
        required: true,
      },
      {
        name: "length",
        type: "number",
        description: "Number of characters to extract",
        required: false,
      },
    ],
    examples: ['$substring("hello", 1, 3)', "$substring(name, 0, 10)"],
    category: "String",
  },
  $uppercase: {
    description: "Convert a string to uppercase",
    signature: "$uppercase(string)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to convert to uppercase",
        required: true,
      },
    ],
    examples: ['$uppercase("hello")', "$uppercase(name)"],
    category: "String",
  },
  $lowercase: {
    description: "Convert a string to lowercase",
    signature: "$lowercase(string)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to convert to lowercase",
        required: true,
      },
    ],
    examples: ['$lowercase("HELLO")', "$lowercase(email)"],
    category: "String",
  },
  $trim: {
    description: "Remove whitespace from the beginning and end of a string",
    signature: "$trim(string)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to trim",
        required: true,
      },
    ],
    examples: ['$trim("  hello  ")', "$trim(user.name)"],
    category: "String",
  },
  $split: {
    description: "Split a string into an array",
    signature: "$split(string, separator)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to split",
        required: true,
      },
      {
        name: "separator",
        type: "string",
        description: "Separator to split on",
        required: true,
      },
    ],
    examples: ['$split("a,b,c", ",")', '$split(path, "/")'],
    category: "String",
  },
  $replace: {
    description: "Replace occurrences in a string",
    signature: "$replace(string, pattern, replacement)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to perform replacement on",
        required: true,
      },
      {
        name: "pattern",
        type: "string",
        description: "Pattern to replace",
        required: true,
      },
      {
        name: "replacement",
        type: "string",
        description: "Replacement string",
        required: true,
      },
    ],
    examples: ['$replace("hello", "l", "x")', '$replace(email, "@", "[at]")'],
    category: "String",
  },
  $match: {
    description: "Test if a string matches a regular expression",
    signature: "$match(string, pattern)",
    parameters: [
      {
        name: "string",
        type: "string",
        description: "String to test",
        required: true,
      },
      {
        name: "pattern",
        type: "string",
        description: "Regular expression pattern",
        required: true,
      },
    ],
    examples: [
      '$match(email, "^[^@]+@[^@]+$")',
      '$match(phone, "^\\d{3}-\\d{3}-\\d{4}$")',
    ],
    category: "String",
  },

  // Number functions
  $number: {
    description: "Convert a value to a number",
    signature: "$number(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to convert to number",
        required: true,
      },
    ],
    examples: ['$number("123")', "$number(price)", '$number("12.34")'],
    category: "Number",
  },
  $round: {
    description: "Round a number to the nearest integer",
    signature: "$round(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to round",
        required: true,
      },
    ],
    examples: ["$round(3.7)", "$round(price)", "$round(3.2)"],
    category: "Number",
  },
  $floor: {
    description: "Round a number down to the nearest integer",
    signature: "$floor(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to round down",
        required: true,
      },
    ],
    examples: ["$floor(3.7)", "$floor(price)", "$floor(3.2)"],
    category: "Number",
  },
  $ceil: {
    description: "Round a number up to the nearest integer",
    signature: "$ceil(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to round up",
        required: true,
      },
    ],
    examples: ["$ceil(3.7)", "$ceil(price)", "$ceil(3.2)"],
    category: "Number",
  },
  $abs: {
    description: "Get the absolute value of a number",
    signature: "$abs(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to get absolute value of",
        required: true,
      },
    ],
    examples: ["$abs(-5)", "$abs(score)", "$abs(3.14)"],
    category: "Number",
  },
  $power: {
    description: "Raise a number to a power",
    signature: "$power(base, exponent)",
    parameters: [
      {
        name: "base",
        type: "number",
        description: "Base number",
        required: true,
      },
      {
        name: "exponent",
        type: "number",
        description: "Exponent",
        required: true,
      },
    ],
    examples: ["$power(2, 3)", "$power(price, 2)", "$power(10, 0.5)"],
    category: "Number",
  },
  $sqrt: {
    description: "Calculate the square root of a number",
    signature: "$sqrt(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to calculate square root of",
        required: true,
      },
    ],
    examples: ["$sqrt(16)", "$sqrt(area)", "$sqrt(100)"],
    category: "Number",
  },
  $random: {
    description: "Generate a random number between 0 and 1",
    signature: "$random()",
    parameters: [],
    examples: ["$random()", "$random() * 100"],
    category: "Number",
  },

  // Boolean functions
  $boolean: {
    description: "Convert a value to a boolean",
    signature: "$boolean(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to convert to boolean",
        required: true,
      },
    ],
    examples: ["$boolean(1)", '$boolean("")', "$boolean(user.active)"],
    category: "Boolean",
  },
  $not: {
    description: "Logical NOT operation",
    signature: "$not(value)",
    parameters: [
      {
        name: "value",
        type: "boolean",
        description: "Value to negate",
        required: true,
      },
    ],
    examples: ["$not(true)", "$not(user.active)", "$not($isEmpty(array))"],
    category: "Boolean",
  },

  // Type checking functions
  $type: {
    description: "Get the type of a value",
    signature: "$type(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to get type of",
        required: true,
      },
    ],
    examples: ["$type(123)", '$type("hello")', "$type(user)", "$type(array)"],
    category: "Type",
  },
  $isString: {
    description: "Check if a value is a string",
    signature: "$isString(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: ['$isString("hello")', "$isString(123)", "$isString(user.name)"],
    category: "Type",
  },
  $isNumber: {
    description: "Check if a value is a number",
    signature: "$isNumber(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: ["$isNumber(123)", '$isNumber("123")', "$isNumber(price)"],
    category: "Type",
  },
  $isBoolean: {
    description: "Check if a value is a boolean",
    signature: "$isBoolean(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: ["$isBoolean(true)", "$isBoolean(1)", "$isBoolean(user.active)"],
    category: "Type",
  },
  $isArray: {
    description: "Check if a value is an array",
    signature: "$isArray(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: ["$isArray([1,2,3])", '$isArray("array")', "$isArray(users)"],
    category: "Type",
  },
  $isObject: {
    description: "Check if a value is an object",
    signature: "$isObject(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: ["$isObject({})", '$isObject("object")', "$isObject(user)"],
    category: "Type",
  },
  $isEmpty: {
    description:
      "Check if a value is empty (null, undefined, empty string, empty array, empty object)",
    signature: "$isEmpty(value)",
    parameters: [
      {
        name: "value",
        type: "any",
        description: "Value to check",
        required: true,
      },
    ],
    examples: [
      '$isEmpty("")',
      "$isEmpty([])",
      "$isEmpty(null)",
      "$isEmpty(user.name)",
    ],
    category: "Type",
  },

  // Conditional functions
  $if: {
    description: "Conditional expression",
    signature: "$if(condition, trueValue, falseValue)",
    parameters: [
      {
        name: "condition",
        type: "boolean",
        description: "Condition to evaluate",
        required: true,
      },
      {
        name: "trueValue",
        type: "any",
        description: "Value if condition is true",
        required: true,
      },
      {
        name: "falseValue",
        type: "any",
        description: "Value if condition is false",
        required: true,
      },
    ],
    examples: [
      '$if(age >= 18, "adult", "minor")',
      '$if(user.active, "active", "inactive")',
      '$if($count(items) > 0, "has items", "empty")',
    ],
    category: "Conditional",
  },
  $case: {
    description: "Multiple conditional expressions",
    signature:
      "$case(condition1, value1, condition2, value2, ..., defaultValue)",
    parameters: [
      {
        name: "condition1",
        type: "boolean",
        description: "First condition",
        required: true,
      },
      {
        name: "value1",
        type: "any",
        description: "Value if first condition is true",
        required: true,
      },
      {
        name: "condition2",
        type: "boolean",
        description: "Second condition",
        required: false,
      },
      {
        name: "value2",
        type: "any",
        description: "Value if second condition is true",
        required: false,
      },
      {
        name: "defaultValue",
        type: "any",
        description: "Default value if no conditions are true",
        required: false,
      },
    ],
    examples: [
      '$case(score >= 90, "A", score >= 80, "B", score >= 70, "C", "F")',
      '$case(status = "active", "green", status = "pending", "yellow", "red")',
    ],
    category: "Conditional",
  },

  // Date functions
  $now: {
    description: "Get the current date and time",
    signature: "$now()",
    parameters: [],
    examples: ["$now()", "$now() > user.lastLogin"],
    category: "Date",
  },
  $millis: {
    description: "Convert a date to milliseconds since epoch",
    signature: "$millis(date)",
    parameters: [
      {
        name: "date",
        type: "date|string",
        description: "Date to convert",
        required: true,
      },
    ],
    examples: ["$millis($now())", '$millis("2023-01-01")'],
    category: "Date",
  },
  $fromMillis: {
    description: "Convert milliseconds to a date",
    signature: "$fromMillis(milliseconds)",
    parameters: [
      {
        name: "milliseconds",
        type: "number",
        description: "Milliseconds since epoch",
        required: true,
      },
    ],
    examples: ["$fromMillis(1640995200000)", "$fromMillis(timestamp)"],
    category: "Date",
  },
  $formatDateTime: {
    description: "Format a date using a pattern",
    signature: "$formatDateTime(date, pattern)",
    parameters: [
      {
        name: "date",
        type: "date|string",
        description: "Date to format",
        required: true,
      },
      {
        name: "pattern",
        type: "string",
        description: "Format pattern",
        required: true,
      },
    ],
    examples: [
      '$formatDateTime($now(), "yyyy-MM-dd")',
      '$formatDateTime(user.created, "MMM dd, yyyy")',
    ],
    category: "Date",
  },

  // Math functions
  $sin: {
    description: "Calculate the sine of an angle in radians",
    signature: "$sin(angle)",
    parameters: [
      {
        name: "angle",
        type: "number",
        description: "Angle in radians",
        required: true,
      },
    ],
    examples: ["$sin(0)", "$sin($pi / 2)", "$sin(angle)"],
    category: "Math",
  },
  $cos: {
    description: "Calculate the cosine of an angle in radians",
    signature: "$cos(angle)",
    parameters: [
      {
        name: "angle",
        type: "number",
        description: "Angle in radians",
        required: true,
      },
    ],
    examples: ["$cos(0)", "$cos($pi)", "$cos(angle)"],
    category: "Math",
  },
  $tan: {
    description: "Calculate the tangent of an angle in radians",
    signature: "$tan(angle)",
    parameters: [
      {
        name: "angle",
        type: "number",
        description: "Angle in radians",
        required: true,
      },
    ],
    examples: ["$tan(0)", "$tan($pi / 4)", "$tan(angle)"],
    category: "Math",
  },
  $asin: {
    description: "Calculate the arcsine of a value",
    signature: "$asin(value)",
    parameters: [
      {
        name: "value",
        type: "number",
        description: "Value between -1 and 1",
        required: true,
      },
    ],
    examples: ["$asin(0)", "$asin(1)", "$asin(ratio)"],
    category: "Math",
  },
  $acos: {
    description: "Calculate the arccosine of a value",
    signature: "$acos(value)",
    parameters: [
      {
        name: "value",
        type: "number",
        description: "Value between -1 and 1",
        required: true,
      },
    ],
    examples: ["$acos(0)", "$acos(1)", "$acos(ratio)"],
    category: "Math",
  },
  $atan: {
    description: "Calculate the arctangent of a value",
    signature: "$atan(value)",
    parameters: [
      {
        name: "value",
        type: "number",
        description: "Value to calculate arctangent of",
        required: true,
      },
    ],
    examples: ["$atan(0)", "$atan(1)", "$atan(ratio)"],
    category: "Math",
  },
  $log: {
    description: "Calculate the natural logarithm of a number",
    signature: "$log(number)",
    parameters: [
      {
        name: "number",
        type: "number",
        description: "Number to calculate logarithm of",
        required: true,
      },
    ],
    examples: ["$log(1)", "$log($e)", "$log(value)"],
    category: "Math",
  },
  $exp: {
    description: "Calculate e raised to a power",
    signature: "$exp(power)",
    parameters: [
      {
        name: "power",
        type: "number",
        description: "Power to raise e to",
        required: true,
      },
    ],
    examples: ["$exp(1)", "$exp(power)"],
    category: "Math",
  },

  // Aggregation functions
  $collect: {
    description: "Collect values into an array",
    signature: "$collect(array, key)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array to collect from",
        required: true,
      },
      {
        name: "key",
        type: "string|function",
        description: "Key or function to group by",
        required: true,
      },
    ],
    examples: ['$collect(data, "category")', '$collect(users, "department")'],
    category: "Aggregation",
  },
  $collectAs: {
    description: "Collect values into an array with a specific name",
    signature: "$collectAs(array, key, name)",
    parameters: [
      {
        name: "array",
        type: "array",
        description: "Array to collect from",
        required: true,
      },
      {
        name: "key",
        type: "string|function",
        description: "Key or function to group by",
        required: true,
      },
      {
        name: "name",
        type: "string",
        description: "Name for the collected array",
        required: true,
      },
    ],
    examples: [
      '$collectAs(data, "category", "categories")',
      '$collectAs(users, "department", "departments")',
    ],
    category: "Aggregation",
  },

  // Context functions
  $: {
    description:
      "Current context variable - represents the current item being processed",
    signature: "$",
    parameters: [],
    examples: [
      "$map(data, $)",
      "$filter(users, $.active = true)",
      '$map(items, { "id": $.id, "name": $.name })',
    ],
    category: "Context",
  },
  $$: {
    description:
      "Root context variable - represents the root of the JSON document",
    signature: "$$",
    parameters: [],
    examples: [
      '$map(data, { "item": $, "rootId": $$.id })',
      "$filter(users, $.department = $$.currentDepartment)",
    ],
    category: "Context",
  },
  $context: {
    description: "Access the current context",
    signature: "$context",
    parameters: [],
    examples: ["$context", "$context.parent"],
    category: "Context",
  },
  $parent: {
    description: "Access the parent context",
    signature: "$parent",
    parameters: [],
    examples: ["$parent", "$parent.name"],
    category: "Context",
  },
  $root: {
    description: "Access the root context",
    signature: "$root",
    parameters: [],
    examples: ["$root", "$root.config"],
    category: "Context",
  },
};

// Keywords for JSONata
export const jsonataKeywords = [
  "and",
  "or",
  "not",
  "in",
  "as",
  "is",
  "true",
  "false",
  "null",
  "undefined",
];

// Variables for JSONata
export const jsonataVariables = ["$", "$$", "$context", "$parent", "$root"];

// Operators for JSONata
export const jsonataOperators = [
  "=",
  "!=",
  "<",
  "<=",
  ">",
  ">=",
  "+",
  "-",
  "*",
  "/",
  "%",
  "&",
  "|",
  "^",
  "~",
  "&&",
  "||",
  "!",
  "==",
  "===",
  "!==",
  "**",
  "<<",
  ">>",
  ">>>",
  "?",
  ":",
  "=>",
];

// Generate comprehensive suggestions for Monaco editor
export const generateJsonataSuggestions = (
  range: monaco.IRange,
  currentWord?: string
): JsonataSuggestion[] => {
  const suggestions: JsonataSuggestion[] = [];

  // Add function suggestions with enhanced signatures
  Object.entries(jsonataFunctionDocs).forEach(([functionName, doc], index) => {
    // Create insert text with complete function name and parameter placeholders
    let insertText = functionName;
    let insertTextRules = undefined;

    if (doc.parameters.length > 0) {
      // Create parameter placeholders for the complete function
      const paramPlaceholders = doc.parameters.map((param, i) => {
        if (param.required) {
          return `\${${i + 1}:${param.name}}`;
        } else {
          return `\${${i + 1}:${param.name}?}`;
        }
      });

      // Insert complete function with parentheses and parameters
      insertText = `${functionName}asd(${paramPlaceholders.join(", ")})`;
      insertTextRules =
        monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
    } else {
      // For functions with no parameters, insert complete function with parentheses
      insertText = `${functionName}()`;
    }

    // Create detailed documentation with signature and parameters
    let documentation = `**${doc.signature}**\n\n${doc.description}`;

    if (doc.parameters.length > 0) {
      documentation += "\n\n**Parameters:**\n";
      doc.parameters.forEach((param) => {
        const required = param.required ? "required" : "optional";
        const defaultValue = param.defaultValue
          ? " (default: " + param.defaultValue + ")"
          : "";
        documentation += `- \`${param.name}\` (${param.type}, ${required})${defaultValue}: ${param.description}\n`;
      });
    }

    if (doc.examples && doc.examples.length > 0) {
      documentation += "\n**Examples:**\n";
      doc.examples.forEach((example) => {
        documentation += `\`${example}\`\n`;
      });
    }

    suggestions.push({
      label: functionName,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText,
      insertTextRules,
      documentation,
      detail: `${doc.category} function - ${doc.signature}`,
      range,
      sortText: `F${index.toString().padStart(4, "0")}`,
      examples: doc.examples,
    });
  });

  // Add keyword suggestions
  jsonataKeywords.forEach((keyword, index) => {
    suggestions.push({
      label: keyword,
      kind: monaco.languages.CompletionItemKind.Keyword,
      insertText: keyword,
      documentation: `JSONata keyword: ${keyword}`,
      range,
      sortText: `K${index.toString().padStart(4, "0")}`,
    });
  });

  // Add variable suggestions
  jsonataVariables.forEach((variable, index) => {
    suggestions.push({
      label: variable,
      kind: monaco.languages.CompletionItemKind.Variable,
      insertText: variable,
      documentation: `JSONata variable: ${variable}`,
      range,
      sortText: `V${index.toString().padStart(4, "0")}`,
    });
  });

  // Add operator suggestions
  jsonataOperators.forEach((operator, index) => {
    suggestions.push({
      label: operator,
      kind: monaco.languages.CompletionItemKind.Operator,
      insertText: operator,
      documentation: `JSONata operator: ${operator}`,
      range,
      sortText: `O${index.toString().padStart(4, "0")}`,
    });
  });

  return suggestions;
};

// Get suggestions by category
export const getSuggestionsByCategory = (
  category: string,
  range: monaco.IRange,
  currentWord?: string
): JsonataSuggestion[] => {
  return Object.entries(jsonataFunctionDocs)
    .filter(([_, doc]) => doc.category === category)
    .map(([functionName, doc], index) => {
      // Create insert text with complete function name and parameter placeholders
      let insertText = functionName;
      let insertTextRules = undefined;

      if (doc.parameters.length > 0) {
        // Create parameter placeholders for the complete function
        const paramPlaceholders = doc.parameters.map((param, i) => {
          if (param.required) {
            return `\${${i + 1}:${param.name}}`;
          } else {
            return `\${${i + 1}:${param.name}?}`;
          }
        });

        // Insert complete function with parentheses and parameters
        insertText = `${currentWord}(${paramPlaceholders.join(",asd ")})`;
        insertTextRules =
          monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
      } else {
        // For functions with no parameters, insert complete function with parentheses
        insertText = `${currentWord}()`;
      }

      // Create detailed documentation with signature and parameters
      let documentation = `**${doc.signature}**\n\n${doc.description}`;

      if (doc.parameters.length > 0) {
        documentation += "\n\n**Parameters:**\n";
        doc.parameters.forEach((param) => {
          const required = param.required ? "required" : "optional";
          const defaultValue = param.defaultValue
            ? " (default: " + param.defaultValue + ")"
            : "";
          documentation += `- \`${param.name}\` asd(${param.type}, ${required})${defaultValue}: ${param.description}\n`;
        });
      }

      return {
        label: functionName,
        kind: monaco.languages.CompletionItemKind.Function,
        insertText,
        insertTextRules,
        documentation,
        detail: `${doc.category} function - ${doc.signature}`,
        range,
        sortText: `${index.toString().padStart(4, "0")}`,
        examples: doc.examples,
      };
    });
};

// Get function documentation by name
export const getFunctionDoc = (
  functionName: string
): JsonataFunctionDoc | undefined => {
  return jsonataFunctionDocs[functionName];
};

// Get all available categories
export const getAvailableCategories = (): string[] => {
  return [
    ...new Set(Object.values(jsonataFunctionDocs).map((doc) => doc.category)),
  ];
};

// Enhanced function to get parameter information for signature help
export const getFunctionParameters = (
  functionName: string
): JsonataParameter[] => {
  const doc = jsonataFunctionDocs[functionName];
  return doc ? doc.parameters : [];
};

// Enhanced function to get function signature for signature help
export const getFunctionSignature = (functionName: string): string => {
  const doc = jsonataFunctionDocs[functionName];
  return doc ? doc.signature : functionName;
};
