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
        console.log(`useProjectSwitch: Switching to project ${projectId}`);

        if (!projectId) {
            console.error("useProjectSwitch: No project ID provided");
            return false;
        }

        if (currentProject?.id === projectId) {
            console.log("useProjectSwitch: Already on the requested project");
            return true;
        }

        try {
            switchProject(projectId);
            console.log("useProjectSwitch: Project switch completed successfully");
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
                console.log("Loaded projects from localStorage:", projectsArray.length);
                return projectsArray;
            }
            console.log("No projects found in localStorage");
            return [];
        } catch (err) {
            console.error("Failed to load projects:", err);
            return [];
        }
    });

    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [forceReload, setForceReload] = useState(0);

    // Load current project after projects are loaded
    useEffect(() => {
        try {
            const activeProjectId = localStorage.getItem(ACTIVE_PROJECT_KEY);
            console.log("Active project ID from localStorage:", activeProjectId);
            console.log("Available projects:", projects.length);

            if (activeProjectId && projects.length > 0) {
                const project = projects.find(p => p.id === activeProjectId);
                if (project) {
                    console.log("Setting current project:", project.name);
                    setCurrentProject(project);
                } else {
                    // Active project not found, but projects exist - set the first one as active
                    const firstProject = projects[0];
                    if (firstProject) {
                        console.log("Active project not found, setting first project as active:", firstProject.name);
                        setCurrentProject(firstProject);
                        localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                    }
                }
            } else if (projects.length > 0) {
                // No active project but projects exist, set the first one as active
                const firstProject = projects[0];
                if (firstProject) {
                    console.log("No active project, setting first project as active:", firstProject.name);
                    setCurrentProject(firstProject);
                    localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                }
            } else {
                // No projects available - clear current project to show welcome screen
                console.log("No projects available - clearing current project");
                setCurrentProject(null);
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
            }
        } catch (err) {
            console.error("Failed to load active project:", err);
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
                console.log(`Saved current project to localStorage: ${currentProject.id}`);
            } else {
                localStorage.removeItem(ACTIVE_PROJECT_KEY);
                console.log(`Removed current project from localStorage`);
            }
        } catch (err) {
            console.error("Failed to save active project:", err);
            setError("Failed to save active project: " + err);
        }
    }, [currentProject]);

    // Debug effect to track currentProject changes
    useEffect(() => {
        console.log(`ProjectContext: currentProject changed to:`, currentProject?.id || 'null');
    }, [currentProject]);

    // Effect to handle when all projects are deleted
    useEffect(() => {
        if (projects.length === 0 && currentProject) {
            console.log("All projects deleted - clearing current project to show welcome screen");
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
        console.log(`Switching to project: ${projectId}`);
        console.log(`Available projects:`, projects.map(p => ({ id: p.id, name: p.name })));

        const project = projects.find(p => p.id === projectId);
        if (project) {
            console.log(`Found project: ${project.name}`);

            // Update projects list to mark the new project as active
            setProjects(prev =>
                prev.map(p => ({ ...p, isActive: p.id === projectId }))
            );

            // Set the new current project
            setCurrentProject(project);
            setError(null);

            // Set active project in localStorage immediately
            localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);
            console.log(`Set active project in localStorage: ${projectId}`);

            // Force AppContext to reload data for the new project
            console.log(`Incrementing forceReload to trigger AppContext reload`);
            setForceReload(prev => prev + 1);
        } else {
            console.error(`Project not found: ${projectId}`);
            setError(`Project not found: ${projectId}`);
        }
    }, [projects]);

    const deleteProject = useCallback((projectId: string) => {
        const wasCurrentProject = currentProject?.id === projectId;

        console.log(`Deleting project: ${projectId}, was current project: ${wasCurrentProject}`);

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
            console.log(`Cleared storage key: ${fullKey}`);
        });

        // If we deleted the current project, force reload when another project becomes active
        if (wasCurrentProject) {
            console.log('Deleted current project, forcing reload');
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
        console.log("Clearing current project - returning to welcome screen");
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

    const value: ProjectContextType = {
        currentProject,
        projects,
        isLoading: false,
        error,
        createProject,
        switchProject,
        deleteProject,
        updateProject,
        clearCurrentProject,
        getProjectStorageKey,
        forceReload,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
}; 