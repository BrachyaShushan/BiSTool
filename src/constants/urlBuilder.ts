import { FiGlobe, FiSettings, FiLink, FiEye } from "react-icons/fi";

export const PROTOCOL_OPTIONS = [
  {
    id: "http",
    label: "HTTP",
    icon: "🌐",
    description: "Unsecured protocol",
    color: "from-gray-200 to-gray-300",
    selectedColor: "from-blue-500 to-blue-600",
  },
  {
    id: "https",
    label: "HTTPS",
    icon: "🔒",
    description: "Secured with SSL",
    color: "from-gray-200 to-gray-300",
    selectedColor: "from-green-500 to-green-600",
  },
];

export const ENVIRONMENT_OPTIONS = [
  {
    id: "development",
    label: "Development",
    icon: "🛠️",
    description: "Local/test environment",
    color: "from-green-200 to-green-300",
    selectedColor: "from-green-500 to-green-600",
  },
  {
    id: "staging",
    label: "Staging",
    icon: "🚧",
    description: "Pre-production testing",
    color: "from-yellow-100 to-yellow-200",
    selectedColor: "from-yellow-400 to-yellow-500",
  },
  {
    id: "production",
    label: "Production",
    icon: "🚀",
    description: "Live environment",
    color: "from-red-100 to-red-200",
    selectedColor: "from-red-500 to-red-600",
  },
];

export const SECTION_CONFIG = {
  header: {
    icon: FiGlobe,
    title: "URL Builder",
    description: "Construct dynamic URLs with variables and path segments",
    bgGradient: "from-blue-50 via-indigo-50 to-purple-50",
    titleGradient: "from-blue-600 to-indigo-600",
    iconBgGradient: "from-blue-500 to-indigo-600",
  },
  configuration: {
    icon: FiSettings,
    title: "Configuration",
    iconBgGradient: "from-green-500 to-green-600",
  },
  pathSegments: {
    icon: FiLink,
    title: "Path Segments",
    iconBgGradient: "from-purple-500 to-purple-600",
  },
  urlPreview: {
    icon: FiEye,
    title: "URL Preview",
    iconBgGradient: "from-orange-500 to-orange-600",
  },
};

export const DEFAULT_VALUES = {
  protocol: "http",
  domain: "{base_url}",
  environment: "development",
  sessionDescription: "",
  segments: [],
};

export const COPY_TIMEOUT = 2000; // 2 seconds

export const VARIABLE_STATUS_STYLES = {
  notSet: "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300",
  set: "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300",
};

export const BUTTON_VARIANTS = {
  addSegment: {
    variant: "primary" as const,
    gradient: "from-blue-600 to-indigo-600",
  },
  removeSegment: {
    variant: "danger" as const,
    size: "sm" as const,
  },
  copyUrl: {
    variant: "ghost" as const,
    hoverColor: "hover:text-blue-600 dark:hover:text-blue-400",
    hoverBg: "hover:bg-blue-100 dark:hover:bg-blue-900",
  },
  togglePreview: {
    variant: "ghost" as const,
    hoverColor: "hover:text-gray-900 dark:hover:text-white",
    hoverBg: "hover:bg-gray-100 dark:hover:bg-gray-700",
  },
  submit: {
    variant: "primary" as const,
    size: "xl" as const,
    gradient: "from-blue-600 to-indigo-600",
  },
};

export const INPUT_PLACEHOLDERS = {
  domain: "example.com or {base_url}",
  staticSegment: "Segment value (e.g., api)",
  dynamicSegment: "Variable name (e.g., user_id)",
  description: "Description (optional)",
  sessionDescription: "Enter a description for this API endpoint...",
};

export const LABELS = {
  protocol: "Protocol",
  domain: "Domain",
  environment: "Environment",
  sessionDescription: "Session Description",
  generatedUrl: "Generated URL",
  clickToCopy: "Click to copy",
  variableValues: "Variable Values",
  addSegment: "Add Segment",
  noSegments: "No path segments added yet",
  noSegmentsDescription: "Add segments to build your URL path",
};
