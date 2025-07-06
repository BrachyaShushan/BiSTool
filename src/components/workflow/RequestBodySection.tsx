import React, { useRef } from "react";
import { FiZap, FiTrash2, FiPlus } from "react-icons/fi";
import { useTheme } from "../../context/ThemeContext";
import { OnMount } from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { Button, Input, IconButton, Textarea, Toggle, MonacoEditor } from "../ui";
import { FormDataField } from "../../types";
import {
    BODY_TYPE_OPTIONS,
    BODY_CONTENT_CONFIG,
    COLOR_CLASSES,
    EDITOR_OPTIONS,
} from "../../constants/requestConfig";

export interface RequestBodySectionProps {
    bodyType: "none" | "json" | "form" | "text";
    jsonBody: string;
    formData: FormDataField[];
    textBody: string;
    onBodyTypeChange: (type: "none" | "json" | "form" | "text") => void;
    onJsonBodyChange: (value: string) => void;
    onFormDataChange: (data: FormDataField[]) => void;
    onTextBodyChange: (value: string) => void;
    className?: string;
    compact?: boolean;
    showHeader?: boolean;
}

const RequestBodySection: React.FC<RequestBodySectionProps> = ({
    bodyType,
    jsonBody,
    formData,
    textBody,
    onBodyTypeChange,
    onJsonBodyChange,
    onFormDataChange,
    onTextBodyChange,
    className = "",
    compact = false,
    showHeader = true,
}) => {
    const { isDarkMode } = useTheme();
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const jsonEditorContainerRef = useRef<HTMLDivElement>(null);

    const handleEditorDidMount: OnMount = (editor) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleEditorChange = (value: string | undefined): void => {
        onJsonBodyChange(value || "");
    };

    const addFormDataField = (): void => {
        const newFormData = [
            ...formData,
            { key: "", value: "", type: "text" as const, required: false },
        ];
        onFormDataChange(newFormData);
    };

    const removeFormDataField = (index: number): void => {
        const newFormData = formData.filter((_, i) => i !== index);
        onFormDataChange(newFormData);
    };

    const updateFormDataField = (
        index: number,
        field: keyof FormDataField,
        value: string | boolean
    ): void => {
        const newFormData = [...formData];
        const currentField = newFormData[index];
        if (!currentField) return;
        newFormData[index] = {
            key: currentField.key,
            value: currentField.value,
            type: currentField.type,
            required: currentField.required,
            [field]: value,
        };
        onFormDataChange(newFormData);
    };


    const getBodyContent = (): React.ReactElement => {
        switch (bodyType) {
            case "json":
                const jsonConfig = BODY_CONTENT_CONFIG.json;
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <div className={`p-2 bg-gradient-to-br ${jsonConfig.bgGradient} rounded-lg`}>
                                    <jsonConfig.icon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{jsonConfig.label}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        try {
                                            const formatted = JSON.stringify(JSON.parse(jsonBody), null, 2);
                                            onJsonBodyChange(formatted);
                                        } catch (e) {
                                            // Invalid JSON, ignore
                                        }
                                    }}
                                    data-testid="format-json"
                                >
                                    Format JSON
                                </Button>
                            </div>
                        </div>
                        <div
                            ref={jsonEditorContainerRef}
                            className="relative overflow-hidden border border-gray-200 shadow-sm rounded-xl dark:border-gray-600"
                        >
                            <MonacoEditor
                                height="200px"
                                language="json"
                                value={jsonBody}
                                theme={isDarkMode ? "dark" : "light"}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                options={EDITOR_OPTIONS}
                            />


                        </div>
                    </div>
                );

            case "form":
                const formConfig = BODY_CONTENT_CONFIG.form;
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className={`p-2 bg-gradient-to-br ${formConfig.bgGradient} rounded-lg`}>
                                <formConfig.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formConfig.label}</span>
                        </div>
                        <div className="space-y-3">
                            {formData.map((field, index) => (
                                <div
                                    key={`form-field-${index}`}
                                    className={`p-4 border border-gray-200 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl dark:from-gray-700 dark:to-gray-800 dark:border-gray-600 ${compact ? 'p-3' : 'p-4'}`}
                                >
                                    <div className={`grid items-center gap-4 ${compact ? 'md:grid-cols-10' : 'md:grid-cols-12'}`}>
                                        <div className={compact ? "md:col-span-4" : "md:col-span-5"}>
                                            <Input
                                                type="text"
                                                value={field.key}
                                                onChange={(e) => updateFormDataField(index, "key", e.target.value)}
                                                placeholder="Field name"
                                                fullWidth
                                                size={compact ? "sm" : "md"}
                                                data-testid={`form-field-key-${index}`}
                                            />
                                        </div>
                                        <div className={compact ? "md:col-span-4" : "md:col-span-5"}>
                                            <Input
                                                type="text"
                                                value={field.value}
                                                onChange={(e) => updateFormDataField(index, "value", e.target.value)}
                                                placeholder="Field value"
                                                fullWidth
                                                size={compact ? "sm" : "md"}
                                                data-testid={`form-field-value-${index}`}
                                            />
                                        </div>
                                        <div className={compact ? "md:col-span-1" : "md:col-span-1"}>
                                            <Toggle
                                                checked={field.required}
                                                onChange={(checked) => updateFormDataField(index, "required", checked)}
                                                label={compact ? "Req" : "Required"}
                                                size={compact ? "sm" : "md"}
                                                colorScheme="green"
                                                position="left"
                                                data-testid={`form-field-required-${index}`}
                                            />
                                        </div>
                                        <div className={compact ? "md:col-span-1" : "md:col-span-1"}>
                                            <IconButton
                                                icon={FiTrash2}
                                                variant="danger"
                                                size="sm"
                                                onClick={() => removeFormDataField(index)}
                                                title="Remove field"
                                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                data-testid={`remove-form-field-${index}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button
                            variant="success"
                            icon={FiPlus}
                            onClick={addFormDataField}
                            size={compact ? "sm" : "md"}
                            data-testid="add-form-field"
                        >
                            Add Form Field
                        </Button>
                    </div>
                );

            case "text":
                const textConfig = BODY_CONTENT_CONFIG.text;
                return (
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className={`p-2 bg-gradient-to-br ${textConfig.bgGradient} rounded-lg`}>
                                <textConfig.icon className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{textConfig.label}</span>
                        </div>
                        <Textarea
                            value={textBody}
                            onChange={(e) => onTextBodyChange(e.target.value)}
                            placeholder="Enter your text body content here..."
                            rows={compact ? 6 : 8}
                            fullWidth
                            data-testid="text-body"
                        />
                    </div>
                );

            case "none":
            default:
                const noneConfig = BODY_CONTENT_CONFIG.none;
                return (
                    <div className="p-8 text-center border-2 border-gray-300 border-dashed bg-gray-50 rounded-xl dark:border-gray-600 dark:bg-gray-700">
                        <noneConfig.icon className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                        <p className="mb-2 text-gray-500 dark:text-gray-400">No body content for this request</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">This HTTP method doesn't support a request body</p>
                    </div>
                );
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                            <FiZap className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Body</span>
                    </div>

                    {/* Body Type Selector */}
                    <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
                        {BODY_TYPE_OPTIONS.map((option) => {
                            const isSelected = bodyType === option.id;
                            const colorClass = COLOR_CLASSES[option.color as keyof typeof COLOR_CLASSES];
                            const selectedClass = colorClass.selected;
                            const unselectedClass = colorClass.unselected;

                            return (
                                <button
                                    key={option.id}
                                    onClick={() => onBodyTypeChange(option.id as "none" | "json" | "form" | "text")}
                                    className={`relative ${compact ? 'p-2' : 'p-3'} rounded-lg border-2 transition-all duration-300 transform hover:scale-105 group overflow-hidden ${isSelected ? selectedClass : unselectedClass
                                        }`}
                                    data-testid={`body-type-${option.id}`}
                                >
                                    {/* Background Pattern */}
                                    <div className={`absolute inset-0 opacity-5 transition-opacity duration-300 ${isSelected ? 'opacity-10' : 'opacity-0 group-hover:opacity-5'
                                        }`}>
                                        <div className={`absolute top-0 right-0 w-8 h-8 rounded-full translate-x-4 -translate-y-4 ${option.color === 'gray' ? 'bg-gray-500' :
                                            option.color === 'purple' ? 'bg-purple-500' :
                                                option.color === 'green' ? 'bg-green-500' : 'bg-blue-500'
                                            }`}></div>
                                    </div>

                                    <div className="relative z-10 flex flex-col items-center space-y-1 text-center">
                                        <div className={`${compact ? 'text-sm' : 'text-lg'} transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-105'
                                            }`}>
                                            {option.icon}
                                        </div>
                                        <div>
                                            <h4 className={`font-semibold ${compact ? 'text-xs' : 'text-xs'} ${isSelected ? 'text-white' : 'text-gray-900 dark:text-white'
                                                }`}>
                                                {option.label}
                                            </h4>
                                            {!compact && (
                                                <p className={`text-xs ${isSelected
                                                    ? 'text-gray-100 dark:text-gray-200'
                                                    : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {option.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${option.color === 'gray' ? 'bg-gray-200' :
                                            option.color === 'purple' ? 'bg-purple-200' :
                                                option.color === 'green' ? 'bg-green-200' : 'bg-blue-200'
                                            } flex items-center justify-center`}>
                                            <div className={`w-1 h-1 rounded-full ${option.color === 'gray' ? 'bg-gray-600' :
                                                option.color === 'purple' ? 'bg-purple-600' :
                                                    option.color === 'green' ? 'bg-green-600' : 'bg-blue-600'
                                                }`}></div>
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="p-6 border border-gray-200 bg-gray-50 rounded-xl dark:bg-gray-700 dark:border-gray-600">
                {getBodyContent()}
            </div>
        </div>
    );
};

export default RequestBodySection; 