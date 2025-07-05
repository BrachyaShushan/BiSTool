import React, { useState } from 'react';
import Toggle from './Toggle';

// Example component showing how to use Toggle in different scenarios
const ToggleUsageExample: React.FC = () => {
    const [settings, setSettings] = useState({
        notifications: true,
        darkMode: false,
        autoSave: true,
        showAdvanced: false,
        enableFeatureX: false
    });

    const updateSetting = (key: keyof typeof settings) => (checked: boolean) => {
        setSettings(prev => ({ ...prev, [key]: checked }));
    };

    return (
        <div className="p-6 space-y-6 max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Settings Panel
            </h2>

            {/* Basic settings with labels */}
            <div className="space-y-4">
                <Toggle
                    checked={settings.notifications}
                    onChange={updateSetting('notifications')}
                    label="Push Notifications"
                    description="Receive notifications for important updates"
                    colorScheme="green"
                    data-testid="notifications-toggle"
                />

                <Toggle
                    checked={settings.darkMode}
                    onChange={updateSetting('darkMode')}
                    label="Dark Mode"
                    description="Switch to dark theme"
                    colorScheme="purple"
                    data-testid="dark-mode-toggle"
                />

                <Toggle
                    checked={settings.autoSave}
                    onChange={updateSetting('autoSave')}
                    label="Auto Save"
                    description="Automatically save your work"
                    colorScheme="blue"
                    data-testid="auto-save-toggle"
                />

                <Toggle
                    checked={settings.showAdvanced}
                    onChange={updateSetting('showAdvanced')}
                    label="Show Advanced Options"
                    size="sm"
                    colorScheme="orange"
                    data-testid="advanced-toggle"
                />

                <Toggle
                    checked={settings.enableFeatureX}
                    onChange={updateSetting('enableFeatureX')}
                    label="Enable Feature X"
                    description="Beta feature - may be unstable"
                    colorScheme="red"
                    glow
                    data-testid="feature-x-toggle"
                />
            </div>

            {/* Conditional content based on toggle states */}
            {settings.showAdvanced && (
                <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Advanced Settings
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        Advanced options are now visible because the toggle is enabled.
                    </p>
                </div>
            )}

            {/* Current state display */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Settings:
                </h3>
                <pre className="text-xs text-gray-600 dark:text-gray-400">
                    {JSON.stringify(settings, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default ToggleUsageExample; 