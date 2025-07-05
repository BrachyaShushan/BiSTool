import React, { useState, useEffect, useCallback } from "react";
import { FiShield, FiClock } from "react-icons/fi";
import TokenGenerator from "../utils/TokenGenerator";
import Modal from "../core/Modal";
import { Button } from "../ui";
import { TOKEN_CHECK_INTERVAL, TOKEN_EXPIRATION_STYLES } from "../../constants/requestConfig";

export interface TokenStatusDisplayProps {
    globalVariables?: Record<string, string> | null;
    className?: string;
    compact?: boolean;
    showTokenGenerator?: boolean;
    showTokenDetails?: boolean;
}

const TokenStatusDisplay: React.FC<TokenStatusDisplayProps> = ({
    globalVariables,
    className = "",
    compact = false,
    showTokenGenerator = true,
    showTokenDetails = true,
}) => {
    const [tokenExpiration, setTokenExpiration] = useState<number | null>(null);
    const [showTokenModal, setShowTokenModal] = useState(false);
    const [decodedToken, setDecodedToken] = useState<any>(null);

    const decodeString = useCallback((encodedString: string): string | null => {
        try {
            return atob(encodedString.replace(/-/g, "+").replace(/_/g, "/"));
        } catch (e) {
            console.error("Error decoding string:", e);
            return null;
        }
    }, []);

    const checkTokenExpiration = useCallback((): boolean => {
        if (!globalVariables) return false;

        const tokenName = globalVariables['tokenName'];
        if (!tokenName) return false;

        const tokenValue = globalVariables[tokenName as keyof typeof globalVariables];
        if (typeof tokenValue !== 'string' || !tokenValue) return false;

        const token = tokenValue as string;
        if (token.trim() === "") {
            setTokenExpiration(null);
            return false;
        }

        try {
            const tokenPart = token.split(".")[1];
            if (!tokenPart) return false;
            const payload = JSON.parse(decodeString(tokenPart) || "{}");
            const now = Math.floor(Date.now() / 1000);
            const exp = payload.exp;
            const duration = (exp - now) / 60; // duration in minutes
            setTokenExpiration(duration);
            return duration > 1;
        } catch (e) {
            console.error("Error checking token expiration:", e);
            setTokenExpiration(null);
            return false;
        }
    }, [globalVariables, decodeString]);

    // Check token expiration periodically
    useEffect(() => {
        checkTokenExpiration();
        const interval = setInterval(checkTokenExpiration, TOKEN_CHECK_INTERVAL);
        return () => clearInterval(interval);
    }, [checkTokenExpiration]);

    const handleShowTokenModal = () => {
        const tokenName = globalVariables ? globalVariables["tokenName"] : undefined;
        const tokenValue = tokenName && globalVariables ? globalVariables[tokenName] : undefined;
        if (typeof tokenValue === "string" && tokenValue.split(".").length === 3) {
            try {
                const base64Url = tokenValue.split(".")[1];
                if (!base64Url) {
                    setDecodedToken({ error: "Invalid token format" });
                } else {
                    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                    const jsonPayload = decodeURIComponent(
                        atob(base64)
                            .split("")
                            .map(function (c) {
                                return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
                            })
                            .join("")
                    );
                    setDecodedToken(JSON.parse(jsonPayload));
                }
            } catch (e) {
                setDecodedToken({ error: "Invalid token format" });
            }
        } else {
            setDecodedToken({ error: "No valid token found in global variables." });
        }
        setShowTokenModal(true);
    };

    const getTokenExpirationStyle = () => {
        if (tokenExpiration === null) return "";
        if (tokenExpiration > 5) return TOKEN_EXPIRATION_STYLES.valid;
        if (tokenExpiration > 1) return TOKEN_EXPIRATION_STYLES.warning;
        return TOKEN_EXPIRATION_STYLES.expired;
    };

    const getTokenExpirationText = () => {
        if (tokenExpiration === null) return "No token";
        if (tokenExpiration <= 0) return "Expired";
        if (tokenExpiration < 60) return `${Math.floor(tokenExpiration)}m`;
        const hours = Math.floor(tokenExpiration / 60);
        const minutes = Math.floor(tokenExpiration % 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className={`flex items-center space-x-3 ${className}`}>
            {/* Token Generator */}
            {showTokenGenerator && <TokenGenerator />}

            {/* Token Details Button */}
            {showTokenDetails && (
                <Button
                    variant="primary"
                    icon={FiShield}
                    onClick={handleShowTokenModal}
                    title="Token Details"
                    gradient
                    size={compact ? "sm" : "md"}
                    data-testid="token-details-button"
                >
                    {compact ? "Token" : "Token Details"}
                </Button>
            )}

            {/* Token Expiration Display */}
            {tokenExpiration !== null && (
                <div
                    className={`px-4 py-2 rounded-xl text-sm font-semibold flex items-center space-x-2 ${getTokenExpirationStyle()}`}
                    data-testid="token-expiration"
                >
                    <FiClock className="w-4 h-4" />
                    <span>{getTokenExpirationText()}</span>
                </div>
            )}

            {/* Token Details Modal */}
            <Modal
                isOpen={showTokenModal}
                onClose={() => setShowTokenModal(false)}
                title="Decoded Token"
                showSaveButton={false}
                size="lg"
            >
                {decodedToken ? (
                    decodedToken.error ? (
                        <div className="p-4 font-semibold text-center text-red-600 dark:text-red-400">
                            {decodedToken.error}
                        </div>
                    ) : (
                        <pre className="p-4 overflow-x-auto text-xs text-left bg-gray-100 rounded dark:bg-gray-900">
                            {JSON.stringify(decodedToken, null, 2)}
                        </pre>
                    )
                ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No token decoded.
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default TokenStatusDisplay; 