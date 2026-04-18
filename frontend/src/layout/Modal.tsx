import i18next from "i18next";
import React, { ReactNode } from "react";

type ModalWidth =
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl"
  | "5xl"
  | "6xl"
  | "7xl";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: ModalWidth;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, width }) => {
  const currentLanguage = i18next.language;
  const isRTL = currentLanguage === "ar" || currentLanguage === "kr";

  if (!isOpen) return null;

  // Mapping of width prop to Tailwind width classes
  const widthClasses: Record<ModalWidth, string> = {
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
  };

  // Set width class based on width prop, defaulting to 'max-w-md'
  const selectedWidthClass = width ? widthClasses[width] : "max-w-md";

  return (
    <div className="fixed inset-0 p-4 z-[99999] bg-gray-900 bg-opacity-50 flex items-center justify-center">
      <div
        className={`bg-white p-6 z-[99999] rounded-lg shadow-lg relative w-full ${selectedWidthClass} max-h-[90vh] overflow-y-auto`}
      >
        <button
          onClick={onClose}
          className={`absolute ${
            isRTL ? "top-3 left-3" : "top-3 right-3"
          } text-gray-500 hover:text-gray-800`}
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
