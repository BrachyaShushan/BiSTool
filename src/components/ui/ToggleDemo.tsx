import React, { useState } from 'react';
import Toggle from './Toggle';
import { Card } from './index';

const ToggleDemo: React.FC = () => {
    const [basicToggle, setBasicToggle] = useState(false);
    const [withLabelToggle, setWithLabelToggle] = useState(true);
    const [disabledToggle, setDisabledToggle] = useState(false);
    const [loadingToggle, setLoadingToggle] = useState(false);
    const [sizeToggles, setSizeToggles] = useState({
        sm: false,
        md: true,
        lg: false,
        xl: true
    });
    const [colorToggles, setColorToggles] = useState({
        blue: true,
        green: false,
        red: true,
        purple: false,
        orange: true,
        teal: false,
        pink: true,
        gray: false
    });

    const handleSizeToggle = (size: keyof typeof sizeToggles) => {
        setSizeToggles(prev => ({ ...prev, [size]: !prev[size] }));
    };

    const handleColorToggle = (color: keyof typeof colorToggles) => {
        setColorToggles(prev => ({ ...prev, [color]: !prev[color] }));
    };

    return (
        <div className="p-6 space-y-8">
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
                    Toggle Component Demo
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Professional toggle component with expert design and testing support
                </p>
            </div>

            {/* Basic Usage */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Basic Usage
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <Toggle
                                checked={basicToggle}
                                onChange={setBasicToggle}
                                data-testid="basic-toggle"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Basic toggle: {basicToggle ? 'ON' : 'OFF'}
                            </span>
                        </div>

                        <div className="flex items-center space-x-4">
                            <Toggle
                                checked={withLabelToggle}
                                onChange={setWithLabelToggle}
                                label="Toggle with label"
                                description="This toggle has a label and description"
                                data-testid="labeled-toggle"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <Toggle
                                checked={disabledToggle}
                                onChange={setDisabledToggle}
                                disabled
                                label="Disabled toggle"
                                data-testid="disabled-toggle"
                            />
                        </div>

                        <div className="flex items-center space-x-4">
                            <Toggle
                                checked={loadingToggle}
                                onChange={setLoadingToggle}
                                loading
                                label="Loading toggle"
                                data-testid="loading-toggle"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Sizes */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Sizes
                    </h2>
                    <div className="space-y-4">
                        {Object.entries(sizeToggles).map(([size, checked]) => (
                            <div key={size} className="flex items-center space-x-4">
                                <Toggle
                                    size={size as 'sm' | 'md' | 'lg' | 'xl'}
                                    checked={checked}
                                    onChange={() => handleSizeToggle(size as keyof typeof sizeToggles)}
                                    label={`Size: ${size.toUpperCase()}`}
                                    data-testid={`size-toggle-${size}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Color Schemes */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Color Schemes
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        {Object.entries(colorToggles).map(([color, checked]) => (
                            <div key={color} className="flex items-center space-x-3">
                                <Toggle
                                    colorScheme={color as any}
                                    checked={checked}
                                    onChange={() => handleColorToggle(color as keyof typeof colorToggles)}
                                    label={color.charAt(0).toUpperCase() + color.slice(1)}
                                    position="right"
                                    data-testid={`color-toggle-${color}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Advanced Features */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Advanced Features
                    </h2>
                    <div className="space-y-6">
                        {/* Glow Effect */}
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Glow Effect
                            </h3>
                            <Toggle
                                checked={true}
                                onChange={() => { }}
                                glow
                                colorScheme="purple"
                                label="Toggle with glow effect"
                                data-testid="glow-toggle"
                            />
                        </div>

                        {/* Without Icons */}
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Without Icons
                            </h3>
                            <Toggle
                                checked={true}
                                onChange={() => { }}
                                showIcon={false}
                                colorScheme="teal"
                                label="Toggle without icons"
                                data-testid="no-icon-toggle"
                            />
                        </div>

                        {/* Square Shape */}
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Square Shape
                            </h3>
                            <Toggle
                                checked={true}
                                onChange={() => { }}
                                rounded={false}
                                colorScheme="orange"
                                label="Square toggle"
                                data-testid="square-toggle"
                            />
                        </div>

                        {/* Label Position */}
                        <div>
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Label Position
                            </h3>
                            <div className="space-y-3">
                                <Toggle
                                    checked={true}
                                    onChange={() => { }}
                                    position="left"
                                    label="Label on left"
                                    description="Description text"
                                    data-testid="left-label-toggle"
                                />
                                <Toggle
                                    checked={true}
                                    onChange={() => { }}
                                    position="right"
                                    label="Label on right"
                                    description="Description text"
                                    data-testid="right-label-toggle"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Usage Examples */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Usage Examples
                    </h2>
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Basic Usage
                            </h3>
                            <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                                {`<Toggle
  checked={isEnabled}
  onChange={setIsEnabled}
  data-testid="feature-toggle"
/>`}
                            </pre>
                        </div>

                        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                With Label and Description
                            </h3>
                            <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                                {`<Toggle
  checked={notifications}
  onChange={setNotifications}
  label="Enable Notifications"
  description="Receive email and push notifications"
  colorScheme="green"
  data-testid="notifications-toggle"
/>`}
                            </pre>
                        </div>

                        <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-800">
                            <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                Advanced Configuration
                            </h3>
                            <pre className="overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                                {`<Toggle
  checked={premiumFeature}
  onChange={setPremiumFeature}
  size="lg"
  colorScheme="purple"
  glow
  label="Premium Feature"
  position="left"
  disabled={!isPremiumUser}
  data-testid="premium-toggle"
/>`}
                            </pre>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Testing Information */}
            <Card>
                <div className="p-6">
                    <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                        Testing Support
                    </h2>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            All Toggle components include comprehensive <code className="px-1 bg-gray-200 rounded dark:bg-gray-700">data-testid</code> attributes:
                        </p>
                        <ul className="ml-4 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <li>• <code className="px-1 bg-gray-200 rounded dark:bg-gray-700">data-testid</code> - Main toggle element</li>
                            <li>• <code className="px-1 bg-gray-200 rounded dark:bg-gray-700">data-testid-container</code> - Container with label</li>
                            <li>• <code className="px-1 bg-gray-200 rounded dark:bg-gray-700">data-testid-label</code> - Label element</li>
                            <li>• <code className="px-1 bg-gray-200 rounded dark:bg-gray-700">data-testid-description</code> - Description element</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default ToggleDemo; 