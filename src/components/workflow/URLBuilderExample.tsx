import React from 'react';
import { useURLBuilderContext, URLBuilderProvider } from '../../context/URLBuilderContext';
import { useURLBuilder } from '../../hooks/useURLBuilder';
import { buildUrlFromSegments, Segment } from '../../utils/urlBuilderUtils';
import { Button, Input } from '../ui';

// Example 1: Using the hook directly
const URLBuilderWithHook: React.FC = () => {
    const {
        protocol,
        domain,
        segments,
        builtUrl,
        setProtocol,
        setDomain,
        handleSegmentAdd,
        copyToClipboard
    } = useURLBuilder({
        autoSave: false, // Don't auto-save for this example
        persistToLocalStorage: false
    });

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Using URL Builder Hook</h3>

            <div className="space-y-4">
                <div className="flex space-x-2">
                    <Input
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                        placeholder="Protocol"
                        className="w-24"
                    />
                    <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Domain"
                        className="flex-1"
                    />
                </div>

                <div className="flex space-x-2">
                    <Button onClick={handleSegmentAdd}>Add Segment</Button>
                    <Button onClick={copyToClipboard}>Copy URL</Button>
                </div>

                <div className="p-2 font-mono text-sm bg-gray-100 rounded">
                    {builtUrl}
                </div>

                <div>
                    <p className="text-sm text-gray-600">
                        Segments: {segments.length}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Example 2: Using the context
const URLBuilderWithContext: React.FC = () => {
    const {
        protocol,
        domain,
        builtUrl,
        setProtocol,
        setDomain,
        reset
    } = useURLBuilderContext();

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Using URL Builder Context</h3>

            <div className="space-y-4">
                <div className="flex space-x-2">
                    <select
                        value={protocol}
                        onChange={(e) => setProtocol(e.target.value)}
                        className="px-3 py-2 border rounded"
                    >
                        <option value="http">HTTP</option>
                        <option value="https">HTTPS</option>
                    </select>
                    <Input
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter domain"
                        className="flex-1"
                    />
                </div>

                <Button onClick={reset} variant="outline">
                    Reset
                </Button>

                <div className="p-2 font-mono text-sm bg-gray-100 rounded">
                    {builtUrl}
                </div>
            </div>
        </div>
    );
};

// Example 3: Using utilities directly
const URLBuilderWithUtils: React.FC = () => {
    const [segments] = React.useState<Segment[]>([
        { value: 'api', isDynamic: false, paramName: '', description: '', required: false },
        { value: '', isDynamic: true, paramName: 'version', description: '', required: true },
        { value: 'users', isDynamic: false, paramName: '', description: '', required: false }
    ]);

    const builtUrl = buildUrlFromSegments(
        'https',
        'api.example.com',
        segments,
        { version: 'v1' }
    );

    return (
        <div className="p-4 border rounded-lg">
            <h3 className="mb-4 text-lg font-semibold">Using URL Builder Utils</h3>

            <div className="space-y-4">
                <div>
                    <p className="mb-2 text-sm text-gray-600">Static segments: api, users</p>
                    <p className="mb-2 text-sm text-gray-600">Dynamic segment: version = "v1"</p>
                </div>

                <div className="p-2 font-mono text-sm bg-gray-100 rounded">
                    {builtUrl}
                </div>
            </div>
        </div>
    );
};

// Main example component that demonstrates all approaches
const URLBuilderExamples: React.FC = () => {
    return (
        <div className="p-6 space-y-6">
            <h2 className="mb-6 text-2xl font-bold">URL Builder Usage Examples</h2>

            {/* Hook example */}
            <URLBuilderWithHook />

            {/* Context example */}
            <URLBuilderProvider options={{ autoSave: false }}>
                <URLBuilderWithContext />
            </URLBuilderProvider>

            {/* Utils example */}
            <URLBuilderWithUtils />
        </div>
    );
};

export default URLBuilderExamples; 