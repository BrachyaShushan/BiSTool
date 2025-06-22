import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useTheme } from "../../context/ThemeContext";
import { FiXCircle, FiTrash2 } from "react-icons/fi";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md rounded-lg p-6 z-50 ${isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
            }`}
        >
          <Dialog.Title className="text-xl font-semibold mb-4">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mb-6">{message}</Dialog.Description>
          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              <FiXCircle />
              <span>{cancelText}</span>
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 ${isDarkMode
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
            >
              <FiTrash2 />
              <span>{confirmText}</span>
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default ConfirmationDialog;
