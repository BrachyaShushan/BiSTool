import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { useAppContext } from "../../context/AppContext";
import { useTokenContext } from "../../context/TokenContext";
import { useAIConfigContext } from "../../context/AIConfigContext";
import { useProjectContext } from "../../context/ProjectContext";
import Editor from "@monaco-editor/react";
import {
  AITestGeneratorProps,
  EditorRef,
  EditorMountParams,
  AIResponse,
  AIConfig,
  AITestGeneratorConfig,
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
  FiLayers,
  FiTarget,
  FiTrendingUp,
  FiMonitor,
  FiWifi,
  FiCloud,
  FiPackage,
  FiGitBranch,
  FiShield,
  FiFileText,
  FiPlus,
  FiTrash2,
  FiCheckCircle,
  FiX,
  FiArrowRight,
  FiClock,
  FiStar,
  FiAward,
  FiBookOpen,
  FiCommand,
  FiTerminal,
  FiGrid,
  FiList,
  FiHash,
  FiTag,
  FiKey,
  FiMail,
  FiType,
  FiExternalLink,
  FiInfo,
  FiAlertTriangle,
  FiHelpCircle,
  FiTool,
  FiBox,
  FiArchive,
  FiFolder,
  FiFile,
  FiHardDrive,
  FiShare,
} from 'react-icons/fi';
import { aiProviderRegistry, validateAIConfig } from "../../utils/aiProviders";
import AIConfigPanel from "./AIConfigPanel";
import PromptConfigPanel from "./PromptConfigPanel";
import {
  Button,
  Card,
  Input,
  Textarea,
  Badge,
  IconButton,
  Toggle,
  Select,
  SectionHeader,
  MonacoEditor
} from "../ui";
import {
  PROGRAMMING_LANGUAGES,
  TEST_FRAMEWORKS,
  API_ENVIRONMENTS,
  TEST_STYLES,
  CODE_STYLES,
  AUTHENTICATION_TYPES,
  PROMPT_TEMPLATES,
  STORAGE_KEYS,
  DEFAULT_CONFIG_TEMPLATES
} from "../../constants/aiTestGenerator";

