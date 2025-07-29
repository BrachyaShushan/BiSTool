import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ResponsiveWorkflowSelector, { Section } from './ResponsiveWorkflowSelector';
import { SectionId } from '../../types';

const sectionPathMap: Record<string, string> = {
    url: 'url',
    request: 'request',
    tests: 'tests',
    yaml: 'yaml',
    ai: 'ai',
    import: 'import',
    json: 'json',
};

// Reverse mapping to get section ID from path
const pathToSectionMap: Record<string, SectionId> = {
    'url': 'url',
    'request': 'request',
    'tests': 'tests',
    'yaml': 'yaml',
    'ai': 'ai',
    'import': 'import',
    'json': 'json',
};

function getSectionIdFromPath(pathname: string): SectionId {
    // Handle the project/session route structure: /project/:projectId/session/:sessionId/:section
    const projectSessionMatch = pathname.match(/\/project\/[^\/]+\/session\/[^\/]+\/([^\/]+)/);
    if (projectSessionMatch && projectSessionMatch[1]) {
        const sectionPath = projectSessionMatch[1];
        if (pathToSectionMap[sectionPath]) {
            return pathToSectionMap[sectionPath];
        }
    }

    // Handle root level routes (if any)
    const rootMatch = pathname.match(/^\/([^\/]+)$/);
    if (rootMatch && rootMatch[1]) {
        const sectionPath = rootMatch[1];
        if (pathToSectionMap[sectionPath]) {
            return pathToSectionMap[sectionPath];
        }
    }

    // If no valid section found, return 'url' as default
    // This should only happen on the index route which redirects to 'url'
    return 'url';
}

interface RouterWorkflowSelectorProps {
    sections: Section[];
    className?: string;
}

const RouterWorkflowSelector: React.FC<RouterWorkflowSelectorProps> = ({ sections, className }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();
    const projectId = params["projectId"];
    const sessionId = params["sessionId"];
    const activeSection = getSectionIdFromPath(location.pathname);

    const handleSectionChange = (sectionId: string) => {
        if (projectId && sessionId) {
            const path = `/project/${projectId}/session/${sessionId}/${sectionPathMap[sectionId] || 'url'}`;
            navigate(path);
        } else {
            // Fallback for cases where project/session are not in URL
            // This should rarely happen, but handle gracefully
            const path = `/${sectionPathMap[sectionId] || 'url'}`;
            navigate(path);
        }
    };

    return (
        <ResponsiveWorkflowSelector
            sections={sections}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            className={className ?? ''}
        />
    );
};

export default RouterWorkflowSelector; 