// hooks/useConfirmation.ts
import { useCallback, useRef, useState } from 'react';

export const useConfirmation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const actionRef = useRef<(() => void) | null>(null);

  const showConfirmation = useCallback((msg: string, action: () => void) => {
    setMessage(msg);
    actionRef.current = action;
    setIsOpen(true);
  }, []);

  const hideConfirmation = useCallback(() => {
    setIsOpen(false);
    // Optional: Clear the action after hiding
    setTimeout(() => {
      actionRef.current = null;
    }, 100);
  }, []);

  const confirm = useCallback(() => {
    if (actionRef.current) {
      actionRef.current();
    }
    hideConfirmation();
  }, [hideConfirmation]);

  return {
    isOpen,
    message,
    showConfirmation,
    hideConfirmation,
    confirm,
  };
};