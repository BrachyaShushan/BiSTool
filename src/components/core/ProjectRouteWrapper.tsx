import React from 'react';
import ProjectRouteGuard from './ProjectRouteGuard';
import AppLayout from '../AppLayout';

const ProjectRouteWrapper: React.FC = () => {
    return (
        <ProjectRouteGuard>
            <AppLayout />
        </ProjectRouteGuard>
    );
};

export default ProjectRouteWrapper; 