import React, { useState, useEffect } from 'react';

const SavedRequests = ({ onLoadRequest }) => {
  const [savedSessions, setSavedSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Load saved sessions from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('saved_sessions');
    if (saved) {
      setSavedSessions(JSON.parse(saved));
    }
  }, []);

  const deleteSession = (id) => {
    const updatedSessions = savedSessions.filter(session => session.timestamp !== id);
    setSavedSessions(updatedSessions);
    localStorage.setItem('saved_sessions', JSON.stringify(updatedSessions));
    setShowDeleteConfirm(null);
  };

  const loadSession = (session) => {
    setSelectedSession(session);
    onLoadRequest(session);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Saved Sessions</h2>
      
      {savedSessions.length === 0 ? (
        <p className="text-gray-500">No saved sessions yet</p>
      ) : (
        <div className="space-y-2">
          {savedSessions.map(session => (
            <div 
              key={session.timestamp} 
              className={`p-3 border rounded-lg ${
                selectedSession?.timestamp === session.timestamp ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium">{session.name || 'Unnamed Session'}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(session.timestamp).toLocaleString()}
                  </p>
                  <div className="mt-2 text-sm">
                    <p><span className="font-medium">URL:</span> {session.urlData?.builtUrl || `${session.urlData?.protocol}://${session.urlData?.domain}`}</p>
                    <p><span className="font-medium">Method:</span> {session.requestConfig?.method || 'GET'}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => loadSession(session)}
                    className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(session.timestamp)}
                    className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {showDeleteConfirm === session.timestamp && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-700">Are you sure you want to delete this session?</p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => deleteSession(session.timestamp)}
                      className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Yes, Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
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