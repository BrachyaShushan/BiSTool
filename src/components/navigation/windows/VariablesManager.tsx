import { FiKey, FiGlobe, FiFolder, FiCheck, FiEdit2, FiCopy, FiTrash2 } from "react-icons/fi";
import { useVariablesContext } from '../../../context/VariablesContext';
import { useEffect, useRef, useState } from "react";
import { ExtendedVariable, ModalType } from "../../../types/features/SavedManager";
import Modal from "../../core/Modal";


const VariablesManager = () => {
    const {
        globalVariables,
        sharedVariables,
        updateGlobalVariable,
        deleteGlobalVariable,
        updateSharedVariable,
        deleteSharedVariable,
    } = useVariablesContext();

    const [showVariableModal, setShowVariableModal] = useState<boolean>(false);
    const [modalType, setModalType] = useState<ModalType | null>(null);
    const [selectedVariable, setSelectedVariable] = useState<ExtendedVariable>({
        key: "",
        value: "",
        isGlobal: false,
    });
    const valueInputRef = useRef<HTMLInputElement>(null);
    const copyTimeoutRef = useRef<number | null>(null);

    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    // Convert sharedVariables array to object for rendering
    const sharedVarsObj = sharedVariables.reduce((acc, v) => {
        acc[v.key] = v.value;
        return acc;
    }, {} as Record<string, string>);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);

        // Clear any existing timeout
        if (copyTimeoutRef.current) {
            clearTimeout(copyTimeoutRef.current);
        }

        // Set new timeout with reference
        copyTimeoutRef.current = window.setTimeout(() => {
            setCopiedKey(null);
        }, 2000);
    };

    // Variable management functions
    const handleVariableAction = (
        action: ModalType,
        variable: [string, string] | null = null,
        isGlobal: boolean = false
    ): void => {
        setSelectedVariable({
            key: variable ? variable[0] : "",
            value: variable ? variable[1] : "",
            isGlobal,
        });
        setModalType(action);
        setShowVariableModal(true);
    };

    const handleVariableModalSubmit = (): void => {
        if (selectedVariable.key.trim() && selectedVariable.value.trim()) {
            if (selectedVariable.isGlobal) {
                updateGlobalVariable(selectedVariable.key, selectedVariable.value);
            } else {
                updateSharedVariable(selectedVariable.key, selectedVariable.value);
            }
            setShowVariableModal(false);
            setSelectedVariable({ key: "", value: "", isGlobal: false });
        }
    };

    useEffect(() => {
        if (showVariableModal && modalType === "edit" && valueInputRef.current) {
            valueInputRef.current.focus();
            valueInputRef.current.select();
        }
    }, [showVariableModal, modalType]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (copyTimeoutRef.current) {
                clearTimeout(copyTimeoutRef.current);
            }
            setShowVariableModal(false);
        };
    }, []);

    return (
        <>

            <div className="space-y-6">
                {/* Professional Header Section */}
                <div className="relative p-6 overflow-hidden border border-green-100 shadow-sm bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 bg-green-500 rounded-full"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 -translate-x-12 translate-y-12 rounded-full bg-emerald-500"></div>
                    </div>

                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title and Stats */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                                    <FiKey className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400`}>
                                        Variables Manager
                                    </h3>
                                    <div className="flex items-center mt-1 space-x-4">
                                        <p className={`text-sm font-medium dark:text-gray-300 text-gray-600`}>
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                                                {Object.keys(globalVariables).length} global variable{Object.keys(globalVariables).length !== 1 ? 's' : ''}
                                            </span>
                                        </p>
                                        <p className={`text-sm dark:text-gray-400 text-gray-500`}>
                                            {Object.keys(sharedVarsObj).length > 0 ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                                                    {Object.keys(sharedVarsObj).length} session variable{Object.keys(sharedVarsObj).length !== 1 ? 's' : ''}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                                                    No session variables
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => handleVariableAction("new", null, true)}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-white dark:bg-gradient-to-r dark:from-green-600 dark:via-emerald-600 dark:to-teal-600 dark:hover:from-green-700 dark:hover:via-emerald-700 dark:hover:to-teal-700 dark:shadow-green-500/25 text-white bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 shadow-green-500/25`}
                            >
                                <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
                                <FiGlobe className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">Global Variable</span>
                            </button>
                            <button
                                onClick={() => handleVariableAction("new", null, false)}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-white dark:bg-gradient-to-r dark:from-blue-600 dark:via-indigo-600 dark:to-purple-600 dark:hover:from-blue-700 dark:hover:via-indigo-700 dark:hover:to-purple-700 dark:shadow-blue-500/25 text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-blue-500/25`}
                            >
                                <div className="absolute inset-0 transition-transform duration-700 transform -translate-x-full -skew-x-12 bg-gradient-to-r from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
                                <FiFolder className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">Session Variable</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Global Variables Section */}
                <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                            <FiGlobe className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <span>Global Variables</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-green-200 dark:bg-green-900 text-green-800 bg-green-100`}>
                                {Object.keys(globalVariables).length}
                            </span>
                        </h4>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(globalVariables).length > 0 ? (
                            Object.entries(globalVariables).map(([key, value]) => {
                                const isDefaultVariable = ['username', 'password', 'base_url'].includes(key);
                                return (
                                    <div key={key} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md dark:bg-gray-700 dark:border-gray-600 bg-gray-50 border-gray-200 hover:border-gray-300`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1 min-w-0 space-x-3">
                                                <div className={`p-2 rounded-lg ${isDefaultVariable
                                                    ? "bg-blue-100 dark:bg-blue-900"
                                                    : "bg-green-100 dark:bg-green-900"
                                                    }`}>
                                                    <FiKey className={`w-4 h-4 ${isDefaultVariable
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : "text-green-600 dark:text-green-400"
                                                        }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`font-semibold dark:text-white text-gray-900`}>
                                                            {key}
                                                        </span>
                                                        {isDefaultVariable && (
                                                            <span className={`px-2 py-1 text-xs rounded-full font-semibold dark:text-blue-100 dark:bg-blue-600 text-blue-700 bg-blue-100`}>
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm truncate mt-1 dark:text-gray-400 text-gray-600`}>
                                                        {value}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center ml-4 space-x-2">
                                                <button
                                                    onClick={() => handleCopy(value as string, `global-${key}`)}
                                                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${copiedKey === `global-${key}`
                                                        ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"
                                                        : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                                                        }`}
                                                    title="Copy value"
                                                >
                                                    {copiedKey === `global-${key}` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleVariableAction("edit", [key, value], true)}
                                                    className="p-2 text-gray-600 transition-all duration-200 rounded-lg dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-105"
                                                    title="Edit variable"
                                                >
                                                    <FiEdit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteGlobalVariable(key)}
                                                    className="p-2 text-gray-600 transition-all duration-200 rounded-lg dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:scale-105"
                                                    title="Delete variable"
                                                >
                                                    <FiTrash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className={`p-8 text-center rounded-lg border-2 border-dashed dark:text-gray-400 dark:border-gray-600 text-gray-500 border-gray-300`}>
                                <FiKey className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No global variables yet</p>
                                <p className="mt-1 text-xs">Create your first global variable to get started</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Session Variables Section */}
                <div className="p-5 bg-white border border-gray-200 shadow-sm rounded-xl dark:bg-gray-800 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                            <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <span>Session Variables</span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-blue-200 dark:bg-blue-900 text-blue-800 bg-blue-100`}>
                                {Object.keys(sharedVarsObj).length}
                            </span>
                        </h4>
                    </div>
                    <div className="space-y-3">
                        {Object.entries(sharedVarsObj).length > 0 ? (
                            Object.entries(sharedVarsObj).map(([key, value]) => (
                                <div key={key} className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500 bg-gray-50 border-gray-200 hover:border-gray-300`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center flex-1 min-w-0 space-x-3">
                                            <div className="p-2 bg-blue-100 rounded-lg dark:bg-blue-900">
                                                <FiFolder className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className={`font-semibold dark:text-white text-gray-900`}>
                                                    {key}
                                                </span>
                                                <p className={`text-sm truncate mt-1 dark:text-gray-400 text-gray-600`}>
                                                    {value}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center ml-4 space-x-2">
                                            <button
                                                onClick={() => handleCopy(value as string, `session-${key}`)}
                                                className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 ${copiedKey === `session-${key}`
                                                    ? "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900"
                                                    : "text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900"
                                                    }`}
                                                title="Copy value"
                                            >
                                                {copiedKey === `session-${key}` ? <FiCheck className="w-4 h-4" /> : <FiCopy className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleVariableAction("edit", [key, value], false)}
                                                className="p-2 text-gray-600 transition-all duration-200 rounded-lg dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 hover:scale-105"
                                                title="Edit variable"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => deleteSharedVariable(key)}
                                                className="p-2 text-gray-600 transition-all duration-200 rounded-lg dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:scale-105"
                                                title="Delete variable"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className={`p-8 text-center rounded-lg border-2 border-dashed dark:text-gray-400 dark:border-gray-600 text-gray-500 border-gray-300`}>
                                <FiFolder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm font-medium">No session variables yet</p>
                                <p className="mt-1 text-xs">Create variables specific to this session</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Variable Modal */}
            <Modal
                isOpen={showVariableModal}
                onClose={() => {
                    setShowVariableModal(false);
                    setSelectedVariable({ key: "", value: "", isGlobal: false });
                }}
                onSave={handleVariableModalSubmit}
                title={
                    modalType === "new"
                        ? `New ${selectedVariable.isGlobal ? "Global" : "Session"} Variable`
                        : `Edit ${selectedVariable.isGlobal ? "Global" : "Session"} Variable`
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Variable Name
                        </label>
                        <input
                            type="text"
                            value={selectedVariable.key}
                            onChange={(e) =>
                                setSelectedVariable({
                                    ...selectedVariable,
                                    key: e.target.value,
                                })
                            }
                            placeholder="Enter variable name"
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Value
                        </label>
                        <input
                            type="text"
                            value={selectedVariable.value}
                            ref={valueInputRef}
                            onChange={(e) =>
                                setSelectedVariable({
                                    ...selectedVariable,
                                    value: e.target.value,
                                })
                            }
                            placeholder="Enter variable value"
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                        />
                    </div>
                </div>
            </Modal>

        </>
    )
}

export default VariablesManager;