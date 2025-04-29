import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';

// Helper function to safely parse JSON
const safeParseJSON = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return null;
  }
};

const URLBuilder = ({ onSubmit }) => {
  const {
    urlData,
    setUrlData,
    sharedVariables,
    updateSharedVariable
  } = useAppContext();
  const { isDarkMode } = useTheme();

  const [protocol, setProtocol] = useState(urlData?.protocol || 'http');
  const [domain, setDomain] = useState(urlData?.domain || '{base_url}');
  const [segments, setSegments] = useState(urlData?.segments || []);
  const [builtUrl, setBuiltUrl] = useState(urlData?.builtUrl || '');
  const [sessionDescription, setSessionDescription] = useState(urlData?.sessionDescription || '');
  const [segmentVariables, setSegmentVariables] = useState(() => {
    const saved = localStorage.getItem('segment_variables');
    if (saved) {
      const parsed = safeParseJSON(saved);
      return parsed || {};
    }
    return {};
  });
  const [environment, setEnvironment] = useState('development');
  const [showVariableEditor, setShowVariableEditor] = useState(false);
  const [editingVariable, setEditingVariable] = useState(null);
  const [editingSegment, setEditingSegment] = useState(null);
  const [showSegmentEditor, setShowSegmentEditor] = useState(false);

  // Update builtUrl whenever protocol, domain, or segments change
  useEffect(() => {
    let url = `${protocol}://${domain}`;
    if (segments.length > 0) {
      url += '/' + segments.map(segment => {
        if (segment.isDynamic && segment.paramName) {
          const envVar = sharedVariables[`${segment.paramName}_${environment}`];
          const defaultVar = sharedVariables[segment.paramName];
          return `{${segment.paramName}}`; // Show the variable name in preview
        }
        return segment.value;
      }).join('/');
    }
    setBuiltUrl(url);
  }, [protocol, domain, segments, sharedVariables, environment]);

  // Sync with context whenever local state changes
  useEffect(() => {
    const data = {
      protocol,
      domain,
      segments,
      builtUrl,
      sessionDescription
    };
    setUrlData(data);
  }, [protocol, domain, segments, builtUrl, sessionDescription, setUrlData]);

  const handleEditVariable = (variableName) => {
    setEditingVariable({
      name: variableName,
      value: sharedVariables[variableName] || '',
      environment: environment
    });
    setShowVariableEditor(true);
  };

  const handleSaveVariable = () => {
    if (editingVariable) {
      const varName = editingVariable.environment === 'development'
        ? editingVariable.name
        : `${editingVariable.name}_${editingVariable.environment}`;
      updateSharedVariable(varName, editingVariable.value);
      setShowVariableEditor(false);
      setEditingVariable(null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        protocol,
        domain,
        segments,
        builtUrl,
        sessionDescription
      });
    }
  };

  const addSegment = () => {
    setSegments([...segments, { value: '', isDynamic: false, paramName: '', description: '' }]);
  };

  const removeSegment = (index) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const updateSegment = (index, field, value) => {
    const updatedSegments = [...segments];
    if (field === 'isDynamic') {
      updatedSegments[index] = {
        ...updatedSegments[index],
        isDynamic: value,
        value: value ? '' : updatedSegments[index].value,
        paramName: value ? updatedSegments[index].paramName || '' : '',
        description: updatedSegments[index].description || ''
      };
    } else if (field === 'value') {
      updatedSegments[index] = {
        ...updatedSegments[index],
        value: value,
        description: updatedSegments[index].description || ''
      };
    } else if (field === 'paramName') {
      updatedSegments[index] = {
        ...updatedSegments[index],
        paramName: value,
        value: sharedVariables[value] || '',
        description: updatedSegments[index].description || ''
      };
    } else if (field === 'description') {
      updatedSegments[index] = {
        ...updatedSegments[index],
        description: value
      };
    }
    setSegments(updatedSegments);
  };

  const handleEditSegment = (segment, index) => {
    setEditingSegment({ ...segment, index });
    setShowSegmentEditor(true);
  };

  const handleSaveSegment = () => {
    if (editingSegment) {
      const updatedSegments = [...segments];
      updatedSegments[editingSegment.index] = {
        ...updatedSegments[editingSegment.index],
        value: editingSegment.value,
        isDynamic: editingSegment.isDynamic,
        paramName: editingSegment.paramName,
        description: editingSegment.description
      };
      setSegments(updatedSegments);
      setShowSegmentEditor(false);
      setEditingSegment(null);
    }
  };

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow`}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Protocol</label>
            <select
              value={protocol}
              onChange={(e) => setProtocol(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <option value="http">HTTP</option>
              <option value="https">HTTPS</option>
            </select>
          </div>
          <div className="flex-1 ml-4">
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            />
          </div>
          <div className="flex-1 ml-4">
            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
            >
              <option value="development">Development</option>
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
          </div>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Session Description</label>
          <textarea
            value={sessionDescription}
            onChange={(e) => setSessionDescription(e.target.value)}
            placeholder="Enter a description for this API endpoint"
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
              }`}
            rows="3"
          />
        </div>

        <div className="space-y-2">
          <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Path Segments</label>
          <div className="space-y-2">
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={segment.isDynamic ? `{${segment.paramName}}` : segment.value}
                  onChange={(e) => updateSegment(index, 'value', e.target.value)}
                  placeholder="Segment"
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  disabled={segment.isDynamic}
                />
                <button
                  onClick={() => handleEditSegment(segment, index)}
                  className={`px-3 py-1 rounded-md ${segment.isDynamic
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : isDarkMode
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  Edit
                </button>
                <button
                  onClick={() => removeSegment(index)}
                  className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addSegment}
            className={`mt-2 px-3 py-2 rounded-md ${isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            Add Segment
          </button>
        </div>

        <div className={`p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-md`}>
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>URL Preview</h3>
          <div className={`mt-2 p-2 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} rounded border`}>
            <code className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{builtUrl}</code>
          </div>
          {segments.some(s => s.isDynamic) && (
            <div className="mt-4">
              <h4 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Variable Values</h4>
              <ul className="mt-2 space-y-1">
                {segments
                  .filter(s => s.isDynamic && s.paramName)
                  .map((segment, i) => {
                    const envVar = sharedVariables[`${segment.paramName}_${environment}`];
                    const defaultVar = sharedVariables[segment.paramName];
                    const value = envVar || defaultVar || 'Not set';
                    return (
                      <li key={i} className="flex items-center space-x-2 text-sm">
                        <span className={`font-mono ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{segment.paramName}:</span>
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>{value}</span>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md ${isDarkMode
              ? 'bg-gray-700 text-white hover:bg-gray-600'
              : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
          >
            Continue to Request Configuration
          </button>
        </div>
      </div>

      {showVariableEditor && editingVariable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Edit Path Segment</h3>
              <button
                onClick={() => {
                  setShowVariableEditor(false);
                  setEditingVariable(null);
                }}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Name</label>
                <input
                  type="text"
                  value={editingVariable.name}
                  onChange={(e) => setEditingVariable({ ...editingVariable, name: e.target.value })}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Description</label>
                <textarea
                  value={editingVariable.description}
                  onChange={(e) => setEditingVariable({ ...editingVariable, description: e.target.value })}
                  rows="3"
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingVariable.isDynamic}
                  onChange={(e) => setEditingVariable({ ...editingVariable, isDynamic: e.target.checked })}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}
                />
                <label className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Dynamic Segment (updates automatically)
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowVariableEditor(false);
                    setEditingVariable(null);
                  }}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveVariable}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSegmentEditor && editingSegment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md rounded-lg shadow-lg p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Edit Segment</h3>
              <button
                onClick={() => {
                  setShowSegmentEditor(false);
                  setEditingSegment(null);
                }}
                className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Value</label>
                <input
                  type="text"
                  value={editingSegment.value}
                  onChange={(e) => setEditingSegment({ ...editingSegment, value: e.target.value })}
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Description</label>
                <textarea
                  value={editingSegment.description}
                  onChange={(e) => setEditingSegment({ ...editingSegment, description: e.target.value })}
                  rows="3"
                  className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingSegment.isDynamic}
                  onChange={(e) => setEditingSegment({ ...editingSegment, isDynamic: e.target.checked })}
                  className={`h-4 w-4 text-blue-600 focus:ring-blue-500 rounded ${isDarkMode ? 'border-gray-600' : 'border-gray-300'
                    }`}
                />
                <label className={`ml-2 block text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                  Dynamic Segment
                </label>
              </div>
              {editingSegment.isDynamic && (
                <div>
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Parameter Name</label>
                  <input
                    type="text"
                    value={editingSegment.paramName}
                    onChange={(e) => setEditingSegment({ ...editingSegment, paramName: e.target.value })}
                    className={`mt-1 block w-full border rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      }`}
                  />
                </div>
              )}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowSegmentEditor(false);
                    setEditingSegment(null);
                  }}
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSegment}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>);
}
export default URLBuilder;