const AITestGenerator: React.FC<AITestGeneratorProps> = ({ yamlData }) => {
  const { isDarkMode } = useTheme();
  const { activeSession, handleSaveSession, openUnifiedManager } = useAppContext();
  const { tokenConfig } = useTokenContext();
  const { aiConfig, setAIConfig } = useAIConfigContext();
  const { currentProject } = useProjectContext();

  // Enhanced state management
  const [requirements, setRequirements] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedTest, setGeneratedTest] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [showAIConfig, setShowAIConfig] = useState<boolean>(false);
  const [showPromptConfig, setShowPromptConfig] = useState<boolean>(false);
  const [showStatusDashboard, setShowStatusDashboard] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [providerType, setProviderType] = useState<'cloud' | 'local' | 'custom'>('cloud');
  const editorRef = useRef<EditorRef["current"]>(null);
  const [lastYamlData, setLastYamlData] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<{ id: string; name: string } | null>(null);

  // Enhanced tracking
  const [generationHistory, setGenerationHistory] = useState<Array<{
    id: string;
    timestamp: string;
    language: string;
    framework: string;
    success: boolean;
    responseTime: number;
    tokensUsed: number;
    cost?: number;
  }>>([]);
  const [totalGenerations, setTotalGenerations] = useState<number>(0);
  const [totalCost, setTotalCost] = useState<number>(0);
  const [averageResponseTime, setAverageResponseTime] = useState<number>(0);

  // Enhanced configuration state
  const [testConfig, setTestConfig] = useState<AITestGeneratorConfig>({
    aiConfig,
    testFramework: "pytest",
    testStyle: "bdd",
    codeStyle: "functional",
    language: "python",
    outputFormat: "code",
    includeExamples: true,
    includeEdgeCases: true,
    includePerformanceTests: false,
    includeSecurityTests: false,
    includeLoadTests: false,
    includeContractTests: false,
    apiEnvironment: "rest",
    authenticationType: "bearer",
    responseValidation: "strict",
    errorHandling: "comprehensive",
    loggingLevel: "info",
    timeoutConfig: {
      request: 30000,
      response: 30000,
      global: 60000
    },
    retryConfig: {
      enabled: true,
      maxAttempts: 3,
      backoffStrategy: "exponential",
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    },
    dataDrivenTesting: {
      enabled: true,
      dataSource: "inline",
      dataFormat: "json"
    },
    parallelExecution: {
      enabled: true,
      maxConcurrency: 4,
      strategy: "process"
    },
    reporting: {
      format: "html",
      includeScreenshots: true,
      includeVideos: false,
      includeLogs: true
    },
    promptConfig: {
      preInstructions: "",
      postInstructions: "",
      customTemplates: {},
      languageSpecificPrompts: {},
      frameworkSpecificPrompts: {},
      environmentSpecificPrompts: {},
      qualityGates: {
        minTestCases: 5,
        maxTestCases: 50,
        requiredAssertions: ["status_code", "response_time"],
        forbiddenPatterns: ["sleep", "hardcoded_values"]
      }
    },
    projectId: currentProject?.id || '',
    lastModified: new Date().toISOString(),
    version: "2.0.0"
  });

  // Refs for timeout management to prevent memory leaks
  const copyPromptTimeoutRef = useRef<number | null>(null);
  const copyCodeTimeoutRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);

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
            <div className="flex justify-center items-center mx-auto mb-6 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full">
              <FiPlay className="w-8 h-8 text-white" />
            </div>
            <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white">
              No Active Session
            </h3>
            <p className="mx-auto mb-6 max-w-md text-gray-600 dark:text-gray-300">
              You need to create or select an active session before generating AI-powered tests.
              Please go to the Session Manager to create a session first.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 font-medium text-gray-700 bg-white rounded-lg border border-gray-300 transition-all duration-200 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  // Open session manager modal on sessions tab
                  openUnifiedManager('sessions');
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

  // Get available frameworks for selected language
  const getFrameworksForLanguage = (languageId: string): string[] => {
    const language = PROGRAMMING_LANGUAGES.find(l => l.id === languageId);
    return language?.frameworks || [];
  };

  // Enhanced prompt generation with multi-language and multi-environment support
  const promptGenerator = () => {
    const selectedLanguage = PROGRAMMING_LANGUAGES.find(l => l.id === testConfig.language);
    const selectedFramework = TEST_FRAMEWORKS[testConfig.testFramework as keyof typeof TEST_FRAMEWORKS];
    const selectedEnvironment = API_ENVIRONMENTS.find(e => e.id === testConfig.apiEnvironment);
    const selectedAuthType = AUTHENTICATION_TYPES.find(a => a.id === testConfig.authenticationType);

    // Get language-specific prompt template
    const languageTemplate = PROMPT_TEMPLATES[testConfig.language as keyof typeof PROMPT_TEMPLATES];
    const frameworkTemplate = languageTemplate?.[testConfig.testFramework as keyof typeof languageTemplate];

    const authInfo = selectedAuthType
      ? `\nAuthentication: This API uses ${selectedAuthType.name} authentication. ${selectedAuthType.implementation}`
      : '\nAuthentication: This API does not require authentication.';

    // Get selected tests for AI prompt
    const selectedTests = activeSession?.tests?.filter(test => test.includeInAIPrompt !== false) || [];

    const testScenarios = selectedTests.length > 0 ? `
    
EXISTING TEST SCENARIOS TO INCLUDE:
The following test scenarios have been manually created and should be incorporated into your generated tests:

${selectedTests.map((test, index) => `
Test Scenario ${index + 1}: ${test.name || `Test ${index + 1}`}
- Expected Status Code: ${test.expectedStatus}
- Expected Response: ${test.expectedResponse ? `\n\`\`\`json\n${test.expectedResponse}\n\`\`\`` : 'Any valid response'}
- Partial Response Match: ${test.expectedPartialResponse ? 'Yes' : 'No'}
- Use Authentication: ${test.useToken !== false ? 'Yes' : 'No'}
${test.pathOverrides && Object.keys(test.pathOverrides).length > 0 ? `- Path Variable Overrides: ${JSON.stringify(test.pathOverrides, null, 2)}` : ''}
${test.queryOverrides && Object.keys(test.queryOverrides).length > 0 ? `- Query Parameter Overrides: ${JSON.stringify(test.queryOverrides, null, 2)}` : ''}
${test.bodyOverride ? `- Request Body Override: \n\`\`\`json\n${test.bodyOverride}\n\`\`\`` : ''}
- Last Test Result: ${test.lastResult || 'Not run yet'}
${test.serverResponse ? `- Previous Server Response: \n\`\`\`json\n${test.serverResponse}\n\`\`\`` : ''}
`).join('\n')}

IMPORTANT: Your generated tests should cover all the scenarios above and expand upon them with additional edge cases and comprehensive testing patterns.
` : '';

    // Build enhanced prompt with configuration
    const enhancedPrompt = `
${testConfig.promptConfig.preInstructions ? `PRE-INSTRUCTIONS:\n${testConfig.promptConfig.preInstructions}\n\n` : ''}

Create comprehensive ${testConfig.testStyle.toUpperCase()} tests for the following ${selectedEnvironment?.name || 'API'} endpoint using ${selectedLanguage?.name || 'Python'} and ${selectedFramework?.name || 'pytest'}:

YAML SPECIFICATION:
${yamlData}

CONFIGURATION:
- Language: ${selectedLanguage?.name || 'Python'} (${selectedLanguage?.icon || '🐍'})
- Framework: ${selectedFramework?.name || 'pytest'}
- Test Style: ${testConfig.testStyle.toUpperCase()}
- Code Style: ${testConfig.codeStyle.toUpperCase()}
- API Environment: ${selectedEnvironment?.name || 'REST API'}
- Authentication: ${selectedAuthType?.name || 'None'}
- Response Validation: ${testConfig.responseValidation}
- Error Handling: ${testConfig.errorHandling}
- Logging Level: ${testConfig.loggingLevel}
- Timeout: ${testConfig.timeoutConfig.request}ms
- Retry: ${testConfig.retryConfig.enabled ? `${testConfig.retryConfig.maxAttempts} attempts` : 'Disabled'}
- Data-Driven Testing: ${testConfig.dataDrivenTesting.enabled ? 'Enabled' : 'Disabled'}
- Parallel Execution: ${testConfig.parallelExecution.enabled ? 'Enabled' : 'Disabled'}

${authInfo}

${testScenarios}

QUALITY REQUIREMENTS:
- Minimum Test Cases: ${testConfig.promptConfig.qualityGates.minTestCases}
- Maximum Test Cases: ${testConfig.promptConfig.qualityGates.maxTestCases}
- Required Assertions: ${testConfig.promptConfig.qualityGates.requiredAssertions.join(', ')}
- Forbidden Patterns: ${testConfig.promptConfig.qualityGates.forbiddenPatterns.join(', ')}

${frameworkTemplate ? `FRAMEWORK TEMPLATE:\n${frameworkTemplate}\n\n` : ''}

ADDITIONAL REQUIREMENTS:
${requirements}

${testConfig.promptConfig.postInstructions ? `POST-INSTRUCTIONS:\n${testConfig.promptConfig.postInstructions}\n\n` : ''}

IMPORTANT: Please ensure the response is complete and not cut off. Include all test cases and their implementations.
IMPORTANT: Generate tests in ${testConfig.codeStyle} style with ${testConfig.testStyle} approach.
IMPORTANT: Include proper error handling, logging, and validation as specified in the configuration.
`;

    return enhancedPrompt;
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

      // Track generation statistics
      const generationRecord = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        language: testConfig.language,
        framework: testConfig.testFramework,
        success: !response.error && !!response.content,
        responseTime: response.metadata.responseTime || 0,
        tokensUsed: response.metadata.tokensUsed || 0,
        cost: response.metadata.cost || 0
      };

      setGenerationHistory(prev => [generationRecord, ...prev.slice(0, 49)]); // Keep last 50
      setTotalGenerations(prev => prev + 1);
      setTotalCost(prev => prev + (response.metadata.cost || 0));

      // Update average response time
      const allResponseTimes = [generationRecord, ...generationHistory].map(g => g.responseTime);
      const newAverage = allResponseTimes.reduce((sum, time) => sum + time, 0) / allResponseTimes.length;
      setAverageResponseTime(newAverage);

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
      copyPromptTimeoutRef.current = window.setTimeout(() => {
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
      copyCodeTimeoutRef.current = window.setTimeout(() => {
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
      saveTimeoutRef.current = window.setTimeout(() => {
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

        {/* Enhanced Configuration Section */}
        <div className="p-6 bg-white rounded-2xl border border-gray-200 shadow-lg dark:bg-gray-800 dark:border-gray-700">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg">
                <FiSettings className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Test Configuration</h3>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                icon={FiTrendingUp}
                onClick={() => setShowStatusDashboard(true)}
                size="sm"
              >
                Status
              </Button>
              <Button
                variant="secondary"
                icon={FiHelpCircle}
                onClick={() => setShowHelp(true)}
                size="sm"
              >
                Help
              </Button>
              <Button
                variant="secondary"
                icon={FiFileText}
                onClick={() => setShowPromptConfig(true)}
                size="sm"
              >
                Prompt Config
              </Button>
              <Button
                variant="secondary"
                icon={FiSettings}
                onClick={() => setShowAIConfig(true)}
                size="sm"
              >
                AI Config
              </Button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Language and Framework Selection */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Programming Language
                </label>
                <Select
                  value={testConfig.language}
                  onChange={(e) => {
                    const value = e.target.value;
                    const language = PROGRAMMING_LANGUAGES.find(l => l.id === value);
                    setTestConfig(prev => ({
                      ...prev,
                      language: value as any,
                      testFramework: (language?.defaultFramework || 'pytest') as any
                    }));
                  }}
                  options={PROGRAMMING_LANGUAGES.map(lang => ({
                    value: lang.id,
                    label: `${lang.icon} ${lang.name}`
                  }))}
                  fullWidth
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Framework
                </label>
                <Select
                  value={testConfig.testFramework}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    testFramework: e.target.value as any
                  }))}
                  options={getFrameworksForLanguage(testConfig.language).map(fw => ({
                    value: fw,
                    label: fw
                  }))}
                  fullWidth
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Test Style
                </label>
                <Select
                  value={testConfig.testStyle}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    testStyle: e.target.value as any
                  }))}
                  options={TEST_STYLES.map(style => ({
                    value: style.id,
                    label: `${style.icon} ${style.name}`
                  }))}
                  fullWidth
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Code Style
                </label>
                <Select
                  value={testConfig.codeStyle}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    codeStyle: e.target.value as any
                  }))}
                  options={CODE_STYLES.map(style => ({
                    value: style.id,
                    label: `${style.icon} ${style.name}`
                  }))}
                  fullWidth
                />
              </div>
            </div>

            {/* API Environment and Authentication */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  API Environment
                </label>
                <Select
                  value={testConfig.apiEnvironment}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    apiEnvironment: e.target.value as any
                  }))}
                  options={API_ENVIRONMENTS.map(env => ({
                    value: env.id,
                    label: `${env.icon} ${env.name}`
                  }))}
                  fullWidth
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Authentication Type
                </label>
                <Select
                  value={testConfig.authenticationType}
                  onChange={(e) => setTestConfig(prev => ({
                    ...prev,
                    authenticationType: e.target.value as any
                  }))}
                  options={AUTHENTICATION_TYPES.map(auth => ({
                    value: auth.id,
                    label: `${auth.icon} ${auth.name}`
                  }))}
                  fullWidth
                />
              </div>
            </div>

            {/* Test Features */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Test Features
              </h4>
              <div className="grid gap-3 md:grid-cols-3">
                <Toggle
                  checked={testConfig.includeExamples}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includeExamples: checked
                  }))}
                  label="Include Examples"
                  colorScheme="blue"
                  size="sm"
                />
                <Toggle
                  checked={testConfig.includeEdgeCases}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includeEdgeCases: checked
                  }))}
                  label="Include Edge Cases"
                  colorScheme="green"
                  size="sm"
                />
                <Toggle
                  checked={testConfig.includePerformanceTests}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includePerformanceTests: checked
                  }))}
                  label="Performance Tests"
                  colorScheme="orange"
                  size="sm"
                />
                <Toggle
                  checked={testConfig.includeSecurityTests}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includeSecurityTests: checked
                  }))}
                  label="Security Tests"
                  colorScheme="red"
                  size="sm"
                />
                <Toggle
                  checked={testConfig.includeLoadTests}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includeLoadTests: checked
                  }))}
                  label="Load Tests"
                  colorScheme="purple"
                  size="sm"
                />
                <Toggle
                  checked={testConfig.includeContractTests}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    includeContractTests: checked
                  }))}
                  label="Contract Tests"
                  colorScheme="purple"
                  size="sm"
                />
              </div>
            </div>

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
              <Textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Specify any additional test requirements, edge cases, or specific scenarios you want to test..."
                rows={4}
                fullWidth
                disabled={!isEditing}
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Describe specific test scenarios, edge cases, or validation requirements for your API endpoint
              </p>
            </div>

            {/* Quick Actions Panel */}
            <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex items-center space-x-3 mb-4">
                <FiCommand className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Quick Actions
                </h4>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <Button
                  variant="secondary"
                  icon={FiCopy}
                  onClick={handleCopyPrompt}
                  size="sm"
                  fullWidth
                >
                  {copiedPrompt ? 'Copied!' : 'Copy Prompt'}
                </Button>

                <Button
                  variant="secondary"
                  icon={FiFile}
                  onClick={() => {
                    // Save current configuration
                    const configData = JSON.stringify(testConfig, null, 2);
                    const blob = new Blob([configData], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ai-test-config-${Date.now()}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  size="sm"
                  fullWidth
                >
                  Export Config
                </Button>

                <Button
                  variant="secondary"
                  icon={FiArchive}
                  onClick={() => {
                    // Import configuration
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          try {
                            const config = JSON.parse(e.target?.result as string);
                            setTestConfig(prev => ({ ...prev, ...config }));
                          } catch (error) {
                            console.error('Failed to parse config file:', error);
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    input.click();
                  }}
                  size="sm"
                  fullWidth
                >
                  Import Config
                </Button>

                <Button
                  variant="secondary"
                  icon={FiRefreshCw}
                  onClick={() => {
                    // Reset to defaults
                    setTestConfig(prev => ({
                      ...prev,
                      testFramework: "pytest",
                      testStyle: "bdd",
                      codeStyle: "functional",
                      language: "python",
                      includeExamples: true,
                      includeEdgeCases: true,
                      includePerformanceTests: false,
                      includeSecurityTests: false,
                      includeLoadTests: false,
                      includeContractTests: false,
                      apiEnvironment: "rest",
                      authenticationType: "bearer"
                    }));
                  }}
                  size="sm"
                  fullWidth
                >
                  Reset Defaults
                </Button>
              </div>
            </div>

            {/* Code Style Toggle */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
              <div className="flex items-center space-x-4">
                <Toggle
                  checked={testConfig.codeStyle === 'oop'}
                  onChange={(checked) => setTestConfig(prev => ({
                    ...prev,
                    codeStyle: checked ? 'oop' : 'functional'
                  }))}
                  label="Use Object-Oriented Programming style"
                  colorScheme="purple"
                  size="md"
                  position="left"
                  data-testid="use-oop-toggle"
                />
              </div>

              <div className="flex items-center space-x-2">
                <FiInfo className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {testConfig.codeStyle === 'oop' ? 'OOP Style' : 'Functional Style'}
                </span>
              </div>
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
                  onClick={() => {
                    // Open in new tab
                    const blob = new Blob([generatedTest], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    URL.revokeObjectURL(url);
                  }}
                  className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
                  title="Open in new tab"
                >
                  <FiExternalLink className="w-4 h-4" />
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

                <button
                  onClick={() => {
                    // Share code
                    if (navigator.share) {
                      navigator.share({
                        title: 'Generated Test Code',
                        text: generatedTest,
                        url: window.location.href
                      });
                    } else {
                      handleCopyCode();
                    }
                  }}
                  className="flex items-center px-4 py-2 space-x-2 font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-lg transition-all duration-200 group hover:scale-105 hover:shadow-xl"
                  title="Share code"
                >
                  <FiShare className="w-4 h-4" />
                  <span>Share</span>
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

                  {/* Code Quality Indicator */}
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <FiAward className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Quality Score
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      {(() => {
                        const qualityScore = Math.min(100, Math.max(0,
                          (aiResponse.metadata.tokensUsed / 1000) * 10 +
                          (aiResponse.metadata.responseTime < 5000 ? 20 : 0) +
                          (generatedTest.includes('def test_') ? 30 : 0) +
                          (generatedTest.includes('assert') ? 40 : 0)
                        ));
                        const stars = Math.ceil(qualityScore / 20);
                        return Array.from({ length: 5 }, (_, i) => (
                          <FiStar
                            key={i}
                            className={`w-4 h-4 ${i < stars ? 'text-yellow-500 fill-current' : 'text-gray-300 dark:text-gray-600'}`}
                          />
                        ));
                      })()}
                    </div>
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

        {/* Prompt Configuration Panel */}
        <PromptConfigPanel
          isOpen={showPromptConfig}
          onClose={() => setShowPromptConfig(false)}
          onConfigChange={(config) => setTestConfig(prev => ({
            ...prev,
            promptConfig: config
          }))}
          currentConfig={testConfig.promptConfig}
        />

        {/* Status Dashboard */}
        {showStatusDashboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                    <FiTrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      Generation Status Dashboard
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Track your AI test generation performance and statistics
                    </p>
                  </div>
                </div>
                <IconButton
                  icon={FiX}
                  onClick={() => setShowStatusDashboard(false)}
                  variant="ghost"
                  size="lg"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {/* Total Generations */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Generations
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {totalGenerations}
                          </p>
                        </div>
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                          <FiActivity className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Success Rate */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Success Rate
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {totalGenerations > 0
                              ? Math.round((generationHistory.filter(g => g.success).length / totalGenerations) * 100)
                              : 0}%
                          </p>
                        </div>
                        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                          <FiCheckCircle className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Average Response Time */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Avg Response Time
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {averageResponseTime > 0 ? `${Math.round(averageResponseTime)}ms` : 'N/A'}
                          </p>
                        </div>
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                          <FiClock className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Total Cost */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Total Cost
                          </p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ${totalCost.toFixed(4)}
                          </p>
                        </div>
                        <div className="p-2 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg">
                          <FiDollarSign className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Language Distribution */}
                <div className="mt-6">
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FiLayers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Language Distribution
                        </h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-3">
                        {Object.entries(
                          generationHistory.reduce((acc, gen) => {
                            acc[gen.language] = (acc[gen.language] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([language, count]) => (
                          <div key={language} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <FiCode className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {language}
                              </span>
                            </div>
                            <Badge variant="primary" size="sm">
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Generations */}
                <div className="mt-6">
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FiList className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Recent Generations
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {generationHistory.slice(0, 5).map((gen) => (
                          <div key={gen.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-1 rounded ${gen.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                {gen.success ? (
                                  <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                ) : (
                                  <FiX className="w-4 h-4 text-red-600 dark:text-red-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {gen.language} - {gen.framework}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(gen.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                              <span>{gen.responseTime}ms</span>
                              <span>•</span>
                              <span>{gen.tokensUsed} tokens</span>
                              {gen.cost && (
                                <>
                                  <span>•</span>
                                  <span>${gen.cost.toFixed(4)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Help Panel */}
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                    <FiHelpCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      AI Test Generator Help
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Learn how to use the AI Test Generator effectively
                    </p>
                  </div>
                </div>
                <IconButton
                  icon={FiX}
                  onClick={() => setShowHelp(false)}
                  variant="ghost"
                  size="lg"
                />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Quick Start */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FiPlay className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Quick Start Guide
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Select Language & Framework</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Choose your preferred programming language and testing framework from the dropdown menus.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">2</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Configure API Environment</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Set the API environment type and authentication method for your tests.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Add Requirements</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Describe any specific test requirements, edge cases, or scenarios you want to test.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">4</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Generate Tests</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Click "Generate Pytest Code" to create comprehensive tests using AI.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Features */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FiStar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Key Features
                        </h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="flex items-start space-x-3">
                          <FiTarget className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Multi-Language Support</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Generate tests in 16+ programming languages with their native frameworks.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiShield className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Quality Assurance</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Built-in quality gates and validation to ensure high-quality test generation.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiLayers className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Multi-Environment</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Support for REST, GraphQL, SOAP, gRPC, WebSocket, and more API types.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiTool className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">Custom Prompts</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Configure custom prompts and templates for specific use cases.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Tips */}
                  <Card variant="elevated" className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center space-x-3 mb-4">
                        <FiInfo className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Pro Tips
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-1" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Use specific requirements to get more targeted test generation.
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-1" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Enable different test features based on your testing needs.
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-1" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Save your configurations for consistent test generation across projects.
                          </p>
                        </div>
                        <div className="flex items-start space-x-3">
                          <FiCheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 mt-1" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Monitor your generation statistics to optimize costs and performance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITestGenerator;
