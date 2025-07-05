import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import { useAIConfigContext } from "../../context/AIConfigContext";
import Editor from "@monaco-editor/react";
import {
  AITestGeneratorProps,
  EditorRef,
  EditorMountParams,
  AIResponse,
  AIConfig,
} from "../../types/components/components.types";
import {
  FiPlay,
  FiCopy,
  FiDownload,
  FiSettings,
  FiCpu,
  FiZap,
  FiCheck,
  FiAlertCircle,
  FiRefreshCw,
  FiSave,
  FiEdit,
  FiEye,
  FiCode,
  FiDatabase,
  FiServer,
  FiGlobe,
  FiHome,
  FiActivity,
  FiDollarSign,
} from 'react-icons/fi';
import { aiProviderRegistry, validateAIConfig } from "../../utils/aiProviders";
import AIConfigPanel from "./AIConfigPanel";
import { Toggle } from "../ui";

const AITestGenerator: React.FC<AITestGeneratorProps> = ({ yamlData }) => {
  const { isDarkMode } = useTheme();
  const { activeSession, handleSaveSession, tokenConfig, generateAuthHeaders, openSessionManager } = useAppContext();
  const { aiConfig, setAIConfig } = useAIConfigContext();
  const [requirements, setRequirements] = useState<string>("");
  const [useOOP, setUseOOP] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [showAIConfig, setShowAIConfig] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [providerType, setProviderType] = useState<'cloud' | 'local' | 'custom'>('cloud');
  const editorRef = useRef<EditorRef["current"]>(null);
  const [lastYamlData, setLastYamlData] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string } | null>(null);

  // Refs for timeout management to prevent memory leaks
  const copyPromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const copyCodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (copyPromptTimeoutRef.current) {
        clearTimeout(copyPromptTimeoutRef.current);
      }
      if (copyCodeTimeoutRef.current) {
        clearTimeout(copyCodeTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Check if there's an active session
  if (!activeSession) {
    return (
      <div className="space-y-6">
        {/* Header Section */}
        <div className="overflow-hidden relative p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500 rounded-full -translate-x-12 translate-y-12"></div>
          </div>

          <div className="flex relative justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <FiPlay className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                  AI Test Generator
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Generate comprehensive pytest tests using AI-powered code generation
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
                <FiCpu className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold text-green-700 dark:text-green-300">AI Powered</span>
              </div>
              <div className="flex items-center px-4 py-2 space-x-2 rounded-xl">
                <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl dark:from-purple-900 dark:to-purple-800">
                  <FiDatabase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Smart Generation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* No Active Session Warning */}
        <div className="p-8 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <FiPlay className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              You need to create or select an active session before generating AI-powered tests.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg transition-all duration-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openSessionManager({ tab: 'sessions' });
                }}
                className="px-6 py-3 font-medium text-white bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg transition-all duration-200 hover:scale-105 hover:shadow-lg"
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Load requirements from session on mount/session change
  useEffect(() => {
    if (activeSession && typeof activeSession.requirements === "string") {
      setRequirements(activeSession.requirements);
    } else {
      setRequirements("");
    }
  }, [activeSession?.id]);

  useEffect(() => {
    // Only update lastYamlData if yamlData has actually changed
    if (yamlData !== lastYamlData) {
      setLastYamlData(yamlData);
      // Clear generated test when yamlData changes
      setGeneratedTest("");
      setError("");
    }
  }, [yamlData]);

  // Save requirements to session when it changes
  useEffect(() => {
    if (activeSession && requirements !== activeSession.requirements) {
      const updatedSession = {
        ...activeSession,
        requirements,
      };
      handleSaveSession(activeSession.name, updatedSession);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requirements]);

  const promptGenerator = (): string => {
    // Generate authentication information for the prompt
    const authHeaders = generateAuthHeaders();
    const authInfo = Object.keys(authHeaders).length > 0
      ? `Authentication Configuration:
    - Type: ${tokenConfig.authType}
    - Headers: ${Object.entries(authHeaders).map(([key, value]) => `${key}: ${value.includes('.') ? value.split('.').map(() => 'xxx').join('.') : 'xxx'}`).join(', ')}
    - Token Name: ${tokenConfig.tokenName}
    - Header Key: ${tokenConfig.headerKey}
    - Header Format: ${tokenConfig.headerValueFormat}`
      : 'No authentication configured';

    const prompt = `Create BDD-style pytest tests for the following Flask API endpoint based on this OpenAPI YAML specification:

    ${yamlData}
    
    ${authInfo}
    
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
    return prompt;
  };

  const generatePytestCode = async (): Promise<void> => {
    setIsLoading(true);
    setError("");
    setAiResponse(null);

    try {
      // Validate AI configuration
      const validation = validateAIConfig(aiConfig);
      if (!validation.isValid) {
        throw new Error(`AI Configuration Error: ${validation.errors.join(', ')}`);
      }

      const provider = aiProviderRegistry.getProvider(aiConfig.provider);
      if (!provider) {
        throw new Error(`Unknown AI provider: ${aiConfig.provider}`);
      }

      const model = provider.models.find(m => m.id === aiConfig.model);
      if (!model) {
        throw new Error(`Unknown model: ${aiConfig.model}`);
      }

      const prompt = promptGenerator();
      const startTime = Date.now();

      let response: AIResponse;

      // Handle different AI providers
      if (aiConfig.provider === 'openai') {
        response = await callOpenAI(prompt, aiConfig);
      } else if (aiConfig.provider === 'anthropic') {
        response = await callAnthropic(prompt, aiConfig);
      } else if (aiConfig.provider === 'google') {
        response = await callGoogle(prompt, aiConfig);
      } else if (aiConfig.provider === 'ollama') {
        response = await callOllama(prompt, aiConfig);
      } else if (aiConfig.provider === 'openai-compatible') {
        response = await callOpenAICompatible(prompt, aiConfig);
      } else {
        throw new Error(`Unsupported AI provider: ${aiConfig.provider}`);
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Calculate cost if available
      const cost = aiProviderRegistry.calculateCost(
        aiConfig.provider,
        aiConfig.model,
        prompt.length / 4, // Rough token estimation
        response.content.length / 4
      );

      // Update response metadata
      response.metadata = {
        ...response.metadata,
        responseTime,
        cost,
      };

      setAiResponse(response);

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.content) {
        throw new Error("No test code generated");
      }

      const generatedCode = response.content;

      // Check if the response is complete
      if (generatedCode.includes("```python") && !generatedCode.includes("```")) {
        throw new Error("Generated code appears to be incomplete. Please try again.");
      }

      setGeneratedTest(generatedCode);

      // Save to session
      if (activeSession) {
        const updatedSession = {
          ...activeSession,
          generatedTest: generatedCode,
          aiResponse: response,
        };
        handleSaveSession(activeSession.name, updatedSession);
      }

    } catch (err) {
      console.error("Error generating test code:", err);
      setError(err instanceof Error ? err.message : "Failed to generate test code");
    } finally {
      setIsLoading(false);
    }
  };

  // AI Provider API calls
  const callOpenAI = async (prompt: string, config: AIConfig): Promise<AIResponse> => {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKeys['openai'] || ''}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        content: data.choices[0]?.message?.content || '',
        metadata: {
          provider: 'openai',
          model: config.model,
          tokensUsed: data.usage?.total_tokens || 0,
          responseTime,
          ...(data.usage && { cost: (data.usage.total_tokens / 1000) * 0.002 }),
        },
      };
    } catch (error) {
      throw new Error(`OpenAI API call failed: ${error}`);
    }
  };

  const callAnthropic = async (prompt: string, config: AIConfig): Promise<AIResponse> => {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKeys['anthropic'] || '',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: config.maxTokens,
          messages: [{ role: 'user', content: prompt }],
          temperature: config.temperature,
          top_p: config.topP,
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        content: data.content[0]?.text || '',
        metadata: {
          provider: 'anthropic',
          model: config.model,
          tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
          responseTime,
          ...(data.usage && { cost: ((data.usage.input_tokens + data.usage.output_tokens) / 1000) * 0.015 }),
        },
      };
    } catch (error) {
      throw new Error(`Anthropic API call failed: ${error}`);
    }
  };

  const callGoogle = async (prompt: string, config: AIConfig): Promise<AIResponse> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKeys['google'] || ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature,
            topP: config.topP,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Google API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        content: data.candidates[0]?.content?.parts[0]?.text || '',
        metadata: {
          provider: 'google',
          model: config.model,
          tokensUsed: data.usageMetadata?.totalTokenCount || 0,
          responseTime,
        },
      };
    } catch (error) {
      throw new Error(`Google API call failed: ${error}`);
    }
  };

  const callOllama = async (prompt: string, config: AIConfig): Promise<AIResponse> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${config.baseUrl || 'http://localhost:11434'}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          prompt,
          options: {
            num_predict: config.maxTokens,
            temperature: config.temperature,
            top_p: config.topP,
            repeat_penalty: 1.0 + config.frequencyPenalty * 0.1, // Convert frequency penalty to repeat penalty
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      let content = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              content += data.response;
            }
            if (data.done) {
              break;
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        content,
        metadata: {
          provider: 'ollama',
          model: config.model,
          tokensUsed: 0, // Ollama doesn't provide token usage
          responseTime,
        },
      };
    } catch (error) {
      throw new Error(`Ollama API call failed: ${error}`);
    }
  };

  const callOpenAICompatible = async (prompt: string, config: AIConfig): Promise<AIResponse> => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${config.baseUrl || 'http://localhost:8000'}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKeys['openai-compatible'] && { 'Authorization': `Bearer ${config.apiKeys['openai-compatible']}` }),
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
          top_p: config.topP,
          frequency_penalty: config.frequencyPenalty,
          presence_penalty: config.presencePenalty,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      return {
        content: data.choices[0]?.message?.content || '',
        metadata: {
          provider: 'openai-compatible',
          model: config.model,
          tokensUsed: data.usage?.total_tokens || 0,
          responseTime,
        },
      };
    } catch (error) {
      throw new Error(`OpenAI-compatible API call failed: ${error}`);
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

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptGenerator());
      setCopiedPrompt(true);

      // Clear any existing timeout
      if (copyPromptTimeoutRef.current) {
        clearTimeout(copyPromptTimeoutRef.current);
      }

      // Set new timeout with reference
      copyPromptTimeoutRef.current = setTimeout(() => {
        setCopiedPrompt(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy prompt:', err);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(generatedTest);
      setCopiedCode(true);

      // Clear any existing timeout
      if (copyCodeTimeoutRef.current) {
        clearTimeout(copyCodeTimeoutRef.current);
      }

      // Set new timeout with reference
      copyCodeTimeoutRef.current = setTimeout(() => {
        setCopiedCode(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const downloadTestFile = () => {
    const blob = new Blob([generatedTest], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_test.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveGeneratedTest = async () => {
    if (!generatedTest || !activeSession) return;

    setIsSaving(true);
    try {
      const updatedSession = {
        ...activeSession,
        generatedTest,
        lastGenerated: new Date().toISOString(),
      };
      await handleSaveSession(activeSession.name, updatedSession);

      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Show success feedback with timeout reference
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
      }, 2000);
    } catch (error) {
      setError('Failed to save generated test');
      setIsSaving(false);
    }
  };

  const handleEditRequirements = () => {
    setIsEditing(!isEditing);
  };

  const updateProviderType = (providerId: string) => {
    const provider = aiProviderRegistry.getProvider(providerId);
    if (provider) {
      if (provider.isCustom) {
        setProviderType('custom');
      } else if (provider.isLocal) {
        setProviderType('local');
      } else {
        setProviderType('cloud');
      }
    }
  };

  // Update provider type when AI config changes
  useEffect(() => {
    updateProviderType(aiConfig.provider);
  }, [aiConfig.provider]);

  // Update selected model when AI config changes
  useEffect(() => {
    const provider = aiProviderRegistry.getProvider(aiConfig.provider);
    if (provider) {
      const model = provider.models.find(m => m.id === aiConfig.model);
      if (model) {
        setSelectedModel({ id: model.id, name: model.name });
      }
    }
  }, [aiConfig.provider, aiConfig.model]);

  const getModelIcon = (modelId: string): string => {
    const modelIcons: Record<string, string> = {
      // OpenAI Models
      'gpt-4o': '🤖',
      'gpt-4o-mini': '⚡',
      'gpt-3.5-turbo': '🚀',
      'gpt-4': '🧠',

      // Anthropic Models
      'claude-3-5-sonnet-20241022': '🧠',
      'claude-3-5-haiku-20241022': '🌸',
      'claude-3': '🧠',

      // Google Models
      'gemini-1.5-pro': '🔮',
      'gemini-1.5-flash': '⚡',
      'gemini-pro': '🔮',

      // Ollama Models
      'llama3.2:3b': '🦙',
      'llama3.2:7b': '🦙',
      'codellama:7b': '💻',

      // Custom Models
      'custom-model': '🔧',
    };

    return modelIcons[modelId] || '🤖';
  };

  const getModelColor = (modelId: string): string => {
    const modelColors: Record<string, string> = {
      // OpenAI Models
      'gpt-4o': '#10a37f',
      'gpt-4o-mini': '#10a37f',
      'gpt-3.5-turbo': '#10a37f',
      'gpt-4': '#10a37f',

      // Anthropic Models
      'claude-3-5-sonnet-20241022': '#d97706',
      'claude-3-5-haiku-20241022': '#d97706',
      'claude-3': '#d97706',

      // Google Models
      'gemini-1.5-pro': '#4285f4',
      'gemini-1.5-flash': '#4285f4',
      'gemini-pro': '#4285f4',

      // Ollama Models
      'llama3.2:3b': '#059669',
      'llama3.2:7b': '#059669',
      'codellama:7b': '#059669',

      // Custom Models
      'custom-model': '#7c3aed',
    };

    return modelColors[modelId] || '#6b7280';
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="overflow-hidden relative p-6 bg-gradient-to-r from-purple-50 via-pink-50 to-indigo-50 rounded-2xl border border-purple-100 shadow-lg dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 dark:opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full translate-x-16 -translate-y-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500 rounded-full -translate-x-12 translate-y-12"></div>
        </div>

        <div className="flex relative justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <FiPlay className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400">
                AI Test Generator
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Generate comprehensive pytest tests using AI-powered code generation
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAIConfig(true)}
              className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
            >
              <FiSettings className="w-4 h-4" />
              <span>AI Config</span>
            </button>
            <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-green-100 to-green-200 rounded-xl dark:from-green-900 dark:to-green-800">
              <FiCpu className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">AI Powered</span>
            </div>
            <div className="flex items-center px-4 py-2 space-x-2 rounded-xl">
              <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl dark:from-purple-900 dark:to-purple-800">
                <FiDatabase className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Smart Generation</span>
              </div>
            </div>

            {/* Provider Type Indicator */}
            <div className={`flex items-center px-4 py-2 space-x-2 rounded-xl ${providerType === 'cloud'
              ? 'bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800'
              : providerType === 'local'
                ? 'bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800'
                : 'bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800'
              }`}>
              {providerType === 'cloud' ? (
                <FiGlobe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              ) : providerType === 'local' ? (
                <FiHome className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <FiServer className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
              <span className={`text-sm font-semibold ${providerType === 'cloud'
                ? 'text-blue-700 dark:text-blue-300'
                : providerType === 'local'
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-purple-700 dark:text-purple-300'
                }`}>
                {providerType.charAt(0).toUpperCase() + providerType.slice(1)} Provider
              </span>
            </div>
            {/* Current Model Indicator */}
            {selectedModel && (
              <div className="flex items-center px-4 py-2 space-x-2 bg-gradient-to-r from-indigo-100 to-indigo-200 rounded-xl dark:from-indigo-900 dark:to-indigo-800">
                <div
                  className="flex justify-center items-center w-6 h-6 text-sm text-white rounded-md shadow-sm"
                  style={{ backgroundColor: getModelColor(selectedModel.id) }}
                >
                  {getModelIcon(selectedModel.id)}
                </div>
                <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                  {selectedModel.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center mb-6 space-x-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
              <FiSettings className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Test Configuration</h3>
          </div>

          <div className="space-y-6">
            {/* Requirements Input */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Additional Test Requirements
                </label>
                <button
                  onClick={handleEditRequirements}
                  className="flex items-center px-3 py-1 space-x-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg transition-colors hover:bg-gray-200 dark:text-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  <FiEdit className="w-3 h-3" />
                  <span>{isEditing ? 'Done' : 'Edit'}</span>
                </button>
              </div>
              <textarea
                value={requirements}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setRequirements(e.target.value)
                }
                placeholder="Specify any additional test requirements, edge cases, or specific scenarios you want to test..."
                className={`px-4 py-3 w-full text-gray-900 bg-white rounded-xl border border-gray-300 shadow-sm transition-all duration-200 resize-none dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isEditing ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}
                rows={4}
                readOnly={!isEditing}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Describe specific test scenarios, edge cases, or validation requirements for your API endpoint
              </p>
            </div>

            {/* Options Row */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <Toggle
                  checked={useOOP}
                  onChange={(checked) => setUseOOP(checked)}
                  label="Use Object-Oriented Programming style"
                  colorScheme="purple"
                  size="md"
                  position="left"
                  data-testid="use-oop-toggle"
                />
              </div>

              <button
                onClick={handleCopyPrompt}
                className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
              >
                {copiedPrompt ? (
                  <>
                    <FiCheck className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <FiCopy className="w-4 h-4" />
                    <span>Copy Prompt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generatePytestCode}
            disabled={isLoading || !yamlData}
            className={`group px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-3 ${isLoading || !yamlData
              ? "bg-gray-400 text-gray-600 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:scale-105"
              }`}
          >
            {isLoading ? (
              <>
                <FiRefreshCw className="w-5 h-5 animate-spin" />
                <span>Generating Tests...</span>
              </>
            ) : (
              <>
                <FiPlay className="w-5 h-5" />
                <span>Generate Pytest Code</span>
              </>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200 dark:from-red-900 dark:to-red-800 dark:border-red-700">
            <div className="flex items-center space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h4 className="text-sm font-semibold text-red-800 dark:text-red-200">Generation Error</h4>
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Generated Code Section */}
        {generatedTest && (
          <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                  <FiCode className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generated Pytest Code</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    AI-generated test code ready for your API endpoint
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  title={showPreview ? "Hide preview" : "Show preview"}
                >
                  {showPreview ? <FiEye className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleSaveGeneratedTest}
                  disabled={isSaving || !activeSession}
                  className={`flex items-center px-4 py-2 space-x-2 font-semibold text-white rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl ${isSaving || !activeSession
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-orange-600 to-orange-700'
                    }`}
                >
                  {isSaving ? (
                    <>
                      <FiRefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FiSave className="w-4 h-4" />
                      <span>Save to Session</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                >
                  {copiedCode ? (
                    <>
                      <FiCheck className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <FiCopy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
                <button
                  onClick={downloadTestFile}
                  className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                >
                  <FiDownload className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* AI Response Metadata */}
            {aiResponse && (
              <div className="p-4 mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 dark:from-blue-900 dark:to-blue-800 dark:border-blue-700">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <FiZap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        {aiResponse.metadata.provider.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiCpu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {aiResponse.metadata.model}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiActivity className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-green-700 dark:text-green-300">
                        {aiResponse.metadata.tokensUsed} tokens
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiRefreshCw className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-purple-700 dark:text-purple-300">
                        {aiResponse.metadata.responseTime}ms
                      </span>
                    </div>
                    {aiResponse.metadata.cost !== undefined && aiResponse.metadata.cost > 0 && (
                      <div className="flex items-center space-x-2">
                        <FiDollarSign className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-300">
                          ${aiResponse.metadata.cost.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Code Preview */}
            {showPreview && (
              <div className="relative">
                <Editor
                  height={getEditorHeight()}
                  defaultLanguage="python"
                  value={generatedTest}
                  theme={isDarkMode ? "vs-dark" : "light"}
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
                    },
                  }}
                  onMount={handleEditorDidMount}
                />
              </div>
            )}
          </div>
        )}

        {/* AI Configuration Panel */}
        <AIConfigPanel
          isOpen={showAIConfig}
          onClose={() => setShowAIConfig(false)}
          onConfigChange={setAIConfig}
          currentConfig={aiConfig}
        />
      </div>
    </div>
  );
};

export default AITestGenerator;
