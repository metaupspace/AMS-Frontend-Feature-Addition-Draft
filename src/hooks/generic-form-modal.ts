import { useState, useCallback } from 'react';

export interface UseModalManagerReturn<T = string> {
  isOpen: boolean;
  selectedId: T | undefined;
  openModal: () => void;
  openEditModal: (id: T) => void;
  closeModal: () => void;
}

export function useModalManager<T = string>(
  onCloseCallback?: () => void
): UseModalManagerReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<T | undefined>();

  const openModal = useCallback(() => {
    setSelectedId(undefined);
    setIsOpen(true);
  }, []);

  const openEditModal = useCallback((id: T) => {
    setSelectedId(id);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setSelectedId(undefined);
    if (onCloseCallback) {
      setTimeout(onCloseCallback, 500);
    }
  }, [onCloseCallback]);

  return {
    isOpen,
    selectedId,
    openModal,
    openEditModal,
    closeModal,
  };
}