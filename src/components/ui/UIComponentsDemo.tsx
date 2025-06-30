import React, { useState } from 'react';
import {
    FiPlus,
    FiSave,
    FiTrash2,
    FiEdit2,
    FiDownload,
    FiUpload,
    FiCheck,
    FiX,
    FiAlertCircle,
    FiInfo,
    FiSettings,
    FiSearch
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
    Tooltip
} from './index';

const UIComponentsDemo: React.FC = () => {
    const [inputValue, setInputValue] = useState('');
    const [selectValue, setSelectValue] = useState('');
    const [textareaValue, setTextareaValue] = useState('');

    const selectOptions = [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
    ];

    return (
        <div className="p-8 space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold mb-4">UI Components Library</h1>
                <p className="text-gray-600 dark:text-gray-400">
                    A comprehensive collection of reusable UI components for BiSTool
                </p>
            </div>

            {/* Buttons Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Buttons</h2>

                <div className="space-y-6">
                    {/* Button Variants */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Variants</h3>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="primary" icon={FiPlus}>Primary</Button>
                            <Button variant="secondary" icon={FiSave}>Secondary</Button>
                            <Button variant="success" icon={FiCheck}>Success</Button>
                            <Button variant="danger" icon={FiTrash2}>Danger</Button>
                            <Button variant="warning" icon={FiAlertCircle}>Warning</Button>
                            <Button variant="ghost" icon={FiSettings}>Ghost</Button>
                            <Button variant="outline" icon={FiDownload}>Outline</Button>
                        </div>
                    </div>

                    {/* Button Sizes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
                        <div className="flex flex-wrap items-center gap-4">
                            <Button size="sm" variant="primary" icon={FiPlus}>Small</Button>
                            <Button size="md" variant="primary" icon={FiPlus}>Medium</Button>
                            <Button size="lg" variant="primary" icon={FiPlus}>Large</Button>
                            <Button size="xl" variant="primary" icon={FiPlus}>Extra Large</Button>
                        </div>
                    </div>

                    {/* Button States */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">States</h3>
                        <div className="flex flex-wrap gap-4">
                            <Button variant="primary" loading>Loading</Button>
                            <Button variant="primary" disabled>Disabled</Button>
                            <Button variant="primary" icon={FiPlus} iconPosition="right">Icon Right</Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Form Components Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Form Components</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Input Examples */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Inputs</h3>
                        <Input
                            label="Default Input"
                            placeholder="Enter text..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            fullWidth
                        />
                        <Input
                            label="Input with Icon"
                            icon={FiSearch}
                            placeholder="Search..."
                            fullWidth
                        />
                        <Input
                            label="Error Input"
                            error
                            helperText="This field is required"
                            fullWidth
                        />
                        <Input
                            label="Success Input"
                            success
                            helperText="Great job!"
                            fullWidth
                        />
                    </div>

                    {/* Select Examples */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold">Selects</h3>
                        <Select
                            label="Default Select"
                            options={selectOptions}
                            value={selectValue}
                            onChange={(e) => setSelectValue(e.target.value)}
                            placeholder="Choose an option"
                            fullWidth
                        />
                        <Select
                            label="Select with Icon"
                            icon={FiSettings}
                            options={selectOptions}
                            placeholder="Choose an option"
                            fullWidth
                        />
                    </div>
                </div>

                {/* Textarea */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Textarea</h3>
                    <Textarea
                        label="Description"
                        placeholder="Enter description..."
                        value={textareaValue}
                        onChange={(e) => setTextareaValue(e.target.value)}
                        rows={4}
                        fullWidth
                    />
                </div>
            </Card>

            {/* Cards Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Cards</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card variant="default" padding="md" interactive>
                        <h3 className="font-semibold mb-2">Default Card</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This is a default card with interactive hover effects.
                        </p>
                    </Card>

                    <Card variant="elevated" padding="md">
                        <h3 className="font-semibold mb-2">Elevated Card</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This card has enhanced shadows and elevation.
                        </p>
                    </Card>

                    <Card variant="outlined" padding="md">
                        <h3 className="font-semibold mb-2">Outlined Card</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            This card uses an outlined border style.
                        </p>
                    </Card>
                </div>
            </Card>

            {/* Badges and Status Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Badges & Status</h2>

                <div className="space-y-6">
                    {/* Badges */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Badges</h3>
                        <div className="flex flex-wrap gap-4">
                            <Badge variant="default">Default</Badge>
                            <Badge variant="primary">Primary</Badge>
                            <Badge variant="success">Success</Badge>
                            <Badge variant="warning">Warning</Badge>
                            <Badge variant="danger">Danger</Badge>
                            <Badge variant="info">Info</Badge>
                            <Badge variant="success" dot>With Dot</Badge>
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Status Indicators</h3>
                        <div className="flex flex-wrap gap-6">
                            <StatusIndicator status="idle" showLabel />
                            <StatusIndicator status="loading" showLabel />
                            <StatusIndicator status="success" showLabel />
                            <StatusIndicator status="error" showLabel />
                            <StatusIndicator status="warning" showLabel />
                            <StatusIndicator status="info" showLabel />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Icon Buttons Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Icon Buttons</h2>

                <div className="space-y-6">
                    {/* Icon Button Variants */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Variants</h3>
                        <div className="flex flex-wrap gap-4">
                            <IconButton variant="default" icon={FiEdit2} />
                            <IconButton variant="primary" icon={FiPlus} />
                            <IconButton variant="success" icon={FiCheck} />
                            <IconButton variant="danger" icon={FiTrash2} />
                            <IconButton variant="warning" icon={FiAlertCircle} />
                            <IconButton variant="outline" icon={FiDownload} />
                        </div>
                    </div>

                    {/* Icon Button Sizes */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Sizes</h3>
                        <div className="flex flex-wrap items-center gap-4">
                            <IconButton size="sm" variant="primary" icon={FiSettings} />
                            <IconButton size="md" variant="primary" icon={FiSettings} />
                            <IconButton size="lg" variant="primary" icon={FiSettings} />
                            <IconButton size="xl" variant="primary" icon={FiSettings} />
                        </div>
                    </div>

                    {/* Icon Button States */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4">States</h3>
                        <div className="flex flex-wrap gap-4">
                            <IconButton variant="primary" icon={FiSettings} loading />
                            <IconButton variant="primary" icon={FiSettings} disabled />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Tooltips Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Tooltips</h2>

                <div className="flex flex-wrap gap-4">
                    <Tooltip content="This is a tooltip on top" position="top">
                        <Button variant="outline">Hover me (Top)</Button>
                    </Tooltip>

                    <Tooltip content="This is a tooltip on bottom" position="bottom">
                        <Button variant="outline">Hover me (Bottom)</Button>
                    </Tooltip>

                    <Tooltip content="This is a tooltip on left" position="left">
                        <Button variant="outline">Hover me (Left)</Button>
                    </Tooltip>

                    <Tooltip content="This is a tooltip on right" position="right">
                        <Button variant="outline">Hover me (Right)</Button>
                    </Tooltip>
                </div>
            </Card>

            {/* Dividers Section */}
            <Card variant="elevated" padding="lg">
                <h2 className="text-2xl font-bold mb-6">Dividers</h2>

                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Horizontal Dividers</h3>
                        <div className="space-y-4">
                            <p>Content above</p>
                            <Divider variant="solid" />
                            <p>Content below</p>
                            <Divider variant="dashed" />
                            <p>More content</p>
                            <Divider variant="dotted" />
                            <p>Final content</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold mb-4">Vertical Dividers</h3>
                        <div className="flex items-center space-x-4">
                            <span>Left</span>
                            <Divider orientation="vertical" variant="solid" />
                            <span>Center</span>
                            <Divider orientation="vertical" variant="dashed" />
                            <span>Right</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default UIComponentsDemo; 