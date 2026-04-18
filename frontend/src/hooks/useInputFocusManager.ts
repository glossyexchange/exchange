import { KeyboardEvent, RefObject, useRef } from 'react';

interface UseInputFocusManagerOptions {
  onLastInputEnter?: () => void; 
  buttonRef?: RefObject<HTMLButtonElement>;
  autoFocusOnChange?: boolean;
  textareaNavigation?: 'enter' | 'ctrl-enter' | 'shift-enter' | 'none';
}

type FocusableFormElement = 
  | HTMLInputElement 
  | HTMLSelectElement 
  | HTMLTextAreaElement;

const useInputFocusManager = (
  inputCount: number, 
  options?: UseInputFocusManagerOptions
) => {
  const { 
    onLastInputEnter, 
    buttonRef, 
    autoFocusOnChange = false,
    textareaNavigation = 'ctrl-enter' // Default: Ctrl+Enter for navigation
  } = options || {};
  
  const inputRefs = useRef<(FocusableFormElement | null)[]>([]);

  const getKeyDownHandler = (index: number) => (e: KeyboardEvent<FocusableFormElement>) => {
    if (e.key === 'Enter') {
      // Handle textarea based on configuration
      // const isTextarea = e.currentTarget instanceof HTMLTextAreaElement;
      
      // if (isTextarea) {
      //   switch (textareaNavigation) {
      //     case 'ctrl-enter':
      //       if (!e.ctrlKey) return; // Allow normal Enter for line break
      //       break;
      //     case 'shift-enter':
      //       if (!e.shiftKey) return; // Allow normal Enter for line break
      //       break;
      //     case 'none':
      //       return; // Don't handle Enter for textarea
      //     case 'enter':
      //       // Handle normally - will prevent line breaks
      //       break;
      //   }
      // }
      
      e.preventDefault();
      
      if (index < inputCount - 1) {
        const nextInput = inputRefs.current[index + 1];
        if (nextInput) {
          // Check if next input is disabled
          if ('disabled' in nextInput && nextInput.disabled) {
            // Skip to the next enabled input
            let nextIndex = index + 1;
            while (nextIndex < inputCount - 1) {
              const next = inputRefs.current[nextIndex + 1];
              if (next && (!('disabled' in next) || !next.disabled)) {
                next.focus();
                return;
              }
              nextIndex++;
            }
          } else {
            nextInput.focus();
          }
        }
      } else {
        if (buttonRef?.current) {
          buttonRef.current.focus();
        } else if (onLastInputEnter) {
          onLastInputEnter();
        }
      }
    }
  };

  // Method to focus next input
  const focusNext = (currentIndex: number) => {
    if (currentIndex < inputCount - 1) {
      const nextInput = inputRefs.current[currentIndex + 1];
      if (nextInput) {
        // Check if the next input is disabled
        if ('disabled' in nextInput && nextInput.disabled) {
          // Skip disabled inputs recursively
          focusNext(currentIndex + 1);
        } else {
          nextInput.focus();
        }
      }
    }
  };

  // Get change handler for auto-focus
  const getChangeHandler = (index: number) => (e: React.ChangeEvent<FocusableFormElement>) => {
    // If autoFocusOnChange is enabled, focus next input
    if (autoFocusOnChange) {
      // Small delay to ensure value is processed
      setTimeout(() => {
        focusNext(index);
      }, 10);
    }
  };

  const registerRef = (index: number) => (el: FocusableFormElement | null) => {
    inputRefs.current[index] = el;
  };

  const clearRefs = () => {
    inputRefs.current = [];
  };

  // Helper to focus a specific input
  const focusInput = (index: number) => {
    if (inputRefs.current[index]) {
      inputRefs.current[index]?.focus();
    }
  };

  return { 
    registerRef, 
    getKeyDownHandler, 
    inputRefs, 
    clearRefs,
    focusNext,
    getChangeHandler,
    focusInput
  };
};

export default useInputFocusManager;