import React, { useState } from 'react';
import { MonacoEditor, Button } from './index';
import { FiCode, FiDatabase, FiFileText, FiPlay, FiLayers } from 'react-icons/fi';

const MonacoEditorDemo: React.FC = () => {
    const [jsonValue, setJsonValue] = useState(`{
  "name": "BiSTool Theme Demo",
  "version": "2.0.0",
  "description": "Monaco Editor with custom background themes",
  "features": {
    "customThemes": true,
    "realTimeThemeSwitching": true,
    "coloredBackgrounds": true,
    "glassmorphicDesign": true
  },
  "availableThemes": [
    "default",
    "bistool", 
    "ocean",
    "sunset",
    "forest",
    "minimal",
    "professional"
  ]
}`);

    const [pythonValue, setPythonValue] = useState(`def test_theme_colors():
    """
    Test different editor themes with beautiful colors
    """
    themes = {
        'default': '#ffffff',
        'bistool': '#f8fafc',  # Blue-tinted background
        'ocean': '#f0fdfa',    # Cyan-tinted background
        'sunset': '#fff7ed',   # Orange-tinted background
        'forest': '#f0fdf4',   # Green-tinted background
        'minimal': '#fefefe',  # Clean white
        'professional': '#fafafa'  # Sophisticated gray
    }
    
    for theme_name, bg_color in themes.items():
        print(f"Theme: {theme_name} - Background: {bg_color}")
    
    return "All themes tested successfully!"`);

    const [yamlValue, setYamlValue] = useState(`# Monaco Editor Theme Configuration
apiVersion: v1
kind: EditorTheme
metadata:
  name: custom-monaco-themes
spec:
  themes:
    - name: bistool
      colors:
        background: "#f8fafc"
        foreground: "#1e293b"
        cursor: "#3b82f6"
    - name: ocean
      colors:
        background: "#f0fdfa"
        foreground: "#134e4a"
        cursor: "#06b6d4"
    - name: sunset
      colors:
        background: "#fff7ed"
        foreground: "#7c2d12"
        cursor: "#ea580c"`);

    // Theme state management
    const [currentTheme, setCurrentTheme] = useState<'default' | 'bistool' | 'ocean' | 'sunset' | 'forest' | 'minimal' | 'professional'>('default');

    const themes = [
        { value: 'default', name: 'Default', colors: ['from-gray-600', 'to-gray-700'] },
        { value: 'bistool', name: 'BiSTool', colors: ['from-blue-500', 'to-indigo-500'] },
        { value: 'ocean', name: 'Ocean', colors: ['from-cyan-500', 'to-blue-500'] },
        { value: 'sunset', name: 'Sunset', colors: ['from-orange-500', 'to-red-500'] },
        { value: 'forest', name: 'Forest', colors: ['from-green-500', 'to-emerald-500'] },
        { value: 'minimal', name: 'Minimal', colors: ['from-gray-500', 'to-slate-500'] },
        { value: 'professional', name: 'Pro', colors: ['from-slate-600', 'to-zinc-600'] }
    ];

    return (
        <div className="p-6 space-y-8">
            <div className="text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Monaco Editor with Custom Themes
                </h1>
                <p className="mb-6 text-gray-600 dark:text-gray-400">
                    Experience beautiful Monaco editors with custom background themes that match your design
                </p>

                {/* Theme Selector */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    <div className="flex items-center gap-2 mr-4">
                        <FiLayers className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Theme:</span>
                    </div>
                    {themes.map((theme) => (
                        <Button
                            key={theme.value}
                            variant={currentTheme === theme.value ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentTheme(theme.value as any)}
                            className="flex items-center gap-2"
                        >
                            <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${theme.colors[0]} ${theme.colors[1]}`}></div>
                            {theme.name}
                        </Button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* JSON Editor with Theme */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        JSON Editor with Custom Theme
                    </h2>
                    <MonacoEditor
                        value={jsonValue}
                        onChange={(value) => setJsonValue(value || '')}
                        language="json"
                        height="300px"
                        colorTheme={currentTheme}
                        label="Theme Configuration"
                        description={`Using ${currentTheme} theme with custom background colors`}
                        icon={FiCode}
                        variant="elevated"
                        allowSettings={true}
                        allowCopy={true}
                        allowFullscreen={true}
                        filename="theme-config.json"
                    />
                </div>

                {/* Python Editor with Custom Actions */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Python Editor with Theme Colors
                    </h2>
                    <MonacoEditor
                        value={pythonValue}
                        onChange={(value) => setPythonValue(value || '')}
                        language="python"
                        height="300px"
                        colorTheme={currentTheme}
                        label="Theme Test Script"
                        description={`Python code with ${currentTheme} background theme`}
                        icon={FiDatabase}
                        variant="elevated"
                        allowDownload={true}
                        filename="theme_test.py"
                        customActions={[
                            {
                                icon: FiPlay,
                                label: 'Run Script',
                                action: () => alert(`Running Python script with ${currentTheme} theme...`),
                                variant: 'primary'
                            }
                        ]}
                    />
                </div>

                {/* YAML Editor (Compact) */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        YAML Editor with Theme
                    </h2>
                    <MonacoEditor
                        value={yamlValue}
                        onChange={(value) => setYamlValue(value || '')}
                        language="yaml"
                        height="250px"
                        colorTheme={currentTheme}
                        label="Theme Configuration YAML"
                        description={`YAML with ${currentTheme} theme styling`}
                        icon={FiFileText}
                        variant="compact"
                        showMinimap={true}
                        fontSize={12}
                    />
                </div>

                {/* Read-only Editor */}
                <div>
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Read-only Output with Theme
                    </h2>
                    <MonacoEditor
                        value={`{
  "themeTest": "success",
  "currentTheme": "${currentTheme}",
  "backgroundColors": {
    "default": "#ffffff",
    "bistool": "#f8fafc",
    "ocean": "#f0fdfa",
    "sunset": "#fff7ed",
    "forest": "#f0fdf4",
    "minimal": "#fefefe",
    "professional": "#fafafa"
  },
  "features": [
    "Real-time theme switching",
    "Custom Monaco themes",
    "Beautiful backgrounds",
    "Coordinated colors"
  ]
}`}
                        language="json"
                        height="250px"
                        readOnly={true}
                        colorTheme={currentTheme}
                        label="Theme Test Results"
                        description={`Read-only output showing ${currentTheme} theme`}
                        variant="outlined"
                        showToolbar={false}
                        success="Theme applied successfully!"
                    />
                </div>
            </div>

            {/* Usage Examples */}
            <div className="mt-12">
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Usage Examples
                </h2>

                <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Basic Usage with Theme</h3>
                        <MonacoEditor
                            value={`import { MonacoEditor } from './components/ui';

// Basic JSON editor with custom theme
<MonacoEditor
  value={jsonValue}
  onChange={setJsonValue}
  language="json"
  height="300px"
  colorTheme="bistool"
  label="Configuration"
  description="JSON editor with BiSTool theme"
/>`}
                            language="typescript"
                            height="140px"
                            readOnly={true}
                            showToolbar={false}
                            variant="compact"
                            colorTheme={currentTheme}
                        />
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Advanced Usage with Custom Theme</h3>
                        <MonacoEditor
                            value={`// Advanced editor with custom theme and actions
<MonacoEditor
  value={code}
  onChange={setCode}
  language="python"
  height="400px"
  colorTheme="ocean"  // Custom background colors
  label="Script Editor"
  description="Python editor with Ocean theme"
  icon={FiCode}
  variant="elevated"
  allowDownload={true}
  allowSettings={true}  // Enable theme switching
  filename="script.py"
  customActions={[
    {
      icon: FiPlay,
      label: 'Run Script',
      action: () => executeScript(),
      variant: 'primary'
    }
  ]}
/>`}
                            language="typescript"
                            height="240px"
                            readOnly={true}
                            showToolbar={false}
                            variant="compact"
                            colorTheme={currentTheme}
                        />
                    </div>

                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <h3 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">Available Themes</h3>
                        <MonacoEditor
                            value={`// Available color themes:
const themes = [
  'default',      // Clean GitHub-style
  'bistool',      // Blue to indigo gradient
  'ocean',        // Cyan to teal marine
  'sunset',       // Orange to red warmth
  'forest',       // Green to emerald nature
  'minimal',      // Simple gray monochrome
  'professional' // Sophisticated slate
];

// Each theme provides:
// - Custom editor background
// - Coordinated line number colors
// - Matching cursor colors
// - Themed selection highlights
// - Harmonious wrapper styling`}
                            language="typescript"
                            height="200px"
                            readOnly={true}
                            showToolbar={false}
                            variant="compact"
                            colorTheme={currentTheme}
                        />
                    </div>
                </div>
            </div>

            {/* Features List */}
            <div className="mt-12">
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Key Features
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[
                        '🎨 7 Custom Themes',
                        '🌈 Colored Backgrounds',
                        '⚡ Real-time Theme Switch',
                        '🛠️ Customizable Toolbar',
                        '📱 Responsive Layout',
                        '🔍 Fullscreen Mode',
                        '📋 Copy to Clipboard',
                        '💾 Download Files',
                        '⚙️ Live Settings Panel',
                        '🎯 Custom Actions',
                        '📝 Multiple Languages',
                        '🚀 TypeScript Support',
                        '🎭 Monaco Theme Engine',
                        '🌙 Dark/Light Mode',
                        '✨ Glassmorphic Design',
                        '🔧 Font & Size Controls'
                    ].map((feature, index) => (
                        <div key={index} className="p-4 transition-shadow bg-white border border-gray-200 rounded-lg dark:bg-gray-800 dark:border-gray-700 hover:shadow-md">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Theme Details */}
            <div className="p-6 mt-12 border bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-xl border-blue-200/60 dark:border-blue-700/40">
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Theme System
                </h2>
                <p className="mb-4 text-gray-600 dark:text-gray-300">
                    Each theme provides a complete visual experience with coordinated colors throughout the editor:
                </p>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Editor Colors</h3>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <li>• Custom background colors</li>
                            <li>• Themed line numbers</li>
                            <li>• Coordinated cursor colors</li>
                            <li>• Harmonious selection highlights</li>
                            <li>• Matching indent guides</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">Wrapper Styling</h3>
                        <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                            <li>• Glassmorphic toolbar design</li>
                            <li>• Theme-coordinated borders</li>
                            <li>• Gradient backdrop effects</li>
                            <li>• Responsive color shadows</li>
                            <li>• Live theme switching</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonacoEditorDemo; 