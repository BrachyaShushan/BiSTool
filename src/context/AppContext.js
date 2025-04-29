import React, { createContext, useContext, useState, useEffect } from 'react';

const AppContext = createContext();

// Helper function to safely parse JSON
const safeParseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return null;
  }
};

export const AppProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [urlData, setUrlData] = useState(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.urlData || null;
    }
    return null;
  });

  const [requestConfig, setRequestConfig] = useState(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.requestConfig || null;
    }
    return null;
  });

  const [yamlOutput, setYamlOutput] = useState(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.yamlOutput || '';
    }
    return '';
  });

  const [activeSection, setActiveSection] = useState(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.activeSection || 'url';
    }
    return 'url';
  });

  const [segmentVariables, setSegmentVariables] = useState(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.segmentVariables || {};
    }
    return {};
  });

  const [sharedVariables, setSharedVariables] = useState(() => {
    const saved = localStorage.getItem('shared_variables');
    if (saved) {
      const parsed = safeParseJSON(saved);
      return parsed || {};
    }
    return {};
  });

  const [activeSession, setActiveSession] = useState(() => {
    const saved = localStorage.getItem('active_session');
    if (saved) {
      const parsed = safeParseJSON(saved);
      return parsed || null;
    }
    return null;
  });

  const [savedSessions, setSavedSessions] = useState(() => {
    const saved = localStorage.getItem('saved_sessions');
    if (saved) {
      const parsed = safeParseJSON(saved);
      return parsed || [];
    }
    return [];
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    const state = {
      urlData,
      requestConfig,
      yamlOutput,
      activeSection,
      segmentVariables
    };
    localStorage.setItem('app_state', JSON.stringify(state));
  }, [urlData, requestConfig, yamlOutput, activeSection, segmentVariables]);

  // Save shared variables when they change
  useEffect(() => {
    localStorage.setItem('shared_variables', JSON.stringify(sharedVariables));
  }, [sharedVariables]);

  // Save active session when it changes
  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('active_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('active_session');
    }
  }, [activeSession]);

  // Save sessions list when it changes
  useEffect(() => {
    localStorage.setItem('saved_sessions', JSON.stringify(savedSessions));
  }, [savedSessions]);

  const handleURLBuilderSubmit = (data) => {
    setUrlData(data);
    setActiveSection('request');
  };

  const handleRequestConfigSubmit = (data) => {
    setRequestConfig(data);
    setActiveSection('yaml');
  };

  const handleYAMLGenerated = (yaml) => {
    setYamlOutput(yaml);
    setActiveSection('ai');
  };

  const handleNewSession = () => {
    // Reset all state to initial values
    setUrlData({
      protocol: 'https',
      domain: '',
      segments: [],
      builtUrl: ''
    });
    setRequestConfig({
      method: 'GET',
      queryParams: [],
      headers: [],
      bodyType: 'none',
      jsonBody: '{\n  \n}'
    });
    setYamlOutput('');
    setActiveSection('url');
    setSegmentVariables({});
    setActiveSession(null);
    // Clear all localStorage data
    localStorage.removeItem('app_state');
    localStorage.removeItem('active_session');
  };

  const handleLoadSession = (session) => {
    setUrlData(session.urlData);
    setRequestConfig(session.requestConfig);
    setSegmentVariables(session.segmentVariables || {});
    setActiveSection('yaml');
    setActiveSession(session);
  };

  const handleDuplicateSession = (session) => {
    const newSession = {
      ...session,
      name: `${session.name} (Copy)`,
      timestamp: new Date().toISOString()
    };
    return newSession;
  };

  const handleSaveSession = (name) => {
    const session = {
      id: activeSession?.id || Date.now().toString(),
      name,
      timestamp: new Date().toISOString(),
      urlData,
      requestConfig,
      segmentVariables
    };

    if (activeSession) {
      // Update existing session
      setSavedSessions(prev => prev.map(s =>
        s.id === activeSession.id ? session : s
      ));
    } else {
      // Add new session
      setSavedSessions(prev => [...prev, session]);
    }
    setActiveSession(session);
  };

  const handleDeleteSession = (sessionId) => {
    setSavedSessions(prev => prev.filter(s => s.id !== sessionId));
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
    }
  };

  const handleRenameSession = (sessionId, newName) => {
    setSavedSessions(prev => prev.map(session =>
      session.id === sessionId ? { ...session, name: newName } : session
    ));
    if (activeSession?.id === sessionId) {
      setActiveSession(prev => ({ ...prev, name: newName }));
    }
  };

  const updateSharedVariable = (key, value) => {
    setSharedVariables(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const deleteSharedVariable = (key) => {
    setSharedVariables(prev => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  const value = {
    urlData,
    requestConfig,
    yamlOutput,
    activeSection,
    segmentVariables,
    sharedVariables,
    activeSession,
    savedSessions,
    setUrlData,
    setRequestConfig,
    setYamlOutput,
    setActiveSection,
    setSegmentVariables,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
    handleNewSession,
    handleLoadSession,
    handleDuplicateSession,
    handleSaveSession,
    handleDeleteSession,
    handleRenameSession,
    updateSharedVariable,
    deleteSharedVariable
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 