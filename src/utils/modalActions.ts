import { ModalType } from "../types/features/SavedManager";

/**
 * Centralized modal action utilities to eliminate duplicate modal action patterns
 */

/**
 * Generic modal action handler factory
 */
export const createModalActionHandler = <T>(
  setSelected: (item: T | null) => void,
  setModalType: (type: ModalType) => void,
  setShowModal: (show: boolean) => void,
  setName?: (name: string) => void
) => {
  return (action: ModalType, item: T | null = null, name?: string): void => {
    setSelected(item);
    setModalType(action);

    if (name && setName) {
      if (action === "duplicate" && item) {
        setName(`${name} (Copy)`);
      } else {
        setName(name);
      }
    }

    setShowModal(true);
  };
};

/**
 * Generic modal submit handler factory
 */
export const createModalSubmitHandler = <T>(
  validateName: (name: string) => boolean,
  onSave: (name: string, item: T) => void,
  setShowModal: (show: boolean) => void,
  setName: (name: string) => void,
  setSelected: (item: T | null) => void,
  setError: (error: string | null) => void
) => {
  return (name: string, item: T | null): void => {
    if (!validateName(name)) {
      return;
    }

    if (name.trim() && item) {
      try {
        onSave(name, item);
        setShowModal(false);
        setName("");
        setSelected(null);
        setError(null);
      } catch (err) {
        setError("Failed to save");
      }
    }
  };
};

/**
 * Generic name validation
 */
export const validateName = (
  name: string,
  existingNames: string[],
  currentId?: string
): boolean => {
  if (!name.trim()) {
    return false;
  }

  // Check if name already exists (excluding current item)
  const nameExists = existingNames.some(
    (existingName) => existingName === name && existingName !== currentId
  );

  return !nameExists;
};
