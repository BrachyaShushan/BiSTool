import * as monaco from "monaco-editor";

export interface JsonataSuggestion {
  label: string;
  kind: monaco.languages.CompletionItemKind;
  insertText: string;
  documentation: string;
  range: monaco.IRange;
  sortText: string;
  detail?: string;
  examples?: string[];
}

export interface JsonataFunctionDoc {
  description: string;
  examples: string[];
  category: string;
}

// Comprehensive JSONata function documentation
export const jsonataFunctionDocs: { [key: string]: JsonataFunctionDoc } = {
  // Array functions
  $map: {
    description: "Transform each item in an array using a function",
    examples: [
      '$map(data, { "id": id, "name": name })',
      "$map(numbers, $ * 2)",
      '$map(users, { "fullName": firstName & " " & lastName })',
    ],
    category: "Array",
  },
  $filter: {
    description: "Filter array items based on a condition",
    examples: [
      '$filter(data, status = "active")',
      "$filter(users, age > 18)",
      "$filter(products, price < 100)",
    ],
    category: "Array",
  },
  $reduce: {
    description: "Reduce an array to a single value",
    examples: [
      "$reduce(numbers, $sum)",
      "$reduce(data, $merge)",
      "$reduce(values, $max)",
    ],
    category: "Array",
  },
  $sort: {
    description: "Sort array items",
    examples: [
      "$sort(data, name)",
      "$sort(users, -age)",
      "$sort(products, price)",
    ],
    category: "Array",
  },
  $distinct: {
    description: "Remove duplicate items from an array",
    examples: [
      "$distinct(categories)",
      "$distinct(data.status)",
      "$distinct(users.department)",
    ],
    category: "Array",
  },
  $count: {
    description: "Count the number of items in an array",
    examples: [
      "$count(data)",
      "$count($filter(users, active = true))",
      "$count($distinct(categories))",
    ],
    category: "Array",
  },
  $sum: {
    description: "Calculate the sum of array values",
    examples: [
      "$sum(prices)",
      "$sum($map(data, amount))",
      "$sum($filter(values, $ > 0))",
    ],
    category: "Array",
  },
  $avg: {
    description: "Calculate the average of array values",
    examples: [
      "$avg(scores)",
      "$avg($map(data, rating))",
      "$avg($filter(values, $isNumber($)))",
    ],
    category: "Array",
  },
  $min: {
    description: "Find the minimum value in an array",
    examples: [
      "$min(prices)",
      "$min($map(data, value))",
      "$min($filter(numbers, $ > 0))",
    ],
    category: "Array",
  },
  $max: {
    description: "Find the maximum value in an array",
    examples: [
      "$max(scores)",
      "$max($map(data, amount))",
      "$max($filter(values, $isNumber($)))",
    ],
    category: "Array",
  },
  $append: {
    description: "Add an item to the end of an array",
    examples: [
      "$append(array, newItem)",
      '$append(users, { "id": 999, "name": "New User" })',
    ],
    category: "Array",
  },
  $prepend: {
    description: "Add an item to the beginning of an array",
    examples: [
      "$prepend(array, newItem)",
      '$prepend(users, { "id": 0, "name": "First User" })',
    ],
    category: "Array",
  },
  $reverse: {
    description: "Reverse the order of items in an array",
    examples: ["$reverse(array)", "$reverse($sort(data, name))"],
    category: "Array",
  },
  $shuffle: {
    description: "Randomly shuffle the items in an array",
    examples: ["$shuffle(array)", "$shuffle(users)"],
    category: "Array",
  },
  $zip: {
    description: "Combine multiple arrays into an array of objects",
    examples: ["$zip(names, ages)", "$zip(ids, names, emails)"],
    category: "Array",
  },
  $slice: {
    description: "Extract a portion of an array",
    examples: ["$slice(array, 0, 10)", "$slice(users, 5, 15)"],
    category: "Array",
  },
  $sift: {
    description: "Remove null and undefined values from an array",
    examples: ["$sift(array)", "$sift($map(data, optionalField))"],
    category: "Array",
  },
  $join: {
    description: "Join array items into a string",
    examples: ['$join(array, ", ")', '$join(names, " and ")'],
    category: "Array",
  },

  // Object functions
  $merge: {
    description: "Merge multiple objects into one",
    examples: [
      "$merge(obj1, obj2)",
      '$merge($map(data, { "id": id }), { "type": "item" })',
      "$merge(defaults, overrides)",
    ],
    category: "Object",
  },
  $keys: {
    description: "Get all keys from an object as an array",
    examples: [
      "$keys(user)",
      "$keys($first(data))",
      "$keys($merge(obj1, obj2))",
    ],
    category: "Object",
  },
  $values: {
    description: "Get all values from an object as an array",
    examples: [
      "$values(user)",
      "$values($first(data))",
      "$values($merge(obj1, obj2))",
    ],
    category: "Object",
  },
  $lookup: {
    description: "Look up a value in an object using a key",
    examples: ['$lookup(obj, "key")', '$lookup(user, "name")'],
    category: "Object",
  },
  $spread: {
    description: "Spread object properties into the current context",
    examples: ["$spread(user)", "$spread($first(data))"],
    category: "Object",
  },
  $each: {
    description: "Iterate over object key-value pairs",
    examples: [
      '$each(obj, { "key": $key, "value": $value })',
      '$each(user, { "field": $key, "data": $value })',
    ],
    category: "Object",
  },
  $base64encode: {
    description: "Encode a string to base64",
    examples: ['$base64encode("Hello World")', "$base64encode($string(data))"],
    category: "Object",
  },
  $base64decode: {
    description: "Decode a base64 string",
    examples: [
      '$base64decode("SGVsbG8gV29ybGQ=")',
      "$base64decode(encodedData)",
    ],
    category: "Object",
  },

  // String functions
  $string: {
    description: "Convert a value to a string",
    examples: ["$string(123)", "$string(true)", "$string($now())"],
    category: "String",
  },
  $substring: {
    description: "Extract a substring from a string",
    examples: ['$substring("Hello World", 0, 5)', "$substring(name, 0, 10)"],
    category: "String",
  },
  $split: {
    description: "Split a string into an array",
    examples: ['$split("a,b,c", ",")', '$split(url, "/")'],
    category: "String",
  },
  $trim: {
    description: "Remove whitespace from the beginning and end of a string",
    examples: ['$trim("  hello  ")', "$trim(name)"],
    category: "String",
  },
  $lowercase: {
    description: "Convert a string to lowercase",
    examples: ['$lowercase("Hello World")', "$lowercase(name)"],
    category: "String",
  },
  $uppercase: {
    description: "Convert a string to uppercase",
    examples: ['$uppercase("hello world")', "$uppercase(status)"],
    category: "String",
  },
  $replace: {
    description: "Replace text in a string",
    examples: [
      '$replace("hello world", "world", "there")',
      '$replace(name, " ", "_")',
    ],
    category: "String",
  },
  $contains: {
    description: "Check if a string contains a substring",
    examples: ['$contains("hello world", "world")', '$contains(name, "John")'],
    category: "String",
  },
  $startsWith: {
    description: "Check if a string starts with a substring",
    examples: [
      '$startsWith("hello world", "hello")',
      '$startsWith(url, "https://")',
    ],
    category: "String",
  },
  $endsWith: {
    description: "Check if a string ends with a substring",
    examples: [
      '$endsWith("hello world", "world")',
      '$endsWith(filename, ".json")',
    ],
    category: "String",
  },
  $pad: {
    description: "Pad a string to a specified length",
    examples: ['$pad("123", 5, "0")', '$pad(name, 20, " ")'],
    category: "String",
  },
  $format: {
    description: "Format a string with placeholders",
    examples: [
      '$format("Hello {name}!", { "name": "World" })',
      '$format("User {id}: {name}", user)',
    ],
    category: "String",
  },
  $formatNumber: {
    description: "Format a number with specified precision",
    examples: ["$formatNumber(123.456, 2)", "$formatNumber(price, 2)"],
    category: "String",
  },
  $formatBase: {
    description: "Format a number in a specific base",
    examples: ["$formatBase(255, 16)", "$formatBase(id, 2)"],
    category: "String",
  },
  $encodeUrlComponent: {
    description: "URL encode a string component",
    examples: [
      '$encodeUrlComponent("hello world")',
      "$encodeUrlComponent(query)",
    ],
    category: "String",
  },
  $decodeUrlComponent: {
    description: "URL decode a string component",
    examples: [
      '$decodeUrlComponent("hello%20world")',
      "$decodeUrlComponent(encodedQuery)",
    ],
    category: "String",
  },
  $encodeUrl: {
    description: "URL encode a string",
    examples: ['$encodeUrl("https://example.com/path")', "$encodeUrl(url)"],
    category: "String",
  },
  $decodeUrl: {
    description: "URL decode a string",
    examples: [
      '$decodeUrl("https%3A//example.com/path")',
      "$decodeUrl(encodedUrl)",
    ],
    category: "String",
  },

  // Number functions
  $number: {
    description: "Convert a value to a number",
    examples: ['$number("123")', '$number("12.34")', "$number(true)"],
    category: "Number",
  },
  $round: {
    description: "Round a number to the nearest integer",
    examples: ["$round(3.7)", "$round(price)"],
    category: "Number",
  },
  $floor: {
    description: "Round a number down to the nearest integer",
    examples: ["$floor(3.7)", "$floor(price)"],
    category: "Number",
  },
  $ceil: {
    description: "Round a number up to the nearest integer",
    examples: ["$ceil(3.2)", "$ceil(price)"],
    category: "Number",
  },
  $abs: {
    description: "Get the absolute value of a number",
    examples: ["$abs(-5)", "$abs(difference)"],
    category: "Number",
  },
  $power: {
    description: "Raise a number to a power",
    examples: ["$power(2, 3)", "$power(base, exponent)"],
    category: "Number",
  },
  $sqrt: {
    description: "Calculate the square root of a number",
    examples: ["$sqrt(16)", "$sqrt(value)"],
    category: "Number",
  },
  $random: {
    description: "Generate a random number",
    examples: ["$random()", "$random(1, 100)"],
    category: "Number",
  },

  // Boolean functions
  $boolean: {
    description: "Convert a value to a boolean",
    examples: ["$boolean(1)", '$boolean("true")', "$boolean($exists(value))"],
    category: "Boolean",
  },
  $exists: {
    description: "Check if a value exists (is not null or undefined)",
    examples: [
      "$exists(user.name)",
      "$exists($lookup(data, key))",
      "$exists($first(array))",
    ],
    category: "Boolean",
  },
  $not: {
    description: "Logical NOT operator",
    examples: ["$not(true)", "$not($exists(value))"],
    category: "Boolean",
  },
  $all: {
    description: "Check if all items in an array are true",
    examples: ["$all($map(users, active))", "$all($map(numbers, $ > 0))"],
    category: "Boolean",
  },
  $any: {
    description: "Check if any item in an array is true",
    examples: ["$any($map(users, active))", "$any($map(numbers, $ > 100))"],
    category: "Boolean",
  },
  $none: {
    description: "Check if no items in an array are true",
    examples: ["$none($map(users, active))", "$none($map(numbers, $ < 0))"],
    category: "Boolean",
  },
  $some: {
    description: "Check if some items in an array are true",
    examples: ["$some($map(users, active))", "$some($map(numbers, $ > 50))"],
    category: "Boolean",
  },

  // Type functions
  $type: {
    description: "Get the type of a value",
    examples: ['$type("hello")', "$type(123)", "$type([1, 2, 3])"],
    category: "Type",
  },
  $isArray: {
    description: "Check if a value is an array",
    examples: ["$isArray([1, 2, 3])", "$isArray(data)"],
    category: "Type",
  },
  $isObject: {
    description: "Check if a value is an object",
    examples: ['$isObject({ "key": "value" })', "$isObject(user)"],
    category: "Type",
  },
  $isString: {
    description: "Check if a value is a string",
    examples: ['$isString("hello")', "$isString(name)"],
    category: "Type",
  },
  $isNumber: {
    description: "Check if a value is a number",
    examples: ["$isNumber(123)", "$isNumber(price)"],
    category: "Type",
  },
  $isBoolean: {
    description: "Check if a value is a boolean",
    examples: ["$isBoolean(true)", "$isBoolean(active)"],
    category: "Type",
  },
  $isInteger: {
    description: "Check if a value is an integer",
    examples: ["$isInteger(123)", "$isInteger(id)"],
    category: "Type",
  },

  // Date functions
  $now: {
    description: "Get the current date and time",
    examples: ["$now()", "$string($now())"],
    category: "Date",
  },
  $millis: {
    description: "Get the current time in milliseconds",
    examples: ["$millis()", "$millis($now())"],
    category: "Date",
  },
  $fromMillis: {
    description: "Convert milliseconds to a date",
    examples: ["$fromMillis(1640995200000)", "$fromMillis(timestamp)"],
    category: "Date",
  },
  $toMillis: {
    description: "Convert a date to milliseconds",
    examples: ["$toMillis($now())", "$toMillis(date)"],
    category: "Date",
  },
  $formatDateTime: {
    description: "Format a date/time value",
    examples: [
      '$formatDateTime($now(), "YYYY-MM-DD")',
      '$formatDateTime(date, "MM/DD/YYYY")',
    ],
    category: "Date",
  },
  $parseDateTime: {
    description: "Parse a date/time string",
    examples: [
      '$parseDateTime("2023-01-01", "YYYY-MM-DD")',
      "$parseDateTime(dateString, format)",
    ],
    category: "Date",
  },

  // JSON functions
  $stringify: {
    description: "Convert a value to a JSON string",
    examples: ['$stringify({ "key": "value" })', "$stringify(data)"],
    category: "JSON",
  },
  $parse: {
    description: "Parse a JSON string",
    examples: ['$parse(\'{"key": "value"}\')', "$parse(jsonString)"],
    category: "JSON",
  },
  $eval: {
    description: "Evaluate a JSONata expression",
    examples: ['$eval("$sum(numbers)")', "$eval(expression)"],
    category: "JSON",
  },
  $jsonata: {
    description: "Create a JSONata expression",
    examples: ['$jsonata("$sum(numbers)")', "$jsonata(expressionString)"],
    category: "JSON",
  },

  // Conditional functions
  $if: {
    description: "Conditional expression",
    examples: [
      '$if(age > 18, "adult", "minor")',
      '$if($exists(name), name, "Unknown")',
      '$if(status = "active", true, false)',
    ],
    category: "Conditional",
  },
  $case: {
    description: "Case statement for multiple conditions",
    examples: [
      '$case(status = "active", "green", status = "pending", "yellow", "red")',
      '$case(score >= 90, "A", score >= 80, "B", score >= 70, "C", "F")',
    ],
    category: "Conditional",
  },
  $switch: {
    description: "Switch statement",
    examples: [
      '$switch(status, "active", "green", "pending", "yellow", "red")',
      '$switch(value, 1, "one", 2, "two", "unknown")',
    ],
    category: "Conditional",
  },
  $match: {
    description: "Pattern matching",
    examples: [
      '$match(value, "pattern", "result")',
      '$match(name, "^A.*", "starts with A")',
    ],
    category: "Conditional",
  },

  // Grouping functions
  $group: {
    description: "Group array items by a key and aggregate values",
    examples: [
      '$group(data, category, { "count": $count(), "total": $sum(amount) })',
      '$group(users, department, { "employees": $count(), "avgSalary": $avg(salary) })',
    ],
    category: "Grouping",
  },
  $orderBy: {
    description: "Order array items by specified criteria",
    examples: ["$orderBy(data, name)", "$orderBy(users, -age, name)"],
    category: "Grouping",
  },
  $limit: {
    description: "Limit the number of items returned",
    examples: ["$limit(data, 10)", "$limit($sort(users, -score), 5)"],
    category: "Grouping",
  },
  $offset: {
    description: "Skip a number of items",
    examples: ["$offset(data, 10)", "$offset($sort(users, -score), 20)"],
    category: "Grouping",
  },

  // Math functions
  $add: {
    description: "Add two numbers",
    examples: ["$add(5, 3)", "$add(a, b)"],
    category: "Math",
  },
  $subtract: {
    description: "Subtract two numbers",
    examples: ["$subtract(10, 3)", "$subtract(total, discount)"],
    category: "Math",
  },
  $multiply: {
    description: "Multiply two numbers",
    examples: ["$multiply(4, 5)", "$multiply(price, quantity)"],
    category: "Math",
  },
  $divide: {
    description: "Divide two numbers",
    examples: ["$divide(10, 2)", "$divide(total, count)"],
    category: "Math",
  },
  $mod: {
    description: "Get the remainder of division",
    examples: ["$mod(7, 3)", "$mod(id, 10)"],
    category: "Math",
  },
  $pow: {
    description: "Raise a number to a power",
    examples: ["$pow(2, 3)", "$pow(base, exponent)"],
    category: "Math",
  },
  $log: {
    description: "Calculate the natural logarithm",
    examples: ["$log(2.718)", "$log(value)"],
    category: "Math",
  },
  $exp: {
    description: "Calculate e raised to a power",
    examples: ["$exp(1)", "$exp(power)"],
    category: "Math",
  },

  // Aggregation functions
  $collect: {
    description: "Collect values into an array",
    examples: ['$collect(data, "category")', '$collect(users, "department")'],
    category: "Aggregation",
  },
  $collectAs: {
    description: "Collect values into an array with a specific name",
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
    examples: [
      '$map(data, { "item": $, "rootId": $$.id })',
      "$filter(users, $.department = $$.currentDepartment)",
    ],
    category: "Context",
  },
  $context: {
    description: "Access the current context",
    examples: ["$context", "$context.parent"],
    category: "Context",
  },
  $parent: {
    description: "Access the parent context",
    examples: ["$parent", "$parent.name"],
    category: "Context",
  },
  $root: {
    description: "Access the root context",
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
  range: monaco.IRange
): JsonataSuggestion[] => {
  const suggestions: JsonataSuggestion[] = [];

  // Add function suggestions
  Object.entries(jsonataFunctionDocs).forEach(([functionName, doc], index) => {
    suggestions.push({
      label: functionName,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: functionName,
      documentation: doc.description,
      detail: `${doc.category} function`,
      range,
      sortText: `${index.toString().padStart(4, "0")}`,
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
  range: monaco.IRange
): JsonataSuggestion[] => {
  return Object.entries(jsonataFunctionDocs)
    .filter(([_, doc]) => doc.category === category)
    .map(([functionName, doc], index) => ({
      label: functionName,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText: functionName,
      documentation: doc.description,
      detail: `${doc.category} function`,
      range,
      sortText: `${index.toString().padStart(4, "0")}`,
      examples: doc.examples,
    }));
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
