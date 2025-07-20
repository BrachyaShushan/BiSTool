import { FiCheck, FiEdit2, FiTrash2, FiSettings, FiPlus } from "react-icons/fi";
import Modal from "../../ui/Modal";
import { useState } from "react";
import { Project } from "../../../types/project.types";
import { useProjectContext, useProjectSwitch } from "../../../context/ProjectContext";

const ProjectsManager = ({ onClose }: { onClose: () => void }) => {
    const {
        projects,
        createProject,
        deleteProject,
        updateProject,
        clearCurrentProject,
        error: projectError,
        currentProject,
    } = useProjectContext();
    const { switchToProject } = useProjectSwitch();
    // Project manager states
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [showEditProjectModal, setShowEditProjectModal] = useState(false);
    const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [editProjectName, setEditProjectName] = useState("");
    const [editProjectDescription, setEditProjectDescription] = useState("");

    // Project management functions
    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
            setNewProjectName("");
            setNewProjectDescription("");
            setShowCreateProjectModal(false);
        }
    };

    const handleEditProject = () => {
        if (editingProject && editProjectName.trim()) {
            const updates: Partial<Project> = {
                name: editProjectName.trim(),
            };
            if (editProjectDescription.trim()) {
                updates.description = editProjectDescription.trim();
            }
            updateProject(editingProject, updates);
            setEditProjectName("");
            setEditProjectDescription("");
            setEditingProject(null);
            setShowEditProjectModal(false);
        }
    };

    const handleDeleteProject = (projectId: string) => {
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
            setDeletingProject(project);
            setShowDeleteProjectModal(true);
        }
    };

    const confirmDeleteProject = () => {
        if (deletingProject) {
            deleteProject(deletingProject.id);
            setDeletingProject(null);
            setShowDeleteProjectModal(false);
        }
    };

    const openEditProjectModal = (project: any) => {
        setEditingProject(project.id);
        setEditProjectName(project.name);
        setEditProjectDescription(project.description ?? "");
        setShowEditProjectModal(true);
    };

    const handleReturnToWelcome = () => {
        clearCurrentProject();
        onClose();
    };

    return (
        <>

            <div className="space-y-6">
                {/* Professional Header Section */}
                <div className="overflow-hidden relative p-6 bg-gradient-to-br from-purple-50 via-violet-50 to-indigo-50 rounded-xl border border-purple-100 shadow-sm dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 dark:border-gray-600">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5 dark:opacity-10">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 rounded-full translate-x-16 -translate-y-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-violet-500 rounded-full -translate-x-12 translate-y-12"></div>
                    </div>

                    <div className="flex relative flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        {/* Title and Stats */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-3">
                                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl shadow-lg">
                                    <FiSettings className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-violet-600 dark:from-purple-400 dark:to-violet-400`}>
                                        Projects Manager
                                    </h3>
                                    <div className="flex items-center mt-1 space-x-4">
                                        <p className={`text-sm font-medium dark:text-gray-300 text-gray-600`}>
                                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-purple-800 bg-purple-100 rounded-full dark:bg-purple-900 dark:text-purple-200">
                                                {projects.length} project{projects.length !== 1 ? 's' : ''}
                                            </span>
                                        </p>
                                        <p className={`text-sm dark:text-gray-400 text-gray-500`}>
                                            {currentProject ? (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full dark:bg-green-900 dark:text-green-200">
                                                    ✓ {currentProject.name} active
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-600 bg-gray-100 rounded-full dark:bg-gray-700 dark:text-gray-300">
                                                    No active project
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
                                onClick={handleReturnToWelcome}
                                className={`group relative px-4 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-gray-300 dark:bg-gray-700 dark:border dark:border-gray-600 dark:hover:bg-gray-600 text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200`}
                                title="Return to Welcome Screen"
                                data-testid="project-welcome"
                            >
                                <span className="text-sm">🏠</span>
                                <span>Welcome</span>
                            </button>
                            <button
                                onClick={() => setShowCreateProjectModal(true)}
                                className={`group relative px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105 shadow-lg overflow-hidden dark:text-white dark:bg-gradient-to-r dark:from-purple-600 dark:via-violet-600 dark:to-indigo-600 dark:hover:from-purple-700 dark:hover:via-violet-700 dark:hover:to-indigo-700 dark:shadow-purple-500/25 text-white bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-700 hover:via-violet-700 hover:to-indigo-700 shadow-purple-500/25`}
                                data-testid="project-create"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-700 transform -translate-x-full -skew-x-12 from-white/0 via-white/20 to-white/0 group-hover:translate-x-full"></div>
                                <FiPlus className="relative z-10 w-4 h-4" />
                                <span className="relative z-10">Create Project</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {projectError && (
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-red-100 rounded-lg dark:bg-red-900">
                                <span className="text-sm text-red-600 dark:text-red-400">⚠️</span>
                            </div>
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">{projectError}</p>
                        </div>
                    </div>
                )}

                {/* Projects List */}
                {projects.length === 0 ? (
                    <div className="p-8 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <div className="text-center">
                            <div className="flex justify-center items-center p-4 mx-auto mb-4 w-20 h-20 bg-purple-100 rounded-full dark:bg-purple-900">
                                <FiSettings className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 dark:text-gray-200 text-gray-800`}>
                                No projects yet
                            </h3>
                            <p className={`text-sm mb-6 dark:text-gray-400 text-gray-600`}>
                                Create your first project to organize your API testing sessions
                            </p>
                            <button
                                onClick={() => setShowCreateProjectModal(true)}
                                className={`px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 mx-auto transition-all duration-300 transform hover:scale-105 shadow-lg dark:text-white dark:bg-gradient-to-r dark:from-purple-600 dark:to-violet-600 dark:hover:from-purple-700 dark:hover:to-violet-700 dark:shadow-purple-500/25 text-white bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-purple-500/25`}
                            >
                                <FiPlus className="w-4 h-4" />
                                <span>Create Your First Project</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className={`text-lg font-semibold flex items-center space-x-2 dark:text-gray-200 text-gray-800`}>
                                <FiSettings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                <span>Your Projects</span>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-purple-200 dark:bg-purple-900 text-purple-800 bg-purple-100`}>
                                    {projects.length}
                                </span>
                            </h4>
                        </div>
                        <div className="space-y-3">
                            {projects.map((project: any) => (
                                <div
                                    key={project.id}
                                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${currentProject?.id === project.id
                                        ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-400"
                                        : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                                        }`}
                                    data-testid={`project-option-${project.name}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-1 items-center space-x-3 min-w-0">
                                            <div className={`p-2 rounded-lg ${currentProject?.id === project.id
                                                ? "bg-purple-100 dark:bg-purple-900"
                                                : "bg-gray-100 dark:bg-gray-600"
                                                }`}>
                                                <FiSettings className={`w-4 h-4 ${currentProject?.id === project.id
                                                    ? "text-purple-600 dark:text-purple-400"
                                                    : "text-gray-600 dark:text-gray-400"
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className={`font-semibold truncate ${currentProject?.id === project.id
                                                        ? "text-purple-800 dark:text-purple-200"
                                                        : "text-gray-900 dark:text-white"
                                                        }`}>
                                                        {project.name}
                                                    </h3>
                                                    {currentProject?.id === project.id && (
                                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full dark:text-purple-100 dark:bg-purple-600 text-purple-700 bg-purple-100`}>
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                {project.description && (
                                                    <p className={`text-sm truncate mt-1 ${currentProject?.id === project.id
                                                        ? "text-purple-600 dark:text-purple-300"
                                                        : "text-gray-600 dark:text-gray-400"
                                                        }`}>
                                                        {project.description}
                                                    </p>
                                                )}
                                                <p className={`text-xs mt-1 ${currentProject?.id === project.id
                                                    ? "text-purple-500 dark:text-purple-400"
                                                    : "text-gray-500 dark:text-gray-500"
                                                    }`}>
                                                    Created: {new Date(project.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center ml-4 space-x-2">
                                            {currentProject?.id !== project.id && (
                                                <button
                                                    onClick={() => switchToProject(project.id)}
                                                    className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 dark:text-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 bg-gray-200 hover:bg-gray-300 hover:text-green-600`}
                                                    title="Switch to Project"
                                                    data-testid={`project-select-${project.name}`}
                                                >
                                                    <FiCheck className="w-4 h-4" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditProjectModal(project)}
                                                className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900 hover:scale-105"
                                                title="Edit Project"
                                            >
                                                <FiEdit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className="p-2 text-gray-600 rounded-lg transition-all duration-200 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 hover:scale-105"
                                                title="Delete Project"
                                            >
                                                <FiTrash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>


            {/* Create Project Modal */}
            <Modal
                isOpen={showCreateProjectModal}
                onClose={() => setShowCreateProjectModal(false)}
                onSave={handleCreateProject}
                title="Create New Project"
                titleIcon={<FiPlus className="w-5 h-5 text-blue-500" />}
            >
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                            data-testid="project-name-input"
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Description (optional)
                        </label>
                        <textarea
                            value={newProjectDescription}
                            onChange={(e) => setNewProjectDescription(e.target.value)}
                            placeholder="Enter project description"
                            rows={3}
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                            data-testid="project-description-input"
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Project Modal */}
            <Modal
                isOpen={showEditProjectModal}
                onClose={() => setShowEditProjectModal(false)}
                onSave={handleEditProject}
                title="Edit Project"
                titleIcon={<FiEdit2 className="w-5 h-5 text-blue-500" />}
            >
                <div className="space-y-4">
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            placeholder="Enter project name"
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                        />
                    </div>
                    <div>
                        <label className={`block text-sm font-medium mb-1 dark:text-gray-300 text-gray-700`}>
                            Description (optional)
                        </label>
                        <textarea
                            value={editProjectDescription}
                            onChange={(e) => setEditProjectDescription(e.target.value)}
                            placeholder="Enter project description"
                            rows={3}
                            className={`w-full px-3 py-2 rounded-md border dark:text-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 bg-white border-gray-300`}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Project Modal */}
            <Modal
                isOpen={showDeleteProjectModal}
                onClose={() => setShowDeleteProjectModal(false)}
                onSave={confirmDeleteProject}
                title="Delete Project"
                saveButtonText="Delete"
                titleIcon={<FiTrash2 className="w-5 h-5 text-blue-500" />}
            >
                <p className={`dark:text-gray-300 text-gray-700`}>
                    Are you sure you want to delete the project "{deletingProject?.name}"? This action cannot be undone.
                </p>
            </Modal>


        </>
    )


}

export default ProjectsManager;