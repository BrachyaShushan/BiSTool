import React, { useState, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import Editor from "@monaco-editor/react";
import Anthropic from "@anthropic-ai/sdk/index.mjs";
import {
  AITestGeneratorProps,
  EditorRef,
  EditorMountParams,
  AnthropicResponse,
} from "../types/AITestGenerator";

const AITestGenerator: React.FC<AITestGeneratorProps> = ({ yamlData }) => {
  const { isDarkMode } = useTheme();
  const [requirements, setRequirements] = useState<string>("");
  const [useOOP, setUseOOP] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<string>("");
  const [error, setError] = useState<string>("");
  const editorRef = useRef<EditorRef["current"]>(null);

  const generatePytestCode = async (): Promise<void> => {
    setIsLoading(true);
    setError("");

    try {
      const anthropic = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const prompt = `Create BDD-style pytest tests for the following Flask API endpoint based on this OpenAPI YAML specification:

${yamlData}

IMPORTANT: The tests must follow the exact style and structure of my existing test files, with these requirements:

1. Use test_client from app.tests for all HTTP requests (NOT the requests library)
2. Create a helper function that takes a role and all necessary parameters for the endpoint
3. Use get_user_test_headers(role) for authentication headers
4. Write detailed BDD-style docstrings with Given/When/Then format in each test function
5. Use pytest.mark.parametrize for testing multiple parameter combinations
6. Use AssertionMessages constants for standard assertions (status200, status400, res_data, etc.)
7. Validate response structure with proper type checking
8. Test all applicable user roles (company, division, region, facility)
9. Include tests for all relevant status codes (200, 204, 400, 404, etc.)
10. Add type hints for all function parameters and variables
11. Store the variables that are used in the test cases in a dictionary in top of the test file

Your tests should include:
- A helper function to make requests to the endpoint with different parameters
- Tests for valid requests with various parameter combinations
- Tests for invalid parameter formats (400 errors)
- Tests for non-existent resources (404 errors)
- Validation of response structure including data fields, types, and values
- At least one data validation test with specific expected response values

Follow this general structure:
\`\`\`python
from typing import Dict, Optional
from app.tests.messages import AssertionMessages
from app.tests import get_user_test_headers, test_client
import pytest


def fetch_endpoint_data(role: str, param1: str, param2: str, filters: Optional[Dict] = None):
    """Helper function to fetch data from the endpoint."""
    headers = get_user_test_headers(role)
    
    query_string = filters or {}
    url = f"/api/endpoint/{param1}/{param2}"
    
    res = test_client.get(
        url,
        headers=headers,
        query_string=query_string
    )
    return res


@pytest.mark.parametrize(
    "role, param1, param2, filters",
    [
        # Test cases here
    ]
)
def test_endpoint_status_200(role, param1, param2, filters):
    """
    Scenario: Retrieve data with valid parameters
    
    Given:
        - Valid parameters 
        - The user has appropriate role permissions
    
    When:
        - Requesting data with these parameters
    
    Then:
        - The API should return a status code of 200
        - The response should have the expected structure
    """
    # Test implementation
\`\`\`

Additional Requirements:
${requirements}

IMPORTANT: Please ensure the response is complete and not cut off. Include all test cases and their implementations.
IMPORTANT: ${useOOP
          ? "Please generate the test code in object-oriented style"
          : "Please generate the test code in functional style"
        }`;

      const response: AnthropicResponse = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      if (!response.content || !response.content[0]?.text) {
        throw new Error("No test code generated");
      }

      const generatedCode = response.content[0].text;

      // Check if the response is complete
      if (generatedCode.includes("...") || generatedCode.endsWith('"')) {
        throw new Error("Generated test code appears to be incomplete");
      }

      setGeneratedTest(generatedCode);
    } catch (err) {
      console.error("Error generating test code:", err);
      setError(
        `Failed to generate test code: ${err instanceof Error ? err.message : "Unknown error"
        }`
      );
      // Fallback to sample code if there's an error
      setGeneratedTest(generateSampleTestCode());
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleTestCode = (): string => {
    let endpoint = "https://api.example.com/resource";
    let method = "GET";

    try {
      const endpointMatch = yamlData.match(/url:\s*["']?(.*?)["']?$/m);
      const methodMatch = yamlData.match(
        /method:\s*["']?(GET|POST|PUT|DELETE|PATCH)["']?$/m
      );

      if (endpointMatch && endpointMatch[1]) {
        endpoint = endpointMatch[1];
      }

      if (methodMatch && methodMatch[1]) {
        method = methodMatch[1];
      }
    } catch (e) {
      console.error("Error parsing YAML:", e);
    }

    return `from typing import Dict, Optional
from app.tests.messages import AssertionMessages
from app.tests import get_user_test_headers, test_client
import pytest


def fetch_endpoint_data(role: str, param1: str, param2: str, filters: Optional[Dict] = None):
    """Helper function to fetch data from the endpoint."""
    headers = get_user_test_headers(role)
    
    query_string = filters or {}
    url = f"${endpoint}/{param1}/{param2}"
    
    res = test_client.${method.toLowerCase()}(
        url,
        headers=headers,
        query_string=query_string
    )
    return res


@pytest.mark.parametrize(
    "role, param1, param2, filters",
    [
        ("company", "valid_param1", "valid_param2", None),
        ("division", "valid_param1", "valid_param2", {"filter": "value"}),
        ("region", "valid_param1", "valid_param2", None),
        ("facility", "valid_param1", "valid_param2", None),
    ]
)
def test_endpoint_status_200(role: str, param1: str, param2: str, filters: Optional[Dict]):
    """
    Scenario: Retrieve data with valid parameters
    
    Given:
        - Valid parameters ({param1}, {param2})
        - The user has {role} role permissions
        - Optional filters: {filters ? JSON.stringify(filters) : 'None'}
    
    When:
        - Requesting data with these parameters
    
    Then:
        - The API should return a status code of 200
        - The response should have the expected structure
    """
    res = fetch_endpoint_data(role, param1, param2, filters)
    
    assert res.status_code == 200, AssertionMessages.status200
    data = res.get_json()
    assert isinstance(data, dict), AssertionMessages.res_data
    assert "data" in data, "Response should contain 'data' field"


@pytest.mark.parametrize(
    "role, param1, param2, filters, expected_status",
    [
        ("company", "invalid_param", "valid_param2", None, 400),
        ("division", "valid_param1", "", None, 400),
        ("region", "valid_param1", "invalid_format", None, 400),
    ]
)
def test_endpoint_status_400(role: str, param1: str, param2: str, filters: Optional[Dict], expected_status: int):
    """
    Scenario: Handle invalid parameters
    
    Given:
        - Invalid parameters ({param1}, {param2})
        - The user has {role} role permissions
        - Optional filters: {filters ? JSON.stringify(filters) : 'None'}
    
    When:
        - Requesting data with these invalid parameters
    
    Then:
        - The API should return a status code of {expected_status}
        - The response should contain an error message
    """
    res = fetch_endpoint_data(role, param1, param2, filters)
    
    assert res.status_code == expected_status, AssertionMessages.status400
    data = res.get_json()
    assert "error" in data, "Response should contain 'error' field"
    assert "message" in data["error"], "Error should contain a message"`;
  };

  const handleGenerateCode = async (): Promise<void> => {
    try {
      await generatePytestCode();
    } catch (err) {
      console.error("Using fallback code generation Error: " + err);
      setGeneratedTest(generateSampleTestCode());
    }
  };

  const handleEditorDidMount = (
    editor: EditorMountParams["editor"],
    monaco: EditorMountParams["monaco"]
  ): void => {
    editorRef.current = editor;

    // Configure Python syntax highlighting
    monaco.languages.register({ id: "python" });
    monaco.languages.setMonarchTokensProvider("python", {
      defaultToken: "",
      tokenPostfix: ".python",
      keywords: [
        "and",
        "as",
        "assert",
        "break",
        "class",
        "continue",
        "def",
        "del",
        "elif",
        "else",
        "except",
        "finally",
        "for",
        "from",
        "global",
        "if",
        "import",
        "in",
        "is",
        "lambda",
        "nonlocal",
        "not",
        "or",
        "pass",
        "raise",
        "return",
        "try",
        "while",
        "with",
        "yield",
      ],
      tokenizer: {
        root: [
          // Comments
          [/#.*$/, "comment"],

          // Strings
          [/'([^'\\]|\\.)*$/, "string.invalid"],
          [/'([^'\\]|\\.)*'/, "string"],
          [/"([^"\\]|\\.)*$/, "string.invalid"],
          [/"([^"\\]|\\.)*"/, "string"],

          // Numbers
          [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
          [/\d+/, "number"],

          // Keywords
          [/@\w+/, "annotation"],
          [
            /\b(and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield)\b/,
            "keyword",
          ],

          // Identifiers
          [/\b[A-Za-z_]\w*\b/, "identifier"],

          // Whitespace
          [/\s+/, "white"],

          // Delimiters
          [/[{}()[\]]/, "@brackets"],
          [/[;,.]/, "delimiter"],

          // Operators
          [/[+\-*/%&|^!~<>]=?/, "operator"],
        ],
      },
    });
  };

  // Calculate editor height based on content
  const getEditorHeight = (): number => {
    if (!generatedTest) return 200; // Default height
    const lineCount = generatedTest.split("\n").length;
    return Math.min(Math.max(lineCount * 20, 200), 800); // Min 200px, max 800px
  };

  return (
    <div
      className={`p-4 ${isDarkMode ? "bg-gray-800" : "bg-gray-50"
        } rounded-lg shadow`}
    >
      <h2
        className={`text-xl font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"
          }`}
      >
        AI Test Generator
      </h2>

      <div className="mb-4">
        <label
          className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Additional Test Requirements
        </label>
        <textarea
          value={requirements}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setRequirements(e.target.value)
          }
          placeholder="Specify any additional test requirements, edge cases, or specific scenarios you want to test..."
          className={`w-full h-32 p-2 border rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${isDarkMode
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-white border-gray-300 text-gray-900"
            }`}
        />
      </div>

      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          id="use-oop"
          checked={useOOP}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setUseOOP(e.target.checked)
          }
          className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? "border-gray-600" : "border-gray-300"
            }`}
        />
        <label
          htmlFor="use-oop"
          className={`ml-2 block text-sm ${isDarkMode ? "text-white" : "text-gray-700"
            }`}
        >
          Use Object-Oriented Programming style for test classes
        </label>
      </div>

      <div className="mb-6">
        <button
          onClick={handleGenerateCode}
          disabled={isLoading || !yamlData}
          className={`w-full inline-flex justify-center items-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${isLoading || !yamlData
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            }`}
        >
          {isLoading ? (
            <>
              <svg
                className="w-5 h-5 mr-3 -ml-1 text-white animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Generating...
            </>
          ) : (
            "Generate Pytest Code"
          )}
        </button>
      </div>

      {error && (
        <div
          className={`mb-4 p-3 rounded ${isDarkMode ? "bg-red-900 text-red-100" : "bg-red-100 text-red-700"
            }`}
        >
          {error}
        </div>
      )}

      {generatedTest && (
        <div>
          <div className="flex justify-between mt-4">
            <h3
              className={`text-lg font-medium mb-2 ${isDarkMode ? "text-white" : "text-gray-700"
                }`}
            >
              Generated Pytest Code
            </h3>
            <button
              onClick={() => navigator.clipboard.writeText(generatedTest)}
              className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md ${isDarkMode
                ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Copy Code
            </button>
          </div>
          <div
            className={`border rounded-md overflow-hidden ${isDarkMode ? "border-gray-600" : "border-gray-300"
              }`}
          >
            <Editor
              height={getEditorHeight()}
              defaultLanguage="python"
              value={generatedTest}
              theme={isDarkMode ? "vs-dark" : "vs-light"}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollbar: {
                  vertical: "visible",
                  horizontal: "visible",
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },
                automaticLayout: true,
                wordWrap: "on",
              }}
              onMount={handleEditorDidMount}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AITestGenerator;
