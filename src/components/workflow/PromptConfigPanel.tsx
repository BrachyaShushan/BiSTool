import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import {
    FiSettings, FiSave, FiEdit3, FiEye, FiEyeOff, FiPlus, FiTrash2,
    FiCode, FiFileText, FiDatabase, FiGlobe, FiShield, FiZap,
    FiCheck, FiX, FiCopy, FiDownload, FiUpload
} from 'react-icons/fi';
import {
    Button, Card, Input, Textarea, Badge, IconButton,
    SectionHeader, Toggle, Select
} from '../ui';
import {
    PROGRAMMING_LANGUAGES,
    TEST_FRAMEWORKS,
    API_ENVIRONMENTS,
    TEST_STYLES,
    CODE_STYLES,
    AUTHENTICATION_TYPES,
    PROMPT_TEMPLATES,
    STORAGE_KEYS
} from '../../constants/aiTestGenerator';

interface PromptConfigPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onConfigChange: (config: any) => void;
    currentConfig?: any;
}

interface PromptTemplate {
    id: string;
    name: string;
    description: string;
    language: string;
    framework: string;
    environment: string;
    content: string;
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

const PromptConfigPanel: React.FC<PromptConfigPanelProps> = ({
    isOpen,
    onClose,
    onConfigChange,
    currentConfig
}) => {
    const { currentProject } = useProjectContext();
    const [activeTab, setActiveTab] = useState<'general' | 'templates' | 'advanced'>('general');
    const [isEditing, setIsEditing] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Configuration state
    const [config, setConfig] = useState({
        preInstructions: currentConfig?.promptConfig?.preInstructions || '',
        postInstructions: currentConfig?.promptConfig?.postInstructions || '',
        languageSpecificPrompts: currentConfig?.promptConfig?.languageSpecificPrompts || {},
        frameworkSpecificPrompts: currentConfig?.promptConfig?.frameworkSpecificPrompts || {},
        environmentSpecificPrompts: currentConfig?.promptConfig?.environmentSpecificPrompts || {},
        qualityGates: {
            minTestCases: currentConfig?.promptConfig?.qualityGates?.minTestCases || 5,
            maxTestCases: currentConfig?.promptConfig?.qualityGates?.maxTestCases || 50,
            requiredAssertions: currentConfig?.promptConfig?.qualityGates?.requiredAssertions || ['status_code', 'response_time'],
            forbiddenPatterns: currentConfig?.promptConfig?.qualityGates?.forbiddenPatterns || ['sleep', 'hardcoded_values']
        },
        customTemplates: currentConfig?.promptConfig?.customTemplates || {}
    });

    // Template management
    const [templates, setTemplates] = useState<PromptTemplate[]>([]);
    const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        description: '',
        language: 'python',
        framework: 'pytest',
        environment: 'rest',
        testStyle: 'bdd',
        codeStyle: 'functional',
        authentication: 'bearer',
        content: ''
    });

    // Load saved configuration from project storage
    useEffect(() => {
        if (currentProject) {
            const savedConfig = localStorage.getItem(`${STORAGE_KEYS.PROMPT_TEMPLATES}_${currentProject.id}`);
            if (savedConfig) {
                try {
                    const parsed = JSON.parse(savedConfig);
                    setConfig(prev => ({ ...prev, ...parsed }));
                } catch (error) {
                    console.error('Failed to load saved prompt config:', error);
                }
            }
        }
    }, [currentProject]);

    // Save configuration to project storage
    const saveConfig = () => {
        if (currentProject) {
            try {
                localStorage.setItem(
                    `${STORAGE_KEYS.PROMPT_TEMPLATES}_${currentProject.id}`,
                    JSON.stringify(config)
                );
                onConfigChange({
                    ...currentConfig,
                    promptConfig: config
                });
                setIsEditing(false);
            } catch (error) {
                console.error('Failed to save prompt config:', error);
            }
        }
    };

    // Export configuration
    const exportConfig = () => {
        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `prompt-config-${currentProject?.name || 'default'}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Import configuration
    const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target?.result as string);
                    setConfig(imported);
                } catch (error) {
                    console.error('Failed to import config:', error);
                }
            };
            reader.readAsText(file);
        }
    };

    // Add new template
    const addTemplate = () => {
        if (newTemplate.name && newTemplate.content) {
            const template: PromptTemplate = {
                id: `template_${Date.now()}`,
                name: newTemplate.name,
                description: newTemplate.description,
                language: newTemplate.language,
                framework: newTemplate.framework,
                environment: newTemplate.environment,
                content: newTemplate.content,
                isDefault: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            setTemplates(prev => [...prev, template]);
            setConfig(prev => ({
                ...prev,
                customTemplates: {
                    ...prev.customTemplates,
                    [template.id]: template.content
                }
            }));

            // Reset form
            setNewTemplate({
                name: '',
                description: '',
                language: 'python',
                framework: 'pytest',
                environment: 'rest',
                testStyle: 'bdd',
                codeStyle: 'functional',
                authentication: 'bearer',
                content: ''
            });
        }
    };

    // Delete template
    const deleteTemplate = (templateId: string) => {
        setTemplates(prev => prev.filter(t => t.id !== templateId));
        setConfig(prev => {
            const { [templateId]: removed, ...rest } = prev.customTemplates;
            return { ...prev, customTemplates: rest };
        });
    };

    // Get available frameworks for selected language
    const getFrameworksForLanguage = (languageId: string) => {
        const language = PROGRAMMING_LANGUAGES.find(l => l.id === languageId);
        return language?.frameworks || [];
    };

    // Get template preview
    const getTemplatePreview = () => {
        const selectedLanguage = PROGRAMMING_LANGUAGES.find(l => l.id === newTemplate.language);
        const selectedFramework = TEST_FRAMEWORKS[newTemplate.framework as keyof typeof TEST_FRAMEWORKS];
        const selectedEnvironment = API_ENVIRONMENTS.find(e => e.id === newTemplate.environment);

        return `Language: ${selectedLanguage?.name || 'Unknown'}
Framework: ${selectedFramework?.name || 'Unknown'}
Environment: ${selectedEnvironment?.name || 'Unknown'}

Template Content:
${newTemplate.content}`;
    };

    if (!isOpen) return null;

    return (
        <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/50">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                            <FiSettings className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Prompt Configuration
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                Configure AI test generation prompts and templates
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <div className="flex items-center px-3 py-1 space-x-1 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                            <FiDatabase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                {currentProject?.name || 'Default'} Config
                            </span>
                        </div>
                        <Button
                            variant="secondary"
                            icon={FiDownload}
                            onClick={exportConfig}
                            size="sm"
                        >
                            Export
                        </Button>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept=".json"
                                onChange={importConfig}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                icon={FiUpload}
                                size="sm"
                            >
                                Import
                            </Button>
                        </label>
                        <IconButton
                            icon={FiX}
                            onClick={onClose}
                            variant="ghost"
                            size="lg"
                        />
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                    {[
                        { id: 'general', label: 'General', icon: FiSettings },
                        { id: 'templates', label: 'Templates', icon: FiFileText },
                        { id: 'advanced', label: 'Advanced', icon: FiCode }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center px-6 py-3 space-x-2 font-medium transition-all duration-200 ${activeTab === tab.id
                                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="p-6">
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            {/* Pre-Instructions */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <SectionHeader
                                            icon={FiCode}
                                            title="Pre-Instructions"
                                            description="Instructions to include before the main prompt"
                                        />
                                        <div className="flex items-center px-2 py-1 space-x-1 bg-green-50 rounded-lg dark:bg-green-900/20">
                                            <FiGlobe className="w-3 h-3 text-green-600 dark:text-green-400" />
                                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                                Global
                                            </span>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={config.preInstructions}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            preInstructions: e.target.value
                                        }))}
                                        placeholder="Enter pre-instructions that will be included before the main AI prompt..."
                                        rows={4}
                                        fullWidth
                                        disabled={!isEditing}
                                    />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        These instructions will be prepended to every AI prompt for test generation
                                    </p>
                                </div>
                            </Card>

                            {/* Post-Instructions */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <SectionHeader
                                            icon={FiFileText}
                                            title="Post-Instructions"
                                            description="Instructions to include after the main prompt"
                                        />
                                        <div className="flex items-center px-2 py-1 space-x-1 bg-blue-50 rounded-lg dark:bg-blue-900/20">
                                            <FiZap className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                            <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                                                Processing
                                            </span>
                                        </div>
                                    </div>
                                    <Textarea
                                        value={config.postInstructions}
                                        onChange={(e) => setConfig(prev => ({
                                            ...prev,
                                            postInstructions: e.target.value
                                        }))}
                                        placeholder="Enter post-instructions that will be included after the main AI prompt..."
                                        rows={4}
                                        fullWidth
                                        disabled={!isEditing}
                                    />
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                        These instructions will be appended to every AI prompt for test generation
                                    </p>
                                </div>
                            </Card>

                            {/* Quality Gates */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <SectionHeader
                                            icon={FiShield}
                                            title="Quality Gates"
                                            description="Configure quality requirements for generated tests"
                                        />
                                        <div className="flex items-center px-2 py-1 space-x-1 bg-purple-50 rounded-lg dark:bg-purple-900/20">
                                            <FiShield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                                Validation
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Minimum Test Cases
                                            </label>
                                            <Input
                                                type="number"
                                                value={config.qualityGates.minTestCases}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    qualityGates: {
                                                        ...prev.qualityGates,
                                                        minTestCases: parseInt(e.target.value) || 0
                                                    }
                                                }))}
                                                min="1"
                                                max="100"
                                                disabled={!isEditing}
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Maximum Test Cases
                                            </label>
                                            <Input
                                                type="number"
                                                value={config.qualityGates.maxTestCases}
                                                onChange={(e) => setConfig(prev => ({
                                                    ...prev,
                                                    qualityGates: {
                                                        ...prev.qualityGates,
                                                        maxTestCases: parseInt(e.target.value) || 0
                                                    }
                                                }))}
                                                min="1"
                                                max="200"
                                                disabled={!isEditing}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Required Assertions
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {['status_code', 'response_time', 'schema_validation', 'content_type', 'headers'].map((assertion) => (
                                                <Toggle
                                                    key={assertion}
                                                    checked={config.qualityGates.requiredAssertions.includes(assertion)}
                                                    onChange={(checked) => {
                                                        setConfig(prev => ({
                                                            ...prev,
                                                            qualityGates: {
                                                                ...prev.qualityGates,
                                                                requiredAssertions: checked
                                                                    ? [...prev.qualityGates.requiredAssertions, assertion]
                                                                    : prev.qualityGates.requiredAssertions.filter((a: string) => a !== assertion)
                                                            }
                                                        }));
                                                    }}
                                                    label={assertion.replace('_', ' ')}
                                                    disabled={!isEditing}
                                                    size="sm"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'templates' && (
                        <div className="space-y-6">
                            {/* New Template Form */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <SectionHeader
                                        icon={FiPlus}
                                        title="Create New Template"
                                        description="Create a custom prompt template for specific languages and frameworks"
                                        className="mb-4"
                                    />

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Template Name
                                            </label>
                                            <Input
                                                value={newTemplate.name}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    name: e.target.value
                                                }))}
                                                placeholder="Enter template name..."
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Description
                                            </label>
                                            <Input
                                                value={newTemplate.description}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    description: e.target.value
                                                }))}
                                                placeholder="Enter template description..."
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Language
                                            </label>
                                            <Select
                                                value={newTemplate.language}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setNewTemplate(prev => ({
                                                        ...prev,
                                                        language: value,
                                                        framework: PROGRAMMING_LANGUAGES.find(l => l.id === value)?.defaultFramework || 'pytest'
                                                    }));
                                                }}
                                                options={PROGRAMMING_LANGUAGES.map(lang => ({
                                                    value: lang.id,
                                                    label: `${lang.icon} ${lang.name}`
                                                }))}
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Framework
                                            </label>
                                            <Select
                                                value={newTemplate.framework}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    framework: e.target.value
                                                }))}
                                                options={getFrameworksForLanguage(newTemplate.language).map(fw => ({
                                                    value: fw,
                                                    label: fw
                                                }))}
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Environment
                                            </label>
                                            <Select
                                                value={newTemplate.environment}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    environment: e.target.value
                                                }))}
                                                options={API_ENVIRONMENTS.map(env => ({
                                                    value: env.id,
                                                    label: `${env.icon} ${env.name}`
                                                }))}
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Test Style
                                            </label>
                                            <Select
                                                value={newTemplate.testStyle || 'bdd'}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    testStyle: e.target.value
                                                }))}
                                                options={TEST_STYLES.map(style => ({
                                                    value: style.id,
                                                    label: `${style.icon} ${style.name}`
                                                }))}
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Code Style
                                            </label>
                                            <Select
                                                value={newTemplate.codeStyle || 'functional'}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    codeStyle: e.target.value
                                                }))}
                                                options={CODE_STYLES.map(style => ({
                                                    value: style.id,
                                                    label: `${style.icon} ${style.name}`
                                                }))}
                                                fullWidth
                                            />
                                        </div>

                                        <div>
                                            <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Authentication
                                            </label>
                                            <Select
                                                value={newTemplate.authentication || 'bearer'}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    authentication: e.target.value
                                                }))}
                                                options={AUTHENTICATION_TYPES.map(auth => ({
                                                    value: auth.id,
                                                    label: `${auth.icon} ${auth.name}`
                                                }))}
                                                fullWidth
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Template Content
                                            </label>
                                            <Button
                                                variant="secondary"
                                                icon={showPreview ? FiEyeOff : FiEye}
                                                onClick={() => setShowPreview(!showPreview)}
                                                size="sm"
                                            >
                                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                                            </Button>
                                        </div>

                                        {showPreview ? (
                                            <div className="p-4 bg-gray-100 rounded-lg dark:bg-gray-700">
                                                <pre className="text-sm text-gray-800 whitespace-pre-wrap dark:text-gray-200">
                                                    {getTemplatePreview()}
                                                </pre>
                                            </div>
                                        ) : (
                                            <Textarea
                                                value={newTemplate.content}
                                                onChange={(e) => setNewTemplate(prev => ({
                                                    ...prev,
                                                    content: e.target.value
                                                }))}
                                                placeholder="Enter your custom prompt template..."
                                                rows={8}
                                                fullWidth
                                            />
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center mt-4">
                                        <div className="flex items-center space-x-2">
                                            {newTemplate.name && newTemplate.content && (
                                                <div className="flex items-center space-x-1 text-green-600 dark:text-green-400">
                                                    <FiCheck className="w-4 h-4" />
                                                    <span className="text-sm font-medium">Template ready</span>
                                                </div>
                                            )}
                                            <Button
                                                variant="secondary"
                                                icon={FiCopy}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(newTemplate.content);
                                                }}
                                                size="sm"
                                                disabled={!newTemplate.content}
                                            >
                                                Copy
                                            </Button>
                                        </div>
                                        <Button
                                            variant="primary"
                                            icon={FiPlus}
                                            onClick={addTemplate}
                                            disabled={!newTemplate.name || !newTemplate.content}
                                        >
                                            Create Template
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            {/* Default Templates */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <SectionHeader
                                        icon={FiFileText}
                                        title="Default Templates"
                                        description="Built-in prompt templates for common scenarios"
                                        className="mb-4"
                                    />

                                    <div className="grid gap-3 md:grid-cols-2">
                                        {Object.entries(PROMPT_TEMPLATES).slice(0, 4).map(([language, frameworks]) => (
                                            <div key={language} className="p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center mb-2 space-x-2">
                                                    <span className="text-lg">{PROGRAMMING_LANGUAGES.find(l => l.id === language)?.icon}</span>
                                                    <h4 className="font-semibold text-gray-900 capitalize dark:text-white">
                                                        {language}
                                                    </h4>
                                                </div>
                                                <div className="space-y-1">
                                                    {Object.keys(frameworks).slice(0, 2).map(framework => (
                                                        <div key={framework} className="flex justify-between items-center">
                                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                {framework}
                                                            </span>
                                                            <Badge variant="info" size="sm">Default</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Custom Templates */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <SectionHeader
                                        icon={FiFileText}
                                        title="Custom Templates"
                                        description="Manage your custom prompt templates"
                                        className="mb-4"
                                    />

                                    {templates.length === 0 ? (
                                        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                                            <FiFileText className="mx-auto mb-4 w-12 h-12 opacity-50" />
                                            <p>No custom templates created yet</p>
                                            <p className="text-sm">Create your first template above</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {templates.map((template) => (
                                                <div
                                                    key={template.id}
                                                    className="p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {template.name}
                                                            </h4>
                                                            <Badge variant="info" size="sm">
                                                                {template.language}
                                                            </Badge>
                                                            <Badge variant="default" size="sm">
                                                                {template.framework}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <IconButton
                                                                icon={FiEdit3}
                                                                onClick={() => setEditingTemplate(template)}
                                                                variant="ghost"
                                                                size="sm"
                                                                title="Edit template"
                                                            />
                                                            <IconButton
                                                                icon={FiTrash2}
                                                                onClick={() => deleteTemplate(template.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700"
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                                                        {template.description}
                                                    </p>
                                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                                        Created: {new Date(template.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}

                    {activeTab === 'advanced' && (
                        <div className="space-y-6">
                            {/* Language-Specific Prompts */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <SectionHeader
                                        icon={FiCode}
                                        title="Language-Specific Prompts"
                                        description="Customize prompts for specific programming languages"
                                        className="mb-4"
                                    />

                                    <div className="space-y-4">
                                        {PROGRAMMING_LANGUAGES.slice(0, 6).map((language) => (
                                            <div key={language.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center mb-2 space-x-2">
                                                    <span className="text-lg">{language.icon}</span>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {language.name}
                                                    </h4>
                                                </div>
                                                <Textarea
                                                    value={config.languageSpecificPrompts[language.id] || ''}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        languageSpecificPrompts: {
                                                            ...prev.languageSpecificPrompts,
                                                            [language.id]: e.target.value
                                                        }
                                                    }))}
                                                    placeholder={`Enter custom prompts for ${language.name}...`}
                                                    rows={3}
                                                    fullWidth
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Framework-Specific Prompts */}
                            <Card variant="elevated" className="overflow-hidden">
                                <div className="p-6">
                                    <SectionHeader
                                        icon={FiZap}
                                        title="Framework-Specific Prompts"
                                        description="Customize prompts for specific testing frameworks"
                                        className="mb-4"
                                    />

                                    <div className="space-y-4">
                                        {Object.entries(TEST_FRAMEWORKS).slice(0, 6).map(([id, framework]) => (
                                            <div key={id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <div className="flex items-center mb-2 space-x-2">
                                                    <span className="text-lg">{framework.icon}</span>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                                        {framework.name}
                                                    </h4>
                                                    <Badge variant="default" size="sm">
                                                        {framework.language}
                                                    </Badge>
                                                </div>
                                                <Textarea
                                                    value={config.frameworkSpecificPrompts[id] || ''}
                                                    onChange={(e) => setConfig(prev => ({
                                                        ...prev,
                                                        frameworkSpecificPrompts: {
                                                            ...prev.frameworkSpecificPrompts,
                                                            [id]: e.target.value
                                                        }
                                                    }))}
                                                    placeholder={`Enter custom prompts for ${framework.name}...`}
                                                    rows={3}
                                                    fullWidth
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        <Toggle
                            checked={isEditing}
                            onChange={setIsEditing}
                            label="Edit Mode"
                            colorScheme="purple"
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            icon={FiSave}
                            onClick={saveConfig}
                            disabled={!isEditing}
                        >
                            Save Configuration
                        </Button>
                    </div>
                </div>
            </div>

            {/* Edit Template Modal */}
            {editingTemplate && (
                <div className="flex fixed inset-0 justify-center items-center backdrop-blur-sm z-60 bg-black/50">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl dark:bg-gray-800">
                        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Edit Template: {editingTemplate.name}
                            </h3>
                            <IconButton
                                icon={FiX}
                                onClick={() => setEditingTemplate(null)}
                                variant="ghost"
                                size="lg"
                            />
                        </div>
                        <div className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Template Name
                                    </label>
                                    <Input
                                        value={editingTemplate.name}
                                        onChange={(e) => setEditingTemplate(prev => prev ? {
                                            ...prev,
                                            name: e.target.value
                                        } : null)}
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Description
                                    </label>
                                    <Input
                                        value={editingTemplate.description}
                                        onChange={(e) => setEditingTemplate(prev => prev ? {
                                            ...prev,
                                            description: e.target.value
                                        } : null)}
                                        fullWidth
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Content
                                    </label>
                                    <Textarea
                                        value={editingTemplate.content}
                                        onChange={(e) => setEditingTemplate(prev => prev ? {
                                            ...prev,
                                            content: e.target.value
                                        } : null)}
                                        rows={6}
                                        fullWidth
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end mt-6 space-x-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setEditingTemplate(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    icon={FiSave}
                                    onClick={() => {
                                        if (editingTemplate) {
                                            setTemplates(prev => prev.map(t =>
                                                t.id === editingTemplate.id ? editingTemplate : t
                                            ));
                                            setEditingTemplate(null);
                                        }
                                    }}
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromptConfigPanel;                                                                                       