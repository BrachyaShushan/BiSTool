import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

const SavedManager = () => {
  const {
    activeSession,
    savedSessions,
    sharedVariables,
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleRenameSession,
    updateSharedVariable,
    deleteSharedVariable
  } = useAppContext();

  const { isDarkMode } = useTheme();

  const [showModal, setShowModal] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showVariableModal, setShowVariableModal] = useState(false);
  const [modalType, setModalType] = useState('new'); // 'new', 'rename', 'duplicate'
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedVariable, setSelectedVariable] = useState({ key: '', value: '' });

  const handleSave = () => {
    if (activeSession) {
      handleSaveSession(activeSession.name);
    } else {
      setModalType('new');
      setSessionName('');
      setShowSessionModal(true);
    }
  };

  const handleVariableAction = (action, variable = null) => {
    if (action === 'new') {
      setSelectedVariable({ key: '', value: '' });
    } else {
      setSelectedVariable({ key: variable[0], value: variable[1] });
    }
    setModalType(action);
    setShowVariableModal(true);
  };

  const handleVariableModalSubmit = () => {
    if (selectedVariable.key && selectedVariable.value) {
      if (modalType === 'edit' && selectedVariable.key !== selectedVariable.originalKey) {
        deleteSharedVariable(selectedVariable.originalKey);
      }
      updateSharedVariable(selectedVariable.key, selectedVariable.value);
      setShowVariableModal(false);
      setSelectedVariable({ key: '', value: '' });
    }
  };

  const handleSessionAction = (action, session = null) => {
    setSelectedSession(session);
    setModalType(action);
    setSessionName(action === 'rename' ? session.name : action === 'duplicate' ? `${session.name} (Copy)` : '');
    setShowSessionModal(true);
  };

  const handleSessionModalSubmit = () => {
    if (sessionName.trim()) {
      switch (modalType) {
        case 'new':
          handleSaveSession(sessionName);
          break;
        case 'rename':
          if (selectedSession) {
            handleRenameSession(selectedSession.id, sessionName);
          }
          break;
        case 'duplicate':
          const newSession = {
            ...selectedSession,
            id: Date.now().toString(),
            name: sessionName,
            timestamp: new Date().toISOString()
          };
          handleSaveSession(sessionName, newSession);
          break;
      }
      setShowSessionModal(false);
      setSessionName('');
      setSelectedSession(null);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-3 py-1 rounded-md flex items-center space-x-2 ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
      >
        <span>{activeSession ? activeSession.name : 'No Session'}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Main Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-11/12 max-w-6xl h-5/6 rounded-lg shadow-xl flex flex-col ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            {/* Modal Header */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
              <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Session Manager
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-full hover:bg-gray-200 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              <div className="grid grid-cols-2 h-full">
                {/* Sessions Section */}
                <div className={`p-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Sessions
                    </h3>
                    <button
                      onClick={() => handleSessionAction('new')}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      New Session
                    </button>
                  </div>
                  <div className="h-[calc(100%-3rem)] overflow-y-auto">
                    {savedSessions.map(session => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-md mb-2 ${activeSession?.id === session.id
                          ? isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
                          : isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {session.name}
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleLoadSession(session)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Load
                            </button>
                            <button
                              onClick={() => handleSessionAction('rename', session)}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Rename
                            </button>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables Section */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Variables
                    </h3>
                    <button
                      onClick={() => handleVariableAction('new')}
                      className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      New Variable
                    </button>
                  </div>
                  <div className="h-[calc(100vh-300px)] overflow-y-auto">
                    {Object.entries(sharedVariables).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-md mb-2 ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1 min-w-0 mr-4">
                            <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              <span className="font-medium">{key}</span>:
                              <span className="truncate block" title={value}>{value}</span>
                            </span>
                          </div>
                          <div className="flex space-x-2 shrink-0">
                            <button
                              onClick={() => handleVariableAction('edit', [key, value])}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteSharedVariable(key)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-96`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {modalType === 'new' ? 'New Session' : modalType === 'rename' ? 'Rename Session' : 'Duplicate Session'}
            </h3>
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="Session name"
              className={`w-full px-3 py-2 rounded-md border mb-4 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowSessionModal(false);
                  setSessionName('');
                  setSelectedSession(null);
                }}
                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleSessionModalSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {modalType === 'new' ? 'Create' : modalType === 'rename' ? 'Rename' : 'Duplicate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Variable Modal */}
      {showVariableModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} w-96`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {modalType === 'new' ? 'New Variable' : 'Edit Variable'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Variable Name
                </label>
                <input
                  type="text"
                  value={selectedVariable.key}
                  onChange={(e) => setSelectedVariable({ ...selectedVariable, key: e.target.value })}
                  placeholder="Enter variable name"
                  className={`w-full px-3 py-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Value
                </label>
                <input
                  type="text"
                  value={selectedVariable.value}
                  onChange={(e) => setSelectedVariable({ ...selectedVariable, value: e.target.value })}
                  placeholder="Enter variable value"
                  className={`w-full px-3 py-2 rounded-md border ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={() => {
                  setShowVariableModal(false);
                  setSelectedVariable({ key: '', value: '' });
                }}
                className={`px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleVariableModalSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {modalType === 'new' ? 'Create' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SavedManager; 