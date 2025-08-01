import React from 'react';
import { FiCheck } from 'react-icons/fi';
import Tooltip from './Tooltip';

interface SaveControlsProps {
    autoSave: boolean;
    hasUnsavedChanges: boolean;
    isSaving: boolean;
    lastSaved?: string | undefined;
}

const SaveControls: React.FC<SaveControlsProps> = ({
    autoSave,
    hasUnsavedChanges,
    isSaving,
    lastSaved
}) => {

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

    const getTooltipContent = () => {
        if (!lastSaved) return 'No save history';
        return `Last saved: ${formatLastSaved(lastSaved)}`;
    };

    return (
        <div className="flex items-center space-x-2">

            {/* Auto-save/status indicator */}
            {autoSave && (
                <Tooltip position='bottom' content={getTooltipContent()}>
                    <div className={`min-w-20 flex items-center justify-center space-x-1 px-2 py-1 rounded-md text-xs ${isSaving
                        ? 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200'
                        : hasUnsavedChanges
                            ? 'text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
                            : 'text-green-700 bg-green-100 dark:bg-green-900 dark:text-green-200'
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
                </Tooltip>
            )}

            {/* Manual mode indicator */}
            {!autoSave && (
                <Tooltip position='bottom' content={getTooltipContent()}>
                    <div className={`min-w-20 flex items-center justify-center space-x-1 px-2 py-1 rounded-md text-xs ${hasUnsavedChanges
                        ? 'text-orange-700 bg-orange-100 dark:bg-orange-900 dark:text-orange-200'
                        : 'text-gray-700 bg-gray-100 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                        {hasUnsavedChanges ? (
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
                </Tooltip>
            )}

        </div>
    );
};

export default SaveControls; 