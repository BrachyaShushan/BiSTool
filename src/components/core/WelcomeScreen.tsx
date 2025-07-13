import React, { useState } from "react";
import { useProjectContext, useProjectSwitch } from "../../context/ProjectContext";
import {
    FiFolder, FiPlus, FiGlobe, FiCode, FiZap, FiDatabase, FiUsers, FiArrowRight,
    FiCheckCircle, FiPlay, FiBookOpen, FiShield, FiTrendingUp, FiSettings,
    FiMonitor, FiSmartphone, FiLayers, FiActivity, FiTarget, FiAward, FiStar,
    FiClock, FiBarChart, FiGitBranch, FiCloud, FiLock, FiRefreshCw, FiGrid,
    FiCommand, FiTerminal, FiPackage, FiServer, FiCpu, FiWifi, FiEye, FiEdit3
} from "react-icons/fi";
import { Button, Badge, Card } from "../ui";
import { useAppContext } from "../../context/AppContext";

const WelcomeScreen: React.FC = () => {
    const { projects } = useProjectContext();
    const { switchToProject } = useProjectSwitch();
    const { setShowUnifiedManager } = useAppContext();
    const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'getting-started'>('overview');

    const handleProjectSwitch = async (projectId: string) => {
        const success = await switchToProject(projectId);
        if (success) {
            console.log(`WelcomeScreen: Project switch completed successfully`);
        } else {
            console.error(`WelcomeScreen: Project switch failed`);
        }
    };

    const handleCreateProjectClick = () => {
        setShowUnifiedManager(true);
    };

    const features = [
        {
            icon: FiGlobe,
            title: "Dynamic URL Builder",
            description: "Construct intelligent URLs with variables, path segments, and environment switching",
            color: "from-blue-500 to-blue-600",
            category: "core",
            badge: "Essential"
        },
        {
            icon: FiCode,
            title: "Advanced Request Config",
            description: "Configure HTTP methods, headers, query params, and multiple body types",
            color: "from-green-500 to-green-600",
            category: "core",
            badge: "Essential"
        },
        {
            icon: FiZap,
            title: "AI-Powered Test Generator",
            description: "Leverage AI to create intelligent test scenarios and edge cases",
            color: "from-purple-500 to-purple-600",
            category: "ai",
            badge: "AI"
        },
        {
            icon: FiDatabase,
            title: "YAML Configuration Generator",
            description: "Generate production-ready YAML configurations for CI/CD pipelines",
            color: "from-orange-500 to-orange-600",
            category: "automation",
            badge: "DevOps"
        },
        {
            icon: FiShield,
            title: "Variable Management System",
            description: "Manage global and session-specific variables with environment support",
            color: "from-indigo-500 to-indigo-600",
            category: "core",
            badge: "Essential"
        },
        {
            icon: FiActivity,
            title: "Real-time Response Analysis",
            description: "Advanced response parsing with JSON validation and error detection",
            color: "from-emerald-500 to-emerald-600",
            category: "analysis",
            badge: "Pro"
        },
        {
            icon: FiLayers,
            title: "Multi-Environment Support",
            description: "Seamlessly switch between dev, staging, and production environments",
            color: "from-cyan-500 to-cyan-600",
            category: "core",
            badge: "Essential"
        },
        {
            icon: FiGitBranch,
            title: "Session Management",
            description: "Organize and manage API testing sessions with categories and metadata",
            color: "from-violet-500 to-violet-600",
            category: "management",
            badge: "Pro"
        },
        {
            icon: FiPackage,
            title: "Export & Import",
            description: "Export configurations and import from various formats",
            color: "from-rose-500 to-rose-600",
            category: "automation",
            badge: "Pro"
        }
    ];

    const steps = [
        {
            number: "01",
            title: "Create Your Project",
            description: "Start by creating a new project to organize your API testing work",
            icon: FiFolder,
            duration: "2 min"
        },
        {
            number: "02",
            title: "Configure Environment",
            description: "Set up your development, staging, and production environments",
            icon: FiLayers,
            duration: "3 min"
        },
        {
            number: "03",
            title: "Build Dynamic URLs",
            description: "Use the URL Builder to construct endpoints with variables and segments",
            icon: FiGlobe,
            duration: "5 min"
        },
        {
            number: "04",
            title: "Configure Requests",
            description: "Set up HTTP methods, headers, and request bodies",
            icon: FiCode,
            duration: "4 min"
        },
        {
            number: "05",
            title: "Generate AI Tests",
            description: "Leverage AI to create comprehensive test scenarios",
            icon: FiZap,
            duration: "3 min"
        },
        {
            number: "06",
            title: "Export YAML",
            description: "Generate YAML configurations for your CI/CD pipeline",
            icon: FiDatabase,
            duration: "2 min"
        }
    ];

    const stats = [
        { label: "Projects Created", value: projects.length, icon: FiFolder, color: "text-blue-600" },
        { label: "Features Available", value: features.length, icon: FiStar, color: "text-purple-600" },
        { label: "Environments", value: 3, icon: FiLayers, color: "text-green-600" },
        { label: "AI Capabilities", value: 2, icon: FiCpu, color: "text-orange-600" }
    ];

    const categories = [
        { id: 'all', name: 'All Features', count: features.length },
        { id: 'core', name: 'Core Features', count: features.filter(f => f.category === 'core').length },
        { id: 'ai', name: 'AI Features', count: features.filter(f => f.category === 'ai').length },
        { id: 'automation', name: 'Automation', count: features.filter(f => f.category === 'automation').length },
        { id: 'analysis', name: 'Analysis', count: features.filter(f => f.category === 'analysis').length },
        { id: 'management', name: 'Management', count: features.filter(f => f.category === 'management').length }
    ];

    const filteredFeatures = activeTab === 'features'
        ? features
        : features.filter(f => f.category === 'core' || f.category === 'ai');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900">
            {/* Enhanced Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 translate-x-48 -translate-y-48 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-96 h-96 opacity-5 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 -translate-x-48 translate-y-48 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full w-96 h-96 opacity-5 animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute w-64 h-64 -translate-x-32 -translate-y-32 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full top-1/2 left-1/2 opacity-5 animate-pulse" style={{ animationDelay: '4s' }}></div>
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Enhanced Header Section */}
                <div className="mb-12 text-center">
                    <div className="inline-flex items-center justify-center p-6 mb-8 shadow-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl animate-pulse">
                        <FiZap className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="mb-6 text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        Welcome to BiSTool
                    </h1>
                    <p className="max-w-4xl mx-auto mb-8 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        Your comprehensive API testing and YAML generation platform.
                        Build, test, and manage your API workflows with AI-powered intelligence.
                    </p>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto md:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="p-4 text-center bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 shadow-lg">
                                <div className={`inline-flex items-center justify-center p-3 mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl dark:from-gray-700 dark:to-gray-600`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Feature Pills */}
                    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
                        <Badge variant="success" className="flex items-center space-x-2">
                            <FiCheckCircle className="w-4 h-4" />
                            <span>Professional API Testing</span>
                        </Badge>
                        <Badge variant="primary" className="flex items-center space-x-2">
                            <FiCpu className="w-4 h-4" />
                            <span>AI-Powered Generation</span>
                        </Badge>
                        <Badge variant="warning" className="flex items-center space-x-2">
                            <FiDatabase className="w-4 h-4" />
                            <span>YAML Export</span>
                        </Badge>
                        <Badge variant="info" className="flex items-center space-x-2">
                            <FiLayers className="w-4 h-4" />
                            <span>Multi-Environment</span>
                        </Badge>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="flex p-2 space-x-2 bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50 shadow-lg">
                        {[
                            { id: 'overview', label: 'Overview', icon: FiEye },
                            { id: 'features', label: 'All Features', icon: FiGrid },
                            { id: 'getting-started', label: 'Getting Started', icon: FiPlay }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center px-6 py-3 space-x-2 rounded-xl font-medium transition-all duration-200 ${activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                {activeTab === 'overview' && (
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Left Column - Project Management */}
                        <div className="lg:col-span-1">
                            <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                                <div className="p-8">
                                    <div className="flex items-center mb-6 space-x-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                            <FiFolder className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Management</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Organize your API testing work</p>
                                        </div>
                                    </div>

                                    {projects.length === 0 ? (
                                        <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-2xl dark:border-gray-600">
                                            <div className="inline-flex items-center justify-center p-4 mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl dark:from-gray-700 dark:to-gray-600">
                                                <FiPlus className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
                                                Create Your First Project
                                            </h3>
                                            <p className="mb-6 text-gray-600 dark:text-gray-400">
                                                Projects help you organize your API tests and configurations separately.
                                                Each project has its own storage space and variables.
                                            </p>
                                            <Button
                                                data-testid="project-create"
                                                onClick={handleCreateProjectClick}
                                                variant="primary"
                                                size="lg"
                                                icon={FiPlus}
                                                gradient
                                                className="w-full"
                                            >
                                                Create Project
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Existing Projects
                                                </h3>
                                                <Badge variant="info">{projects.length}</Badge>
                                            </div>
                                            {projects.map((project: any) => (
                                                <button
                                                    key={project.id}
                                                    className="w-full p-4 transition-all duration-300 border border-gray-200 cursor-pointer bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl group dark:from-gray-700 dark:to-gray-600 dark:border-gray-600 hover:scale-105 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500"
                                                    onClick={() => handleProjectSwitch(project.id)}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                                                <FiFolder className="w-5 h-5 text-white" />
                                                            </div>
                                                            <div className="text-left">
                                                                <h4 className="font-semibold text-gray-900 transition-colors dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                                    {project.name}
                                                                </h4>
                                                                {project.description && (
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {project.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <FiArrowRight className="w-5 h-5 text-gray-400 transition-all duration-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Right Column - Features and Guide */}
                        <div className="space-y-8 lg:col-span-2">
                            {/* Enhanced Getting Started Guide */}
                            <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                                <div className="p-8">
                                    <div className="flex items-center mb-6 space-x-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                            <FiPlay className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Start Guide</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Get up and running in minutes</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {steps.slice(0, 4).map((step) => (
                                            <div key={step.number} className="flex items-start p-4 space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl dark:from-gray-700 dark:to-gray-600 border border-gray-200/50 dark:border-gray-600/50">
                                                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                                    <span className="text-sm font-bold text-white">{step.number}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {step.title}
                                                        </h3>
                                                        <Badge variant="info" size="sm">{step.duration}</Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Enhanced Features Grid */}
                            <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                                <div className="p-8">
                                    <div className="flex items-center mb-6 space-x-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                            <FiTrendingUp className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Key Features</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Powerful tools for API testing</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredFeatures.map((feature) => (
                                            <div key={feature.title} className="group p-6 transition-all duration-300 border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl dark:from-gray-700 dark:to-gray-600 dark:border-gray-600 hover:scale-105 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                                                        <feature.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <Badge
                                                        variant={feature.badge === 'AI' ? 'warning' : feature.badge === 'Pro' ? 'info' : 'success'}
                                                        size="sm"
                                                    >
                                                        {feature.badge}
                                                    </Badge>
                                                </div>
                                                <h3 className="mb-2 font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Enhanced Quick Tips */}
                            <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50">
                                <div className="p-8">
                                    <div className="flex items-center mb-6 space-x-3">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                            <FiBookOpen className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pro Tips</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Maximize your productivity</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {[
                                            "Use variables to make your URLs and requests dynamic across environments",
                                            "Organize sessions by categories for better management and collaboration",
                                            "Generate YAML configurations for seamless CI/CD integration",
                                            "Leverage AI to create comprehensive test scenarios and edge cases",
                                            "Switch between environments to test different stages of your API",
                                            "Export and import configurations to share with your team"
                                        ].map((tip, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 bg-white/50 rounded-xl dark:bg-gray-800/50">
                                                <div className="flex-shrink-0 w-2 h-2 mt-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                                                    {tip}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                )}

                {activeTab === 'features' && (
                    <div className="space-y-8">
                        {/* Category Filter */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-6">
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            className="px-4 py-2 text-sm font-medium transition-all duration-200 border border-gray-200 rounded-xl dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10"
                                        >
                                            {category.name} ({category.count})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* All Features Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <Card key={feature.title} variant="elevated" className="overflow-hidden border-0 shadow-xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80 group hover:scale-105 transition-all duration-300">
                                    <div className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                                                <feature.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <Badge
                                                variant={feature.badge === 'AI' ? 'warning' : feature.badge === 'Pro' ? 'info' : 'success'}
                                                size="sm"
                                            >
                                                {feature.badge}
                                            </Badge>
                                        </div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'getting-started' && (
                    <div className="max-w-4xl mx-auto space-y-8">
                        {/* Complete Getting Started Guide */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-8 space-x-3">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                        <FiPlay className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Getting Started Guide</h2>
                                        <p className="text-gray-600 dark:text-gray-400">Follow these steps to get up and running</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {steps.map((step, index) => (
                                        <div key={step.number} className="flex items-start space-x-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl dark:from-gray-700 dark:to-gray-600 border border-gray-200/50 dark:border-gray-600/50">
                                            <div className="flex items-center justify-center flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                                                <span className="text-lg font-bold text-white">{step.number}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        {step.title}
                                                    </h3>
                                                    <Badge variant="info">{step.duration}</Badge>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeScreen; 