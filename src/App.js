// In App.js, modify your component to ensure proper flow
import React from 'react';
import URLBuilder from './components/URLBuilder';
import RequestConfig from './components/RequestConfig';
import YAMLGenerator from './components/YAMLGenerator';
import AITestGenerator from './components/AITestGenerator';
import SavedManager from './components/SavedManager';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

const AppContent = () => {
  const {
    urlData,
    requestConfig,
    yamlOutput,
    activeSection,
    handleURLBuilderSubmit,
    handleRequestConfigSubmit,
    handleYAMLGenerated,
    setActiveSection
  } = useAppContext();

  const { isDarkMode, toggleDarkMode } = useTheme();

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'request':
        return <RequestConfig onSubmit={handleRequestConfigSubmit} />;
      case 'yaml':
        return <YAMLGenerator onGenerate={handleYAMLGenerated} />;
      case 'ai':
        return <AITestGenerator yamlData={yamlOutput} />;
      case 'url':
      default:
        return <URLBuilder onSubmit={handleURLBuilderSubmit} />;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm transition-colors duration-200`}>
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>BiSTool</h1>
              </div>
              <div className="flex items-center space-x-4">
                <SavedManager />
                <button
                  onClick={toggleDarkMode}
                  className={`p-2 rounded-full transition-colors duration-200 ${isDarkMode ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation Steps */}
        <div className="mt-6">
          <nav className="flex justify-center">
            <ol className="flex items-center space-x-4">
              {['URL Builder', 'Request Config', 'YAML Generator', 'AI Test Generator'].map((step, index) => {
                const stepKey = ['url', 'request', 'yaml', 'ai'][index];
                const isCurrent = activeSection === stepKey;
                const isPrevious = ['url', 'request', 'yaml', 'ai'].indexOf(activeSection) > index;

                return (
                  <li key={index} className="flex items-center">
                    {index > 0 && (
                      <svg className={`h-5 w-5 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <button
                      onClick={() => setActiveSection(stepKey)}
                      className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : isPrevious
                          ? `${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`
                          : `${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'} cursor-not-allowed`
                        }`}
                      disabled={!isPrevious && !isCurrent}
                    >
                      {step}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="mt-6">
          <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden transition-colors duration-200`}>
            {renderActiveSection()}
          </div>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;