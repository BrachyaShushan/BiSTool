import React, { useState } from 'react';
import {
    FiPlus,
    FiSave,
    FiDownload,
    FiSettings,
    FiCode,
    FiCopy,
    FiPlay,
    FiUsers,
    FiActivity,
    FiClock,
    FiTrendingUp
} from 'react-icons/fi';
import {
    Button,
    Card,
    Input,
    Select,
    Textarea,
    Badge,
    IconButton,
    StatusIndicator,
    Divider,
    Tooltip,
    StatCard,
    TestStatusBadge,
    SectionHeader,
    MonacoEditor
} from './index';

const UIComponentsDemo: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('');
    const [textareaValue, setTextareaValue] = useState('');
    const [code, setCode] = useState('{\n  "name": "BiSTool",\n  "version": "1.0.0",\n  "description": "Professional API testing tool"\n}');
    const [jsCode, setJsCode] = useState('// Welcome to Monaco Editor\nconst greeting = "Hello, World!";\n\nfunction sayHello() {\n    console.log(greeting);\n    return greeting;\n}\n\nsayHello();');

    const selectOptions = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
    ];

    return (
        <div className="p-6 space-y-8">
            <div className="space-y-4">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">UI Components Demo</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Showcase of all available UI components in the BiSTool design system.
                </p>
            </div>

            <Divider />

            {/* Monaco Editor Section */}
            <div className="space-y-6">
                <SectionHeader
                    title="Monaco Editor"
                    description="Professional code editor with expert-level design"
                    icon={FiCode}
                />

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {/* JSON Editor */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">JSON Editor</h3>
                        <MonacoEditor
                            value={code}
                            onChange={(value) => setCode(value || '')}
                            language="json"
                            height="300px"
                            variant="elevated"
                            colorTheme="bistool"
                            label="Configuration File"
                            description="Edit your API configuration"
                            icon={FiSettings}
                            filename="config.json"
                            allowCopy={true}
                            allowDownload={true}
                            allowFullscreen={true}
                            allowSettings={true}
                        />
                    </div>

                    {/* JavaScript Editor */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">JavaScript Editor</h3>
                        <MonacoEditor
                            value={jsCode}
                            onChange={(value) => setJsCode(value || '')}
                            language="javascript"
                            height="300px"
                            variant="outlined"
                            colorTheme="ocean"
                            label="Script Editor"
                            description="Write and test your JavaScript code"
                            icon={FiPlay}
                            filename="script.js"
                            customActions={[
                                {
                                    icon: FiPlay,
                                    label: 'Run Code',
                                    action: () => alert('Running code...'),
                                    variant: 'primary'
                                },
                                {
                                    icon: FiSave,
                                    label: 'Save',
                                    action: () => alert('Saving code...'),
                                    variant: 'default'
                                }
                            ]}
                        />
                    </div>
                </div>

                {/* Theme Showcase */}
                <div className="col-span-1 space-y-4 xl:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Color Themes Showcase</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <MonacoEditor
                            value='{\n  "theme": "sunset",\n  "vibrant": true\n}'
                            language="json"
                            height="160px"
                            variant="compact"
                            colorTheme="sunset"
                            label="Sunset Theme"
                            showToolbar={false}
                            readOnly={true}
                            fontSize={12}
                        />
                        <MonacoEditor
                            value='{\n  "theme": "forest",\n  "natural": true\n}'
                            language="json"
                            height="160px"
                            variant="compact"
                            colorTheme="forest"
                            label="Forest Theme"
                            showToolbar={false}
                            readOnly={true}
                            fontSize={12}
                        />
                        <MonacoEditor
                            value='{\n  "theme": "professional",\n  "clean": true\n}'
                            language="json"
                            height="160px"
                            variant="compact"
                            colorTheme="professional"
                            label="Professional Theme"
                            showToolbar={false}
                            readOnly={true}
                            fontSize={12}
                        />
                    </div>
                </div>

                {/* Loading State Demo */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Loading State</h3>
                    <MonacoEditor
                        value=""
                        language="json"
                        height="200px"
                        variant="default"
                        colorTheme="minimal"
                        label="Loading Example"
                        description="Shows premium loading animation"
                        loading={true}
                    />
                </div>
            </div>

            <Divider />

            {/* Rest of existing components... */}
            <div className="space-y-6">
                <SectionHeader
                    title="Buttons"
                    description="Various button styles and states"
                    icon={FiCode}
                />

                <div className="space-y-6">
                    {/* Solid Buttons */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 text-md dark:text-gray-300">Solid Buttons</h4>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="primary">Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="success">Success</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="warning">Warning</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="outline">Outline</Button>
                        </div>
                    </div>

                    {/* Gradient Buttons */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 text-md dark:text-gray-300">Gradient Buttons</h4>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="primary" gradient>Primary</Button>
                            <Button variant="secondary" gradient>Secondary</Button>
                            <Button variant="success" gradient>Success</Button>
                            <Button variant="danger" gradient>Danger</Button>
                            <Button variant="warning" gradient>Warning</Button>
                            <Button variant="ghost" gradient>Ghost</Button>
                            <Button variant="outline" gradient>Outline</Button>
                        </div>
                    </div>

                    {/* States */}
                    <div className="space-y-2">
                        <h4 className="font-medium text-gray-700 text-md dark:text-gray-300">Button States</h4>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="primary" gradient loading>Loading...</Button>
                            <Button variant="success" gradient disabled>Disabled</Button>
                            <Button variant="danger" gradient icon={FiPlus}>With Icon</Button>
                            <Button variant="warning" gradient icon={FiSave} iconPosition="right">Icon Right</Button>
                        </div>
                    </div>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <SectionHeader
                    title="Cards"
                    description="Container components with different variants"
                    icon={FiCopy}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <Card variant="default">
                        <h3 className="mb-2 text-lg font-semibold">Default Card</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This is a default card with standard styling.
                        </p>
                    </Card>

                    <Card variant="elevated">
                        <h3 className="mb-2 text-lg font-semibold">Elevated Card</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This card has enhanced shadow and elevation.
                        </p>
                    </Card>

                    <Card variant="outlined">
                        <h3 className="mb-2 text-lg font-semibold">Outlined Card</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            This card features a prominent border.
                        </p>
                    </Card>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <SectionHeader
                    title="Form Controls"
                    description="Input fields and form elements"
                    icon={FiCode}
                />

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                        <Input
                            label="Text Input"
                            placeholder="Enter some text..."
                            value={inputValue}
                            icon={FiCode}
                            onChange={(e) => setInputValue(e.target.value)}
                        />

                        <Select
                            label="Select Option"
                            placeholder="Choose an option..."
                            options={selectOptions}
                            value={selectValue}
                            onChange={(value: any) => setSelectValue(value.value)}
                        />
                    </div>

                    <div className="space-y-4">
                        <Textarea
                            label="Textarea"
                            placeholder="Enter multiple lines of text..."
                            rows={4}
                            value={textareaValue}
                            onChange={(e) => setTextareaValue(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <SectionHeader
                    title="Status & Indicators"
                    description="Visual feedback components"
                    icon={FiPlay}
                />

                <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="primary">Primary</Badge>
                        <Badge variant="success">Success</Badge>
                        <Badge variant="warning">Warning</Badge>
                        <Badge variant="danger">Danger</Badge>
                        <Badge variant="info">Info</Badge>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <StatusIndicator status="success" label="Success" />
                        <StatusIndicator status="error" label="Error" />
                        <StatusIndicator status="loading" label="Loading" />
                        <StatusIndicator status="warning" label="Warning" />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <TestStatusBadge status="pass" />
                        <TestStatusBadge status="fail" />
                        <TestStatusBadge status="pending" />
                        <TestStatusBadge status="running" />
                    </div>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <SectionHeader
                    title="Interactive Elements"
                    description="Buttons and interactive components"
                    icon={FiSettings}
                />

                <div className="flex flex-wrap gap-4">
                    <Tooltip content="Copy to clipboard">
                        <IconButton icon={FiCopy} variant="ghost" size="sm" />
                    </Tooltip>

                    <Tooltip content="Download file">
                        <IconButton icon={FiDownload} variant="outline" size="md" />
                    </Tooltip>

                    <Tooltip content="Settings">
                        <IconButton icon={FiSettings} variant="primary" size="lg" />
                    </Tooltip>
                </div>
            </div>

            <Divider />

            <div className="space-y-6">
                <SectionHeader
                    title="Statistics Cards"
                    description="Data visualization components"
                    icon={FiPlay}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <StatCard
                        icon={FiTrendingUp}
                        label="Total Tests"
                        value="1,234"
                        color="blue"
                    />

                    <StatCard
                        icon={FiActivity}
                        label="Success Rate"
                        value="94.5%"
                        color="green"
                    />

                    <StatCard
                        icon={FiClock}
                        label="Response Time"
                        value="245ms"
                        color="orange"
                    />

                    <StatCard
                        icon={FiUsers}
                        label="Active Users"
                        value="5,678"
                        color="purple"
                    />
                </div>
            </div>
        </div>
    );
};

export default UIComponentsDemo; 