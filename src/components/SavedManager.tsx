import React, { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { useTheme } from "../context/ThemeContext";
import Modal from "./Modal";
import {
  ExtendedSession,
  ExtendedVariable,
  ModalType,
} from "../types/SavedManager";
import { URLData, RequestConfigData, Session } from "../types/app.types";

interface SavedManagerProps {
  activeSession: ExtendedSession | null;
  savedSessions: ExtendedSession[];
  globalVariables: Record<string, string>;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (name: string, sessionData?: ExtendedSession) => void;
  handleDeleteSession: (id: string) => void;
  updateGlobalVariable: (key: string, value: string) => void;
  updateSessionVariable: (key: string, value: string) => void;
}

const SavedManager: React.FC<SavedManagerProps> = ({
  activeSession,
  savedSessions,
  globalVariables,
  handleLoadSession,
  handleSaveSession,
  handleDeleteSession,
  updateGlobalVariable,
  updateSessionVariable,
}) => {
  const { isDarkMode } = useTheme();

  const [showModal, setShowModal] = useState<boolean>(false);
  const [sessionName, setSessionName] = useState<string>("");
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [showVariableModal, setShowVariableModal] = useState<boolean>(false);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [selectedSession, setSelectedSession] =
    useState<ExtendedSession | null>(null);
  const [selectedVariable, setSelectedVariable] = useState<ExtendedVariable>({
    key: "",
    value: "",
    isGlobal: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShowModal(false);
      setShowSessionModal(false);
      setShowVariableModal(false);
      setSessionName("");
      setSelectedSession(null);
      setError(null);
    };
  }, []);

  const validateSessionName = (name: string): boolean => {
    if (!name.trim()) {
      setError("Session name cannot be empty");
      return false;
    }
    if (
      savedSessions.some(
        (session) => session.name === name && session.id !== selectedSession?.id
      )
    ) {
      setError("A session with this name already exists");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSessionAction = (
    action: ModalType,
    session: ExtendedSession | null = null
  ): void => {
    setSelectedSession(session);
    setModalType(action);
    if (action === "duplicate" && session) {
      setSessionName(`${session.name} (Copy)`);
    } else {
      setSessionName(action === "rename" && session ? session.name : "");
    }
    setShowSessionModal(true);
  };

  const handleSessionModalSubmit = (): void => {
    if (!validateSessionName(sessionName)) {
      return;
    }

    if (sessionName.trim()) {
      try {
        switch (modalType) {
          case "new":
            const newSession: ExtendedSession = {
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: sessionName,
              timestamp: new Date().toISOString(),
              urlData: {
                baseURL: "",
                segments: "",
                parsedSegments: [],
                queryParams: [],
                segmentVariables: [],
                processedURL: "",
                domain: "",
                protocol: "https",
                builtUrl: "",
                environment: "development",
              },
              requestConfig: {
                method: "GET",
                queryParams: [],
                headers: [],
                bodyType: "none",
                jsonBody: "{\n  \n}",
                formData: [],
              },
              yamlOutput: "",
              segmentVariables: {},
              sharedVariables: {},
              activeSection: "url",
            };
            handleSaveSession(sessionName, newSession);
            break;
          case "rename":
            if (selectedSession) {
              const renamedSession: ExtendedSession = {
                ...selectedSession,
                name: sessionName,
              };
              handleSaveSession(sessionName, renamedSession);
            }
            break;
          case "duplicate":
            if (selectedSession) {
              const newSession: ExtendedSession = {
                ...selectedSession,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: sessionName,
                timestamp: new Date().toISOString(),
              };
              handleSaveSession(sessionName, newSession);
            }
            break;
          default:
            console.warn(`Unknown modal type: ${modalType}`);
            break;
        }
        setShowSessionModal(false);
        setSessionName("");
        setSelectedSession(null);
        setError(null);
      } catch (err) {
        setError("Failed to save session");
      }
    }
  };

  const handleVariableAction = (
    action: ModalType,
    variable: [string, string] | null = null,
    isGlobal: boolean = false
  ): void => {
    if (action === "new") {
      setSelectedVariable({ key: "", value: "", isGlobal });
    } else if (variable) {
      setSelectedVariable({
        key: variable[0],
        value: variable[1],
        isGlobal,
        originalKey: variable[0],
      });
    }
    setModalType(action);
    setShowVariableModal(true);
  };

  const handleVariableModalSubmit = (): void => {
    if (selectedVariable.key && selectedVariable.value) {
      if (selectedVariable.isGlobal) {
        updateGlobalVariable(selectedVariable.key, selectedVariable.value);
      } else {
        updateSessionVariable(selectedVariable.key, selectedVariable.value);
      }
      setShowVariableModal(false);
      setSelectedVariable({ key: "", value: "", isGlobal: false });
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`px-3 py-1 rounded-md flex items-center space-x-2 ${
          isDarkMode
            ? "bg-gray-700 text-white hover:bg-gray-600"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        <span>{activeSession?.name || "No Session"}</span>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Main Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Session Manager"
        size="6xl"
        showSaveButton={false}
      >
        <div className="grid h-full grid-cols-2">
          {/* Sessions Section */}
          <div
            className={`p-4 border-r ${
              isDarkMode ? "border-gray-700" : "border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Sessions
              </h3>
              <button
                onClick={() => handleSessionAction("new")}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  isDarkMode
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
              >
                New Session
              </button>
            </div>
            <div className="h-[calc(100%-3rem)] overflow-y-auto">
              {savedSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 rounded-md mb-2 ${
                    activeSession?.id === session.id
                      ? isDarkMode
                        ? "bg-gray-700"
                        : "bg-blue-50"
                      : isDarkMode
                      ? "hover:bg-gray-700"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {session.name}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          handleLoadSession(session as ExtendedSession)
                        }
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        }`}
                      >
                        Load
                      </button>
                      <button
                        onClick={() =>
                          handleSessionAction(
                            "rename",
                            session as ExtendedSession
                          )
                        }
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                            : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        }`}
                      >
                        Rename
                      </button>
                      <button
                        onClick={() =>
                          handleSessionAction(
                            "duplicate",
                            session as ExtendedSession
                          )
                        }
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          isDarkMode
                            ? "bg-red-600 text-white hover:bg-red-700"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
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
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-lg font-medium ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Variables
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVariableAction("new", null, true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    isDarkMode
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  New Global Variable
                </button>
                {activeSession && (
                  <button
                    onClick={() => handleVariableAction("new", null, false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      isDarkMode
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    }`}
                  >
                    New Session Variable
                  </button>
                )}
              </div>
            </div>
            <div className="h-[calc(100vh-300px)] overflow-y-auto">
              {/* Global Variables */}
              <div className="mb-6">
                <h4
                  className={`text-md font-medium mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Global Variables
                </h4>
                {Object.entries(globalVariables).map(([key, value]) => (
                  <div
                    key={key}
                    className={`p-3 rounded-md mb-2 ${
                      isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0 mr-4">
                        <span
                          className={`${
                            isDarkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          <span className="font-medium">{key}</span>:
                          <span className="block truncate" title={value}>
                            {value}
                          </span>
                        </span>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        <button
                          onClick={() =>
                            handleVariableAction("edit", [key, value], true)
                          }
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            isDarkMode
                              ? "bg-blue-600 text-white hover:bg-blue-700"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            const newGlobalVariables = { ...globalVariables };
                            delete newGlobalVariables[key];
                            Object.entries(newGlobalVariables).forEach(
                              ([k, v]) => {
                                updateGlobalVariable(k, v);
                              }
                            );
                          }}
                          className={`px-3 py-1 rounded-md text-sm font-medium ${
                            isDarkMode
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Session Variables */}
              {activeSession && (
                <div>
                  <h4
                    className={`text-md font-medium mb-2 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Session Variables ({activeSession.name})
                  </h4>
                  {Object.entries(activeSession.sharedVariables || {}).map(
                    ([key, value]) => (
                      <div
                        key={key}
                        className={`p-3 rounded-md mb-2 ${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <span
                              className={`${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              <span className="font-medium">{key}</span>:
                              <span
                                className="block truncate"
                                title={value as string}
                              >
                                {value as string}
                              </span>
                            </span>
                          </div>
                          <div className="flex space-x-2 shrink-0">
                            <button
                              onClick={() =>
                                handleVariableAction(
                                  "edit",
                                  [key, value as string],
                                  false
                                )
                              }
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                isDarkMode
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                              }`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                const updatedSession: ExtendedSession = {
                                  ...(activeSession as Session),
                                  urlData: activeSession.urlData || {
                                    baseURL: "",
                                    segments: "",
                                    parsedSegments: [],
                                    queryParams: [],
                                    segmentVariables: [],
                                    processedURL: "",
                                    domain: "",
                                    protocol: "https",
                                    builtUrl: "",
                                    environment: "development",
                                  },
                                  requestConfig:
                                    activeSession.requestConfig || {
                                      method: "GET",
                                      queryParams: [],
                                      headers: [],
                                      bodyType: "none",
                                      jsonBody: "{\n  \n}",
                                      formData: [],
                                    },
                                  yamlOutput: activeSession.yamlOutput || "",
                                  segmentVariables:
                                    activeSession.segmentVariables || {},
                                  sharedVariables: {
                                    ...(activeSession.sharedVariables || {}),
                                  },
                                  activeSection:
                                    activeSession.activeSection || "url",
                                };
                                delete updatedSession.sharedVariables[key];
                                handleSaveSession(
                                  activeSession.name,
                                  updatedSession
                                );
                              }}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                isDarkMode
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "bg-red-100 text-red-700 hover:bg-red-200"
                              }`}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Session Modal */}
      <Modal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setSessionName("");
          setSelectedSession(null);
        }}
        onSave={handleSessionModalSubmit}
        title={
          modalType === "new"
            ? "New Session"
            : modalType === "rename"
            ? "Rename Session"
            : "Duplicate Session"
        }
      >
        <input
          type="text"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          placeholder="Session name"
          className={`w-full px-3 py-2 rounded-md border mb-4 ${
            isDarkMode
              ? "bg-gray-700 border-gray-600 text-white"
              : "bg-white border-gray-300 text-gray-900"
          }`}
        />
      </Modal>

      {/* Variable Modal */}
      <Modal
        isOpen={showVariableModal}
        onClose={() => {
          setShowVariableModal(false);
          setSelectedVariable({ key: "", value: "", isGlobal: false });
        }}
        onSave={handleVariableModalSubmit}
        title={
          modalType === "new"
            ? `New ${selectedVariable.isGlobal ? "Global" : "Session"} Variable`
            : `Edit ${
                selectedVariable.isGlobal ? "Global" : "Session"
              } Variable`
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Variable Name
            </label>
            <input
              type="text"
              value={selectedVariable.key}
              onChange={(e) =>
                setSelectedVariable({
                  ...selectedVariable,
                  key: e.target.value,
                })
              }
              placeholder="Enter variable name"
              className={`w-full px-3 py-2 rounded-md border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Value
            </label>
            <input
              type="text"
              value={selectedVariable.value}
              onChange={(e) =>
                setSelectedVariable({
                  ...selectedVariable,
                  value: e.target.value,
                })
              }
              placeholder="Enter variable value"
              className={`w-full px-3 py-2 rounded-md border ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SavedManager;
