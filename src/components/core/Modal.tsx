import React, { useRef, useEffect, useState } from 'react';
import { FiX, FiXCircle, FiSave, FiMaximize, FiMinimize } from 'react-icons/fi';
import { Button, IconButton } from '../ui';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    title: string | React.ReactNode;
    titleIcon?: React.ReactNode;
    children: React.ReactNode;
    showSaveButton?: boolean;
    showCancelButton?: boolean;
    saveButtonText?: string;
    cancelButtonText?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | '8xl' | '9xl';
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    onSave,
    title,
    titleIcon,
    children,
    showSaveButton = true,
    showCancelButton = true,
    saveButtonText = "Save",
    cancelButtonText = "Cancel",
    size = "md",
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const hasFocused = useRef(false);
    const [maximized, setMaximized] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            hasFocused.current = false;
            setMaximized(false);
            return;
        }

        const handleEscape = (e: KeyboardEvent) => {
            const openModals = document.querySelectorAll('.modal-child');
            const topModal = openModals[openModals.length - 1];

            if (modalRef.current === topModal && e.key === "Escape") {
                onClose();
            }
        };

        const handleEnter = (e: KeyboardEvent) => {
            const openModals = document.querySelectorAll('.modal-child');
            const topModal = openModals[openModals.length - 1];

            if (modalRef.current === topModal && e.key === "Enter" && showSaveButton) {
                e.preventDefault();
                onSave?.();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            const openModals = document.querySelectorAll('.modal-child');
            const topModal = openModals[openModals.length - 1];

            if (modalRef.current === topModal && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.addEventListener("keydown", handleEnter);
        document.addEventListener("mousedown", handleClickOutside);

        if (!hasFocused.current) {
            const formElements = modalRef.current?.querySelectorAll('input:not([type="hidden"]), textarea, select, button:not(.close-button)');
            if (formElements && formElements.length > 0) {
                (formElements[0] as HTMLElement).focus();
            }
            hasFocused.current = true;
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.removeEventListener("keydown", handleEnter);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, onSave, showSaveButton]);

    if (!isOpen) return null;

    const sizeClasses: Record<string, string> = {
        sm: "max-w-sm",
        md: "max-w-md",
        lg: "max-w-lg",
        xl: "max-w-xl",
        "2xl": "max-w-2xl",
        "3xl": "max-w-3xl",
        "4xl": "max-w-4xl",
        "5xl": "max-w-5xl",
        "6xl": "max-w-6xl",
        "7xl": "max-w-7xl",
        "8xl": "max-w-8xl",
        "9xl": "max-w-9xl",
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
            style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)'
            }}
        >
            {/* Animated backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/40 to-black/20"></div>

            <div
                ref={modalRef}
                className={`relative w-full transition-all duration-300 ease-out transform ${maximized ? 'max-w-full h-[96vh]' : sizeClasses[size]} modal-child`}
                style={{
                    zIndex: 50 + (document.querySelectorAll('.modal-child').length * 10),
                    animation: 'modalSlideIn 0.3s ease-out',
                    ...(maximized ? { height: '96vh', maxWidth: '96vw', minHeight: '80vh' } : {})
                }}
            >
                {/* Modal Container */}
                <div className="relative flex flex-col h-full overflow-hidden bg-white border border-gray-200 shadow-2xl rounded-2xl dark:bg-gray-800 dark:border-gray-700">
                    {/* Header Section */}
                    <div className="relative flex-shrink-0 px-4 py-3 border-b border-gray-200 sm:px-6 sm:py-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5 dark:opacity-10">
                            <div className="absolute top-0 right-0 w-16 h-16 translate-x-8 -translate-y-8 bg-blue-500 rounded-full sm:w-24 sm:h-24 sm:translate-x-12 sm:-translate-y-12"></div>
                            <div className="absolute bottom-0 left-0 w-12 h-12 -translate-x-6 translate-y-6 bg-indigo-500 rounded-full sm:w-16 sm:h-16 sm:-translate-x-8 sm:translate-y-8"></div>
                        </div>

                        <div className="relative flex items-center justify-between">
                            {typeof title === 'string' ? (
                                <div className="flex items-center flex-1 min-w-0 space-x-2 sm:space-x-3">
                                    {titleIcon && (
                                        titleIcon
                                    )}
                                    <h2 className="text-lg font-bold text-transparent truncate sm:text-xl bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
                                        {title}
                                    </h2>
                                </div>
                            ) : (
                                <div className="flex items-center flex-1 min-w-0">
                                    {title}
                                </div>
                            )}
                            <div className="flex items-center flex-shrink-0 gap-1 sm:gap-2">
                                {/* Full Size Button */}
                                <IconButton
                                    icon={maximized ? FiMinimize : FiMaximize}
                                    variant="ghost"
                                    size="md"
                                    onClick={() => setMaximized(m => !m)}
                                    title={maximized ? "Restore size" : "Full size"}
                                />
                                {/* Using IconButton component */}
                                <IconButton
                                    icon={FiX}
                                    variant="ghost"
                                    size="md"
                                    onClick={onClose}
                                    className="close-button"
                                    title="Close modal"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div
                        className="flex-1 px-4 py-4 overflow-y-auto sm:px-6 sm:py-6"
                        style={{
                            ...(maximized ? { maxHeight: 'none' } : { maxHeight: '60vh' })
                        }}
                    >
                        <div className="h-full space-y-3 sm:space-y-4">
                            {children}
                        </div>
                    </div>

                    {/* Footer Section */}
                    {(showSaveButton || showCancelButton) && (
                        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 sm:px-6 sm:py-4 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600">
                            <div className="flex flex-col justify-end space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                                {showCancelButton && (
                                    <Button
                                        gradient
                                        variant="secondary"
                                        icon={FiXCircle}
                                        onClick={onClose}
                                    >
                                        {cancelButtonText}
                                    </Button>
                                )}
                                {showSaveButton && (
                                    <Button
                                        gradient
                                        variant="primary"
                                        icon={FiSave}
                                        onClick={onSave}
                                    >
                                        {saveButtonText}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom CSS for animations */}
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        .modal-child {
          animation: modalSlideIn 0.3s ease-out;
        }
      `}} />
        </div>
    );
};

export default Modal; 