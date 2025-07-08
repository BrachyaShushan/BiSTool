import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from "react";
import { TokenConfig } from "../types";
import { useTokenManager } from "../hooks/useTokenManager";
import { useTokenConfigStorage } from "../hooks/useStorage";
import { useStorageContext } from "./StorageContext";
import { useProjectContext } from "./ProjectContext";
import { useVariablesContext } from "./VariablesContext";

export interface TokenContextType {
    // Token configuration
    tokenConfig: TokenConfig;
    setTokenConfig: (config: TokenConfig | ((prev: TokenConfig) => TokenConfig)) => void;

    // Token management functions
    regenerateToken: () => Promise<void>;
    generateAuthHeaders: () => Record<string, string>;
    getCurrentToken: () => string | null;
    isAuthenticated: () => boolean;

    // Loading state
    isLoading: boolean;
    error: string | null;
}

const TokenContext = createContext<TokenContextType | undefined>(undefined);

interface TokenProviderProps {
    children: React.ReactNode;
    currentProjectId: string | null;
    forceReload: number;
}

export const TokenProvider: React.FC<TokenProviderProps> = ({
    children,
    currentProjectId,
    forceReload
}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const tokenManagerRef = useRef<any>(null);

    // Get current project name from ProjectContext
    const projectContext = useProjectContext();
    const projectName = projectContext?.currentProject?.name || "Unnamed Project";

    // Use the shared StorageManager from StorageContext
    const { storageManager } = useStorageContext();

    // Initialize token manager
    const tokenManager = useTokenManager();
    const { updateGlobalVariable } = useVariablesContext();

    // Store tokenManager in ref for use in effects
    tokenManagerRef.current = tokenManager;

    // Initialize token config storage - call hook at top level
    const tokenConfigStorage = useTokenConfigStorage(storageManager, currentProjectId, projectName);

    // Load token config when project changes
    useEffect(() => {
        if (!currentProjectId) {
            setIsLoading(false);
            setHasLoaded(true);
            return;
        }

        const loadTokenConfig = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Load token config
                const loadedTokenConfig = tokenConfigStorage.loadTokenConfig();
                if (loadedTokenConfig && tokenManagerRef.current) {
                    tokenManagerRef.current.setTokenConfig(loadedTokenConfig);
                }

                setHasLoaded(true);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load token config:", err);
                setError(`Failed to load token config: ${err}`);
                setIsLoading(false);
            }
        };

        loadTokenConfig();
    }, [currentProjectId, forceReload, projectName, tokenConfigStorage]);

    // Create a wrapped setTokenConfig that also saves
    const setTokenConfigWithSave = useCallback((config: TokenConfig | ((prev: TokenConfig) => TokenConfig)) => {
        tokenManager.setTokenConfig(config);

        // Save the new config if we have a current project
        if (currentProjectId && hasLoaded) {
            const newConfig = typeof config === 'function' ? config(tokenManager.tokenConfig) : config;
            tokenConfigStorage.saveTokenConfig(newConfig);
        }
    }, [tokenManager, currentProjectId, hasLoaded, tokenConfigStorage]);

    // Token management functions
    const regenerateToken = useCallback(async (): Promise<void> => {
        try {
            const result = await tokenManager.regenerateToken();
            updateGlobalVariable(result.tokenName, result.token);
            updateGlobalVariable("tokenName", result.tokenName);

            if (result.refreshToken && result.refreshTokenName) {
                updateGlobalVariable(result.refreshTokenName, result.refreshToken);
            }
        } catch (error) {
            console.error("Token regeneration error:", error);
            throw error;
        }
    }, [tokenManager, updateGlobalVariable]);

    const generateAuthHeaders = useCallback(() => {
        return tokenManager.generateAuthHeaders();
    }, [tokenManager]);

    const getCurrentToken = useCallback(() => {
        return tokenManager.getCurrentToken();
    }, [tokenManager]);

    const isAuthenticated = useCallback(() => {
        return tokenManager.isAuthenticated();
    }, [tokenManager]);

    const value: TokenContextType = {
        // Token configuration
        tokenConfig: tokenManager.tokenConfig,
        setTokenConfig: setTokenConfigWithSave,

        // Token management functions
        regenerateToken,
        generateAuthHeaders,
        getCurrentToken,
        isAuthenticated,

        // Loading state
        isLoading,
        error,
    };

    return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

export const useTokenContext = () => {
    const context = useContext(TokenContext);
    if (!context) {
        throw new Error("useTokenContext must be used within a TokenProvider");
    }
    return context;
}; 