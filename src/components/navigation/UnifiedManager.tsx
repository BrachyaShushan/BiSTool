import React, { useEffect, useState } from "react";
import { useProjectContext } from "../../context/ProjectContext";
import Modal from "../ui/Modal";
import { FiFolder, FiSettings, FiKey, } from "react-icons/fi";
import Settings from "./windows/Settings";
import SessionsManager from "./windows/SessionsManager";
import ProjectsManager from "./windows/ProjectsManager";
import VariablesManager from "./windows/VariablesManager";
import { TabType } from "../../types/core/app.types";
interface UnifiedManagerProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: TabType;
}


const UnifiedManager: React.FC<UnifiedManagerProps> = ({
    isOpen,
    onClose,
    initialTab,
}) => {
    const {
        currentProject,
    } = useProjectContext();

    const [activeTab, setActiveTab] = useState<TabType>(initialTab || 'projects');

    // Update active tab when initialTab prop changes
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    if (!isOpen) return null;

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                titleIcon={<FiSettings className="w-5 h-5 text-blue-500" />}
                title="Manager"
                showSaveButton={false}
                showCancelButton={false}
                size="4xl"
            >
                {/* Tabs */}
                <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
                    {currentProject && (
                        <>
                            <button
                                onClick={() => setActiveTab('sessions')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'sessions'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <FiFolder className="inline mr-2" />
                                Sessions
                            </button>
                            <button
                                onClick={() => setActiveTab('variables')}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'variables'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                            >
                                <FiKey className="inline mr-2" />
                                Variables
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setActiveTab('projects')}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'projects'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <FiFolder className="inline mr-2" />
                        Projects
                    </button>
                    {currentProject && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'settings'
                                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            <FiSettings className="inline mr-2" />
                            Settings
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                <div>
                    {/* Sessions Tab */}
                    {activeTab === 'sessions' && <SessionsManager />}

                    {/* Variables Tab */}
                    {activeTab === 'variables' && <VariablesManager />}

                    {/* Projects Tab */}
                    {activeTab === 'projects' && (<ProjectsManager onClose={onClose} />)}

                    {activeTab === 'settings' && (
                        <Settings />
                    )}
                </div>
            </Modal>


        </>
    );
};

export default UnifiedManager; 