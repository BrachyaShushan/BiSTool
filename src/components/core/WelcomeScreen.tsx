import React, { useState } from "react";
import { useProjectContext, useProjectSwitch } from "../../context/ProjectContext";
import {
    FiFolder, FiPlus, FiGlobe, FiCode, FiZap, FiDatabase, FiUsers, FiArrowRight,
    FiCheckCircle, FiPlay, FiBookOpen, FiShield, FiTrendingUp, FiSettings,
    FiMonitor, FiLayers, FiActivity, FiTarget, FiAward, FiStar,
    FiClock, FiBarChart, FiGitBranch, FiRefreshCw, FiGrid,
    FiCommand, FiTerminal, FiPackage, FiServer, FiCpu, FiWifi, FiEye, FiEdit3,
    FiSun, FiMoon
} from "react-icons/fi";
import { Button, Badge, Card, IconWrapper } from "../ui";
import { useAppContext } from "../../context/AppContext";
import { useTheme } from "../../context/ThemeContext";

const WelcomeScreen: React.FC = () => {
    const { projects } = useProjectContext();
    const { switchToProject } = useProjectSwitch();
    const { setShowUnifiedManager } = useAppContext();
    const { isDarkMode, toggleDarkMode } = useTheme();
    const [activeTab, setActiveTab] = useState<'overview' | 'features' | 'getting-started' | 'system' | 'activity'>('overview');

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

    // Enhanced features with more icons
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
        },
        {
            icon: FiMonitor,
            title: "Desktop & Mobile Testing",
            description: "Test APIs across different device types and screen sizes",
            color: "from-teal-500 to-teal-600",
            category: "testing",
            badge: "Pro"
        },
        {
            icon: FiServer,
            title: "Server Health Monitoring",
            description: "Monitor API server health and performance metrics",
            color: "from-red-500 to-red-600",
            category: "monitoring",
            badge: "Enterprise"
        },
        {
            icon: FiWifi,
            title: "Network Diagnostics",
            description: "Advanced network connectivity and latency testing",
            color: "from-yellow-500 to-yellow-600",
            category: "diagnostics",
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

    // New system status data
    const systemStatus = [
        { label: "System Health", value: "Excellent", icon: FiCheckCircle, color: "text-green-600", status: "online" },
        { label: "API Response Time", value: "45ms", icon: FiClock, color: "text-blue-600", status: "optimal" },
        { label: "Active Sessions", value: "12", icon: FiActivity, color: "text-purple-600", status: "active" },
        { label: "Storage Used", value: "2.4GB", icon: FiDatabase, color: "text-orange-600", status: "normal" }
    ];

    // New user activity data
    const userActivity = [
        { action: "Created new project", time: "2 hours ago", icon: FiPlus, type: "create" },
        { action: "Generated AI tests", time: "4 hours ago", icon: FiZap, type: "ai" },
        { action: "Exported YAML config", time: "1 day ago", icon: FiPackage, type: "export" },
        { action: "Updated variables", time: "2 days ago", icon: FiEdit3, type: "edit" }
    ];

    // New performance metrics
    const performanceMetrics = [
        { metric: "Test Success Rate", value: "98.5%", icon: FiTarget, trend: "up" },
        { metric: "Average Response Time", value: "245ms", icon: FiBarChart, trend: "down" },
        { metric: "API Coverage", value: "87%", icon: FiAward, trend: "up" },
        { metric: "Code Quality Score", value: "9.2/10", icon: FiStar, trend: "up" }
    ];

    const categories = [
        { id: 'all', name: 'All Features', count: features.length, icon: FiGrid },
        { id: 'core', name: 'Core Features', count: features.filter(f => f.category === 'core').length, icon: FiCommand },
        { id: 'ai', name: 'AI Features', count: features.filter(f => f.category === 'ai').length, icon: FiCpu },
        { id: 'automation', name: 'Automation', count: features.filter(f => f.category === 'automation').length, icon: FiTerminal },
        { id: 'analysis', name: 'Analysis', count: features.filter(f => f.category === 'analysis').length, icon: FiBarChart },
        { id: 'management', name: 'Management', count: features.filter(f => f.category === 'management').length, icon: FiUsers },
        { id: 'testing', name: 'Testing', count: features.filter(f => f.category === 'testing').length, icon: FiMonitor },
        { id: 'monitoring', name: 'Monitoring', count: features.filter(f => f.category === 'monitoring').length, icon: FiActivity },
        { id: 'diagnostics', name: 'Diagnostics', count: features.filter(f => f.category === 'diagnostics').length, icon: FiWifi }
    ];

    const filteredFeatures = activeTab === 'features'
        ? features
        : features.filter(f => f.category === 'core' || f.category === 'ai');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Enhanced Background Pattern */}
            <div className="overflow-hidden fixed inset-0">
                <div className="fixed top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full opacity-5 animate-pulse translate-x-48 -translate-y-48"></div>
                <div className="fixed bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full opacity-5 animate-pulse -translate-x-48 translate-y-48" style={{ animationDelay: '2s' }}></div>
                <div className="fixed top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full opacity-5 animate-pulse -translate-x-32 -translate-y-32" style={{ animationDelay: '4s' }}></div>
                <div className="fixed top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-orange-500 to-red-600 rounded-full opacity-5 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
                {/* Theme Toggle - Top Right */}
                <div className="absolute top-8 right-8 z-10">
                    <button
                        onClick={toggleDarkMode}
                        className="group relative p-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-300 dark:hover:border-blue-500"
                        title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                        aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
                    >
                        <div className="relative">
                            {/* Background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Icon with smooth transition */}
                            <div className="relative transform transition-all duration-500">
                                {isDarkMode ? (
                                    <IconWrapper
                                        icon={FiSun}
                                        size="lg"
                                        className="text-yellow-500 group-hover:text-yellow-400 transition-colors duration-300"
                                    />
                                ) : (
                                    <IconWrapper
                                        icon={FiMoon}
                                        size="lg"
                                        className="text-indigo-600 group-hover:text-indigo-500 transition-colors duration-300"
                                    />
                                )}
                            </div>

                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                        </div>
                    </button>
                </div>

                {/* Enhanced Header Section */}
                <div className="mb-12 text-center">
                    <div className="inline-flex justify-center items-center p-6 mb-8 bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl">
                        <FiZap className="w-16 h-16 text-white" />
                    </div>
                    <h1 className="mb-6 text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                        Welcome to BiSTool
                    </h1>
                    <p className="mx-auto mb-8 max-w-4xl text-xl leading-relaxed text-gray-600 dark:text-gray-300">
                        Your comprehensive API testing and YAML generation platform.
                        Build, test, and manage your API workflows with AI-powered intelligence.
                    </p>

                    {/* Enhanced Stats */}
                    <div className="grid grid-cols-2 gap-6 mx-auto mb-8 max-w-4xl md:grid-cols-4">
                        {stats.map((stat) => (
                            <div key={stat.label} className="p-4 text-center rounded-2xl border shadow-lg backdrop-blur-sm bg-white/80 border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50">
                                <div className={`inline-flex justify-center items-center p-3 mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl dark:from-gray-700 dark:to-gray-600`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Feature Pills */}
                    <div className="flex flex-wrap gap-3 justify-center items-center text-sm">
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
                        <Badge variant="success" className="flex items-center space-x-2">
                            <FiShield className="w-4 h-4" />
                            <span>Secure & Reliable</span>
                        </Badge>
                    </div>
                </div>

                {/* Enhanced Tab Navigation */}
                <div className="flex justify-center mb-8">
                    <div className="flex p-2 space-x-2 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/80 border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50">
                        {[
                            { id: 'overview', label: 'Overview', icon: FiEye },
                            { id: 'features', label: 'All Features', icon: FiGrid },
                            { id: 'getting-started', label: 'Getting Started', icon: FiPlay },
                            { id: 'system', label: 'System Status', icon: FiMonitor },
                            { id: 'activity', label: 'Activity', icon: FiActivity }
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
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                            <FiFolder className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Management</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Organize your API testing work</p>
                                        </div>
                                    </div>

                                    {projects.length === 0 ? (
                                        <div className="p-8 text-center rounded-2xl border-2 border-gray-300 border-dashed dark:border-gray-600">
                                            <div className="inline-flex justify-center items-center p-4 mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl dark:from-gray-700 dark:to-gray-600">
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
                                            <div className="flex justify-between items-center">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                    Existing Projects
                                                </h3>
                                                <Badge variant="info">{projects.length}</Badge>
                                            </div>
                                            {projects.map((project: any) => (
                                                <button
                                                    key={project.id}
                                                    className="p-4 w-full bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 transition-all duration-300 cursor-pointer group dark:from-gray-700 dark:to-gray-600 dark:border-gray-600 hover:scale-105 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500"
                                                    onClick={() => handleProjectSwitch(project.id)}
                                                >
                                                    <div className="flex justify-between items-center">
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
                                        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                            <FiPlay className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Start Guide</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Get up and running in minutes</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        {steps.slice(0, 4).map((step) => (
                                            <div key={step.number} className="flex items-start p-4 space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border dark:from-gray-700 dark:to-gray-600 border-gray-200/50 dark:border-gray-600/50">
                                                <div className="flex flex-shrink-0 justify-center items-center w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                                    <span className="text-sm font-bold text-white">{step.number}</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
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
                                        <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                            <FiTrendingUp className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Key Features</h2>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Powerful tools for API testing</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {filteredFeatures.map((feature) => (
                                            <div key={feature.title} className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200 transition-all duration-300 group dark:from-gray-700 dark:to-gray-600 dark:border-gray-600 hover:scale-105 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500">
                                                <div className="flex justify-between items-center mb-4">
                                                    <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                                                        <feature.icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <Badge
                                                        variant={feature.badge === 'AI' ? 'warning' : feature.badge === 'Pro' ? 'info' : feature.badge === 'Enterprise' ? 'danger' : 'success'}
                                                        size="sm"
                                                    >
                                                        {feature.badge}
                                                    </Badge>
                                                </div>
                                                <h3 className="mb-2 font-semibold text-gray-900 transition-colors dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                                    {feature.title}
                                                </h3>
                                                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                                    {feature.description}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>

                            {/* Enhanced Quick Tips */}
                            <Card variant="elevated" className="overflow-hidden bg-gradient-to-r border-0 shadow-2xl backdrop-blur-sm from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200/50 dark:border-blue-700/50">
                                <div className="p-8">
                                    <div className="flex items-center mb-6 space-x-3">
                                        <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
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
                                            <div key={index} className="flex items-start p-3 space-x-3 rounded-xl bg-white/50 dark:bg-gray-800/50">
                                                <div className="flex-shrink-0 mt-2 w-2 h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"></div>
                                                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
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
                                            className="flex items-center px-4 py-2 space-x-2 text-sm font-medium rounded-xl border border-gray-200 transition-all duration-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 dark:text-white"
                                        >
                                            <category.icon className="w-4 h-4" />
                                            <span>{category.name} ({category.count})</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* All Features Grid */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature) => (
                                <Card key={feature.title} variant="elevated" className="overflow-hidden border-0 shadow-xl backdrop-blur-sm transition-all duration-300 bg-white/80 dark:bg-slate-800/80 group hover:scale-105">
                                    <div className="p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className={`inline-flex items-center justify-center p-3 bg-gradient-to-br ${feature.color} rounded-xl shadow-lg`}>
                                                <feature.icon className="w-6 h-6 text-white" />
                                            </div>
                                            <Badge
                                                variant={feature.badge === 'AI' ? 'warning' : feature.badge === 'Pro' ? 'info' : feature.badge === 'Enterprise' ? 'danger' : 'success'}
                                                size="sm"
                                            >
                                                {feature.badge}
                                            </Badge>
                                        </div>
                                        <h3 className="mb-3 text-lg font-semibold text-gray-900 transition-colors dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
                                            {feature.description}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'getting-started' && (
                    <div className="mx-auto space-y-8 max-w-4xl">
                        {/* Complete Getting Started Guide */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-8 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                        <FiPlay className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Complete Getting Started Guide</h2>
                                        <p className="text-gray-600 dark:text-gray-400">Follow these steps to get up and running</p>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {steps.map((step) => (
                                        <div key={step.number} className="flex items-start p-6 space-x-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border dark:from-gray-700 dark:to-gray-600 border-gray-200/50 dark:border-gray-600/50">
                                            <div className="flex flex-shrink-0 justify-center items-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                                <span className="text-lg font-bold text-white">{step.number}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                                        {step.title}
                                                    </h3>
                                                    <Badge variant="info">{step.duration}</Badge>
                                                </div>
                                                <p className="leading-relaxed text-gray-600 dark:text-gray-400">
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

                {activeTab === 'system' && (
                    <div className="space-y-8">
                        {/* System Status Dashboard */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                                        <FiMonitor className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Status</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Real-time system health and performance</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {systemStatus.map((status) => (
                                        <div key={status.label} className="p-6 text-center rounded-2xl border shadow-lg backdrop-blur-sm bg-white/80 border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50">
                                            <div className={`inline-flex justify-center items-center p-3 mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl dark:from-gray-700 dark:to-gray-600`}>
                                                <status.icon className={`w-6 h-6 ${status.color}`} />
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{status.value}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{status.label}</div>
                                            <Badge
                                                variant={status.status === 'online' ? 'success' : status.status === 'optimal' ? 'primary' : 'warning'}
                                                size="sm"
                                                className="mt-2"
                                            >
                                                {status.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Performance Metrics */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                        <FiBarChart className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Performance Metrics</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Key performance indicators and trends</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                    {performanceMetrics.map((metric) => (
                                        <div key={metric.metric} className="p-6 rounded-2xl border shadow-lg backdrop-blur-sm bg-white/80 border-gray-200/50 dark:bg-gray-800/80 dark:border-gray-700/50">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className={`inline-flex justify-center items-center p-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl dark:from-gray-700 dark:to-gray-600`}>
                                                    <metric.icon className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${metric.trend === 'up' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                    }`}>
                                                    <FiTrendingUp className={`w-4 h-4 ${metric.trend === 'down' ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400">{metric.metric}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* System Information */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                        <FiServer className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">System Information</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Technical details and capabilities</p>
                                    </div>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {[
                                        { label: "Platform", value: "Web Browser", icon: FiGlobe },
                                        { label: "Storage", value: "Local Storage", icon: FiDatabase },
                                        { label: "Security", value: "Client-Side", icon: FiShield },
                                        { label: "Connectivity", value: "Online", icon: FiWifi },
                                        { label: "Processing", value: "Real-time", icon: FiCpu },
                                        { label: "Updates", value: "Auto", icon: FiRefreshCw }
                                    ].map((info) => (
                                        <div key={info.label} className="flex items-center p-4 space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-600">
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                                <info.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{info.label}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{info.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="space-y-8">
                        {/* Recent Activity */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg">
                                        <FiActivity className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Your latest actions and updates</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {userActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center p-4 space-x-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200/50 dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-600">
                                            <div className={`p-2 rounded-xl ${activity.type === 'create' ? 'bg-green-500' :
                                                activity.type === 'ai' ? 'bg-purple-500' :
                                                    activity.type === 'export' ? 'bg-orange-500' :
                                                        'bg-blue-500'
                                                }`}>
                                                <activity.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-semibold text-gray-900 dark:text-white">{activity.action}</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">{activity.time}</div>
                                            </div>
                                            <FiClock className="w-4 h-4 text-gray-400" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>

                        {/* Quick Actions */}
                        <Card variant="elevated" className="overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/80 dark:bg-slate-800/80">
                            <div className="p-8">
                                <div className="flex items-center mb-6 space-x-3">
                                    <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                                        <FiCommand className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Common tasks and shortcuts</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {[
                                        { label: "Create Project", icon: FiPlus, action: handleCreateProjectClick },
                                        { label: "Open Settings", icon: FiSettings, action: () => console.log("Settings") },
                                        { label: "View Documentation", icon: FiBookOpen, action: () => console.log("Docs") },
                                        { label: "Check Updates", icon: FiRefreshCw, action: () => console.log("Updates") },
                                        { label: "Export Data", icon: FiPackage, action: () => console.log("Export") },
                                        { label: "System Info", icon: FiServer, action: () => setActiveTab('system') }
                                    ].map((action) => (
                                        <button
                                            key={action.label}
                                            onClick={action.action}
                                            className="flex items-center p-4 space-x-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border transition-all duration-300 border-gray-200/50 dark:border-gray-600/50 dark:from-gray-700 dark:to-gray-600 hover:scale-105 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500"
                                        >
                                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                                                <action.icon className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="font-semibold text-gray-900 dark:text-white">{action.label}</span>
                                        </button>
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