import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import Editor from '@monaco-editor/react';
import TokenGenerator from './TokenGenerator';

const RequestConfig = ({ onSubmit }) => {
  const { requestConfig: savedConfig, setRequestConfig, sharedVariables } = useAppContext();
  const { isDarkMode } = useTheme();
  const [tokenExpiration, setTokenExpiration] = useState(null);

  const [activeTab, setActiveTab] = useState('params');
  const [queryParams, setQueryParams] = useState(savedConfig?.queryParams || []);
  const [headers, setHeaders] = useState(savedConfig?.headers || []);
  const [method, setMethod] = useState(savedConfig?.method || 'GET');
  const [bodyType, setBodyType] = useState(savedConfig?.bodyType || 'none');
  const [jsonBody, setJsonBody] = useState(savedConfig?.jsonBody || '{\n  \n}');
  const [formData, setFormData] = useState([{ key: '', value: '', required: false }]);
  const editorRef = useRef(null);

  // Save state to context whenever it changes
  useEffect(() => {
    const config = {
      method,
      queryParams,
      headers,
      bodyType,
      jsonBody: bodyType === 'json' ? jsonBody : null
    };
    setRequestConfig(config);
  }, [method, queryParams, headers, bodyType, jsonBody, setRequestConfig]);

  // Add new query parameter
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: '', value: '', description: '', required: false }]);
  };

  // Remove query parameter
  const removeQueryParam = (index) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Update query parameter
  const updateQueryParam = (index, field, value) => {
    const updatedParams = [...queryParams];
    if (field === 'key') {
      updatedParams[index] = {
        ...updatedParams[index],
        key: value,
        description: updatedParams[index].description || '',
        required: updatedParams[index].required || false
      };
    } else if (field === 'value') {
      updatedParams[index] = {
        ...updatedParams[index],
        value: value,
        description: updatedParams[index].description || '',
        required: updatedParams[index].required || false
      };
    } else if (field === 'description') {
      updatedParams[index] = {
        ...updatedParams[index],
        description: value,
        required: updatedParams[index].required || false
      };
    } else if (field === 'required') {
      updatedParams[index] = {
        ...updatedParams[index],
        required: value
      };
    }
    setQueryParams(updatedParams);
  };

  // Add new header
  const addHeader = () => {
    setHeaders([...headers, { key: '', value: '', description: '', required: false }]);
  };

  // Remove header
  const removeHeader = (index) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  // Update header
  const updateHeader = (index, field, value) => {
    const updatedHeaders = [...headers];
    if (field === 'key') {
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        key: value,
        description: updatedHeaders[index].description || '',
        required: updatedHeaders[index].required || false
      };
    } else if (field === 'value') {
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        value: value,
        description: updatedHeaders[index].description || '',
        required: updatedHeaders[index].required || false
      };
    } else if (field === 'description') {
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        description: value,
        required: updatedHeaders[index].required || false
      };
    } else if (field === 'required') {
      updatedHeaders[index] = {
        ...updatedHeaders[index],
        required: value
      };
    }
    setHeaders(updatedHeaders);
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    // Configure JSON validation
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: "http://myserver/foo-schema.json",
        schema: {
          type: "object",
          properties: {
            "*": {
              type: "object"
            }
          }
        }
      }]
    });
  };

  const handleEditorChange = (value) => {
    setJsonBody(value);
  };

  const addFormDataField = () => {
    setFormData([...formData, { key: '', value: '', required: false }]);
  };

  const removeFormDataField = (index) => {
    setFormData(formData.filter((_, i) => i !== index));
  };

  const updateFormDataField = (index, field, value) => {
    const updatedFormData = [...formData];
    if (field === 'required') {
      updatedFormData[index] = {
        ...updatedFormData[index],
        required: value
      };
    } else {
      updatedFormData[index] = {
        ...updatedFormData[index],
        [field]: value,
        required: updatedFormData[index].required || false
      };
    }
    setFormData(updatedFormData);
  };

  const getBodyContent = () => {
    switch (bodyType) {
      case 'json':
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">JSON Body</label>
            <div className="border rounded-md overflow-hidden" style={{ height: '200px' }}>
              <Editor
                height="200px"
                defaultLanguage="json"
                value={jsonBody}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  lineNumbers: 'on',
                  roundedSelection: false,
                  scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible',
                    useShadows: false,
                    verticalScrollbarSize: 10,
                    horizontalScrollbarSize: 10
                  },
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  tabSize: 2
                }}
              />
            </div>
          </div>
        );
      case 'form':
        return (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Form Data</label>
            <div className="space-y-2">
              {formData.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                  <input
                    type="text"
                    value={field.key}
                    onChange={(e) => updateFormDataField(index, 'key', e.target.value)}
                    placeholder="Key"
                    className="block w-1/2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={field.value}
                    onChange={(e) => updateFormDataField(index, 'value', e.target.value)}
                    placeholder="Value"
                    className="block w-1/2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateFormDataField(index, 'required', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                    />
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Required</span>
                  </div>
                  <button
                    onClick={() => removeFormDataField(index)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={addFormDataField}
              className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Form Field
            </button>
          </div>
        );
      case 'none':
      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 p-4 rounded text-center">
            No body content for this request.
          </div>
        );
    }
  };

  const handleSubmit = () => {
    const config = {
      method,
      queryParams,
      headers,
      bodyType,
      jsonBody: bodyType === 'json' ? jsonBody : null
    };

    onSubmit(config);
  };

  const decodeString = useCallback((encodedString) => {
    try {
      return atob(encodedString.replace(/-/g, '+').replace(/_/g, '/'));
    } catch (e) {
      console.error('Error decoding string:', e);
      return null;
    }
  }, []);

  const checkTokenExpiration = useCallback(() => {
    const tokenName = sharedVariables.tokenName;
    const token = sharedVariables[tokenName];
    if (token && token.trim() !== "") {
      try {
        const payload = JSON.parse(decodeString(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        const duration = (exp - now) / 60; // duration in minutes
        setTokenExpiration(duration);
        return duration > 1;
      } catch (e) {
        console.error('Error checking token expiration:', e);
        setTokenExpiration(null);
        return false;
      }
    } else {
      setTokenExpiration(null);
      return false;
    }
  }, [sharedVariables, decodeString]);

  // Check token expiration periodically
  useEffect(() => {
    checkTokenExpiration();
    const interval = setInterval(checkTokenExpiration, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkTokenExpiration]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Request Configuration</h2>
        <div className="flex space-x-2 items-center">
          <TokenGenerator />
          {tokenExpiration !== null && (
            <div className={`px-3 py-1 rounded-md text-sm ${tokenExpiration > 5 ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
              tokenExpiration > 1 ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}>
              Token expires in: {Math.floor(tokenExpiration)} minutes
            </div>
          )}
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className={`w-32 px-3 py-2 rounded-md border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDarkMode
              ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
          >
            <option value="GET" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>GET</option>
            <option value="POST" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>POST</option>
            <option value="PUT" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>PUT</option>
            <option value="DELETE" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>DELETE</option>
            <option value="PATCH" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>PATCH</option>
            <option value="HEAD" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>HEAD</option>
            <option value="OPTIONS" className={isDarkMode ? 'bg-gray-700' : 'bg-white'}>OPTIONS</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="mb-4 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('params')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'params'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Query Parameters
          </button>
          <button
            onClick={() => setActiveTab('headers')}
            className={`mr-4 py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'headers'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Headers
          </button>
          <button
            onClick={() => setActiveTab('body')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'body'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
          >
            Body
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* Query Parameters Tab */}
        {activeTab === 'params' && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Query Parameters</label>
                <div className="space-y-2">
                  {queryParams.map((param, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                      <input
                        type="text"
                        value={param.key}
                        onChange={(e) => updateQueryParam(index, 'key', e.target.value)}
                        placeholder="Key"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={param.value}
                        onChange={(e) => updateQueryParam(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={param.description}
                        onChange={(e) => updateQueryParam(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={param.required}
                          onChange={(e) => updateQueryParam(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Required</span>
                      </div>
                      <button
                        onClick={() => removeQueryParam(index)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addQueryParam}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Query Parameter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Headers Tab */}
        {activeTab === 'headers' && (
          <div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Headers</label>
                <div className="space-y-2">
                  {headers.map((header, index) => (
                    <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 p-2 rounded-md">
                      <input
                        type="text"
                        value={header.key}
                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                        placeholder="Key"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={header.value}
                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={header.description}
                        onChange={(e) => updateHeader(index, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="block w-1/3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={header.required}
                          onChange={(e) => updateHeader(index, 'required', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                        />
                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Required</span>
                      </div>
                      <button
                        onClick={() => removeHeader(index)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={addHeader}
                  className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-sm leading-4 font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Header
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Body Tab */}
        {activeTab === 'body' && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Type</label>
              <select
                value={bodyType}
                onChange={(e) => setBodyType(e.target.value)}
                className="w-full md:w-1/3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="none">None</option>
                <option value="json">JSON</option>
                <option value="form">Form Data</option>
              </select>
            </div>

            <div className="mt-4">
              {getBodyContent()}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <button
          onClick={handleSubmit}
          className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Continue to YAML Generator
        </button>
      </div>
    </div>
  );
};

export default RequestConfig;