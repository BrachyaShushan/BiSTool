import React, { useState, useEffect } from 'react';
import { useProjectContext } from '../../context/ProjectContext';
import { useVariablesContext } from '../../context/VariablesContext';
import { useURLBuilderContext } from '../../context/URLBuilderContext';
import {
    FiArrowRight, FiArrowLeft, FiCheck, FiX, FiPlay, FiGlobe, FiCode, FiZap, FiDatabase,
    FiFolder, FiSettings, FiGrid, FiHelpCircle, FiPlus
} from 'react-icons/fi';
import { Button, Card, Input, Textarea } from '../ui';

interface WizardStep {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<any>;
    component: React.ComponentType<WizardStepProps>;
    isRequired?: boolean;
    isCompleted?: boolean;
}

interface WizardStepProps {
    onNext: () => void;
    onBack: () => void;
    onSkip: () => void;
    isFirstStep: boolean;
    isLastStep: boolean;
    currentStep: number;
    totalSteps: number;
}

const QuickStartWizard: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [_completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
    const [showWizard, setShowWizard] = useState(false);
    const [wizardData, setWizardData] = useState({
        projectName: '',
        projectDescription: '',
        baseUrl: '',
        environment: 'development',
        apiKey: '',
        globalVariables: [] as Array<{ key: string; value: string; id: string }>,
        selectedFeatures: [] as string[]
    });

    const { createProject } = useProjectContext();
    const { updateGlobalVariable } = useVariablesContext();
    const { setDomain, setEnvironment } = useURLBuilderContext();

    // Check if user is new (no projects exist)
    const { projects } = useProjectContext();
    const isNewUser = projects.length === 0;

    useEffect(() => {
        // Show wizard for new users or if explicitly requested
        if (isNewUser) {
            setShowWizard(true);
        }
    }, [isNewUser]);

    const handleNext = () => {
        const currentStepData = steps[currentStep];
        if (currentStepData?.isRequired) {
            setCompletedSteps(prev => new Set([...prev, currentStepData.id]));
        }

        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleWizardComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleWizardComplete();
        }
    };

    const handleWizardComplete = async () => {
        try {
            // Create project if name is provided
            if (wizardData.projectName.trim()) {
                await createProject(wizardData.projectName, wizardData.projectDescription);

                // Set up initial configuration
                if (wizardData.baseUrl) {
                    setDomain(wizardData.baseUrl);
                }

                if (wizardData.environment) {
                    setEnvironment(wizardData.environment);
                }

                // Set up global variables
                wizardData.globalVariables.forEach(({ key, value }) => {
                    if (key && value) {
                        updateGlobalVariable(key, value);
                    }
                });
            }

            setShowWizard(false);
        } catch (error) {
            console.error('Error completing wizard:', error);
        }
    };

    const handleClose = () => {
        setShowWizard(false);
    };

    // Wizard Steps Components
    const WelcomeStep: React.FC<WizardStepProps> = ({ onNext }) => (
        <div className="text-center space-y-6">
            <div className="inline-flex justify-center items-center p-6 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl">
                <FiZap className="w-16 h-16 text-white" />
            </div>

            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Welcome to BiSTool!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Let's get you started with your API testing journey. This quick setup will help you create your first project and configure the essential settings.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <div className="flex items-center justify-center p-3 bg-blue-500 rounded-xl mb-3">
                        <FiGlobe className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">URL Builder</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Create dynamic URLs with variables and environment switching</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                    <div className="flex items-center justify-center p-3 bg-green-500 rounded-xl mb-3">
                        <FiCode className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Request Config</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Configure headers, query params, and request bodies</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                    <div className="flex items-center justify-center p-3 bg-purple-500 rounded-xl mb-3">
                        <FiZap className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">AI Testing</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generate intelligent test scenarios with AI</p>
                </div>
            </div>

            <div className="flex justify-center space-x-4">
                <Button
                    onClick={onNext}
                    variant="primary"
                    size="lg"
                    icon={FiArrowRight}
                    gradient
                >
                    Get Started
                </Button>
            </div>
        </div>
    );

    const ProjectSetupStep: React.FC<WizardStepProps> = ({ onNext, onBack, isFirstStep }) => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Create Your First Project
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Projects help you organize your API tests and configurations separately.
                </p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Project Name"
                    placeholder="My API Project"
                    value={wizardData.projectName}
                    onChange={(e) => setWizardData(prev => ({ ...prev, projectName: e.target.value }))}
                    fullWidth
                    required
                />

                <Textarea
                    label="Project Description (Optional)"
                    placeholder="Describe what this project is for..."
                    value={wizardData.projectDescription}
                    onChange={(e) => setWizardData(prev => ({ ...prev, projectDescription: e.target.value }))}
                    fullWidth
                    rows={3}
                />
            </div>

            <div className="flex justify-between">
                <Button
                    onClick={onBack}
                    variant="secondary"
                    icon={FiArrowLeft}
                    disabled={isFirstStep}
                >
                    Back
                </Button>

                <Button
                    onClick={onNext}
                    variant="primary"
                    icon={FiArrowRight}
                    disabled={!wizardData.projectName.trim()}
                >
                    Next
                </Button>
            </div>
        </div>
    );

    const EnvironmentSetupStep: React.FC<WizardStepProps> = ({ onNext, onBack, onSkip, isFirstStep }) => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Configure Your Environment
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Set up your base URL and environment settings.
                </p>
            </div>

            <div className="space-y-4">
                <Input
                    label="Base URL"
                    placeholder="https://api.example.com"
                    value={wizardData.baseUrl}
                    onChange={(e) => setWizardData(prev => ({ ...prev, baseUrl: e.target.value }))}
                    fullWidth
                    icon={FiGlobe}
                />

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Default Environment
                    </label>
                    <select
                        value={wizardData.environment}
                        onChange={(e) => setWizardData(prev => ({ ...prev, environment: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="development">Development</option>
                        <option value="staging">Staging</option>
                        <option value="production">Production</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-between">
                <Button
                    onClick={onBack}
                    variant="secondary"
                    icon={FiArrowLeft}
                    disabled={isFirstStep}
                >
                    Back
                </Button>

                <div className="flex space-x-2">
                    <Button
                        onClick={onSkip}
                        variant="ghost"
                    >
                        Skip
                    </Button>

                    <Button
                        onClick={onNext}
                        variant="primary"
                        icon={FiArrowRight}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );

    const VariablesSetupStep: React.FC<WizardStepProps> = ({ onNext, onBack, onSkip, isFirstStep }) => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Set Up Global Variables
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Configure variables that will be available across all your API requests.
                </p>
            </div>

            <div className="space-y-4">
                {wizardData.globalVariables.map((variable) => (
                    <div key={variable.id} className="flex space-x-2">
                        <Input
                            placeholder="Variable name"
                            value={variable?.key || ''}
                            onChange={(e) => {
                                const newVariables = wizardData.globalVariables.map((v) =>
                                    v.id === variable.id ? { ...v, key: e.target.value } : v
                                );
                                setWizardData(prev => ({ ...prev, globalVariables: newVariables }));
                            }}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Value"
                            value={variable?.value || ''}
                            onChange={(e) => {
                                const newVariables = wizardData.globalVariables.map((v) =>
                                    v.id === variable.id ? { ...v, value: e.target.value } : v
                                );
                                setWizardData(prev => ({ ...prev, globalVariables: newVariables }));
                            }}
                            className="flex-1"
                        />
                        <Button
                            onClick={() => {
                                const newVariables = wizardData.globalVariables.filter((v) => v.id !== variable.id);
                                setWizardData(prev => ({ ...prev, globalVariables: newVariables }));
                            }}
                            variant="danger"
                            size="sm"
                            icon={FiX}
                        >
                            Remove
                        </Button>
                    </div>
                ))}

                <Button
                    onClick={() => {
                        setWizardData(prev => ({
                            ...prev,
                            globalVariables: [
                                ...prev.globalVariables,
                                { key: '', value: '', id: Date.now().toString() + Math.random().toString(36).substr(2, 5) }
                            ]
                        }));
                    }}
                    variant="outline"
                    icon={FiPlus}
                    fullWidth
                >
                    Add Variable
                </Button>
            </div>

            <div className="flex justify-between">
                <Button
                    onClick={onBack}
                    variant="secondary"
                    icon={FiArrowLeft}
                    disabled={isFirstStep}
                >
                    Back
                </Button>

                <div className="flex space-x-2">
                    <Button
                        onClick={onSkip}
                        variant="ghost"
                    >
                        Skip
                    </Button>

                    <Button
                        onClick={onNext}
                        variant="primary"
                        icon={FiArrowRight}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );

    const FeaturesStep: React.FC<WizardStepProps> = ({ onNext, onBack, onSkip, isFirstStep }) => {
        const features = [
            { id: 'url-builder', name: 'URL Builder', description: 'Dynamic URL construction with variables', icon: FiGlobe },
            { id: 'request-config', name: 'Request Config', description: 'Advanced request configuration', icon: FiCode },
            { id: 'ai-testing', name: 'AI Test Generator', description: 'AI-powered test scenario generation', icon: FiZap },
            { id: 'yaml-export', name: 'YAML Export', description: 'Export configurations for CI/CD', icon: FiDatabase },
            { id: 'session-management', name: 'Session Management', description: 'Organize and manage test sessions', icon: FiFolder },
            { id: 'variables', name: 'Variable Management', description: 'Global and session variables', icon: FiSettings }
        ];

        const toggleFeature = (featureId: string) => {
            setWizardData(prev => ({
                ...prev,
                selectedFeatures: prev.selectedFeatures.includes(featureId)
                    ? prev.selectedFeatures.filter(id => id !== featureId)
                    : [...prev.selectedFeatures, featureId]
            }));
        };

        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        Choose Your Features
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        Select the features you'd like to explore first.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {features.map((feature) => (
                        <Card
                            key={feature.id}
                            variant={wizardData.selectedFeatures.includes(feature.id) ? "elevated" : "default"}
                            className={`cursor-pointer transition-all duration-200 ${wizardData.selectedFeatures.includes(feature.id)
                                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                            onClick={() => toggleFeature(feature.id)}
                        >
                            <div className="flex items-start space-x-3">
                                <div className={`p-2 rounded-lg ${wizardData.selectedFeatures.includes(feature.id)
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                    }`}>
                                    <feature.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 dark:text-white">
                                        {feature.name}
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {feature.description}
                                    </p>
                                </div>
                                {wizardData.selectedFeatures.includes(feature.id) && (
                                    <FiCheck className="w-5 h-5 text-blue-500" />
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="flex justify-between">
                    <Button
                        onClick={onBack}
                        variant="secondary"
                        icon={FiArrowLeft}
                        disabled={isFirstStep}
                    >
                        Back
                    </Button>

                    <div className="flex space-x-2">
                        <Button
                            onClick={onSkip}
                            variant="ghost"
                        >
                            Skip
                        </Button>

                        <Button
                            onClick={onNext}
                            variant="primary"
                            icon={FiArrowRight}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    const CompletionStep: React.FC<WizardStepProps> = ({ onBack }) => (
        <div className="text-center space-y-6">
            <div className="inline-flex justify-center items-center p-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl">
                <FiCheck className="w-16 h-16 text-white" />
            </div>

            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    You're All Set!
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    Your BiSTool workspace is ready. You can now start building and testing your APIs with all the powerful features at your disposal.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <Card variant="elevated" className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg">
                            <FiPlay className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Quick Start</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Begin with URL Builder</p>
                        </div>
                    </div>
                </Card>

                <Card variant="elevated" className="p-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-500 rounded-lg">
                            <FiHelpCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Get Help</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Explore documentation</p>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="flex justify-center space-x-4">
                <Button
                    onClick={onBack}
                    variant="secondary"
                    icon={FiArrowLeft}
                >
                    Back
                </Button>

                <Button
                    onClick={handleWizardComplete}
                    variant="primary"
                    icon={FiCheck}
                    gradient
                    size="lg"
                >
                    Start Using BiSTool
                </Button>
            </div>
        </div>
    );

    const steps: WizardStep[] = [
        {
            id: 'welcome',
            title: 'Welcome',
            description: 'Get started with BiSTool',
            icon: FiZap,
            component: WelcomeStep,
            isRequired: false
        },
        {
            id: 'project-setup',
            title: 'Project Setup',
            description: 'Create your first project',
            icon: FiFolder,
            component: ProjectSetupStep,
            isRequired: true
        },
        {
            id: 'environment',
            title: 'Environment',
            description: 'Configure your environment',
            icon: FiGlobe,
            component: EnvironmentSetupStep,
            isRequired: false
        },
        {
            id: 'variables',
            title: 'Variables',
            description: 'Set up global variables',
            icon: FiSettings,
            component: VariablesSetupStep,
            isRequired: false
        },
        {
            id: 'features',
            title: 'Features',
            description: 'Choose your features',
            icon: FiGrid,
            component: FeaturesStep,
            isRequired: false
        },
        {
            id: 'completion',
            title: 'Completion',
            description: 'You\'re all set!',
            icon: FiCheck,
            component: CompletionStep,
            isRequired: false
        }
    ];

    if (!showWizard) {
        return null;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData) {
        return null;
    }

    const CurrentStepComponent = currentStepData.component;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                            <currentStepData.icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                {currentStepData.title}
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {currentStepData.description}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <FiX className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>Step {currentStep + 1} of {steps.length}</span>
                        <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    <CurrentStepComponent
                        onNext={handleNext}
                        onBack={handleBack}
                        onSkip={handleSkip}
                        isFirstStep={currentStep === 0}
                        isLastStep={currentStep === steps.length - 1}
                        currentStep={currentStep}
                        totalSteps={steps.length}
                    />
                </div>
            </div>
        </div>
    );
};

export default QuickStartWizard; 