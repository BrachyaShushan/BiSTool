import { createBrowserRouter, Navigate } from "react-router-dom";
import Providers from "./Providers";
import URLBuilder from "./components/workflow/URLBuilder";
import RequestConfig from "./components/workflow/RequestConfig";
import TestManager from "./components/workflow/TestManager";
import YAMLGenerator from "./components/workflow/YAMLGenerator";
import AITestGenerator from "./components/workflow/AITestGenerator";
import SessionImporter from "./components/workflow/SessionImporter";
import WelcomeScreen from "./components/core/WelcomeScreen";
import JsonDiffTool from './components/utils/JsonDiffTool';
import ResultDetailPage from './components/ResultDetailPage';
import AppLayout from "./components/AppLayout";
import NotFoundPage from './components/NotFoundPage';
import ErrorBoundary from './components/ui/ErrorBoundary';
import ProjectRouteWrapper from './components/core/ProjectRouteWrapper';

const router = createBrowserRouter([
    {
        path: "/",
        element: (
            <Providers>
                <AppLayout />
            </Providers>
        ),
        errorElement: <ErrorBoundary>{null}</ErrorBoundary>,
        children: [
            { index: true, element: <WelcomeScreen /> },
            { path: "details/:type/:id", element: <ResultDetailPage /> },
            { path: "*", element: <NotFoundPage /> },
        ],
    },
    {
        path: "/project/:projectId/session/:sessionId",
        element: (
            <Providers>
                <ProjectRouteWrapper />
            </Providers>
        ),
        children: [
            { index: true, element: <Navigate to="url" replace /> },
            { path: "url", element: <URLBuilder /> },
            { path: "request", element: <RequestConfig /> },
            { path: "tests", element: <TestManager /> },
            { path: "yaml", element: <YAMLGenerator /> },
            { path: "ai", element: <AITestGenerator /> },
            { path: "import", element: <SessionImporter /> },
            { path: "json", element: <JsonDiffTool /> },
        ],
    },
]);

export default router; 