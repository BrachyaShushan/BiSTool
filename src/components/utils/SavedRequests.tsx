import React, { useState, useEffect } from "react";
import { useProjectContext } from "../../context/ProjectContext";
import { SavedRequestsProps, SavedSession } from "../../types/features/savedRequests.types";

const SavedRequests: React.FC<SavedRequestsProps> = ({ onLoadRequest }) => {
    const { getProjectStorageKey } = useProjectContext();
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved sessions from localStorage on component mount
    useEffect(() => {
        const loadSessions = () => {
            try {
                const storageKey = getProjectStorageKey("saved_sessions");
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (!Array.isArray(parsed)) {
                        throw new Error('Invalid saved sessions format');
                    }

                    // Validate each session
                    const validSessions = parsed.filter(session => {
                        if (!session || typeof session !== 'object') return false;
                        const requiredProps = ['id', 'name', 'timestamp'];
                        return requiredProps.every(prop => prop in session);
                    });

                    setSavedSessions(validSessions);
                }
            } catch (err) {
                setError('Failed to load saved sessions: ' + err);
                setSavedSessions([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSessions();
    }, [getProjectStorageKey]);

    const deleteSession = (id: string) => {
        try {
            const updatedSessions = savedSessions.filter(
                (session) => session.id !== id
            );
            setSavedSessions(updatedSessions);
            const storageKey = getProjectStorageKey("saved_sessions");
            localStorage.setItem(storageKey, JSON.stringify(updatedSessions));
            setShowDeleteConfirm(null);
        } catch (err) {
            setError('Failed to delete session: ' + err);
        }
    };

    const loadSession = (session: SavedSession) => {
        try {
            if (!session || typeof session !== 'object') {
                throw new Error('Invalid session data');
            }

            // Validate required session properties
            const requiredProps = ['id', 'name', 'timestamp'];
            const missingProps = requiredProps.filter(prop => !(prop in session));
            if (missingProps.length > 0) {
                throw new Error(`Missing required session properties: ${missingProps.join(', ')}`);
            }

            onLoadRequest(session);
        } catch (err) {
            setError('Failed to load session: ' + err);
        }
    };

    if (isLoading) {
        return <div>Loading sessions...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Saved Requests</h3>
            {savedSessions.length === 0 ? (
                <p className="text-gray-500">No saved requests found.</p>
            ) : (
                <div className="space-y-2">
                    {savedSessions.map((session) => (
                        <div
                            key={session.id}
                            className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium">{session.name}</h4>
                                    <p className="text-sm text-gray-500">
                                        {new Date(session.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadSession(session)}
                                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(session.id)}
                                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            {showDeleteConfirm === session.id && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                    <p className="text-sm text-red-700 dark:text-red-300">
                                        Are you sure you want to delete this session?
                                    </p>
                                    <div className="flex space-x-2 mt-2">
                                        <button
                                            onClick={() => deleteSession(session.id)}
                                            className="px-2 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                                        >
                                            Confirm
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            className="px-2 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SavedRequests; 