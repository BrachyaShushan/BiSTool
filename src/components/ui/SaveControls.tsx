import React, { useState, useCallback } from 'react';
import { FiSave, FiRotateCcw, FiSettings, FiCheck } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';

interface SaveControlsProps {
    autoSave: boolean;
    onAutoSaveToggle: (enabled: boolean) => void;
    onManualSave: () => void;
    onUndo: () => void;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    canUndo: boolean;
    lastSaved?: string | undefined;
    saveFrequency: number;
    onSaveFrequencyChange: (frequency: number) => void;
}

const SaveControls: React.FC<SaveControlsProps> = ({
    autoSave,
    onAutoSaveToggle,
    onManualSave,
    onUndo,
    hasUnsavedChanges,
    isSaving,
    canUndo,
    lastSaved,
    saveFrequency,
    onSaveFrequencyChange
}) => {
    const { isDarkMode } = useTheme();
    const [showSettings, setShowSettings] = useState(false);

    const handleAutoSaveToggle = useCallback(() => {
        onAutoSaveToggle(!autoSave);
    }, [autoSave, onAutoSaveToggle]);

    const formatLastSaved = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="flex items-center space-x-2">
            {/* Auto-save indicator */}
            {autoSave && (
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs ${isSaving
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200'
                    : hasUnsavedChanges
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-200'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200'
                    }`}>
                    {isSaving ? (
                        <>
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span>Saving...</span>
                        </>
                    ) : hasUnsavedChanges ? (
                        <>
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span>Unsaved</span>
                        </>
                    ) : (
                        <>
                            <FiCheck className="w-3 h-3" />
                            <span>Saved</span>
                        </>
                    )}
                </div>
            )}

            {/* Last saved timestamp */}
            {lastSaved && !hasUnsavedChanges && (
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {formatLastSaved(lastSaved)}
                </span>
            )}

            {/* Manual save button */}
            {!autoSave && (
                <button
                    onClick={onManualSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${hasUnsavedChanges && !isSaving
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                        : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                        }`}
                >
                    <FiSave className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
            )}

            {/* Undo button */}
            <button
                onClick={onUndo}
                disabled={!canUndo}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${canUndo
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed'
                    }`}
                title={canUndo ? 'Undo last change' : 'Nothing to undo'}
            >
                <FiRotateCcw className="w-4 h-4" />
                <span>Undo</span>
            </button>

            {/* Settings button */}
            <button
                onClick={() => setShowSettings(!showSettings)}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${showSettings
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
            >
                <FiSettings className="w-4 h-4" />
                <span>Settings</span>
            </button>

            {/* Settings dropdown */}
            {showSettings && (
                <div className={`absolute top-full right-0 mt-2 w-64 rounded-lg shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                    } z-50`}>
                    <div className="p-4">
                        <h3 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                            Save Settings
                        </h3>

                        {/* Auto-save toggle */}
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Auto-save
                                </label>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Automatically save changes
                                </p>
                            </div>
                            <button
                                onClick={handleAutoSaveToggle}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoSave
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${autoSave ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                />
                            </button>
                        </div>

                        {/* Save frequency (when auto-save is enabled) */}
                        {autoSave && (
                            <div className="mb-3">
                                <label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Save frequency
                                </label>
                                <select
                                    value={saveFrequency}
                                    onChange={(e) => onSaveFrequencyChange(Number(e.target.value))}
                                    className={`mt-1 w-full px-3 py-1.5 text-sm rounded-md border ${isDarkMode
                                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                >
                                    <option value="100">100ms (Very fast)</option>
                                    <option value="300">300ms (Fast)</option>
                                    <option value="500">500ms (Normal)</option>
                                    <option value="1000">1s (Slow)</option>
                                </select>
                            </div>
                        )}

                        {/* Keyboard shortcuts info */}
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            <p className="mb-1"><strong>Keyboard shortcuts:</strong></p>
                            <p>Ctrl+S - Manual save</p>
                            <p>Ctrl+Z - Undo</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaveControls; 