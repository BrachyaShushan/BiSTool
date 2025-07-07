import { FiSettings, FiSave, FiRotateCcw, FiKey } from "react-icons/fi";
import { useAppContext } from "../../../context/AppContext";
import TokenGenerator from "../../utils/TokenGenerator";

const Settings = () => {
    const {
        autoSave,
        hasUnsavedChanges,
        isSaving,
        saveFrequency,
        toggleAutoSave,
        manualSave,
        undo,
        updateSaveFrequency,
        isUndoAvailable,
    } = useAppContext();
    return (
        <div className="space-y-6">
            {/* Professional Header Section */}
            <div className="overflow-hidden relative p-6 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 rounded-xl border border-orange-100 shadow-sm dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-10">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 rounded-full translate-x-16 -translate-y-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-500 rounded-full -translate-x-12 translate-y-12"></div>
                </div>

                <div className="flex relative flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Title and Stats */}
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
                                <FiSettings className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 dark:from-orange-400 dark:to-amber-400`}>
                                    Settings
                                </h3>
                                <div className="flex items-center mt-1 space-x-4">
                                    <p className={`text-sm font-medium dark:text-gray-300 text-gray-600`}>
                                        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-orange-800 bg-orange-100 rounded-full dark:bg-orange-900 dark:text-orange-200">
                                            Project Settings & Controls
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Settings Section */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                        <FiSave className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span>Save Settings</span>
                    </h4>
                </div>

                <div className="space-y-4">
                    {/* Auto-save toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <div>
                            <label className={`text-sm font-medium dark:text-gray-300 text-gray-700`}>
                                Auto-save
                            </label>
                            <p className={`text-xs mt-1 dark:text-gray-400 text-gray-500`}>
                                Automatically save changes as you work
                            </p>
                        </div>
                        <button
                            onClick={() => toggleAutoSave?.(!autoSave)}
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
                        <div className="p-4 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                            <label className={`text-sm font-medium block mb-2 dark:text-gray-300 text-gray-700`}>
                                Save frequency
                            </label>
                            <select
                                value={saveFrequency}
                                onChange={(e) => updateSaveFrequency?.(Number(e.target.value))}
                                className={`w-full px-3 py-2 text-sm rounded-md border dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 bg-white border-gray-300 text-gray-900
                                    }`}
                            >
                                <option value="100">100ms (Very fast)</option>
                                <option value="300">300ms (Fast)</option>
                                <option value="500">500ms (Normal)</option>
                                <option value="1000">1s (Slow)</option>
                            </select>
                            <p className={`text-xs mt-1 dark:text-blue-300 text-blue-600`}>
                                How often to save when auto-save is enabled
                            </p>
                        </div>
                    )}

                    {/* Manual Controls */}
                    <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-700">
                        <h5 className={`text-sm font-medium mb-3 dark:text-gray-300 text-gray-700`}>
                            Manual Controls
                        </h5>
                        <div className="flex items-center space-x-3">
                            {/* Manual save button */}
                            <button
                                onClick={manualSave}
                                disabled={!hasUnsavedChanges || isSaving}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${hasUnsavedChanges && !isSaving
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                <FiSave className="w-4 h-4" />
                                <span>{isSaving ? 'Saving...' : 'Save Now'}</span>
                            </button>

                            {/* Undo button */}
                            <button
                                onClick={undo}
                                disabled={!isUndoAvailable}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isUndoAvailable
                                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                                    : 'bg-gray-100 text-gray-400 dark:bg-gray-600 dark:text-gray-500 cursor-not-allowed'
                                    }`}
                                title={isUndoAvailable ? 'Undo last change' : 'Nothing to undo'}
                            >
                                <FiRotateCcw className="w-4 h-4" />
                                <span>Undo</span>
                            </button>
                        </div>
                    </div>

                    {/* Keyboard shortcuts info */}
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
                        <h5 className={`text-sm font-medium mb-2 flex items-center space-x-2 dark:text-amber-200 text-amber-800`}>
                            <span>⌨️</span>
                            <span>Keyboard Shortcuts</span>
                        </h5>
                        <div className={`text-xs space-y-1 dark:text-amber-300 text-amber-700`}>
                            <div className="flex justify-between">
                                <span>Manual save:</span>
                                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">Ctrl+S</code>
                            </div>
                            <div className="flex justify-between">
                                <span>Undo:</span>
                                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">Ctrl+Z</code>
                            </div>
                            <div className="flex justify-between">
                                <span>Redo:</span>
                                <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">Ctrl+Shift+Z</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Token Configuration Section */}
            <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                    <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                        <FiKey className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span>Token Configuration</span>
                    </h4>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                        <p className={`text-sm dark:text-purple-300 text-purple-700`}>
                            Configure authentication tokens for API requests. Set up your authentication method,
                            extraction rules, and token management settings.
                        </p>
                    </div>

                    {/* Token Generator Component */}
                    <div className="flex justify-center">
                        <TokenGenerator />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings;