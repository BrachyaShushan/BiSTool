import { ReactNode } from "react";

export type ModalSize =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl"
  | "8xl"
  | "9xl";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  title: string | ReactNode;
  children: ReactNode;
  showSaveButton?: boolean;
  showCancelButton?: boolean;
  saveButtonText?: string;
  cancelButtonText?: string;
  size?: ModalSize;
}
