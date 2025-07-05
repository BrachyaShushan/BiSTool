import React from "react";
import { useProjectContext, useProjectSwitch } from "../../context/ProjectContext";
import { FiFolder, FiPlus, FiGlobe, FiCode, FiZap, FiDatabase, FiUsers, FiArrowRight, FiCheckCircle, FiPlay, FiBookOpen, FiShield, FiTrendingUp } from "react-icons/fi";
import { Button } from "../ui";
import { useAppContext } from "../../context/AppContext";

const WelcomeScreen: React.FC = () => {
    const { projects } = useProjectContext();
    const { switchToProject } = useProjectSwitch();
    const { setShowUnifiedManager } = useAppContext();
    const handleProjectSwitch = async (projectId: string) => {
        const success = await switchToProject(projectId);
        if (success) {
            console.log(`WelcomeScreen: Project switch completed successfully`);
        } else {
            console.error(`WelcomeScreen: Project switch failed`);
        }
    };

    const handleCreateProjectClick = () => {
        setShowUnifiedManager(true);
    };

    const features = [
        {
            icon: FiGlobe,
            title: "URL Builder",
            description: "Construct dynamic URLs with variables and path segments",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: FiCode,
            title: "Request Config",
            description: "Configure HTTP methods, headers, and request bodies",
            color: "from-green-500 to-green-600"
        },
        {
            icon: FiZap,
            title: "Test Manager",
            description: "Create and manage comprehensive API test scenarios",
            color: "from-purple-500 to-purple-600"
        },
        {
            icon: FiDatabase,
            title: "YAML Generator",
            description: "Generate YAML configurations for your API tests",
            color: "from-orange-500 to-orange-600"
        },
        {
            icon: FiUsers,
            title: "AI Test Generator",
            description: "Leverage AI to create intelligent test scenarios",
            color: "from-pink-500 to-pink-600"
        },
        {
            icon: FiShield,
            title: "Variable Management",
            description: "Manage global and session-specific variables",
            color: "from-indigo-500 to-indigo-600"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Create a Project",
            description: "Start by creating a new project to organize your API testing work",
            icon: FiFolder
        },
        {
            number: "02",
            title: "Build Your URL",
            description: "Use the URL Builder to construct dynamic endpoints with variables",
            icon: FiGlobe
        },
        {
            number: "03",
            title: "Configure Requests",
            description: "Set up HTTP methods, headers, and request bodies",
            icon: FiCode
        },
        {
            number: "04",
            title: "Generate Tests",
            description: "Create test scenarios and generate YAML configurations",
            icon: FiZap
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-48 -translate-y-48 bg-blue-500 rounded-full w-96 h-96 opacity-5"></div>
                <div className="absolute bottom-0 left-0 -translate-x-48 translate-y-48 bg-indigo-500 rounded-full w-96 h-96 opacity-5"></div>
                <div className="absolute w-64 h-64 -translate-x-32 -translate-y-32 bg-purple-500 rounded-full top-1/2 left-1/2 opacity-5"></div>
            </div>

            <div className="relative px-4 py-12 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center justify-center p-4 mb-6 shadow-2xl bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl">
                        <FiFolder className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="mb-4 text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        Welcome to BiSTool
                    </h1>
                    <p className="max-w-3xl mx-auto mb-8 text-xl text-gray-600 dark:text-gray-300">
                        Your comprehensive API testing and YAML generation platform.
                        Build, test, and manage your API workflows with ease.
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                            <span>Professional API Testing</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center space-x-2">
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                            <span>YAML Generation</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center space-x-2">
                            <FiCheckCircle className="w-4 h-4 text-green-500" />
                            <span>AI-Powered Testing</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Left Column - Project Management */}
                    <div className="lg:col-span-1">
                        <div className="p-6 bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-center mb-6 space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                                    <FiFolder className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Management</h2>
                            </div>

                            {projects.length === 0 ? (
                                <div className="p-6 text-center border-2 border-gray-300 border-dashed rounded-xl dark:border-gray-600">
                                    <FiPlus className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                                    <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                                        Create Your First Project
                                    </h3>
                                    <p className="mb-6 text-gray-600 dark:text-gray-400">
                                        Projects help you organize your API tests and configurations separately.
                                        Each project has its own storage space and variables.
                                    </p>
                                    <Button
                                        data-testid="project-create"
                                        onClick={handleCreateProjectClick}
                                        className="px-6 py-3 font-semibold text-white transition-all duration-200 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl group hover:scale-105 hover:shadow-xl"
                                    >
                                        <FiPlus className="inline w-4 h-4 mr-2" />
                                        Create Project
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                                        Existing Projects ({projects.length})
                                    </h3>
                                    {projects.map((project: any) => (
                                        <button
                                            key={project.id}
                                            className="w-full p-4 transition-all duration-200 border border-gray-200 cursor-pointer bg-gray-50 rounded-xl group dark:bg-gray-700 dark:border-gray-600 hover:scale-105 hover:shadow-md"
                                            onClick={() => handleProjectSwitch(project.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <FiFolder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                    <div className="text-left">
                                                        <h4 className="font-semibold text-gray-900 transition-colors dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                            {project.name}
                                                        </h4>
                                                        {project.description && (
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {project.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <FiArrowRight className="w-4 h-4 text-gray-400 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Features and Guide */}
                    <div className="space-y-8 lg:col-span-2">
                        {/* Getting Started Guide */}
                        <div className="p-6 bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-center mb-6 space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                                    <FiPlay className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Getting Started Guide</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {steps.map((step) => (
                                    <div key={step.number} className="flex items-start p-4 space-x-4 bg-gray-50 rounded-xl dark:bg-gray-700">
                                        <div className="flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                                            <span className="text-sm font-bold text-white">{step.number}</span>
                                        </div>
                                        <div>
                                            <h3 className="mb-1 font-semibold text-gray-900 dark:text-white">
                                                {step.title}
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Features Grid */}
                        <div className="p-6 bg-white border border-gray-200 shadow-xl rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                            <div className="flex items-center mb-6 space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
                                    <FiTrendingUp className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Key Features</h2>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {features.map((feature) => (
                                    <div key={feature.title} className="p-4 transition-all duration-200 border border-gray-200 bg-gray-50 rounded-xl group dark:bg-gray-700 dark:border-gray-600 hover:scale-105 hover:shadow-md">
                                        <div className={`inline-flex items-center justify-center p-3 mb-3 bg-gradient-to-br ${feature.color} rounded-lg`}>
                                            <feature.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Tips */}
                        <div className="p-6 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-700">
                            <div className="flex items-center mb-4 space-x-3">
                                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                                    <FiBookOpen className="w-5 h-5 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Tips</h2>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Use variables to make your URLs and requests dynamic
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Organize sessions by categories for better management
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Generate YAML configurations for CI/CD integration
                                    </p>
                                </div>
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Leverage AI to create comprehensive test scenarios
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen; 