import React from "react";
import Header from "../layout/Header";
import UnifiedManager from "../components/navigation/UnifiedManager";
import QuickStartWizard from "../components/core/QuickStartWizard";
import RouterWorkflowSelector from "./ui/RouterWorkflowSelector";
import BasicMode from "../components/core/BasicMode";
import { Outlet, useLocation, useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { Section, SectionId } from "../types";
// Fallback to importing from app.types if previous imports fail

const AppLayout: React.FC = () => {
    console.log('AppLayout rendered');
    const { mode, showUnifiedManager, unifiedManagerTab, setShowUnifiedManager, requestConfig, setRequestConfig } = useAppContext();
    const location = useLocation();
    const params = useParams();
    const projectId = params["projectId"];
    const sessionId = params["sessionId"];

    const isWelcome = location.pathname === "/";

    const sections: Section[] = [
        { id: "url" as SectionId, label: "URL Builder" },
        { id: "request" as SectionId, label: "Request Config" },
        { id: "tests" as SectionId, label: "Tests" },
        { id: "yaml" as SectionId, label: "YAML Generator" },
        { id: "ai" as SectionId, label: "AI Test Generator" },
        { id: "import" as SectionId, label: "Session Importer" },
        { id: "json" as SectionId, label: "JSON Diff Tool" },
    ];

    // Always use URL params to determine what to render
    return (
        <div className="min-h-screen text-gray-900 bg-gray-100 transition-colors duration-200 dark:bg-gray-900 dark:text-gray-100">
            {!isWelcome && <Header />}
            {projectId && sessionId ? (
                <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {mode === "expert" && (
                        <nav className="mt-6 overflow-hidden bg-white border border-gray-200 shadow-lg rounded-xl dark:bg-gray-800 dark:border-gray-700">
                            <RouterWorkflowSelector sections={sections} />
                        </nav>
                    )}
                    <main className="mt-4">
                        {mode === "basic" ? (
                            <BasicMode requestConfig={requestConfig} setRequestConfig={setRequestConfig} />
                        ) : (
                            <Outlet />
                        )}
                    </main>
                </div>
            ) : (
                <Outlet />
            )}
            {showUnifiedManager && (
                <UnifiedManager
                    isOpen={showUnifiedManager}
                    onClose={() => setShowUnifiedManager(false)}
                    initialTab={unifiedManagerTab}
                />
            )}
            <QuickStartWizard />
        </div>
    );
};

export default AppLayout; 