import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Editor as MonacoEditor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import jsonata from 'jsonata';
import { FiUpload, FiDownload, FiPlay, FiInfo, FiAlertCircle, FiCheckCircle, FiXCircle, FiCopy, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import {
    generateJsonataSuggestions,
    getFunctionDoc,
    jsonataKeywords,
    jsonataVariables,
    jsonataOperators,
    jsonataFunctionDocs,
    JsonataSuggestion
} from '../../utils/jsonataSuggestions';
import Modal from '../ui/Modal';
import { copyToClipboard } from '../../utils/clipboard';
import { Button } from '../ui';

interface SessionImporterProps {
    onImportSessions?: (sessions: any[]) => void;
}

interface ImportedData {
    name: string;
    data: any;
    timestamp: string;
}

// Global variable to store the current imported data for suggestions
let currentImportedData: ImportedData | null = {
    name: 'test.json',
    data: {
        name: 'Test Data',
        users: [
            {
                id: 1,
                name: 'John Doe',
                email: 'john@example.com',
                profile: {
                    age: 30,
                    city: 'New York',
                    preferences: {
                        theme: 'dark',
                        language: 'en'
                    }
                }
            },
            {
                id: 2,
                name: 'Jane Smith',
                email: 'jane@example.com',
                profile: {
                    age: 25,
                    city: 'Los Angeles',
                    preferences: {
                        theme: 'light',
                        language: 'es'
                    }
                }
            }
        ],
        settings: {
            active: true,
            version: '1.0.0',
            config: {
                environment: 'production',
                debug: false
            }
        }
    },
    timestamp: new Date().toISOString()
};

// Global flag to track if JSONata language is registered
let jsonataLanguageRegistered = false;

// Custom JSONata language definition
const registerJsonataLanguage = (monacoInstance: typeof monaco) => {

    // Check if language is already registered to prevent duplicates
    if (jsonataLanguageRegistered) {
        return;
    }

    try {
        const existingLanguages = monacoInstance.languages.getLanguages();
        const jsonataExists = existingLanguages.some(lang => lang.id === 'jsonata');

        if (jsonataExists) {
            jsonataLanguageRegistered = true;
            return;
        }
    } catch (error) {
        console.warn('Could not check existing languages:', error);
    }

    // Define JSONata language
    try {
        monacoInstance.languages.register({ id: 'jsonata' });
        jsonataLanguageRegistered = true;
    } catch (error) {
        console.error('Failed to register jsonata language:', error);
        return; // Exit if registration fails
    }

    // Verify registration
    try {
        const languagesAfterRegistration = monacoInstance.languages.getLanguages();
        const jsonataRegistered = languagesAfterRegistration.some(lang => lang.id === 'jsonata');
        if (!jsonataRegistered) {
            console.error('JSONata language registration failed - not found in languages list');
            jsonataLanguageRegistered = false;
            return;
        }
    } catch (error) {
        console.warn('Could not verify language registration:', error);
    }

    // Function to generate suggestions from data structure
    const generateDataStructureSuggestions = (data: any, range: monaco.IRange): JsonataSuggestion[] => {
        const suggestions: JsonataSuggestion[] = [];

        // Helper function to extract properties from an object with unlimited depth
        const extractProperties = (obj: any, path: string = '', maxDepth: number = 10): { [key: string]: any } => {
            const properties: { [key: string]: any } = {};

            // Prevent infinite recursion
            if (path.split('.').length > maxDepth) {
                return properties;
            }

            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                Object.keys(obj).forEach(key => {
                    const currentPath = path ? `${path}.${key}` : key;
                    properties[currentPath] = obj[key];

                    // Recursively extract nested properties (unlimited depth)
                    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                        const nestedProps = extractProperties(obj[key], currentPath, maxDepth);
                        Object.assign(properties, nestedProps);
                    }
                });
            } else if (Array.isArray(obj) && obj.length > 0) {
                // For arrays, show the first item's properties and also array-specific properties
                properties[path ? `${path}[0]` : '[0]'] = obj[0];
                properties[path ? `${path}.length` : 'length'] = obj.length;

                const firstItem = obj[0];
                if (firstItem && typeof firstItem === 'object') {
                    const arrayProps = extractProperties(firstItem, path ? `${path}[0]` : '[0]', maxDepth);
                    Object.assign(properties, arrayProps);
                }
            }

            return properties;
        };

        // Extract properties from the entire imported file object with unlimited depth
        const properties = extractProperties(data);

        // Create suggestions for each property with better organization
        Object.entries(properties).forEach(([key, value], index) => {
            const pathParts = key.split('.');
            const displayKey = pathParts[pathParts.length - 1] || key;
            const fullPath = key;

            let kind = monacoInstance.languages.CompletionItemKind.Field;
            let detail = '';
            let documentation = '';

            if (Array.isArray(value)) {
                kind = monacoInstance.languages.CompletionItemKind.Class;
                detail = `Array (${value.length} items)`;
                documentation = `Array property: ${fullPath} with ${value.length} items`;
            } else if (typeof value === 'object' && value !== null) {
                kind = monacoInstance.languages.CompletionItemKind.Class;
                detail = 'Object';
                documentation = `Object property: ${fullPath}`;
            } else if (typeof value === 'string') {
                kind = monacoInstance.languages.CompletionItemKind.Text;
                detail = 'String';
                documentation = `String property: ${fullPath} = "${value}"`;
            } else if (typeof value === 'number') {
                kind = monacoInstance.languages.CompletionItemKind.Value;
                detail = 'Number';
                documentation = `Number property: ${fullPath} = ${value}`;
            } else if (typeof value === 'boolean') {
                kind = monacoInstance.languages.CompletionItemKind.Value;
                detail = 'Boolean';
                documentation = `Boolean property: ${fullPath} = ${value}`;
            } else if (value === null) {
                kind = monacoInstance.languages.CompletionItemKind.Value;
                detail = 'Null';
                documentation = `Null property: ${fullPath}`;
            } else if (value === undefined) {
                kind = monacoInstance.languages.CompletionItemKind.Value;
                detail = 'Undefined';
                documentation = `Undefined property: ${fullPath}`;
            }

            // Create the full path for insertion (handle array indices)
            let insertText = displayKey;
            if (displayKey.startsWith('[') && displayKey.endsWith(']')) {
                // For array indices, insert the full path
                insertText = key;
            }

            suggestions.push({
                label: displayKey,
                kind,
                insertText,
                documentation,
                detail: `${detail} - ${fullPath}`,
                range,
                sortText: `D${index.toString().padStart(4, '0')}`
            });
        });

        return suggestions;
    };

    // Define JSONata tokens with enhanced syntax highlighting
    try {
        monacoInstance.languages.setMonarchTokensProvider('jsonata', {
            // Keywords
            keywords: jsonataKeywords,

            // Functions - comprehensive list from JSONata documentation
            functions: Object.keys(jsonataFunctionDocs),

            // Variables
            variables: jsonataVariables,

            // Operators
            operators: jsonataOperators,

            // Symbols
            symbols: /[=><!~?:&|+\-*\/\^%]+/,

            // Escapes
            escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

            // The main tokenizer for our languages
            tokenizer: {
                root: [
                    // Identifiers and keywords
                    [/[a-zA-Z_$][\w$]*/, {
                        cases: {
                            '@keywords': 'keyword',
                            '@functions': 'function',
                            '@variables': 'variable',
                            '@default': 'identifier'
                        }
                    }],

                    // Whitespace
                    { include: '@whitespace' },

                    // Delimiters and operators
                    [/[{}()\[\]]/, '@brackets'],
                    [/[<>](?!@symbols)/, '@brackets'],
                    [/@symbols/, {
                        cases: {
                            '@operators': 'operator',
                            '@default': ''
                        }
                    }],

                    // Numbers
                    [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                    [/0[xX][0-9a-fA-F]+/, 'number.hex'],
                    [/\d+/, 'number'],

                    // Strings
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/'/, { token: 'string.quote', bracket: '@open', next: '@string_single' }],

                    // Comments
                    [/\/\*/, { token: 'comment.quote', next: '@comment' }],
                    [/\/\/.*$/, 'comment'],
                ],

                whitespace: [
                    [/[ \t\r\n]+/, 'white'],
                ],

                comment: [
                    [/[^\/*]+/, 'comment'],
                    [/\*\//, { token: 'comment.quote', next: '@pop' }],
                    [/[\/*]/, 'comment']
                ],

                string: [
                    [/[^\\"]+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],

                string_single: [
                    [/[^\\']+/, 'string'],
                    [/@escapes/, 'string.escape'],
                    [/\\./, 'string.escape.invalid'],
                    [/'/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
                ],
            }
        });
    } catch (error) {
        console.error('Failed to set tokens provider:', error);
    }

    // Enhanced completion provider with better suggestions
    try {

        // Dispose any existing provider first
        try {
            monacoInstance.languages.registerCompletionItemProvider('jsonata', {
                provideCompletionItems: () => ({ suggestions: [] })
            });
        } catch (error) {
            // Provider might not exist, that's okay
        }

        monacoInstance.languages.registerCompletionItemProvider('jsonata', {
            provideCompletionItems: (model, position) => {

                const word = model.getWordUntilPosition(position);
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                };

                // Get the current line text to determine context
                const lineText = model.getLineContent(position.lineNumber);
                const beforeCursor = lineText.substring(0, position.column - 1);

                // Generate comprehensive suggestions using the utility
                let suggestions = generateJsonataSuggestions(range, word.word);

                // Add suggestions from imported data structure
                if (currentImportedData) {
                    const dataSuggestions = generateDataStructureSuggestions(currentImportedData.data, range);
                    suggestions = [...suggestions, ...dataSuggestions];
                }

                // Simple filtering based on context
                if (word.word.startsWith('$')) {
                    // Show only $ suggestions when typing $
                    suggestions = suggestions.filter(s => s.label.startsWith('$'));
                } else if (beforeCursor.endsWith('$.') || beforeCursor.endsWith('$.')) {
                    // Show only data properties after $.
                    suggestions = suggestions.filter(s => s.sortText.startsWith('D'));
                } else if (word.word.length > 0) {
                    // Filter by what user is typing
                    suggestions = suggestions.filter(s =>
                        s.label.toLowerCase().includes(word.word.toLowerCase())
                    );
                }

                // Convert JsonataSuggestion to Monaco CompletionItem
                const completionItems: monaco.languages.CompletionItem[] = suggestions.map(suggestion => {
                    const item: monaco.languages.CompletionItem = {
                        label: suggestion.label,
                        kind: suggestion.kind,
                        insertText: suggestion.insertText,
                        documentation: suggestion.documentation,
                        range: suggestion.range,
                        sortText: suggestion.sortText
                    };

                    // Only add optional properties if they're defined
                    if (suggestion.detail !== undefined) {
                        item.detail = suggestion.detail;
                    }
                    if (suggestion.command !== undefined) {
                        item.command = suggestion.command;
                    }
                    if (suggestion.insertTextRules !== undefined) {
                        item.insertTextRules = suggestion.insertTextRules;
                    }

                    return item;
                });

                return { suggestions: completionItems };
            },
            triggerCharacters: ['$', '.', ' ', '(', ',', '[', '{']
        });

    } catch (error) {
        console.error('Failed to register JSONata completion provider:', error);
    }

    // Enhanced hover provider with better documentation
    try {
        monacoInstance.languages.registerHoverProvider('jsonata', {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (!word) return null;

                const doc = getFunctionDoc(word.word);
                if (doc) {
                    return {
                        contents: [
                            { value: `**${doc.signature}**` },
                            { value: doc.description },
                            { value: '**Examples:**' },
                            ...doc.examples.map(example => ({ value: `\`${example}\`` }))
                        ]
                    };
                }
                return null;
            }
        });
    } catch (error) {
        console.error('Failed to register JSONata hover provider:', error);
    }

    // Signature help provider for function parameters
    try {
        monacoInstance.languages.registerSignatureHelpProvider('jsonata', {
            signatureHelpTriggerCharacters: ['(', ','],
            signatureHelpRetriggerCharacters: [','],
            provideSignatureHelp: (model, position) => {
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });

                // Find the function name before the current position
                const functionMatch = textUntilPosition.match(/(\$[a-zA-Z_$][\w$]*)\s*\([^)]*$/);
                if (!functionMatch) return null;

                const functionName = functionMatch[1];
                const doc = getFunctionDoc(functionName || '');
                if (!doc) return null;

                // Count commas to determine which parameter we're on
                const openParenIndex = textUntilPosition.lastIndexOf('(');
                if (openParenIndex === -1) return null;

                const textAfterParen = textUntilPosition.substring(openParenIndex + 1);
                const commaCount = (textAfterParen.match(/,/g) || []).length;
                const activeParameter = commaCount;

                // Create signature information
                const signatureLabel = doc.signature || `${functionName}(${doc.parameters.map(p => p.name).join(', ')})`;
                const signature = {
                    label: signatureLabel,
                    documentation: doc.description,
                    parameters: doc.parameters.map(param => ({
                        label: param.name,
                        documentation: `${param.type}${param.required ? ' (required)' : ' (optional)'} - ${param.description}`
                    }))
                };

                return {
                    value: {
                        label: [signatureLabel],
                        signatures: [signature],
                        activeSignature: 0,
                        activeParameter: Math.min(activeParameter, doc.parameters.length - 1)
                    },
                    dispose: () => { }
                };
            }
        });
    } catch (error) {
        console.error('Failed to register JSONata signature help provider:', error);
    }

};

const SessionImporter: React.FC<SessionImporterProps> = ({ onImportSessions }) => {
    const [importedFile, setImportedFile] = useState<ImportedData | null>(null);
    const [jsonataExpression, setJsonataExpression] = useState<string>('');
    const [transformationResult, setTransformationResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
    const [editorReady, setEditorReady] = useState(false);
    const [editorInstance, setEditorInstance] = useState<any>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [autoValidate, setAutoValidate] = useState(true);
    const { isDarkMode } = useTheme();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);

    // Update global variable when imported file changes
    useEffect(() => {
        if (importedFile) {
            currentImportedData = importedFile;
        }
    }, [importedFile]);

    // Ensure JSONata language is registered when component mounts
    useEffect(() => {
        // Try to register the language if Monaco is available
        if (typeof window !== 'undefined' && (window as any).monaco) {
            try {
                registerJsonataLanguage((window as any).monaco);
            } catch (error) {
                console.warn('Could not register JSONata language on mount:', error);
            }
        }
    }, []);

    // Real-time validation of JSONata expression
    useEffect(() => {
        if (!autoValidate || !jsonataExpression.trim() || !importedFile) {
            setValidationStatus('idle');
            return;
        }

        const validateExpression = async () => {
            setValidationStatus('validating');
            try {
                const expression = jsonata(jsonataExpression);
                // Test the expression with a small sample
                await expression.evaluate(importedFile.data);
                setValidationStatus('valid');
                setError(null);
            } catch (err) {
                setValidationStatus('invalid');
                setError(`Invalid JSONata expression: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        };

        // Debounce validation to avoid too many calls
        const timeoutId = setTimeout(validateExpression, 500);
        return () => clearTimeout(timeoutId);
    }, [jsonataExpression, importedFile, autoValidate]);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file && (file.type === 'application/json' || file.name.endsWith('.json'))) {
                // Create a proper file input event
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);

                if (fileInputRef.current) {
                    fileInputRef.current.files = dataTransfer.files;
                    // Trigger the change event
                    const event = new Event('change', { bubbles: true });
                    fileInputRef.current.dispatchEvent(event);
                }
            } else {
                setError('Please drop a valid JSON file.');
            }
        }
    }, []);

    // Enhanced editor controls
    const clearEditor = useCallback(() => {
        if (editorInstance) {
            editorInstance.setValue('');
            setJsonataExpression('');
        }
    }, [editorInstance]);

    const formatExpression = useCallback(() => {
        if (editorInstance && jsonataExpression.trim()) {
            try {
                // Basic formatting - could be enhanced with a proper JSONata formatter
                const formatted = jsonataExpression
                    .replace(/\s+/g, ' ')
                    .replace(/\s*,\s*/g, ', ')
                    .replace(/\s*{\s*/g, ' { ')
                    .replace(/\s*}\s*/g, ' } ');
                editorInstance.setValue(formatted);
                setJsonataExpression(formatted);
            } catch (err) {
                setError('Could not format expression');
            }
        }
    }, [editorInstance, jsonataExpression]);

    const executeTransformationWithLoading = useCallback(async () => {
        if (!importedFile || !jsonataExpression.trim()) {
            setError('Please provide both imported data and a JSONata expression.');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const expression = jsonata(jsonataExpression);
            const result = await expression.evaluate(importedFile.data);
            setTransformationResult(result);
            setValidationStatus('valid');
        } catch (err) {
            setError(`JSONata transformation error: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setValidationStatus('invalid');
            setTransformationResult(null);
        } finally {
            setIsProcessing(false);
        }
    }, [importedFile, jsonataExpression]);

    // Handle Monaco editor mount
    const handleEditorDidMount = useCallback((editor: any, monacoInstance: any) => {
        setEditorInstance(editor);

        // Register the language and providers
        registerJsonataLanguage(monacoInstance);

        // Ensure the model is set to jsonata language
        const model = editor.getModel();
        if (model) {
            try {
                monacoInstance.editor.setModelLanguage(model, 'jsonata');
            } catch (error) {
                console.warn('Could not set editor language to jsonata:', error);
                // Fallback: try to register the language again
                try {
                    registerJsonataLanguage(monacoInstance);
                    monacoInstance.editor.setModelLanguage(model, 'jsonata');
                } catch (retryError) {
                    console.error('Failed to set editor language after retry:', retryError);
                }
            }
        }

        // Simplified editor configuration for better suggestions
        // Suggestions only appear on trigger characters ($, .) or manual trigger (Ctrl+Space)
        editor.updateOptions({
            readOnly: false,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            theme: isDarkMode ? 'vs-dark' : 'vs-light',
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            quickSuggestionsDelay: 1000,
            wordBasedSuggestions: "off",
            parameterHints: {
                enabled: true
            },
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnCommitCharacter: true,
            suggestSelection: "first",
            hover: {
                enabled: true
            },
            contextmenu: true
        });

        // Simple manual trigger for suggestions
        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            editor.trigger('keyboard', 'editor.action.triggerSuggest', {});
        });

        // Force focus on mount
        setTimeout(() => {
            editor.focus();
        }, 100);

        // Inject CSS to ensure suggestion widget is visible
        const style = document.createElement('style');
        style.textContent = `
            .monaco-editor .suggest-widget {
                z-index: 10000 !important;
                background: #1e1e1e !important;
                border: 1px solid #3c3c3c !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
            }
            .monaco-editor .suggest-widget .monaco-list {
                background: #1e1e1e !important;
            }
            .monaco-editor .suggest-widget .monaco-list .monaco-list-row {
                background: #1e1e1e !important;
                color: #d4d4d4 !important;
            }
            .monaco-editor .suggest-widget .monaco-list .monaco-list-row:hover {
                background: #2a2d2e !important;
            }
            .monaco-editor .suggest-widget .monaco-list .monaco-list-row.selected {
                background: #094771 !important;
            }
        `;
        document.head.appendChild(style);

        setEditorReady(true);
    }, [isDarkMode]);

    // Sample JSONata expressions for common transformations
    const sampleExpressions = [
        {
            name: 'Access imported file properties',
            expression: '{ "fileName": $.name, "importTime": $.timestamp, "dataCount": $count($.data) }'
        },
        {
            name: 'Access deeply nested data properties',
            expression: '$map($.data, { "id": $.id, "deepProperty": $.nested.deeply.property, "arrayFirst": $.array[0].property })'
        },
        {
            name: 'Extract API endpoints from data',
            expression: '$map($.data, { "name": $.name, "method": $.method, "url": $.url })'
        },
        {
            name: 'Flatten nested objects from data',
            expression: '$map($.data, { "id": $.id, "title": $.title, "category": $.category.name, "subcategory": $.category.subcategory.type })'
        },
        {
            name: 'Filter imported data by nested status',
            expression: '$filter($.data, $.status.active = true)'
        },
        {
            name: 'Group imported data by nested category',
            expression: '$group($.data, $.category.type, { "count": $count(), "total": $sum($.amount) })'
        },
        {
            name: 'Advanced string manipulation on nested data',
            expression: '$map($.data, { "id": $.id, "formattedName": $uppercase($trim($.user.profile.name)), "url": $encodeUrl($.endpoint.url) })'
        },
        {
            name: 'Conditional transformation of nested data',
            expression: '$map($.data, { "id": $.id, "status": $if($.settings.active = true, "active", "inactive"), "priority": $case($.metrics.score >= 90, "high", $.metrics.score >= 70, "medium", "low") })'
        },
        {
            name: 'Create basic BiSTool session',
            expression: `{
        "id": $millis(),
        "name": "Sample Session",
        "timestamp": $now(),
        "category": "Sample",
        "urlData": {
          "baseURL": "https://api.example.com",
          "segments": "users/123",
          "parsedSegments": [],
          "queryParams": [],
          "segmentVariables": [],
          "processedURL": "https://api.example.com/users/123",
          "domain": "api.example.com",
          "protocol": "https",
          "builtUrl": "https://api.example.com/users/123",
          "environment": "development"
        },
        "requestConfig": {
          "method": "GET",
          "queryParams": [],
          "headers": [],
          "bodyType": "none",
          "jsonBody": "",
          "formData": []
        },
        "yamlOutput": "",
        "segmentVariables": {},
        "sharedVariables": {}
      }`
        },
        {
            name: 'Transform to BiSTool session format',
            expression: `$map($.data, {
        "id": $string($.id),
        "name": $.name,
        "timestamp": $now(),
        "category": $.category.name ? $.category.name : "Imported",
        "urlData": {
          "domain": $split($.endpoint.url, "/")[2],
          "protocol": $substring($.endpoint.url, 0, $indexOf($.endpoint.url, "://")),
          "builtUrl": $.endpoint.url,
          "environment": $.config.environment ? $.config.environment : "development",
          "baseURL": $substring($.endpoint.url, 0, $lastIndexOf($.endpoint.url, "/")),
          "processedURL": $.endpoint.url,
          "segments": $substring($.endpoint.url, $lastIndexOf($.endpoint.url, "/") + 1),
          "parsedSegments": [],
          "queryParams": $.endpoint.params ? $.endpoint.params : [],
          "segmentVariables": []
        },
        "requestConfig": {
          "method": $.method ? $.method : "GET",
          "headers": $.headers ? $.headers : [],
          "queryParams": $.endpoint.queryParams ? $.endpoint.queryParams : [],
          "bodyType": "json",
          "jsonBody": $stringify($.body),
          "formData": []
        },
        "yamlOutput": "",
        "segmentVariables": {},
        "sharedVariables": {}
      })`
        },
        {
            name: 'Transform imported file to BiSTool session format (whole file)',
            expression: `{
  "savedSessions": $map($.savedSessions, function($s) {
    {
      "id": $s.id,
      "name": $s.name,
      "timestamp": $s.timestamp ? $s.timestamp : $now(),
      "category": $s.category ? $s.category : "Imported",
      "urlData": {
        "domain": $s.urlData.domain ? $s.urlData.domain : (
          $s.urlData.builtUrl ? $split($s.urlData.builtUrl, "/")[2] : ""
        ),
        "protocol": $s.urlData.protocol ? $s.urlData.protocol : (
          $s.urlData.builtUrl ? $substring($s.urlData.builtUrl, 0, $indexOf($s.urlData.builtUrl, "://")) : ""
        ),
        "builtUrl": $s.urlData.builtUrl ? $s.urlData.builtUrl : "",
        "environment": $s.urlData.environment ? $s.urlData.environment : "development",
        "baseURL": $s.urlData.baseURL ? $s.urlData.baseURL : (
          $s.urlData.builtUrl ? $substring($s.urlData.builtUrl, 0, $lastIndexOf($s.urlData.builtUrl, "/")) : ""
        ),
        "processedURL": $s.urlData.processedURL ? $s.urlData.processedURL : $s.urlData.builtUrl,
        "segments": $s.urlData.segments ? $s.urlData.segments : "",
        "parsedSegments": $s.urlData.parsedSegments ? $s.urlData.parsedSegments : [],
        "queryParams": $s.urlData.queryParams ? $s.urlData.queryParams : [],
        "segmentVariables": $s.urlData.segmentVariables ? $s.urlData.segmentVariables : []
      },
      "requestConfig": {
        "method": $s.requestConfig.method ? $s.requestConfig.method : "GET",
        "headers": $s.requestConfig.headers ? $s.requestConfig.headers : [],
        "queryParams": $s.requestConfig.queryParams ? $s.requestConfig.queryParams : [],
        "bodyType": $s.requestConfig.bodyType ? $s.requestConfig.bodyType : "json",
        "jsonBody": $s.requestConfig.jsonBody ? $s.requestConfig.jsonBody : "",
        "formData": $s.requestConfig.formData ? $s.requestConfig.formData : []
      },
      "yamlOutput": $s.yamlOutput ? $s.yamlOutput : "",
      "segmentVariables": $s.segmentVariables ? $s.segmentVariables : {},
      "sharedVariables": $s.sharedVariables ? $s.sharedVariables : {}
    }
  }),
  "globalVariables": $.globalVariables
}`
        }
    ];

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                setImportedFile({
                    name: file.name,
                    data: data,
                    timestamp: new Date().toISOString()
                });
                setError(null);
                setTransformationResult(null);
                setValidationStatus('idle');
            } catch (err) {
                setError('Invalid JSON file. Please check the file format.');
                setImportedFile(null);
            }
        };
        reader.readAsText(file);
    }, []);

    const validateResult = useCallback(() => {
        if (!transformationResult) return false;

        // Basic validation for BiSTool session format
        if (Array.isArray(transformationResult)) {
            return transformationResult.every(item =>
                item &&
                typeof item === 'object' &&
                (item.name || item.id) &&
                (item.urlData || item.requestConfig)
            );
        }

        return transformationResult &&
            typeof transformationResult === 'object' &&
            (transformationResult.name || transformationResult.id);
    }, [transformationResult]);

    const handleImportSessions = useCallback(() => {
        if (!transformationResult || !validateResult()) {
            setError('Invalid session format. Please check your transformation result.');
            return;
        }

        const sessions = Array.isArray(transformationResult) ? transformationResult : [transformationResult];
        onImportSessions?.(sessions);
    }, [transformationResult, validateResult, onImportSessions]);

    const formatJson = useCallback((data: any) => {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    }, []);

    const getValidationIcon = () => {
        switch (validationStatus) {
            case 'validating':
                return <FiAlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />;
            case 'valid':
                return <FiCheckCircle className="w-5 h-5 text-green-500" />;
            case 'invalid':
                return <FiXCircle className="w-5 h-5 text-red-500" />;
            default:
                return null;
        }
    };

    const getValidationText = () => {
        switch (validationStatus) {
            case 'validating':
                return 'Validating...';
            case 'valid':
                return 'Valid format';
            case 'invalid':
                return 'Invalid format';
            default:
                return '';
        }
    };

    // Storage structure explanation (customize as needed)
    const storageStructureExplanation = `BiSTool Session Storage Structure:\n\n{
      "id": string, // Unique session ID
      "name": string, // Session name
      "timestamp": string, // ISO timestamp
      "category": string, // Session category
      "urlData": object, // URL and endpoint info
      "requestConfig": object, // Request configuration
      "yamlOutput": string, // YAML output (optional)
      "segmentVariables": object, // Segment variables (optional)
      "sharedVariables": object // Shared variables (optional)
    }\n\n- urlData: { domain, protocol, builtUrl, environment, baseURL, processedURL, segments, parsedSegments, queryParams, segmentVariables }
    - requestConfig: { method, headers, queryParams, bodyType, jsonBody, formData }\n\nThis structure is required for AI-powered session import and manipulation.`;

    // Get a sample JSONata expression (use the last one from sampleExpressions)
    const sampleJsonata = sampleExpressions[sampleExpressions.length - 1]?.expression || '';

    // Compose the prompt for copying
    const getPromptText = () => {
        return [
            '--- Storage Structure Explanation ---',
            storageStructureExplanation,
            '',
            '--- Imported File ---',
            importedFile ? JSON.stringify(importedFile.data, null, 2) : '',
            '',
            '--- Sample JSONata Expression ---',
            sampleJsonata
        ].join('\n\n');
    };

    const handleCopyPrompt = async () => {
        await copyToClipboard(getPromptText());
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-10 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                            <FiUpload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                            Session Importer
                        </h1>
                        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300 max-w-2xl">
                            Import, preview, and transform external data into BiSTool sessions using powerful JSONata expressions.
                        </p>
                    </div>
                    <div className="hidden lg:flex items-center gap-4">
                        <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                            <FiInfo className="mr-1" /> Expert Mode
                        </span>
                    </div>
                </header>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Import & Preview */}
                    <section className="space-y-8">
                        {/* Import Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col gap-6">
                            <div className="flex items-center gap-3 mb-2">
                                <FiUpload className="w-6 h-6 text-blue-500" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import Data</h2>
                            </div>
                            {/* Enhanced drag-and-drop area */}
                            <div
                                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 cursor-pointer ${isDragOver
                                    ? 'border-blue-500 bg-blue-100 dark:bg-blue-900/40'
                                    : 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                    }`}
                                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <FiUpload className={`w-12 h-12 mb-4 transition-colors duration-200 ${isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-blue-500 dark:text-blue-400'
                                    }`} />
                                <span className="text-blue-600 dark:text-blue-300 font-semibold text-lg mb-2">
                                    {isDragOver ? 'Drop your JSON file here' : 'Drag & drop your JSON file here'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 text-sm">or click to select a file</span>
                                {/* File input remains hidden */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>
                            {/* File info bar */}
                            {importedFile && (
                                <div className="flex items-center gap-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg px-4 py-2 text-sm text-blue-900 dark:text-blue-200">
                                    <FiCheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">{importedFile.name}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(importedFile.timestamp).toLocaleString()}</span>
                                    <button
                                        onClick={() => setImportedFile(null)}
                                        className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
                                        title="Clear imported file"
                                    >
                                        <FiXCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* JSON Preview Card */}
                        {importedFile && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiInfo className="w-5 h-5 text-blue-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Imported JSON Preview</h3>
                                    <Button variant="outline" size="sm" icon={FiInfo} children="View Structure" onClick={() => setShowStructureModal(true)} />
                                </div>
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    <MonacoEditor
                                        height="250px"
                                        language="json"
                                        value={formatJson(importedFile.data)}
                                        options={{
                                            readOnly: true,
                                            minimap: { enabled: false },
                                            fontSize: 13,
                                            lineNumbers: 'on',
                                            roundedSelection: false,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            theme: isDarkMode ? 'vs-dark' : 'vs-light'
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Data Structure Helper Card */}
                        {importedFile && (
                            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <FiInfo className="w-5 h-5 text-green-400" />
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Available Data Properties</h3>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                    Use these properties in your JSONata expressions with <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">$.</code> prefix:
                                </div>
                                <div className="max-h-40 overflow-y-auto">
                                    {(() => {
                                        const properties: string[] = [];
                                        const extractProps = (obj: any, path: string = '') => {
                                            if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                                                Object.keys(obj).forEach(key => {
                                                    const currentPath = path ? `${path}.${key}` : key;
                                                    properties.push(currentPath);
                                                    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                                                        extractProps(obj[key], currentPath);
                                                    }
                                                });
                                            } else if (Array.isArray(obj) && obj.length > 0) {
                                                properties.push(path ? `${path}[0]` : '[0]');
                                                properties.push(path ? `${path}.length` : 'length');
                                            }
                                        };
                                        extractProps(importedFile.data);
                                        return (
                                            <div className="grid grid-cols-2 gap-2">
                                                {properties.slice(0, 20).map((prop, index) => (
                                                    <div key={index} className="text-xs bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded border">
                                                        <code className="text-blue-600 dark:text-blue-400">$.{prop}</code>
                                                    </div>
                                                ))}
                                                {properties.length > 20 && (
                                                    <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                                                        ... and {properties.length - 20} more properties
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Right Column: Editor & Result */}
                    <section className="space-y-8">
                        {/* JSONata Editor Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col gap-6">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <FiPlay className="w-6 h-6 text-green-500" />
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">JSONata Expression Editor</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={autoValidate}
                                            onChange={(e) => setAutoValidate(e.target.checked)}
                                            className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                        />
                                        Auto-validate
                                    </label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                                    <FiInfo className="w-4 h-4" />
                                    <span>Type <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">$</code> for suggestions, <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">$.</code> for data properties, or press <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Ctrl+Space</code> to manually trigger</span>
                                </div>
                                <div className="h-[200px] bg-gray-900 rounded-lg border border-gray-700 overflow-hidden relative">
                                    <MonacoEditor
                                        key={`jsonata-editor-${isDarkMode ? 'dark' : 'light'}`}
                                        height="200px"
                                        language="jsonata"
                                        value={jsonataExpression}
                                        onChange={(value) => setJsonataExpression(value || '')}
                                        onMount={handleEditorDidMount}
                                        loading={
                                            <div className="h-full flex items-center justify-center text-gray-400">
                                                <div className="text-center">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                                    <div className="text-sm">Initializing JSONata editor...</div>
                                                </div>
                                            </div>
                                        }
                                    />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {editorReady ? (
                                            <span className="flex items-center text-green-600 dark:text-green-400">
                                                <FiCheckCircle className="w-3 h-3 mr-1" />
                                                JSONata editor ready
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-yellow-600 dark:text-yellow-400">
                                                <FiAlertCircle className="w-3 h-3 mr-1" />
                                                Initializing...
                                            </span>
                                        )}
                                    </div>
                                    {editorReady && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={clearEditor}
                                                className="text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                                                title="Clear editor"
                                            >
                                                Clear
                                            </button>
                                            <button
                                                onClick={formatExpression}
                                                className="text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                                                title="Format expression"
                                            >
                                                Format
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (editorInstance) {
                                                        console.log('Manually triggering suggestions');
                                                        editorInstance.trigger('keyboard', 'editor.action.triggerSuggest', {});
                                                    }
                                                }}
                                                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                Test Suggestions (Ctrl+Space)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    console.log('=== DEBUG INFO ===');
                                                    console.log('Editor instance:', editorInstance);
                                                    console.log('Editor ready:', editorReady);
                                                    console.log('Current imported data:', currentImportedData);

                                                    if (editorInstance) {
                                                        console.log('Editor model:', editorInstance.getModel());
                                                        console.log('Editor language:', editorInstance.getModel()?.getLanguageId());
                                                        console.log('Editor value:', editorInstance.getValue());
                                                        console.log('Editor position:', editorInstance.getPosition());

                                                        // Check Monaco languages
                                                        const monaco = (window as any).monaco;
                                                        if (monaco) {
                                                            const languages = monaco.languages.getLanguages();
                                                            console.log('Available languages:', languages);
                                                            const jsonataLang = languages.find((lang: any) => lang.id === 'jsonata');
                                                            console.log('JSONata language found:', jsonataLang);
                                                        }
                                                    }
                                                }}
                                                className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Debug Info
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Transformation Result Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-8 flex flex-col gap-6">
                            <div className="flex items-center gap-3 mb-2">
                                <FiDownload className="w-6 h-6 text-blue-500" />
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transformation Result</h2>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    {getValidationIcon()}
                                    <span>{getValidationText()}</span>
                                </div>
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {transformationResult ? (
                                        <MonacoEditor
                                            height="200px"
                                            language="json"
                                            value={formatJson(transformationResult)}
                                            options={{
                                                readOnly: true,
                                                minimap: { enabled: false },
                                                fontSize: 13,
                                                lineNumbers: 'on',
                                                roundedSelection: false,
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                theme: isDarkMode ? 'vs-dark' : 'vs-light'
                                            }}
                                        />
                                    ) : (
                                        <div className="h-[200px] flex items-center justify-center text-gray-400 dark:text-gray-500">
                                            <div className="text-center">
                                                <FiPlay className="w-10 h-10 mx-auto mb-2 opacity-50" />
                                                <p>Execute a JSONata expression to see results</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-end mt-2">
                                    <button
                                        onClick={executeTransformationWithLoading}
                                        disabled={!importedFile || !jsonataExpression.trim() || isProcessing}
                                        className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold transition-colors duration-200"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <FiPlay className="w-4 h-4" />
                                                Execute Transformation
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={handleImportSessions}
                                        disabled={!validateResult() || isProcessing}
                                        className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-semibold transition-colors duration-200 ml-2"
                                    >
                                        <FiDownload className="w-4 h-4" />
                                        Import Sessions
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sample Expressions Card */}
                        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6">
                            <div className="flex items-center gap-3 mb-2">
                                <FiInfo className="w-5 h-5 text-blue-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sample Expressions</h3>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {sampleExpressions.map((sample, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setJsonataExpression(sample.expression)}
                                        disabled={!editorReady}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium border border-blue-200 dark:border-blue-700 transition-colors duration-200 ${editorReady
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900/50'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        {sample.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mt-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                        <div className="flex items-center gap-3">
                            <FiAlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700 dark:text-red-300 font-medium">{error}</span>
                        </div>
                    </div>
                )}

                {/* Modal for storage structure explanation */}
                <Modal
                    isOpen={showStructureModal}
                    onClose={() => setShowStructureModal(false)}
                    title="Storage Structure & Import Guide"
                    titleIcon={<FiInfo className="w-5 h-5 text-indigo-500" />}
                    showSaveButton={false}
                    showCancelButton={true}
                    cancelButtonText="Close"
                    size="3xl"
                >
                    <div className="space-y-6">
                        <div>
                            <h4 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Session Storage Structure</h4>
                            <pre className="bg-gray-100 dark:bg-gray-800 rounded p-4 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                                {storageStructureExplanation}
                            </pre>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Imported File</h4>
                            <pre className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap border border-gray-200 dark:border-gray-700 max-h-48 overflow-auto">
                                {importedFile ? JSON.stringify(importedFile.data, null, 2) : ''}
                            </pre>
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-1 text-gray-900 dark:text-white">Sample JSONata Expression</h4>
                            <pre className="bg-blue-50 dark:bg-blue-900 rounded p-4 text-xs text-blue-900 dark:text-blue-200 whitespace-pre-wrap border border-blue-200 dark:border-blue-700">
                                {sampleJsonata}
                            </pre>
                        </div>
                        <div className="flex justify-end">
                            <button
                                onClick={handleCopyPrompt}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${copySuccess ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                            >
                                {copySuccess ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                {copySuccess ? 'Copied!' : 'Copy Prompt'}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </div>
    );
};

export default SessionImporter; 