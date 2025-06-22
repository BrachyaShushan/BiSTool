import React from "react";
import { useProjectContext } from "../../context/ProjectContext";
import { FiFolder, FiPlus, FiSettings } from "react-icons/fi";

interface WelcomeScreenProps {
    onCreateProject: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onCreateProject }) => {
    const { projects, switchProject } = useProjectContext();

    const handleCreateProjectClick = () => {
        onCreateProject();
    };

    return (
        <div className={`flex justify-center items-center min-h-screen text-gray-900 bg-gray-100 dark:text-white dark:bg-gray-900`}>
            <div className={`p-8 mx-auto max-w-2xl text-center bg-white rounded-lg shadow-lg dark:bg-gray-800`}>
                <div className="mb-8">
                    <FiFolder size={64} className={`mx-auto mb-4 text-blue-600 dark:text-blue-400`} />
                    <h1 className="mb-4 text-3xl font-bold">Welcome to BiSTool</h1>
                    <p className={`mb-6 text-lg text-gray-600 dark:text-gray-300`}>
                        Create your first project to get started with API testing and YAML generation
                    </p>
                </div>

                <div className="space-y-6">
                    {projects.length === 0 ? (
                        <div className={`p-6 rounded-lg border-2 border-gray-300 border-dashed dark:border-gray-600`}>
                            <FiPlus size={32} className={`mx-auto mb-4 text-gray-500 dark:text-gray-400`} />
                            <h2 className="mb-2 text-xl font-semibold">Create Your First Project</h2>
                            <p className={`mb-4 text-gray-600 dark:text-gray-400`}>
                                Projects help you organize your API tests and configurations separately.
                                Each project has its own storage space.
                            </p>
                            <button
                                onClick={handleCreateProjectClick}
                                className={`px-6 py-3 font-medium text-blue-700 bg-blue-100 rounded-lg transition-colors dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 hover:bg-blue-200`}
                            >
                                <FiPlus className="inline mr-2" />
                                Create Project
                            </button>
                        </div>
                    ) : (

                        <div className={`p-6 bg-gray-50 rounded-lg dark:bg-gray-700`}>
                            <h3 className="mb-3 text-lg font-semibold">Existing Projects</h3>
                            <div className="space-y-2">
                                {projects.map((project: any) => (
                                    <button
                                        key={project.id}
                                        className={`p-3 w-full bg-white rounded-lg border border-gray-200 transition-colors cursor-pointer dark:bg-gray-600 dark:border-gray-600 dark:hover:bg-gray-500 hover:bg-gray-50`}
                                        onClick={() => switchProject(project.id)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <FiFolder size={20} className={`text-blue-600 dark:text-blue-400`} />
                                                <div className="text-left">
                                                    <h4 className="font-medium">{project.name}</h4>
                                                    {project.description && (
                                                        <p className={`text-sm text-gray-600 dark:text-gray-400`}>
                                                            {project.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <FiSettings size={16} className={`text-gray-500 dark:text-gray-400`} />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className={`p-4 bg-blue-50 rounded-lg dark:bg-blue-900 dark:bg-opacity-20`}>
                        <h3 className="mb-2 font-semibold">What you can do with BiSTool:</h3>
                        <ul className={`space-y-1 text-sm text-left text-gray-600 dark:text-gray-300`}>
                            <li>• Build and test API endpoints with dynamic variables</li>
                            <li>• Generate YAML configurations for your API tests</li>
                            <li>• Create AI-powered test scenarios</li>
                            <li>• Organize your work into separate projects</li>
                            <li>• Save and manage multiple test sessions</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen; 