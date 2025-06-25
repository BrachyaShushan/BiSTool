import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import Modal from "../core/Modal";
import {
  ExtendedSession,
  ExtendedVariable,
  ModalType,
} from "../../types/features/SavedManager";
import { FiPlus, FiEdit2, FiCopy, FiTrash2, FiChevronDown, FiGlobe, FiFolder, FiDownload, FiUpload, FiCheckSquare, FiSquare, FiCheck } from "react-icons/fi";
import { Disclosure, DisclosureButton, DisclosurePanel, Transition } from '@headlessui/react';
import { useAppContext } from "../../context/AppContext";

interface SavedManagerProps {
  activeSession: ExtendedSession | null;
  savedSessions: ExtendedSession[];
  globalVariables: Record<string, string>;
  handleLoadSession: (session: ExtendedSession) => void;
  handleSaveSession: (name: string, sessionData?: ExtendedSession) => void;
  handleDeleteSession: (id: string) => void;
  updateGlobalVariable: (key: string, value: string) => void;
  updateSessionVariable: (key: string, value: string) => void;
  deleteGlobalVariable: (key: string) => void;
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
  deleteGlobalVariable,
}) => {
  const { isDarkMode } = useTheme();
  const { methodColor } = useAppContext();
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
  const [sessionCategory, setSessionCategory] = useState<string>("");
  const [divideBy, setDivideBy] = useState<'none' | 'category'>("category");
  const [orderBy, setOrderBy] = useState<'date' | 'name' | 'method'>("name");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState<any>(null);
  const [importStep, setImportStep] = useState<'options' | 'choose'>('options');
  const [selectedImportSessions, setSelectedImportSessions] = useState<string[]>([]);
  const [selectedImportVariables, setSelectedImportVariables] = useState<string[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const valueInputRef = React.useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (
      showVariableModal &&
      modalType === "edit" &&
      valueInputRef.current
    ) {
      valueInputRef.current.focus();
      valueInputRef.current.select();
    }
  }, [showVariableModal, modalType]);

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
      setSessionCategory(session.category || "");
    } else {
      setSessionName(action === "rename" && session ? session.name : "");
      setSessionCategory(action === "rename" && session ? session.category || "" : "");
    }
    setShowSessionModal(true);
  };

  // Get unique categories from savedSessions
  const existingCategories = Array.from(new Set(savedSessions.map(s => (s.category || '').trim()).filter(Boolean)));

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
              category: sessionCategory,
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
                category: sessionCategory,
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
                category: sessionCategory,
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
        setSessionCategory("");
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

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2000);
  };

  // Helper to order sessions
  const orderSessions = (sessions: ExtendedSession[]) => {
    const methodOrder = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    return [...sessions].sort((a, b) => {
      if (orderBy === "name") {
        return a.name.localeCompare(b.name);
      } else if (orderBy === 'method') {
        const methodA = a.requestConfig?.method || '';
        const methodB = b.requestConfig?.method || '';
        const indexA = methodOrder.indexOf(methodA);
        const indexB = methodOrder.indexOf(methodB);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      } else {
        // date (descending)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
    });
  };

  // Helper to group sessions by category
  const groupByCategory = (sessions: ExtendedSession[]) => {
    const groups: Record<string, ExtendedSession[]> = {};
    sessions.forEach((session) => {
      const cat = session.category?.trim() || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(session);
    });
    return groups;
  };

  const sessionCard = (session: ExtendedSession) => {
    return (
      <div key={session.id} className={`p-3 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
        <div className="flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>{session.name}</span>
            {session.category && (
              <span className="ml-2 px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs">{session.category}</span>
            )}
            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${methodColor[(session.requestConfig?.method || "GET").toUpperCase() as keyof typeof methodColor]?.color}`}>{session.requestConfig?.method}</span>
          </div>
          <div className="flex flex-wrap space-x-4">
            <button onClick={() => { handleLoadSession(session as ExtendedSession); setShowModal(false) }} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode ? "text-white bg-blue-600 hover:bg-blue-700" : "text-blue-700 bg-blue-100 hover:bg-blue-200"}`}><FiFolder /><span>Load</span></button>
            <button onClick={() => handleSessionAction("rename", session as ExtendedSession)} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode ? "text-white bg-yellow-600 hover:bg-yellow-700" : "text-yellow-700 bg-yellow-100 hover:bg-yellow-200"}`}><FiEdit2 /><span>Rename</span></button>
            <button onClick={() => handleSessionAction("duplicate", session as ExtendedSession)} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode ? "text-white bg-green-600 hover:bg-green-700" : "text-green-700 bg-green-100 hover:bg-green-200"}`}><FiCopy /><span>Duplicate</span></button>
            <button onClick={() => handleDeleteSession(session.id)} className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode ? "text-white bg-red-600 hover:bg-red-700" : "text-red-700 bg-red-100 hover:bg-red-200"}`}><FiTrash2 /><span>Delete</span></button>
          </div>
        </div>
      </div>
    )
  }

  // Export logic
  const handleExport = () => {
    const safeGlobalVariables = Object.fromEntries(Object.entries(globalVariables).map(([key, _]) => [key, '']));
    const data = {
      savedSessions,
      globalVariables: safeGlobalVariables,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'saved_manager_export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import logic
  const handleImportClick = () => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    fileInputRef.current?.click();
  };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setImportData(data);
        setImportStep('options');
        setShowImportModal(true);
        setSelectedImportSessions(data.savedSessions?.map((s: any) => s.id) || []);
        setSelectedImportVariables(Object.keys(data.globalVariables || {}));
      } catch (err) {
        setError('Invalid import file');
      }
    };
    reader.readAsText(file);
  };

  const handleImportOption = (option: 'add' | 'override' | 'choose') => {
    if (!importData) return;
    if (option === 'add') {
      // Merge sessions (skip duplicates by id)
      const newSessions = importData.savedSessions?.filter((s: any) => !savedSessions.some(sess => sess.id === s.id)) || [];
      const mergedSessions = [...savedSessions, ...newSessions];
      // Merge variables (skip duplicates by key)
      const newVars = Object.entries(importData.globalVariables || {}).filter(([k]) => !(k in globalVariables));
      const mergedVars = { ...globalVariables, ...Object.fromEntries(newVars) };
      // Save
      mergedSessions.forEach(s => handleSaveSession(s.name, s));
      Object.entries(mergedVars).forEach(([k, v]) => updateGlobalVariable(k, v as string));
      setShowImportModal(false);
    } else if (option === 'override') {
      // Replace all
      (importData.savedSessions || []).forEach((s: any) => handleSaveSession(s.name, s));
      Object.entries(importData.globalVariables || {}).forEach(([k, v]) => updateGlobalVariable(k, v as string));
      setShowImportModal(false);
    } else if (option === 'choose') {
      setImportStep('choose');
    }
  };

  const handleChooseImport = () => {
    if (!importData) return;
    // Sessions
    const chosenSessions = (importData.savedSessions || []).filter((s: any) => selectedImportSessions.includes(s.id));
    chosenSessions.forEach((s: any) => handleSaveSession(s.name, s));
    // Variables
    const chosenVars = Object.fromEntries(
      Object.entries(importData.globalVariables || {}).filter(([k]) => selectedImportVariables.includes(k))
    );
    Object.entries(chosenVars).forEach(([k, v]) => updateGlobalVariable(k, v as string));
    setShowImportModal(false);
  };

  const toggleSession = (id: string) => {
    setSelectedImportSessions(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleVariable = (key: string) => {
    setSelectedImportVariables(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center px-3 py-1 space-x-2 text-gray-700 bg-gray-100 rounded-md dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 hover:bg-gray-200`}
      >
        <span>{activeSession?.name || "No Session"}</span>
        <FiChevronDown size={16} />
      </button>

      {/* Main Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Session Manager"
        size="6xl"
        showSaveButton={false}
      >
        <div className="grid grid-cols-2 h-full">
          {/* Sessions Section */}
          <div className={`p-4 border-r ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
            <div className="flex flex-col gap-2 justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Sessions
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleSessionAction("new")}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                    ? "text-white bg-blue-600 hover:bg-blue-700"
                    : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                    }`}
                >
                  <FiPlus />
                  <span>New Session</span>
                </button>
                <button
                  onClick={handleExport}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                    ? "text-white bg-gray-700 hover:bg-gray-600"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                  <FiDownload />
                  <span>Export</span>
                </button>
                <button
                  onClick={handleImportClick}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                    ? "text-white bg-gray-700 hover:bg-gray-600"
                    : "text-gray-700 bg-gray-100 hover:bg-gray-200"
                    }`}
                >
                  <FiUpload />
                  <span>Import</span>
                </button>
                <input
                  type="file"
                  accept="application/json"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm">Divide By:</label>
                <select
                  value={divideBy}
                  onChange={e => setDivideBy(e.target.value as 'none' | 'category')}
                  className={`px-2 py-1 rounded border ${isDarkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`}
                >
                  <option value="none">None</option>
                  <option value="category">Category</option>
                </select>
                <label className="ml-2 text-sm">Order By:</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setOrderBy('name')}
                    className={`px-3 py-1 rounded text-sm ${orderBy === 'name' ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-200') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setOrderBy('date')}
                    className={`px-3 py-1 rounded text-sm ${orderBy === 'date' ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-200') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                  >
                    Date
                  </button>
                  <button
                    onClick={() => setOrderBy('method')}
                    className={`px-3 py-1 rounded text-sm ${orderBy === 'method' ? (isDarkMode ? 'bg-blue-600' : 'bg-blue-200') : (isDarkMode ? 'bg-gray-600' : 'bg-gray-200')}`}
                  >
                    Method
                  </button>
                </div>
              </div>
            </div>

            {/* Session List */}
            {divideBy === 'category' ? (
              Object.entries(groupByCategory(orderSessions(savedSessions))).map(([cat, sessions]) => (
                <Disclosure key={cat}>
                  {({ open }: { open: boolean }) => (
                    <div className="mb-4">
                      <DisclosureButton className={`flex items-center w-full text-left font-semibold mb-2 focus:outline-none ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                        <FiChevronDown
                          className={`transition-transform duration-200 mr-2 ${open ? 'rotate-180' : ''}`}
                        />
                        {cat}
                      </DisclosureButton>
                      <Transition
                        show={open}
                        enter="transition-all duration-500 ease-in-out"
                        enterFrom="max-h-0 opacity-0"
                        enterTo="max-h-96 opacity-100"
                        leave="transition-all duration-500 ease-in-out"
                        leaveFrom="max-h-96 opacity-100"
                        leaveTo="max-h-0 opacity-0"
                      >
                        <DisclosurePanel>
                          <div className="space-y-2">
                            {sessions.map((session) => sessionCard(session))}
                          </div>
                        </DisclosurePanel>
                      </Transition>
                    </div>
                  )}
                </Disclosure>
              ))
            ) : (
              <div className="space-y-2">
                {orderSessions(savedSessions).map((session) => (
                  sessionCard(session)
                ))}
              </div>
            )}
          </div>

          {/* Variables Section */}
          <div className="p-4">
            <div className="flex flex-col gap-2 justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Variables
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleVariableAction("new", null, true)}
                  className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                    ? "text-white bg-green-600 hover:bg-green-700"
                    : "text-green-700 bg-green-100 hover:bg-green-200"
                    }`}
                >
                  <FiGlobe />
                  <span>New Global Variable</span>
                </button>
                {activeSession && (
                  <button
                    onClick={() => handleVariableAction("new", null, false)}
                    className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                      ? "text-white bg-blue-600 hover:bg-blue-700"
                      : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                      }`}
                  >
                    <FiFolder />
                    <span>New Session Variable</span>
                  </button>
                )}
              </div>
            </div>

            {/* Global Variables */}
            <div className="mb-6">
              <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                Global Variables
              </h4>
              <div className="space-y-2">
                {Object.entries(globalVariables).map(([key, value]) => {
                  const isDefaultVariable = ['username', 'password', 'base_url'].includes(key);
                  return (
                    <div key={key} className={`p-3 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {key}
                          </span>
                          {isDefaultVariable && (
                            <span className={`px-2 py-1 text-xs rounded-full ${isDarkMode
                              ? "text-blue-100 bg-blue-600"
                              : "text-blue-700 bg-blue-100"}`}>
                              Default
                            </span>
                          )}
                          <span className={`ml-2 truncate block w-40 max-w-60 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {value}
                          </span>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                          <button
                            onClick={() => handleCopy(value as string, `global-${key}`)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-green-600 hover:bg-green-700"
                              : "text-green-700 bg-green-100 hover:bg-green-200"
                              }`}
                          >
                            {copiedKey === `global-${key}` ? <FiCheck /> : <FiCopy />}
                          </button>
                          <button
                            onClick={() => handleVariableAction("edit", [key, value], true)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-blue-600 hover:bg-blue-700"
                              : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                              }`}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => deleteGlobalVariable(key)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-red-600 hover:bg-red-700"
                              : "text-red-700 bg-red-100 hover:bg-red-200"
                              }`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Session Variables */}
            {activeSession && (
              <div>
                <h4 className={`text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Session Variables
                </h4>
                <div className="space-y-2">
                  {Object.entries(activeSession.sharedVariables || {}).map(([key, value]) => (
                    <div key={key} className={`p-3 rounded-md ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {key}
                          </span>
                          <span className={`ml-2 truncate block w-40 max-w-60 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {value}
                          </span>
                        </div>
                        <div className="flex space-x-2 shrink-0">
                          <button
                            onClick={() => handleCopy(value as string, `session-${key}`)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-green-600 hover:bg-green-700"
                              : "text-green-700 bg-green-100 hover:bg-green-200"
                              }`}
                          >
                            {copiedKey === `session-${key}` ? <FiCheck /> : <FiCopy />}
                          </button>
                          <button
                            onClick={() => handleVariableAction("edit", [key, value as string], false)}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-blue-600 hover:bg-blue-700"
                              : "text-blue-700 bg-blue-100 hover:bg-blue-200"
                              }`}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => {
                              const updatedSession: ExtendedSession = {
                                ...activeSession,
                                sharedVariables: {
                                  ...activeSession.sharedVariables,
                                },
                              };
                              delete updatedSession.sharedVariables?.[key];
                              handleSaveSession(activeSession.name, updatedSession);
                            }}
                            className={`px-3 py-1 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                              ? "text-white bg-red-600 hover:bg-red-700"
                              : "text-red-700 bg-red-100 hover:bg-red-200"
                              }`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Session Modal */}
      <Modal
        isOpen={showSessionModal}
        onClose={() => {
          setShowSessionModal(false);
          setSessionName("");
          setSessionCategory("");
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
          className={`w-full px-3 py-2 rounded-md border mb-4 ${isDarkMode
            ? "text-white bg-gray-700 border-gray-600"
            : "text-gray-900 bg-white border-gray-300"
            }`}
        />
        <input
          type="text"
          value={sessionCategory}
          onChange={(e) => setSessionCategory(e.target.value)}
          placeholder="Category (optional)"
          list="category-list"
          className={`w-full px-3 py-2 rounded-md border mb-4 ${isDarkMode
            ? "text-white bg-gray-700 border-gray-600"
            : "text-gray-900 bg-white border-gray-300"
            }`}
        />
        <datalist id="category-list">
          {existingCategories.map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
        {error && (
          <p className={`text-sm ${isDarkMode ? "text-red-400" : "text-red-600"} mb-4`}>
            {error}
          </p>
        )}
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
            : `Edit ${selectedVariable.isGlobal ? "Global" : "Session"
            } Variable`
        }
      >
        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"
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
              className={`w-full px-3 py-2 rounded-md border ${isDarkMode
                ? "text-white bg-gray-700 border-gray-600"
                : "text-gray-900 bg-white border-gray-300"
                }`}
            />
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
            >
              Value
            </label>
            <input
              type="text"
              value={selectedVariable.value}
              ref={valueInputRef}
              onChange={(e) =>
                setSelectedVariable({
                  ...selectedVariable,
                  value: e.target.value,
                })
              }
              placeholder="Enter variable value"
              className={`w-full px-3 py-2 rounded-md border ${isDarkMode
                ? "text-white bg-gray-700 border-gray-600"
                : "text-gray-900 bg-white border-gray-300"
                }`}
            />
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      {showImportModal && (
        <Modal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          title={importStep === 'options' ? 'Import Sessions & Variables' : 'Choose What to Import'}
          showSaveButton={false}
        >
          {importStep === 'options' ? (
            <div className="space-y-4">
              <button
                className="px-4 py-2 w-full text-white bg-blue-600 rounded hover:bg-blue-700"
                onClick={() => handleImportOption('add')}
              >
                Import and Add (merge, skip duplicates)
              </button>
              <button
                className="px-4 py-2 w-full text-white bg-red-600 rounded hover:bg-red-700"
                onClick={() => handleImportOption('override')}
              >
                Import and Override (replace all)
              </button>
              <button
                className="px-4 py-2 w-full text-white bg-yellow-500 rounded hover:bg-yellow-600"
                onClick={() => handleImportOption('choose')}
              >
                Import and Choose What to Import
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 font-semibold">Sessions</h4>
                <div className="overflow-y-auto space-y-1 max-h-40">
                  {(importData.savedSessions || []).map((s: any) => (
                    <div key={s.id} className="flex items-center space-x-2">
                      <button onClick={() => toggleSession(s.id)} className="focus:outline-none">
                        {selectedImportSessions.includes(s.id) ? <FiCheckSquare /> : <FiSquare />}
                      </button>
                      <span>{s.name}</span>
                      {savedSessions.some(sess => sess.id === s.id) && (
                        <span className="ml-2 text-xs text-red-500">(already exists)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="mb-2 font-semibold">Global Variables</h4>
                <div className="overflow-y-auto space-y-1 max-h-40">
                  {Object.entries(importData.globalVariables || {}).map(([k, _]) => (
                    <div key={k} className="flex items-center space-x-2">
                      <button onClick={() => toggleVariable(k)} className="focus:outline-none">
                        {selectedImportVariables.includes(k) ? <FiCheckSquare /> : <FiSquare />}
                      </button>
                      <span>{k}</span>
                      {globalVariables[k] !== undefined && (
                        <span className="ml-2 text-xs text-red-500">(already exists)</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="px-4 py-2 mt-4 w-full text-white bg-blue-600 rounded hover:bg-blue-700"
                onClick={handleChooseImport}
              >
                Import Selected
              </button>
            </div>
          )}
          {error && <p className="mt-2 text-red-500">{error}</p>}
        </Modal>
      )}
    </>
  );
};

export default SavedManager;
