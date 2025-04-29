import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppContextType, URLData, Variable } from '../types';

// Types
interface QueryParam {
  key: string;
  value: string;
  description: string;
}

interface Header {
  key: string;
  value: string;
  description: string;
}

interface RequestConfig {
  method: string;
  queryParams: QueryParam[];
  headers: Header[];
  bodyType: 'none' | 'json' | 'form';
  jsonBody: string | null;
}

interface Session {
  id: string;
  name: string;
  timestamp: string;
  urlData?: URLData;
  requestConfig?: RequestConfig;
  yamlOutput?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [urlData, setUrlData] = useState<URLData>({
    baseURL: '',
    segments: '',
    queryParams: [],
    segmentVariables: [],
    processedURL: '',
  });

  const [requestConfig, setRequestConfig] = useState<RequestConfig | null>(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.requestConfig || null;
    }
    return null;
  });

  const [yamlOutput, setYamlOutput] = useState<string>(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.yamlOutput || '';
    }
    return '';
  });

  const [activeSection, setActiveSection] = useState<'url' | 'request' | 'yaml' | 'ai'>(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.activeSection || 'url';
    }
    return 'url';
  });

  const [segmentVariables, setSegmentVariables] = useState<Record<string, string>>(() => {
    const savedState = localStorage.getItem('app_state');
    if (savedState) {
      const parsed = safeParseJSON(savedState);
      return parsed?.segmentVariables || {};
    }
    return {};
  });

  const [sharedVariables, setSharedVariables] = useState<Variable[]>([]);

  const [activeSession, setActiveSession] = useState<Session | null>(() => {
    const saved = localStorage.getItem('active_session');
    if (saved) {
      const parsed = safeParseJSON(saved);
      return parsed || null;
    }
    return null;
  });

  const [savedSessions, setSavedSessions] = useState<Session[]>(() => {
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

  useEffect(() => {
    localStorage.setItem('shared_variables', JSON.stringify(sharedVariables));
  }, [sharedVariables]);

  useEffect(() => {
    localStorage.setItem('active_session', JSON.stringify(activeSession));
  }, [activeSession]);

  useEffect(() => {
    localStorage.setItem('saved_sessions', JSON.stringify(savedSessions));
  }, [savedSessions]);

  const updateSharedVariable = (key: string, value: string) => {
    setSharedVariables(prev => ({ ...prev, [key]: value }));
  };

  const deleteSharedVariable = (key: string) => {
    setSharedVariables(prev => {
      const newVars = { ...prev };
      delete newVars[key];
      return newVars;
    });
  };

  const handleNewSession = () => {
    setActiveSession(null);
    setUrlData({
      baseURL: '',
      segments: '',
      queryParams: [],
      segmentVariables: [],
      processedURL: '',
    });
    setRequestConfig(null);
    setYamlOutput('');
    setSegmentVariables({});
  };

  const handleLoadSession = (session: Session) => {
    setActiveSession(session);
    setUrlData(session.urlData || {
      baseURL: '',
      segments: '',
      queryParams: [],
      segmentVariables: [],
      processedURL: '',
    });
    setRequestConfig(session.requestConfig || null);
    setYamlOutput(session.yamlOutput || '');
  };

  const handleSaveSession = (name: string, sessionData?: Session) => {
    const newSession: Session = sessionData || {
      id: Date.now().toString(),
      name,
      timestamp: new Date().toISOString(),
      urlData: urlData || undefined,
      requestConfig: requestConfig || undefined,
      yamlOutput: yamlOutput || undefined
    };

    setSavedSessions(prev => {
      const existingIndex = prev.findIndex(s => s.id === newSession.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newSession;
        return updated;
      }
      return [...prev, newSession];
    });

    setActiveSession(newSession);
  };

  const handleDeleteSession = (id: string) => {
    setSavedSessions(prev => prev.filter(session => session.id !== id));
    if (activeSession?.id === id) {
      handleNewSession();
    }
  };

  const handleURLBuilderSubmit = (data: URLData) => {
    setUrlData(data);
    setActiveSection('request');
  };

  const handleRequestConfigSubmit = (config: RequestConfig) => {
    setRequestConfig(config);
    setActiveSection('yaml');
  };

  const handleYAMLGenerated = (yaml: string) => {
    setYamlOutput(yaml);
    setActiveSection('ai');
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
    updateSharedVariable,
    deleteSharedVariable,
    handleNewSession,
    handleLoadSession,
    handleSaveSession,
    handleDeleteSession,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { AppContext };

// Helper function to safely parse JSON
const safeParseJSON = (str: string): any => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}; 