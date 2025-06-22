export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ProjectContextType {
  currentProject: Project | null;
  projects: Project[];
  isLoading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => void;
  switchProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  clearCurrentProject: () => void;
  getProjectStorageKey: (key: string) => string;
  forceReload: number;
}

export interface ProjectStorage {
  [projectId: string]: {
    app_state: string;
    active_session: string;
    saved_sessions: string;
    shared_variables: string;
  };
}
