import React, { useRef, useEffect } from 'react';
import { FiX, FiXCircle, FiSave } from 'react-icons/fi';
import { Button, IconButton } from '../ui';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    title: string;
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
    children,
    showSaveButton = true,
    showCancelButton = true,
    saveButtonText = "Save",
    cancelButtonText = "Cancel",
    size = "md",
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const hasFocused = useRef(false);

    useEffect(() => {
        if (!isOpen) {
            hasFocused.current = false;
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
            className="flex fixed inset-0 z-50 justify-center items-center p-4"
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
                className={`relative w-full transition-all duration-300 ease-out transform ${sizeClasses[size]} modal-child`}
                style={{
                    zIndex: 50 + (document.querySelectorAll('.modal-child').length * 10),
                    animation: 'modalSlideIn 0.3s ease-out'
                }}
            >
                {/* Modal Container */}
                <div className="overflow-hidden relative bg-white rounded-2xl border border-gray-200 shadow-2xl dark:bg-gray-800 dark:border-gray-700">
                    {/* Header Section */}
                    <div className="relative px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600">
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5 dark:opacity-10">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500 rounded-full translate-x-12 -translate-y-12"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-500 rounded-full -translate-x-8 translate-y-8"></div>
                        </div>

                        <div className="flex relative justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg">
                                    <div className="w-4 h-4 bg-white rounded-sm"></div>
                                </div>
                                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300">
                                    {title}
                                </h2>
                            </div>

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

                    {/* Content Section */}
                    <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                        <div className="space-y-4">
                            {children}
                        </div>
                    </div>

                    {/* Footer Section */}
                    {(showSaveButton || showCancelButton) && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 dark:bg-gray-700/50 dark:border-gray-600">
                            <div className="flex justify-end space-x-3">
                                {showCancelButton && (
                                    <Button
                                        variant="secondary"
                                        icon={FiXCircle}
                                        onClick={onClose}
                                    >
                                        {cancelButtonText}
                                    </Button>
                                )}
                                {showSaveButton && (
                                    <Button
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