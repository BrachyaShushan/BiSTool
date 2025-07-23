import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useProjectContext } from '../../context/ProjectContext';

interface ProjectRouteGuardProps {
    children: React.ReactNode;
}

const ProjectRouteGuard: React.FC<ProjectRouteGuardProps> = ({ children }) => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects } = useProjectContext();

    console.log('ProjectRouteGuard:', {
        projectId,
        projectsCount: projects.length,
        projectIds: projects.map(p => p.id),
        projectExists: projects.some(project => project.id === projectId)
    });

    // Check if the project exists
    const projectExists = projects.some(project => project.id === projectId);

    // If project doesn't exist, redirect to welcome screen
    if (!projectExists && projectId) {
        console.log(`Project ${projectId} not found, redirecting to welcome screen`);
        return <Navigate to="/" replace />;
    }

    // If project exists or no projectId (welcome screen), render children
    return <>{children}</>;
};

export default ProjectRouteGuard; 