import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { useTheme } from '../../context/ThemeContext';
import { IconType } from 'react-icons';
import {
    FiMaximize2,
    FiMinimize2,
    FiCopy,
    FiDownload,
    FiSettings,
    FiCheck,
    FiX
} from 'react-icons/fi';
import { Card } from './index';
import { EDITOR_OPTIONS } from '../../constants/requestConfig';

export interface MonacoEditorProps {
    value?: string;
    onChange?: (value: string | undefined) => void;
    onMount?: (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => void;
    language?: string;
    theme?: 'light' | 'dark' | 'auto';
    height?: string | number;
    width?: string | number;
    readOnly?: boolean;
    className?: string;
    placeholder?: string;
    options?: monaco.editor.IStandaloneEditorConstructionOptions;

    // Advanced props
    showToolbar?: boolean;
    showLineNumbers?: boolean;
    showMinimap?: boolean;
    fontSize?: number;
    tabSize?: number;
    wordWrap?: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
    scrollBeyondLastLine?: boolean;

    // Styling props
    variant?: 'default' | 'elevated' | 'outlined' | 'compact';
    colorTheme?: 'default' | 'bistool' | 'ocean' | 'sunset' | 'forest' | 'minimal' | 'professional';
    transparentBackground?: boolean;
    backgroundOpacity?: number;
    label?: string;
    description?: string;
    icon?: IconType;
    error?: string;
    success?: string;

    // Toolbar props
    allowCopy?: boolean;
    allowDownload?: boolean;
    allowFullscreen?: boolean;
    allowSettings?: boolean;
    filename?: string;

    // Loading state
    loading?: boolean;

    // Custom actions
    customActions?: Array<{
        icon: IconType;
        label: string;
        action: () => void;
        variant?: 'default' | 'primary' | 'danger';
    }>;
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({
    value = '',
    onChange,
    onMount,
    language = 'json',
    theme = 'auto',
    height = '300px',
    width = '100%',
    readOnly = false,
    className = '',
    placeholder = '',
    options = {},

    // Advanced props
    showToolbar = true,
    showLineNumbers = true,
    showMinimap = false,
    fontSize = 14,
    tabSize = 2,
    wordWrap = 'on',
    scrollBeyondLastLine = false,

    // Styling props
    variant = 'default',
    colorTheme = 'default',
    transparentBackground = false,
    backgroundOpacity = 0.8,
    label,
    description,
    icon: Icon,
    error,
    success,

    // Toolbar props
    allowCopy = true,
    allowDownload = false,
    allowFullscreen = true,
    allowSettings = true,
    filename,

    // Loading state
    loading = false,

    // Custom actions
    customActions = []
}) => {
    const { isDarkMode } = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
    const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'error'>('idle');
    const [showSettings, setShowSettings] = useState(false);
    const [localOptions, setLocalOptions] = useState({
        fontSize,
        tabSize,
        wordWrap,
        showLineNumbers,
        showMinimap,
        colorTheme,
        transparentBackground,
        backgroundOpacity
    });

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
        };
    }, []);

    // Determine the theme to use
    const editorTheme = theme === 'auto' ? (isDarkMode ? 'vs-dark' : 'vs') : (theme === 'dark' ? 'vs-dark' : 'vs');

    // Combined editor options
    const combinedOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        ...EDITOR_OPTIONS,
        ...options,
        readOnly,
        fontSize: localOptions.fontSize,
        tabSize: localOptions.tabSize,
        wordWrap: localOptions.wordWrap,
        lineNumbers: localOptions.showLineNumbers ? 'on' : 'off',
        minimap: { enabled: localOptions.showMinimap },
        scrollBeyondLastLine,
        theme: editorTheme, // This will be overridden by custom themes
        placeholder: placeholder || undefined,
    };

    // Define custom themes based on color theme
    const defineCustomThemes = useCallback((monacoInstance: typeof monaco) => {
        const getThemeBackground = (defaultColor: string) => {
            return localOptions.transparentBackground ? 'transparent' : defaultColor;
        };

        const themes = {
            'bistool-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#f8fafc'),
                    'editor.foreground': '#1e293b',
                    'editorLineNumber.foreground': '#64748b',
                    'editorLineNumber.activeForeground': '#3b82f6',
                    'editor.selectionBackground': '#3b82f620',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#f1f5f9',
                    'editorCursor.foreground': '#3b82f6',
                    'editorWhitespace.foreground': '#cbd5e1',
                    'editorIndentGuide.background': '#e2e8f0',
                    'editorIndentGuide.activeBackground': '#94a3b8',
                }
            },
            'bistool-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#0f172a'),
                    'editor.foreground': '#e2e8f0',
                    'editorLineNumber.foreground': '#64748b',
                    'editorLineNumber.activeForeground': '#60a5fa',
                    'editor.selectionBackground': '#3b82f630',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#1e293b',
                    'editorCursor.foreground': '#60a5fa',
                    'editorWhitespace.foreground': '#475569',
                    'editorIndentGuide.background': '#334155',
                    'editorIndentGuide.activeBackground': '#64748b',
                }
            },
            'ocean-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#f0fdfa'),
                    'editor.foreground': '#134e4a',
                    'editorLineNumber.foreground': '#5eead4',
                    'editorLineNumber.activeForeground': '#06b6d4',
                    'editor.selectionBackground': '#06b6d420',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#ecfeff',
                    'editorCursor.foreground': '#06b6d4',
                    'editorWhitespace.foreground': '#a7f3d0',
                    'editorIndentGuide.background': '#d1fae5',
                    'editorIndentGuide.activeBackground': '#6ee7b7',
                }
            },
            'ocean-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#0a2e2a'),
                    'editor.foreground': '#a7f3d0',
                    'editorLineNumber.foreground': '#34d399',
                    'editorLineNumber.activeForeground': '#22d3ee',
                    'editor.selectionBackground': '#06b6d430',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#134e4a',
                    'editorCursor.foreground': '#22d3ee',
                    'editorWhitespace.foreground': '#059669',
                    'editorIndentGuide.background': '#065f46',
                    'editorIndentGuide.activeBackground': '#047857',
                }
            },
            'sunset-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#fff7ed'),
                    'editor.foreground': '#7c2d12',
                    'editorLineNumber.foreground': '#fb923c',
                    'editorLineNumber.activeForeground': '#ea580c',
                    'editor.selectionBackground': '#ea580c20',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#fed7aa',
                    'editorCursor.foreground': '#ea580c',
                    'editorWhitespace.foreground': '#fdba74',
                    'editorIndentGuide.background': '#fed7aa',
                    'editorIndentGuide.activeBackground': '#fb923c',
                }
            },
            'sunset-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#431407'),
                    'editor.foreground': '#fed7aa',
                    'editorLineNumber.foreground': '#fb923c',
                    'editorLineNumber.activeForeground': '#f97316',
                    'editor.selectionBackground': '#ea580c30',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#7c2d12',
                    'editorCursor.foreground': '#f97316',
                    'editorWhitespace.foreground': '#c2410c',
                    'editorIndentGuide.background': '#9a3412',
                    'editorIndentGuide.activeBackground': '#c2410c',
                }
            },
            'forest-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#f0fdf4'),
                    'editor.foreground': '#14532d',
                    'editorLineNumber.foreground': '#4ade80',
                    'editorLineNumber.activeForeground': '#16a34a',
                    'editor.selectionBackground': '#16a34a20',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#dcfce7',
                    'editorCursor.foreground': '#16a34a',
                    'editorWhitespace.foreground': '#86efac',
                    'editorIndentGuide.background': '#dcfce7',
                    'editorIndentGuide.activeBackground': '#86efac',
                }
            },
            'forest-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#0a2e0a'),
                    'editor.foreground': '#bbf7d0',
                    'editorLineNumber.foreground': '#4ade80',
                    'editorLineNumber.activeForeground': '#22c55e',
                    'editor.selectionBackground': '#16a34a30',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#14532d',
                    'editorCursor.foreground': '#22c55e',
                    'editorWhitespace.foreground': '#15803d',
                    'editorIndentGuide.background': '#166534',
                    'editorIndentGuide.activeBackground': '#15803d',
                }
            },
            'minimal-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#fefefe'),
                    'editor.foreground': '#374151',
                    'editorLineNumber.foreground': '#9ca3af',
                    'editorLineNumber.activeForeground': '#6b7280',
                    'editor.selectionBackground': '#6b728020',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#f9fafb',
                    'editorCursor.foreground': '#6b7280',
                    'editorWhitespace.foreground': '#d1d5db',
                    'editorIndentGuide.background': '#e5e7eb',
                    'editorIndentGuide.activeBackground': '#9ca3af',
                }
            },
            'minimal-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#111827'),
                    'editor.foreground': '#d1d5db',
                    'editorLineNumber.foreground': '#6b7280',
                    'editorLineNumber.activeForeground': '#9ca3af',
                    'editor.selectionBackground': '#9ca3af30',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#1f2937',
                    'editorCursor.foreground': '#9ca3af',
                    'editorWhitespace.foreground': '#4b5563',
                    'editorIndentGuide.background': '#374151',
                    'editorIndentGuide.activeBackground': '#4b5563',
                }
            },
            'professional-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#fafafa'),
                    'editor.foreground': '#27272a',
                    'editorLineNumber.foreground': '#71717a',
                    'editorLineNumber.activeForeground': '#52525b',
                    'editor.selectionBackground': '#52525b20',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#f4f4f5',
                    'editorCursor.foreground': '#52525b',
                    'editorWhitespace.foreground': '#a1a1aa',
                    'editorIndentGuide.background': '#e4e4e7',
                    'editorIndentGuide.activeBackground': '#a1a1aa',
                }
            },
            'professional-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#18181b'),
                    'editor.foreground': '#d4d4d8',
                    'editorLineNumber.foreground': '#71717a',
                    'editorLineNumber.activeForeground': '#a1a1aa',
                    'editor.selectionBackground': '#a1a1aa30',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#27272a',
                    'editorCursor.foreground': '#a1a1aa',
                    'editorWhitespace.foreground': '#52525b',
                    'editorIndentGuide.background': '#3f3f46',
                    'editorIndentGuide.activeBackground': '#52525b',
                }
            },
            'default-light': {
                base: 'vs' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#ffffff'),
                    'editor.foreground': '#24292e',
                    'editorLineNumber.foreground': '#959da5',
                    'editorLineNumber.activeForeground': '#24292e',
                    'editor.selectionBackground': '#24292e20',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#f6f8fa',
                    'editorCursor.foreground': '#24292e',
                    'editorWhitespace.foreground': '#e1e4e8',
                    'editorIndentGuide.background': '#e1e4e8',
                    'editorIndentGuide.activeBackground': '#959da5',
                }
            },
            'default-dark': {
                base: 'vs-dark' as const,
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': getThemeBackground('#0d1117'),
                    'editor.foreground': '#e6edf3',
                    'editorLineNumber.foreground': '#7d8590',
                    'editorLineNumber.activeForeground': '#e6edf3',
                    'editor.selectionBackground': '#e6edf330',
                    'editor.lineHighlightBackground': localOptions.transparentBackground ? 'transparent' : '#161b22',
                    'editorCursor.foreground': '#e6edf3',
                    'editorWhitespace.foreground': '#484f58',
                    'editorIndentGuide.background': '#21262d',
                    'editorIndentGuide.activeBackground': '#30363d',
                }
            }
        };

        // Define all themes
        Object.entries(themes).forEach(([name, themeData]) => {
            monacoInstance.editor.defineTheme(name, themeData);
        });
    }, [localOptions.transparentBackground, localOptions.backgroundOpacity]);

    // Get the appropriate custom theme name
    const getCustomThemeName = useCallback(() => {
        const suffix = isDarkMode ? '-dark' : '-light';
        return `${localOptions.colorTheme}${suffix}`;
    }, [isDarkMode, localOptions.colorTheme]);

    // Handle editor mount
    const handleEditorDidMount = useCallback((editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: typeof monaco) => {
        editorRef.current = editor;

        // Define custom themes
        defineCustomThemes(monacoInstance);

        // Set the custom theme
        const customThemeName = getCustomThemeName();
        monacoInstance.editor.setTheme(customThemeName);

        // Set up common configurations
        editor.updateOptions({
            ...combinedOptions,
            automaticLayout: true,
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false
            },
            parameterHints: { enabled: true },
            hover: { enabled: true },
            contextmenu: true,
            folding: true,
            foldingStrategy: 'indentation',
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            matchBrackets: 'always',
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            formatOnType: true,
        });

        // Add keyboard shortcuts
        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyS, () => {
            // Save functionality (if needed)
        });

        editor.addCommand(monacoInstance.KeyMod.CtrlCmd | monacoInstance.KeyCode.KeyF, () => {
            editor.getAction('actions.find')?.run();
        });

        // Call the onMount callback if provided
        if (onMount) {
            onMount(editor, monacoInstance);
        }
    }, [onMount, combinedOptions, defineCustomThemes, getCustomThemeName]);

    // Handle copy functionality
    const handleCopy = useCallback(async () => {
        if (!editorRef.current) return;

        setCopyStatus('copying');
        try {
            const value = editorRef.current.getValue();
            await navigator.clipboard.writeText(value);
            setCopyStatus('copied');

            // Clear any existing timeout
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            // Set new timeout with reference
            copyTimeoutRef.current = setTimeout(() => {
                setCopyStatus('idle');
            }, 2000);
        } catch (error) {
            setCopyStatus('error');

            // Clear any existing timeout
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }

            // Set new timeout with reference
            copyTimeoutRef.current = setTimeout(() => {
                setCopyStatus('idle');
            }, 2000);
        }
    }, []);

    // Handle download functionality
    const handleDownload = useCallback(() => {
        if (!editorRef.current) return;

        const value = editorRef.current.getValue();
        const blob = new Blob([value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `code.${language === 'json' ? 'json' : 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [filename, language]);

    // Handle fullscreen toggle
    const handleFullscreen = useCallback(() => {
        setIsFullscreen(!isFullscreen);
    }, [isFullscreen]);

    // Update editor options when local options change
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.updateOptions({
                fontSize: localOptions.fontSize,
                tabSize: localOptions.tabSize,
                wordWrap: localOptions.wordWrap,
                lineNumbers: localOptions.showLineNumbers ? 'on' : 'off',
                minimap: { enabled: localOptions.showMinimap },
            });

            // Update theme when color theme or transparency changes
            const customThemeName = getCustomThemeName();
            monaco.editor.setTheme(customThemeName);
        }
    }, [localOptions, getCustomThemeName]);

    // Get copy icon based on status
    const getCopyIcon = () => {
        switch (copyStatus) {
            case 'copying': return <div className="w-3.5 h-3.5 border-2 border-current rounded-full border-t-transparent animate-spin" />;
            case 'copied': return <FiCheck className="w-3.5 h-3.5 text-green-500" />;
            case 'error': return <FiX className="w-3.5 h-3.5 text-red-500" />;
            default: return <FiCopy className="w-3.5 h-3.5" />;
        }
    };

    // Get variant classes
    const getVariantClasses = () => {
        switch (variant) {
            case 'elevated':
                return 'shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50';
            case 'outlined':
                return 'border-2 border-gray-300 dark:border-gray-600';
            case 'compact':
                return 'border border-gray-200 dark:border-gray-700 rounded-lg';
            default:
                return 'border border-gray-200 dark:border-gray-700';
        }
    };



    // Map our variant to Card's supported variants
    const cardVariant = variant === 'compact' ? 'default' : variant;

    // Get theme classes based on local options for real-time updates
    const getActiveThemeClasses = () => {
        switch (localOptions.colorTheme) {
            case 'bistool':
                return {
                    backdrop: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20',
                    card: 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30 dark:from-gray-800 dark:via-blue-900/10 dark:to-indigo-900/10',
                    border: 'border-blue-200/60 dark:border-blue-700/40',
                    toolbar: 'bg-gradient-to-r from-blue-50 via-white to-indigo-50 dark:from-blue-800/20 dark:via-gray-800 dark:to-indigo-800/20',
                    toolbarBorder: 'border-blue-200/80 dark:border-blue-700/60',
                    shadow: 'shadow-blue-500/10 dark:shadow-blue-900/30 group-hover:shadow-blue-500/20 dark:group-hover:shadow-blue-900/40'
                };
            case 'ocean':
                return {
                    backdrop: 'bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 dark:from-cyan-900/20 dark:via-blue-900/20 dark:to-teal-900/20',
                    card: 'bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 dark:from-gray-800 dark:via-cyan-900/10 dark:to-blue-900/10',
                    border: 'border-cyan-200/60 dark:border-cyan-700/40',
                    toolbar: 'bg-gradient-to-r from-cyan-50 via-white to-blue-50 dark:from-cyan-800/20 dark:via-gray-800 dark:to-blue-800/20',
                    toolbarBorder: 'border-cyan-200/80 dark:border-cyan-700/60',
                    shadow: 'shadow-cyan-500/10 dark:shadow-cyan-900/30 group-hover:shadow-cyan-500/20 dark:group-hover:shadow-cyan-900/40'
                };
            case 'sunset':
                return {
                    backdrop: 'bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 dark:from-orange-900/20 dark:via-red-900/20 dark:to-pink-900/20',
                    card: 'bg-gradient-to-br from-white via-orange-50/30 to-red-50/30 dark:from-gray-800 dark:via-orange-900/10 dark:to-red-900/10',
                    border: 'border-orange-200/60 dark:border-orange-700/40',
                    toolbar: 'bg-gradient-to-r from-orange-50 via-white to-red-50 dark:from-orange-800/20 dark:via-gray-800 dark:to-red-800/20',
                    toolbarBorder: 'border-orange-200/80 dark:border-orange-700/60',
                    shadow: 'shadow-orange-500/10 dark:shadow-orange-900/30 group-hover:shadow-orange-500/20 dark:group-hover:shadow-orange-900/40'
                };
            case 'forest':
                return {
                    backdrop: 'bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20',
                    card: 'bg-gradient-to-br from-white via-green-50/30 to-emerald-50/30 dark:from-gray-800 dark:via-green-900/10 dark:to-emerald-900/10',
                    border: 'border-green-200/60 dark:border-green-700/40',
                    toolbar: 'bg-gradient-to-r from-green-50 via-white to-emerald-50 dark:from-green-800/20 dark:via-gray-800 dark:to-emerald-800/20',
                    toolbarBorder: 'border-green-200/80 dark:border-green-700/60',
                    shadow: 'shadow-green-500/10 dark:shadow-green-900/30 group-hover:shadow-green-500/20 dark:group-hover:shadow-green-900/40'
                };
            case 'minimal':
                return {
                    backdrop: 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 dark:from-gray-900/50 dark:via-slate-900/50 dark:to-gray-900/50',
                    card: 'bg-white/90 dark:bg-gray-800/90',
                    border: 'border-gray-200/80 dark:border-gray-700/60',
                    toolbar: 'bg-gray-50/80 dark:bg-gray-800/80',
                    toolbarBorder: 'border-gray-200/80 dark:border-gray-700/60',
                    shadow: 'shadow-gray-500/10 dark:shadow-gray-900/40 group-hover:shadow-gray-500/15 dark:group-hover:shadow-gray-900/50'
                };
            case 'professional':
                return {
                    backdrop: 'bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-50 dark:from-slate-900/30 dark:via-zinc-900/30 dark:to-slate-900/30',
                    card: 'bg-gradient-to-br from-white via-slate-50/40 to-zinc-50/40 dark:from-gray-800 dark:via-slate-800/30 dark:to-zinc-800/30',
                    border: 'border-slate-200/70 dark:border-slate-700/50',
                    toolbar: 'bg-gradient-to-r from-slate-50 via-white to-zinc-50 dark:from-slate-800/30 dark:via-gray-800 dark:to-zinc-800/30',
                    toolbarBorder: 'border-slate-200/80 dark:border-slate-700/60',
                    shadow: 'shadow-slate-500/10 dark:shadow-slate-900/40 group-hover:shadow-slate-500/20 dark:group-hover:shadow-slate-900/50'
                };
            default:
                return {
                    backdrop: 'bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-900/50 dark:to-gray-800',
                    card: 'bg-white/80 dark:bg-gray-800/80',
                    border: 'border-gray-200/60 dark:border-gray-700/60',
                    toolbar: 'bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-750 dark:to-gray-800',
                    toolbarBorder: 'border-gray-200/80 dark:border-gray-700/80',
                    shadow: 'shadow-gray-900/10 dark:shadow-black/20 group-hover:shadow-gray-900/20 dark:group-hover:shadow-black/30'
                };
        }
    };

    const themeClasses = getActiveThemeClasses();



    const editorContent = (
        <div className={`relative ${className}`}>
            {/* Transparent Monaco Editor Styles */}
            {localOptions.transparentBackground && (
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .monaco-transparent .monaco-editor,
                        .monaco-transparent .monaco-editor-background,
                        .monaco-transparent .monaco-editor .margin,
                        .monaco-transparent .monaco-editor .monaco-scrollable-element,
                        .monaco-transparent .monaco-editor .overflow-guard,
                        .monaco-transparent .monaco-editor .lines-content.monaco-editor-background {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .current-line {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .view-lines {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .scrollbar {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .decorationsOverviewRuler {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .monaco-scrollable-element.editor-scrollable {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .monaco-scrollable-element.editor-scrollable.vs-dark {
                            background: transparent !important;
                        }
                        
                        .monaco-transparent .monaco-editor .monaco-scrollable-element.editor-scrollable.vs {
                            background: transparent !important;
                        }
                    `
                }} />
            )}

            {/* Header */}
            {(label || description || Icon) && (
                <div className="flex items-center mb-2 space-x-2">
                    {Icon && <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />}
                    <div>
                        {label && (
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {label}
                            </label>
                        )}
                        {description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                        )}
                    </div>
                </div>
            )}

            {/* Editor Container */}
            <div className={`relative group ${showSettings ? 'overflow-visible' : 'overflow-hidden'} ${getVariantClasses()}`}>
                {/* Premium backdrop with theme-specific gradient */}
                <div className={`absolute inset-0 rounded-xl ${themeClasses.backdrop}`}></div>

                {/* Main editor card with glassmorphic effect */}
                <div
                    className={`relative transition-all duration-300 border shadow-xl backdrop-blur-sm rounded-xl ${themeClasses.border} ${themeClasses.shadow}`}
                    style={localOptions.transparentBackground ? {
                        background: isDarkMode
                            ? `rgba(31, 41, 55, ${localOptions.backgroundOpacity})`
                            : `rgba(255, 255, 255, ${localOptions.backgroundOpacity})`,
                        backdropFilter: 'blur(8px)'
                    } : undefined}
                >
                    <Card
                        variant={cardVariant}
                        padding="none"
                        className={`relative transition-all duration-300 ${!localOptions.transparentBackground ? themeClasses.card : ''}`}
                    >
                        {/* Enhanced Toolbar */}
                        {showToolbar && (
                            <div className={`relative ${showSettings ? 'overflow-visible' : ''}`}>
                                {/* Toolbar background with theme-specific gradient */}
                                <div className={`absolute inset-0 border-b ${themeClasses.toolbar} ${themeClasses.toolbarBorder}`}></div>

                                {/* Toolbar content */}
                                <div className="relative flex items-center justify-between px-4 py-3 backdrop-blur-sm">
                                    <div className="flex items-center space-x-4">
                                        {/* macOS-style window controls with enhanced styling */}
                                        <div className="flex items-center space-x-2">
                                            <div className="w-3 h-3 transition-all duration-200 rounded-full shadow-sm cursor-pointer bg-gradient-to-br from-red-400 to-red-600 ring-1 ring-red-300/50 hover:ring-red-400/70"></div>
                                            <div className="w-3 h-3 transition-all duration-200 rounded-full shadow-sm cursor-pointer bg-gradient-to-br from-yellow-400 to-yellow-600 ring-1 ring-yellow-300/50 hover:ring-yellow-400/70"></div>
                                            <div className="w-3 h-3 transition-all duration-200 rounded-full shadow-sm cursor-pointer bg-gradient-to-br from-green-400 to-green-600 ring-1 ring-green-300/50 hover:ring-green-400/70"></div>
                                        </div>

                                        {/* Language indicator with premium styling */}
                                        <div className="flex items-center space-x-3">
                                            <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-blue-400/20 dark:to-indigo-400/20 border border-blue-200/50 dark:border-blue-600/30 rounded-lg backdrop-blur-sm">
                                                <span className="text-xs font-semibold text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text">
                                                    {language.toUpperCase()}
                                                </span>
                                            </div>

                                            {filename && (
                                                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100/80 dark:bg-gray-700/50 rounded-lg border border-gray-200/60 dark:border-gray-600/40 backdrop-blur-sm">
                                                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 animate-pulse"></div>
                                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                        {filename}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-1">
                                        {customActions.map((action, index) => (
                                            <button
                                                key={index}
                                                onClick={action.action}
                                                className={`p-2 rounded-lg text-xs transition-all duration-200 ${action.variant === 'primary'
                                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/25'
                                                    : action.variant === 'danger'
                                                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25'
                                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm'
                                                    }`}
                                                title={action.label}
                                            >
                                                <action.icon className="w-3.5 h-3.5" />
                                            </button>
                                        ))}

                                        {allowCopy && (
                                            <button
                                                onClick={handleCopy}
                                                className="p-2 text-gray-500 transition-all duration-200 rounded-lg hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm"
                                                title="Copy code"
                                            >
                                                {getCopyIcon()}
                                            </button>
                                        )}

                                        {allowDownload && (
                                            <button
                                                onClick={handleDownload}
                                                className="p-2 text-gray-500 transition-all duration-200 rounded-lg hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm"
                                                title="Download code"
                                            >
                                                <FiDownload className="w-3.5 h-3.5" />
                                            </button>
                                        )}

                                        {allowSettings && (
                                            <div className="relative">
                                                <button
                                                    onClick={() => setShowSettings(!showSettings)}
                                                    className={`p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${showSettings
                                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80'
                                                        }`}
                                                    title="Settings"
                                                >
                                                    <FiSettings className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        )}

                                        {allowFullscreen && (
                                            <button
                                                onClick={handleFullscreen}
                                                className="p-2 text-gray-500 transition-all duration-200 rounded-lg hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-gray-700/80 backdrop-blur-sm"
                                                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                            >
                                                {isFullscreen ? <FiMinimize2 className="w-3.5 h-3.5" /> : <FiMaximize2 className="w-3.5 h-3.5" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enhanced Editor */}
                        <div className="relative">
                            {loading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
                                    <div className="text-center">
                                        <div className="w-12 h-12 mx-auto mb-4 border-4 rounded-full border-blue-500/20 border-t-blue-500 animate-spin"></div>
                                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Loading Monaco Editor...</div>
                                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">Preparing your coding environment</div>
                                    </div>
                                </div>
                            )}

                            <div className={localOptions.transparentBackground ? 'monaco-transparent' : ''}>
                                <Editor
                                    height={height}
                                    width={width}
                                    language={language}
                                    value={value}
                                    {...(onChange && { onChange })}
                                    onMount={handleEditorDidMount}
                                    theme={editorTheme}
                                    options={combinedOptions}
                                    loading={null}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Settings Panel - Positioned outside Card for proper floating */}
            {showSettings && (
                <div
                    className="fixed inset-0 z-[100] pointer-events-auto"
                    onClick={() => setShowSettings(false)}
                >
                    <div
                        className="absolute duration-200 right-4 top-16 w-96 max-h-[calc(100vh-5rem)] animate-in slide-in-from-top-2"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Backdrop blur overlay */}
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-xl -z-10"></div>

                        {/* Main panel */}
                        <div className="relative flex flex-col max-h-full overflow-hidden border shadow-2xl bg-gradient-to-br from-white via-gray-50 to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-gray-900/20 dark:shadow-black/40 backdrop-blur-md">
                            {/* Header with gradient */}
                            <div className="relative p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-purple-600/90 backdrop-blur-sm"></div>
                                <div className="relative flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-sm">
                                            <FiSettings className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white">Editor Settings</h3>
                                            <p className="text-xs text-white/80">Customize your coding experience</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="p-2 transition-all duration-200 rounded-lg text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm"
                                    >
                                        <FiX className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto overscroll-contain">
                                {/* Two Column Layout */}
                                <div className="grid grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {/* Font Size */}
                                        <div className="space-y-2">
                                            <label className="flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                <span>Font Size</span>
                                                <span className="px-2 py-1 font-mono text-xs text-blue-800 rounded-md bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200">
                                                    {localOptions.fontSize}px
                                                </span>
                                            </label>
                                            <input
                                                type="range"
                                                min="10"
                                                max="24"
                                                value={localOptions.fontSize}
                                                onChange={(e) => setLocalOptions(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 slider-thumb"
                                            />
                                        </div>

                                        {/* Tab Size */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                Tab Size
                                            </label>
                                            <select
                                                value={localOptions.tabSize}
                                                onChange={(e) => setLocalOptions(prev => ({ ...prev, tabSize: Number(e.target.value) }))}
                                                className="w-full px-3 py-2 text-sm transition-all duration-200 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400"
                                            >
                                                <option value={2}>2 spaces</option>
                                                <option value={4}>4 spaces</option>
                                                <option value={8}>8 spaces</option>
                                            </select>
                                        </div>

                                        {/* Line Numbers Toggle */}
                                        <label className="flex items-center justify-between p-3 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded bg-gradient-to-br from-emerald-500 to-emerald-600">
                                                    #
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Line Numbers</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={localOptions.showLineNumbers}
                                                    onChange={(e) => setLocalOptions(prev => ({ ...prev, showLineNumbers: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${localOptions.showLineNumbers ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${localOptions.showLineNumbers ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Word Wrap */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                Word Wrap
                                            </label>
                                            <select
                                                value={localOptions.wordWrap}
                                                onChange={(e) => setLocalOptions(prev => ({ ...prev, wordWrap: e.target.value as any }))}
                                                className="w-full px-3 py-2 text-sm transition-all duration-200 bg-white border border-gray-300 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-600 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400"
                                            >
                                                <option value="on">Enabled</option>
                                                <option value="off">Disabled</option>
                                                <option value="bounded">Bounded</option>
                                            </select>
                                        </div>

                                        {/* Minimap Toggle */}
                                        <label className="flex items-center justify-between p-3 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded bg-gradient-to-br from-purple-500 to-purple-600">
                                                    ▤
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Minimap</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={localOptions.showMinimap}
                                                    onChange={(e) => setLocalOptions(prev => ({ ...prev, showMinimap: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${localOptions.showMinimap ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${localOptions.showMinimap ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                                </div>
                                            </div>
                                        </label>

                                        {/* Transparent Background Toggle */}
                                        <label className="flex items-center justify-between p-3 transition-all duration-200 border border-gray-200 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 group">
                                            <div className="flex items-center space-x-3">
                                                <div className="flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded bg-gradient-to-br from-cyan-500 to-cyan-600">
                                                    ◐
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Transparent</span>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    checked={localOptions.transparentBackground}
                                                    onChange={(e) => setLocalOptions(prev => ({ ...prev, transparentBackground: e.target.checked }))}
                                                    className="sr-only"
                                                />
                                                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${localOptions.transparentBackground ? 'bg-gradient-to-r from-blue-500 to-indigo-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${localOptions.transparentBackground ? 'translate-x-4' : 'translate-x-0.5'}`}></div>
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Background Opacity Slider - only show when transparent is enabled */}
                                {localOptions.transparentBackground && (
                                    <div className="p-3 space-y-3 border rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-700/50">
                                        <label className="flex items-center justify-between text-sm font-semibold text-blue-800 dark:text-blue-200">
                                            <span>Background Opacity</span>
                                            <span className="px-2 py-1 font-mono text-xs text-blue-800 rounded-md bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 dark:text-blue-200">
                                                {Math.round(localOptions.backgroundOpacity * 100)}%
                                            </span>
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={localOptions.backgroundOpacity}
                                            onChange={(e) => setLocalOptions(prev => ({ ...prev, backgroundOpacity: Number(e.target.value) }))}
                                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-600 dark:to-cyan-600 slider-thumb"
                                        />
                                    </div>
                                )}

                                {/* Color Theme Selection */}
                                <div className="space-y-3">
                                    <label className="flex items-center justify-between text-sm font-semibold text-gray-800 dark:text-gray-200">
                                        <span>Color Theme</span>
                                        <span className="px-2 py-1 text-xs font-medium text-blue-800 capitalize rounded-md bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-200">
                                            {localOptions.colorTheme}
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {[
                                            { value: 'default', name: 'Default', colors: ['from-gray-600', 'to-gray-700'] },
                                            { value: 'bistool', name: 'BiSTool', colors: ['from-blue-500', 'to-indigo-500'] },
                                            { value: 'ocean', name: 'Ocean', colors: ['from-cyan-500', 'to-blue-500'] },
                                            { value: 'sunset', name: 'Sunset', colors: ['from-orange-500', 'to-red-500'] },
                                            { value: 'forest', name: 'Forest', colors: ['from-green-500', 'to-emerald-500'] },
                                            { value: 'minimal', name: 'Minimal', colors: ['from-gray-500', 'to-slate-500'] },
                                            { value: 'professional', name: 'Pro', colors: ['from-slate-600', 'to-zinc-600'] }
                                        ].map((theme) => (
                                            <button
                                                key={theme.value}
                                                onClick={() => setLocalOptions(prev => ({ ...prev, colorTheme: theme.value as any }))}
                                                className={`p-2 rounded-lg border-2 transition-all duration-200 text-xs font-medium ${localOptions.colorTheme === theme.value
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-lg shadow-blue-500/25'
                                                    : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                <div className={`w-full h-1.5 rounded-full mb-1 bg-gradient-to-r ${theme.colors[0]} ${theme.colors[1]}`}></div>
                                                {theme.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                            </div>

                            {/* Footer */}
                            <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                    <span>Settings saved automatically</span>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span>Live</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Messages */}
            {error && (
                <div className="flex items-center mt-2 space-x-2 text-sm text-red-600 dark:text-red-400">
                    <FiX className="w-4 h-4" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center mt-2 space-x-2 text-sm text-green-600 dark:text-green-400">
                    <FiCheck className="w-4 h-4" />
                    <span>{success}</span>
                </div>
            )}
        </div>
    );

    // Render fullscreen version if needed
    if (isFullscreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                <div className="w-full h-full overflow-hidden bg-white rounded-lg max-w-none dark:bg-gray-800">
                    <div className="h-full">
                        {React.cloneElement(editorContent, {
                            className: `h-full ${className}`,
                            children: React.Children.map(editorContent.props.children, (child) => {
                                if (child?.type === Card) {
                                    return React.cloneElement(child, {
                                        className: `h-full ${child.props.className}`,
                                        children: React.Children.map(child.props.children, (grandChild) => {
                                            if (grandChild?.props?.className?.includes('relative')) {
                                                return React.cloneElement(grandChild, {
                                                    className: `${grandChild.props.className} h-full`,
                                                    children: React.Children.map(grandChild.props.children, (greatGrandChild) => {
                                                        if (greatGrandChild?.type === Editor) {
                                                            return React.cloneElement(greatGrandChild, {
                                                                height: '100%'
                                                            });
                                                        }
                                                        return greatGrandChild;
                                                    })
                                                });
                                            }
                                            return grandChild;
                                        })
                                    });
                                }
                                return child;
                            })
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return editorContent;
};

export default MonacoEditor;

