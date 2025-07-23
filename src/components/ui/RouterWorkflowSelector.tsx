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

function getSectionIdFromPath(pathname: string): string {
    // Extract section from path like /project/:projectId/session/:sessionId/:section
    const pathParts = pathname.split('/');
    const sectionIndex = pathParts.findIndex(part => part === 'session') + 2;
    const section = pathParts[sectionIndex];

    if (section && sectionPathMap[section]) {
        return section;
    }
    return 'url'; // default
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
            const path = sectionPathMap[sectionId] || '/url';
            navigate(path);
        }
    };

    return (
        <ResponsiveWorkflowSelector
            sections={sections}
            activeSection={activeSection as SectionId}
            onSectionChange={handleSectionChange}
            className={className ?? ''}
        />
    );
};

export default RouterWorkflowSelector; 