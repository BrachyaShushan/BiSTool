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

    const initializeDefaultGlobalVariables = useCallback((projectId: string) => {
        try {
            const storageKey = `${projectId}_app_state`;
            const existing = localStorage.getItem(storageKey);
            const parsed = existing ? JSON.parse(existing) : null;
            const globalVariables = parsed?.globalVariables || {};

            // Define default variables with AI support
            const defaultVariables = {
                username: "",
                password: "",
                base_url: "",
                // AI Provider API Keys
                openai_api_key: "",
                anthropic_api_key: "",
                google_api_key: "",
                ollama_api_key: "",
                custom_api_key: "",
                // AI Configuration
                ai_provider: "anthropic",
                ai_model: "claude-3-5-haiku-20241022",
                ai_max_tokens: "4000",
                ai_temperature: "0.7",
                // Local AI Configuration
                ollama_base_url: "http://localhost:11434",
                custom_ai_base_url: "http://localhost:8000",
            };

            const updatedGlobalVariables = { ...globalVariables };

            // Add missing default variables
            Object.entries(defaultVariables).forEach(([key, defaultValue]) => {
                if (!(key in updatedGlobalVariables)) {
                    updatedGlobalVariables[key] = defaultValue;
                }
            });

            // Save updated global variables
            const updatedState = {
                ...parsed,
                globalVariables: updatedGlobalVariables,
            };
            localStorage.setItem(storageKey, JSON.stringify(updatedState));
        } catch (err) {
            console.error("Failed to initialize default global variables:", err);
        }
    }, []);

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
                    // Initialize default global variables for the current project
                    initializeDefaultGlobalVariables(project.id);
                } else {
                    // Active project not found, set first project as active
                    const firstProject = projects[0];
                    if (firstProject) {
                        console.log("Active project not found, setting first project as active:", firstProject.name);
                        setCurrentProject(firstProject);
                        localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                        initializeDefaultGlobalVariables(firstProject.id);
                    }
                }
            } else if (projects.length > 0) {
                // No active project but projects exist, set the first one as active
                const firstProject = projects[0];
                if (firstProject) {
                    console.log("No active project, setting first project as active:", firstProject.name);
                    setCurrentProject(firstProject);
                    localStorage.setItem(ACTIVE_PROJECT_KEY, firstProject.id);
                    initializeDefaultGlobalVariables(firstProject.id);
                }
            } else {
                console.log("No projects available");
            }
        } catch (err) {
            console.error("Failed to load active project:", err);
        }
    }, []);

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
            setError("Failed to save active project: " + err);
        }
    }, [currentProject]);

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

        // Initialize default global variables for the new project
        const defaultGlobalVariables = {
            username: "",
            password: "",
            base_url: "",
            // AI Provider API Keys
            openai_api_key: "",
            anthropic_api_key: "",
            google_api_key: "",
            ollama_api_key: "",
            custom_api_key: "",
            // AI Configuration
            ai_provider: "anthropic",
            ai_model: "claude-3-5-haiku-20241022",
            ai_max_tokens: "4000",
            ai_temperature: "0.7",
            // Local AI Configuration
            ollama_base_url: "http://localhost:11434",
            custom_ai_base_url: "http://localhost:8000",
        };

        // Save default global variables to localStorage for the new project
        try {
            const storageKey = `${newProject.id}_app_state`;
            const initialState = {
                globalVariables: defaultGlobalVariables,
                urlData: {},
                requestConfig: null,
                yamlOutput: "",
                activeSection: "url",
                segmentVariables: {},
            };
            localStorage.setItem(storageKey, JSON.stringify(initialState));
        } catch (err) {
            console.error("Failed to initialize default global variables:", err);
        }
    }, []);

    const switchProject = useCallback((projectId: string) => {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setProjects(prev =>
                prev.map(p => ({ ...p, isActive: p.id === projectId }))
            );
            setCurrentProject(project);
            setError(null);

            // Set active project in localStorage immediately
            localStorage.setItem(ACTIVE_PROJECT_KEY, projectId);

            // Initialize default global variables if they don't exist
            initializeDefaultGlobalVariables(projectId);
        } else {
            setError("Project not found");
        }
    }, [projects, initializeDefaultGlobalVariables]);

    const deleteProject = useCallback((projectId: string) => {
        setProjects(prev => prev.filter(p => p.id !== projectId));

        // Clear project-specific storage
        const storageKeys = [
            "app_state",
            "active_session",
            "saved_sessions",
            "shared_variables"
        ];

        storageKeys.forEach(key => {
            localStorage.removeItem(`${projectId}_${key}`);
        });
    }, []);

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
    }, []);

    const getProjectStorageKey = useCallback((key: string): string => {
        if (!currentProject) {
            return key; // Fallback to original key if no project is active
        }
        return `${currentProject.id}_${key}`;
    }, [currentProject]);

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