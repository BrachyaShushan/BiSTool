import React, { Suspense, lazy } from 'react';
import { OnMount } from "@monaco-editor/react";

// Dynamically import Monaco Editor to reduce initial bundle size
const Editor = lazy(() => import('@monaco-editor/react').then(module => ({ default: module.Editor })));

interface LazyMonacoEditorProps {
    value: string;
    onChange?: (value: string | undefined) => void;
    language?: string;
    theme?: string;
    height?: string;
    width?: string;
    options?: any;
    onMount?: OnMount;
    className?: string;
    placeholder?: string;
    readOnly?: boolean;
}

const LazyMonacoEditor: React.FC<LazyMonacoEditorProps> = ({
    value,
    onChange,
    language = 'json',
    theme = 'vs-dark',
    height = '300px',
    width = '100%',
    options = {},
    onMount,
    className = '',
    placeholder,
    readOnly = false,
}) => {
    return (
        <div className={className}>
            <Suspense fallback={
                <div
                    className="flex items-center justify-center border border-gray-300 rounded-md bg-gray-50 dark:bg-gray-800 dark:border-gray-600"
                    style={{ height, width }}
                >
                    <div className="text-gray-500 dark:text-gray-400">Loading editor...</div>
                </div>
            }>
                <Editor
                    height={height}
                    width={width}
                    language={language}
                    theme={theme}
                    value={value}
                    {...(onChange && { onChange })}
                    {...(onMount && { onMount })}
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        lineNumbers: 'on',
                        roundedSelection: false,
                        scrollbar: {
                            vertical: 'visible',
                            horizontal: 'visible',
                        },
                        readOnly,
                        placeholder: placeholder || undefined,
                        ...options,
                    }}
                />
            </Suspense>
        </div>
    );
};

export default LazyMonacoEditor; 