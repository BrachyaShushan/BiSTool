import React, { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { ModalProps } from "../types/Modal.types";
import { FiX, FiSave, FiXCircle } from "react-icons/fi";

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
  size = "md", // sm, md, lg, xl
}) => {
  const { isDarkMode } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const hasFocused = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasFocused.current = false;
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      // Get all open modals
      const openModals = document.querySelectorAll('.modal-child');
      const topModal = openModals[openModals.length - 1];

      // Only handle escape if this is the topmost modal
      if (modalRef.current === topModal && e.key === "Escape") {
        onClose();
      }
    };

    const handleEnter = (e: KeyboardEvent) => {
      // Get all open modals
      const openModals = document.querySelectorAll('.modal-child');
      const topModal = openModals[openModals.length - 1];

      // Only handle enter if this is the topmost modal
      if (modalRef.current === topModal && e.key === "Enter" && showSaveButton) {
        e.preventDefault();
        onSave?.();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      // Get all open modals
      const openModals = document.querySelectorAll('.modal-child');
      const topModal = openModals[openModals.length - 1];

      // Only handle click if this is the topmost modal
      if (modalRef.current === topModal && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("keydown", handleEnter);
    document.addEventListener("mousedown", handleClickOutside);

    // Focus on first form element only when modal first opens
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
    "3xl": "max-w-3xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    "8xl": "max-w-8xl",
    "9xl": "max-w-9xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        ref={modalRef}
        className={`w-full ${sizeClasses[size]} rounded-lg shadow-lg p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"
          } modal-child`}
        style={{ zIndex: 50 + (document.querySelectorAll('.modal-child').length * 10) }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"
              }`}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full close-button ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
          >
            <FiX size={5} />
          </button>
        </div>

        <div className="mb-4 max-h-[60vh] overflow-y-auto">{children}</div>

        <div className="flex justify-end space-x-2">
          {showCancelButton && (
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                ? "bg-gray-600 text-white hover:bg-gray-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <FiXCircle />
              <span>{cancelButtonText}</span>
            </button>
          )}
          {showSaveButton && (
            <button
              onClick={onSave}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                }`}
            >
              <FiSave />
              <span>{saveButtonText}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;