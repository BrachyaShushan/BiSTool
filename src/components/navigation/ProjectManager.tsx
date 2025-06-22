import React, { useState } from "react";
import { useProjectContext } from "../../context/ProjectContext";
import { useTheme } from "../../context/ThemeContext";
import { Project } from "../../types/core/project.types";
import Modal from "../core/Modal";
import { FiPlus, FiFolder, FiTrash2, FiEdit2, FiCheck, FiX } from "react-icons/fi";

interface ProjectManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose }) => {
    const {
        currentProject,
        projects,
        createProject,
        switchProject,
        deleteProject,
        updateProject,
        clearCurrentProject,
        error,
    } = useProjectContext();

    const { isDarkMode } = useTheme();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingProject, setEditingProject] = useState<string | null>(null);
    const [deletingProject, setDeletingProject] = useState<Project | null>(null);
    const [newProjectName, setNewProjectName] = useState("");
    const [newProjectDescription, setNewProjectDescription] = useState("");
    const [editProjectName, setEditProjectName] = useState("");
    const [editProjectDescription, setEditProjectDescription] = useState("");

    const handleCreateProject = () => {
        if (newProjectName.trim()) {
            createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
            setNewProjectName("");
            setNewProjectDescription("");
            setShowCreateModal(false);
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
            setShowEditModal(false);
        }
    };

    const handleDeleteProject = (projectId: string) => {
        const project = projects.find((p: any) => p.id === projectId);
        if (project) {
            setDeletingProject(project);
            setShowDeleteModal(true);
        }
    };

    const confirmDeleteProject = () => {
        if (deletingProject) {
            deleteProject(deletingProject.id);
            setDeletingProject(null);
            setShowDeleteModal(false);
        }
    };

    const openEditModal = (project: any) => {
        setEditingProject(project.id);
        setEditProjectName(project.name);
        setEditProjectDescription(project.description || "");
        setShowEditModal(true);
    };

    const handleModalBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleReturnToWelcome = () => {
        clearCurrentProject();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50" onClick={handleModalBackdropClick}>
            <div className={`max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden rounded-lg shadow-xl ${isDarkMode ? "text-white bg-gray-800" : "text-gray-900 bg-white"
                }`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}>
                    <h2 className="text-xl font-semibold">Project Manager</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleReturnToWelcome}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                }`}
                            title="Return to Welcome Screen"
                        >
                            <span className="text-sm">🏠</span>
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                ? "text-white bg-blue-600 hover:bg-blue-700"
                                : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                                }`}
                            title="Create New Project"
                        >
                            <FiPlus size={16} />
                        </button>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                ? "text-gray-300 bg-gray-700 hover:bg-gray-600"
                                : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            <FiX size={16} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {error && (
                        <div className="p-3 mb-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-300">
                            {error}
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div className="py-8 text-center">
                            <FiFolder size={48} className={`mx-auto mb-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`} />
                            <p className={`text-lg ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                No projects yet
                            </p>
                            <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
                                Create your first project to get started
                            </p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className={`mt-4 px-4 py-2 rounded-lg transition-colors ${isDarkMode
                                    ? "text-white bg-blue-600 hover:bg-blue-700"
                                    : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                                    }`}
                            >
                                Create Project
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((project: any) => (
                                <div
                                    key={project.id}
                                    className={`p-4 rounded-lg border transition-colors ${currentProject?.id === project.id
                                        ? isDarkMode
                                            ? "border-blue-500 bg-blue-900 bg-opacity-20"
                                            : "border-blue-500 bg-blue-50"
                                        : isDarkMode
                                            ? "border-gray-700 bg-gray-700 hover:bg-gray-600"
                                            : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                                        }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex flex-1 items-center space-x-3 min-w-0">
                                            <FiFolder
                                                size={20}
                                                className={currentProject?.id === project.id
                                                    ? "text-blue-500"
                                                    : isDarkMode ? "text-gray-400" : "text-gray-600"
                                                }
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-medium truncate">{project.name}</h3>
                                                    {currentProject?.id === project.id && (
                                                        <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode
                                                            ? "text-blue-100 bg-blue-600"
                                                            : "text-blue-700 bg-blue-100"
                                                            }`}>
                                                            Active
                                                        </span>
                                                    )}
                                                </div>
                                                {project.description && (
                                                    <p className={`text-sm truncate ${isDarkMode ? "text-gray-400" : "text-gray-600"
                                                        }`}>
                                                        {project.description}
                                                    </p>
                                                )}
                                                <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"
                                                    }`}>
                                                    Created: {new Date(project.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center ml-4 space-x-2">
                                            {currentProject?.id !== project.id && (
                                                <button
                                                    onClick={() => switchProject(project.id)}
                                                    className={`p-2 rounded transition-colors ${isDarkMode
                                                        ? "text-gray-300 bg-gray-600 hover:bg-gray-500"
                                                        : "text-gray-700 bg-gray-200 hover:bg-gray-300"
                                                        }`}
                                                    title="Switch to Project"
                                                >
                                                    <FiCheck size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => openEditModal(project)}
                                                className={`p-2 rounded transition-colors ${isDarkMode
                                                    ? "text-white bg-yellow-600 hover:bg-yellow-700"
                                                    : "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"
                                                    }`}
                                                title="Edit Project"
                                            >
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteProject(project.id)}
                                                className={`p-2 rounded transition-colors ${isDarkMode
                                                    ? "text-white bg-red-600 hover:bg-red-700"
                                                    : "text-red-700 bg-red-100 hover:bg-red-200"
                                                    }`}
                                                title="Delete Project"
                                            >
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create Project Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    setNewProjectName("");
                    setNewProjectDescription("");
                }}
                onSave={handleCreateProject}
                title="Create New Project"
                saveButtonText="Create"
                showSaveButton={!!newProjectName.trim()}
            >
                <div className="space-y-4">
                    <div>
                        <label className="flex flex-col mb-2 text-sm font-medium">
                            <span className="block mb-2 text-sm font-medium dark:text-white">Project Name *</span>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                    ? "text-white bg-gray-700 border-gray-600"
                                    : "text-gray-900 bg-white border-gray-300"
                                    }`}
                                placeholder="Enter project name"
                            />

                        </label>
                    </div>
                    <div>
                        <label className="flex flex-col mb-2 text-sm font-medium">
                            <span className="block mb-2 text-sm font-medium dark:text-white">Description (Optional)</span>
                            <textarea
                                value={newProjectDescription}
                                onChange={(e) => setNewProjectDescription(e.target.value)}
                                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                    ? "text-white bg-gray-700 border-gray-600"
                                    : "text-gray-900 bg-white border-gray-300"
                                    }`}
                                placeholder="Enter project description"
                                rows={3}
                            />
                        </label>
                    </div>
                </div>
            </Modal>

            {/* Edit Project Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditProjectName("");
                    setEditProjectDescription("");
                    setEditingProject(null);
                }}
                onSave={handleEditProject}
                title="Edit Project"
                saveButtonText="Save"
                showSaveButton={!!editProjectName.trim()}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Project Name *</label>
                        <input
                            type="text"
                            value={editProjectName}
                            onChange={(e) => setEditProjectName(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                            placeholder="Enter project name"
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Description (Optional)</label>
                        <textarea
                            value={editProjectDescription}
                            onChange={(e) => setEditProjectDescription(e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDarkMode
                                ? "text-white bg-gray-700 border-gray-600"
                                : "text-gray-900 bg-white border-gray-300"
                                }`}
                            placeholder="Enter project description"
                            rows={3}
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Project Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletingProject(null);
                }}
                onSave={confirmDeleteProject}
                title="Delete Project"
                saveButtonText="Delete"
                cancelButtonText="Cancel"
                showSaveButton={true}
                showCancelButton={true}
            >
                <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-full ${isDarkMode ? "bg-red-900" : "bg-red-100"}`}>
                            <FiTrash2 size={24} className="text-red-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-medium">Are you sure?</h3>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                                This action cannot be undone.
                            </p>
                        </div>
                    </div>

                    {deletingProject && (
                        <div className={`p-4 rounded-lg border ${isDarkMode ? "bg-red-900 bg-opacity-20 border-red-700" : "bg-red-50 border-red-200"}`}>
                            <div className="flex items-center space-x-3">
                                <FiFolder size={20} className="text-red-600" />
                                <div>
                                    <p className="font-medium text-red-800 dark:text-red-200">
                                        {deletingProject.name}
                                    </p>
                                    {deletingProject.description && (
                                        <p className={`text-sm ${isDarkMode ? "text-red-300" : "text-red-600"}`}>
                                            {deletingProject.description}
                                        </p>
                                    )}
                                    <p className={`text-xs ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                                        Created: {new Date(deletingProject.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={`p-3 rounded-lg ${isDarkMode ? "bg-yellow-900 bg-opacity-20 border border-yellow-700" : "bg-yellow-50 border border-yellow-200"}`}>
                        <p className={`text-sm ${isDarkMode ? "text-yellow-200" : "text-yellow-800"}`}>
                            <strong>Warning:</strong> Deleting this project will permanently remove all associated data including:
                        </p>
                        <ul className={`text-sm mt-2 space-y-1 ${isDarkMode ? "text-yellow-300" : "text-yellow-700"}`}>
                            <li>• Saved sessions and requests</li>
                            <li>• Global variables</li>
                            <li>• Test configurations</li>
                            <li>• All project-specific data</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ProjectManager; 