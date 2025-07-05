import React from "react";
import { FiPlus, FiTrash2, FiGlobe } from "react-icons/fi";
import { Button, Input, IconButton, Toggle } from "../ui";
import { Header } from "../../types";

export interface RequestHeadersSectionProps {
    headers: Header[];
    onAdd: () => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: keyof Header, value: string | boolean) => void;
    className?: string;
    compact?: boolean;
    showHeader?: boolean;
}

const RequestHeadersSection: React.FC<RequestHeadersSectionProps> = ({
    headers,
    onAdd,
    onRemove,
    onUpdate,
    className = "",
    compact = false,
    showHeader = true,
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {showHeader && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                            <FiGlobe className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Request Headers</span>
                    </div>
                    <Button
                        variant="primary"
                        icon={FiPlus}
                        onClick={onAdd}
                        size={compact ? "sm" : "md"}
                        data-testid="add-header"
                    >
                        Add Header
                    </Button>
                </div>
            )}

            {headers.length === 0 ? (
                <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-xl dark:border-gray-600">
                    <FiGlobe className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
                    <p className="mb-4 text-gray-500 dark:text-gray-400">No headers added yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Add headers to include in your request</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {headers.map((header, index) => (
                        <div
                            key={`header-${index}`}
                            className={`p-4 border border-gray-200 shadow-sm bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl dark:from-gray-700 dark:to-gray-800 dark:border-gray-600 ${compact ? 'p-3' : 'p-4'}`}
                        >
                            <div className={`grid items-center gap-4 ${compact ? 'md:grid-cols-10' : 'md:grid-cols-12'}`}>
                                {/* Header Name */}
                                <div className={compact ? "md:col-span-3" : "md:col-span-3"}>
                                    <Input
                                        type="text"
                                        value={header.key}
                                        onChange={(e) => onUpdate(index, "key", e.target.value)}
                                        placeholder="Header name"
                                        fullWidth
                                        size={compact ? "sm" : "md"}
                                        data-testid={`header-key-${index}`}
                                    />
                                </div>

                                {/* Header Value */}
                                <div className={compact ? "md:col-span-3" : "md:col-span-3"}>
                                    <Input
                                        type="text"
                                        value={header.value}
                                        onChange={(e) => onUpdate(index, "value", e.target.value)}
                                        placeholder="Header value"
                                        fullWidth
                                        size={compact ? "sm" : "md"}
                                        data-testid={`header-value-${index}`}
                                    />
                                </div>

                                {/* Description */}
                                {!compact && (
                                    <div className="md:col-span-3">
                                        <Input
                                            type="text"
                                            value={header.description || ""}
                                            onChange={(e) => onUpdate(index, "description", e.target.value)}
                                            placeholder="Description (optional)"
                                            fullWidth
                                            size="md"
                                            data-testid={`header-description-${index}`}
                                        />
                                    </div>
                                )}

                                {/* Required Toggle */}
                                <div className={compact ? "md:col-span-3" : "md:col-span-2"}>
                                    <Toggle
                                        checked={header.required || false}
                                        onChange={(checked) => onUpdate(index, "required", checked)}
                                        label="Required"
                                        size={compact ? "sm" : "md"}
                                        colorScheme="blue"
                                        position="left"
                                        data-testid={`header-required-${index}`}
                                    />
                                </div>

                                {/* Remove Button */}
                                <div className={compact ? "md:col-span-1" : "md:col-span-1"}>
                                    <IconButton
                                        icon={FiTrash2}
                                        variant="danger"
                                        size="sm"
                                        onClick={() => onRemove(index)}
                                        title="Remove header"
                                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                        data-testid={`remove-header-${index}`}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RequestHeadersSection; 