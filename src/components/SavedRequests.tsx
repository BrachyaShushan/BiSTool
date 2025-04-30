import React, { useState, useEffect } from "react";
import { SavedRequestsProps, SavedSession } from "../types/savedRequests.types";

const SavedRequests: React.FC<SavedRequestsProps> = ({ onLoadRequest }) => {
    const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<SavedSession | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load saved sessions from localStorage on component mount
    useEffect(() => {
        const loadSessions = () => {
            try {
                const saved = localStorage.getItem("saved_sessions");
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
                setError('Failed to load saved sessions');
                setSavedSessions([]);
            } finally {
                setIsLoading(false);
            }
        };

        loadSessions();
    }, []);

    const deleteSession = (id: string) => {
        try {
            const updatedSessions = savedSessions.filter(
                (session) => session.id !== id
            );
            setSavedSessions(updatedSessions);
            localStorage.setItem("saved_sessions", JSON.stringify(updatedSessions));
            setShowDeleteConfirm(null);
        } catch (err) {
            setError('Failed to delete session');
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

            setSelectedSession(session);
            onLoadRequest(session);
        } catch (err) {
            setError('Failed to load session');
        }
    };

    if (isLoading) {
        return <div>Loading sessions...</div>;
    }

    if (error) {
        return <div className="text-red-500">{error}</div>;
    }

    return (
        <div className="p-4 rounded-lg shadow bg-gray-50">
            <h2 className="mb-4 text-xl font-bold">Saved Sessions</h2>

            {savedSessions.length === 0 ? (
                <p className="text-gray-500">No saved sessions yet</p>
            ) : (
                <div className="space-y-2">
                    {savedSessions.map((session) => (
                        <div
                            key={session.timestamp}
                            className={`p-3 border rounded-lg ${selectedSession?.timestamp === session.timestamp
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium">
                                        {session.name || "Unnamed Session"}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {new Date(session.timestamp).toLocaleString()}
                                    </p>
                                    <div className="mt-2 text-sm">
                                        <p>
                                            <span className="font-medium">URL:</span>{" "}
                                            {session.urlData?.processedURL ||
                                                `${session.urlData?.baseURL}${session.urlData?.segments ? '/' + session.urlData.segments : ''}`}
                                        </p>
                                        <p>
                                            <span className="font-medium">Method:</span>{" "}
                                            {session.requestConfig?.method || "GET"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => loadSession(session)}
                                        className="px-2 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(session.timestamp)}
                                        className="px-2 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {showDeleteConfirm === session.timestamp && (
                                <div className="p-2 mt-2 border border-red-200 rounded bg-red-50">
                                    <p className="text-sm text-red-700">
                                        Are you sure you want to delete this session?
                                    </p>
                                    <div className="flex mt-2 space-x-2">
                                        <button
                                            onClick={() => deleteSession(session.id)}
                                            className="px-2 py-1 text-xs text-white bg-red-500 rounded hover:bg-red-600"
                                        >
                                            Yes, Delete
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteConfirm(null)}
                                            className="px-2 py-1 text-xs text-white bg-gray-500 rounded hover:bg-gray-600"
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