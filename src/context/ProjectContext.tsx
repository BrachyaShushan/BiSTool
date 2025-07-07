import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
} from "react";
import { Project, ProjectContextType } from "../types/core/project.types";

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const PROJECTS_STORAGE_KEY = "bistool_projects";
const ACTIVE_PROJECT_KEY = "bistool_active_project";

export const useProjectContext = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error("useProjectContext must be used within a ProjectProvider");
    }
    return context;
};

// Custom hook for efficient project switching
export const useProjectSwitch = () => {
    const { switchProject, currentProject, projects } = useProjectContext();

    const switchToProject = useCallback(async (projectId: string) => {

        if (!projectId) {
            console.error("useProjectSwitch: No project ID provided");
            return false;
        }

        if (currentProject?.id === projectId) {
            return true;
        }

        try {
            switchProject(projectId);
            return true;
        } catch (error) {
            console.error("useProjectSwitch: Error switching project:", error);
            return false;
        }
    }, [switchProject, currentProject]);

    return {
        switchToProject,
        currentProject,
        projects
    };
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [projects, setProjects] = useState<Project[]>(() => {
        try {
            const savedProjects = localStorage.getItem(PROJECTS_STORAGE_KEY);
            if (savedProjects) {
                const parsed = JSON.parse(savedProjects);
                const projectsArray = Array.isArray(parsed) ? parsed : [];
                return projectsArray;
            }
            return [];
        } catch (err) {
            console.error("Failed to load projects:", err);
            return [];
        }
    });

    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [forceReload, setForceReload] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Load current project after projects are loaded
    useEffect(() => {
        try {
            const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);

            if (activeProjectId && projects.length > 0) {
                const project = projects.find(p => p.id === activeProjectId);
                if (project) {
                    setCurrentProject(project);
                } else {
                    // Active project not found, but projects exist - set the first one as active
                    const firstProject = projects[0];
                    if (firstProject) {
                        setCurrentProject(firstProject);
                        localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                    }
                }
            } else if (projects.length > 0) {
                // No active project but projects exist, set the first one as active
                const firstProject = projects[0];
                if (firstProject) {
                    setCurrentProject(firstProject);
                    localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                }
            } else {
                // No projects available - clear current project to show welcome screen
                setCurrentProject(null);
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
            }
        } catch (err) {
            console.error("Failed to load active project:", err);
            setError("Failed to load active project: " + err);
        } finally {
            setIsLoading(false);
        }
    }, [projects]);

    // Save projects to localStorage whenever they change
    useEffect(() => {
        try {
            localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
        } catch (err) {
            setError("Failed to save projects: " + err);
        }
    }, [projects]);

    // Save active project to localStorage whenever it changes
    useEffect(() => {
        try {
            if (currentProject) {
                localStorage.setItem(ACTIVE_PROJECT_KEY, currentProject.id);
            } else {
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
            }
        } catch (err) {
            console.error("Failed to save active project:", err);
            setError("Failed to save active project: " + err);
        }
    }, [currentProject]);

    // Effect to handle when all projects are deleted
    useEffect(() => {
        if (projects.length === 0 && currentProject) {
            setCurrentProject(null);
            localStorage.removeItem(ACTIVE_PROJECT_KEY);
        }
    }, [projects.length, currentProject]);

    const createProject = useCallback((name: string, description?: string) => {
        const newProject: Project = {
            id: `project_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            name: name.trim(),
            ...(description && { description: description.trim() }),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isActive: true,
        };

        setProjects(prev => {
            const updated = prev.map(p => ({ ...p, isActive: false }));
            return [...updated, newProject];
        });

        setCurrentProject(newProject);
        setError(null);

        // Force AppContext to reload data for the new project
        setForceReload(prev => prev + 1);
    }, []);

    const switchProject = useCallback((projectId: string) => {
        setIsLoading(true);
        setError(null);

        const project = projects.find(p => p.id === projectId);
        if (project) {

            // Update projects list to mark the new project as active
            setProjects(prev =>
                prev.map(p => ({ ...p, isActive: p.id === projectId }))
            );

            // Set the new current project
            setCurrentProject(project);

            // Set active project in localStorage immediately
            localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);

            // Force AppContext to reload data for the new project
            setForceReload(prev => prev + 1);
        } else {
            console.error(`Project not found: ${projectId}`);
            setError(`Project not found: ${projectId}`);
            setIsLoading(false);
        }
    }, [projects]);

    const deleteProject = useCallback((projectId: string) => {
        const wasCurrentProject = currentProject?.id === projectId;

        setProjects(prev => prev.filter(p => p.id !== projectId));

        // Clear project-specific storage
        const storageKeys = [
            "app_state",
            "active_session",
            "saved_sessions",
            "shared_variables",
            "token_config",
            "ai_config"
        ];

        storageKeys.forEach(key => {
            const fullKey = `${projectId}_${key}`;
            localStorage.removeItem(fullKey);
        });

        // If we deleted the current project, force reload when another project becomes active
        if (wasCurrentProject) {
            setForceReload(prev => prev + 1);
        }
    }, [currentProject]);

    const updateProject = useCallback((projectId: string, updates: Partial<Project>) => {
        setProjects(prev =>
            prev.map(p =>
                p.id === projectId
                    ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                    : p
            )
        );
    }, []);

    const clearCurrentProject = useCallback(() => {
        setCurrentProject(null);
        setError(null);
        localStorage.removeItem(ACTIVE_PROJECT_KEY);
        // Force AppContext to clear its state
        setForceReload(prev => prev + 1);
    }, []);

    const getProjectStorageKey = useCallback((key: string): string => {
        if (!currentProject) {
            return key; // Fallback to original key if no project is active
        }
        return `${currentProject.id}_${key}`;
    }, [currentProject?.id]);

    const setProjectLoadingComplete = useCallback(() => {
        setIsLoading(false);
    }, []);

    const value: ProjectContextType = {
        currentProject,
        projects,
        isLoading,
        error,
        createProject,
        switchProject,
        deleteProject,
        updateProject,
        clearCurrentProject,
        getProjectStorageKey,
        forceReload,
        setProjectLoadingComplete,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}; 