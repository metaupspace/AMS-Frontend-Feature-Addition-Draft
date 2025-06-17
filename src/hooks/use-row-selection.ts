// hooks/use-row-selection.ts
import { useState, useCallback, useMemo } from "react";

interface BulkDeleteResult {
  success: { id: string; [key: string]: any }[];
  failed: { id: string; error: string; [key: string]: any }[];
}

interface DeleteProgress {
  completed: number;
  total: number;
}

interface UseRowSelectionProps<T> {
  data: T[]; // All available data (for getting selected items)
  getId: (item: T) => string;
}

interface UseRowSelectionReturn<T> {
  selectedRows: string[];
  selectedItems: T[];
  bulkDeleteResult: BulkDeleteResult | null;
  deleteProgress: DeleteProgress;
  showBulkDeleteModal: boolean;
  handleRowSelection: (selectedRowIds: string[]) => void;
  handleBulkDeleteModalOpen: () => void;
  handleBulkDeleteModalClose: (open: boolean, isDeleting?: boolean) => void;
  setBulkDeleteResult: (result: BulkDeleteResult | null) => void;
  setDeleteProgress: (progress: DeleteProgress) => void;
  clearSelection: () => void;
  removeFromSelection: (ids: string[]) => void;
  toggleRowSelection: (id: string) => void;
  selectAll: (ids: string[]) => void;
  isSelected: (id: string) => boolean;
  isAllSelected: (ids: string[]) => boolean;
  isSomeSelected: (ids: string[]) => boolean;
}

export function useRowSelection<T>({ 
  data, 
  getId 
}: UseRowSelectionProps<T>): UseRowSelectionReturn<T> {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteResult, setBulkDeleteResult] = useState<BulkDeleteResult | null>(null);
  const [deleteProgress, setDeleteProgress] = useState<DeleteProgress>({ completed: 0, total: 0 });

  // Get selected items based on selected row IDs
  const selectedItems = useMemo(() => {
    return data.filter(item => selectedRows.includes(getId(item)));
  }, [data, selectedRows, getId]);

  // Main row selection handler - optimized for server-side pagination
  const handleRowSelection = useCallback((selectedRowIds: string[]) => {
    setSelectedRows(selectedRowIds);
    if (bulkDeleteResult) {
      setBulkDeleteResult(null);
    }
  }, [bulkDeleteResult]);

  // Toggle selection for a single row
  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const isCurrentlySelected = prev.includes(id);
      if (isCurrentlySelected) {
        return prev.filter(selectedId => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
    
    if (bulkDeleteResult) {
      setBulkDeleteResult(null);
    }
  }, [bulkDeleteResult]);

  // Select all items from a given list of IDs
  const selectAll = useCallback((ids: string[]) => {
    setSelectedRows(prev => {
      const newSelection = [...new Set([...prev, ...ids])];
      return newSelection;
    });
    
    if (bulkDeleteResult) {
      setBulkDeleteResult(null);
    }
  }, [bulkDeleteResult]);

  // Check if a specific ID is selected
  const isSelected = useCallback((id: string) => {
    return selectedRows.includes(id);
  }, [selectedRows]);

  // Check if all items in a list are selected
  const isAllSelected = useCallback((ids: string[]) => {
    if (ids.length === 0) return false;
    return ids.every(id => selectedRows.includes(id));
  }, [selectedRows]);

  // Check if some (but not all) items in a list are selected
  const isSomeSelected = useCallback((ids: string[]) => {
    if (ids.length === 0) return false;
    const selectedCount = ids.filter(id => selectedRows.includes(id)).length;
    return selectedCount > 0 && selectedCount < ids.length;
  }, [selectedRows]);

  // Open bulk delete modal
  const handleBulkDeleteModalOpen = useCallback(() => {
    setShowBulkDeleteModal(true);
  }, []);

  // Close bulk delete modal
  const handleBulkDeleteModalClose = useCallback((open: boolean, isDeleting: boolean = false) => {
    if (!open && !isDeleting) {
      setShowBulkDeleteModal(false);
      setBulkDeleteResult(null);
      setDeleteProgress({ completed: 0, total: 0 });
    } else if (open) {
      setShowBulkDeleteModal(true);
    }
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedRows([]);
    setBulkDeleteResult(null);
  }, []);

  // Remove specific IDs from selection (useful after successful deletes)
  const removeFromSelection = useCallback((idsToRemove: string[]) => {
    setSelectedRows(prev => prev.filter(id => !idsToRemove.includes(id)));
  }, []);

  return {
    selectedRows,
    selectedItems,
    bulkDeleteResult,
    deleteProgress,
    showBulkDeleteModal,
    handleRowSelection,
    handleBulkDeleteModalOpen,
    handleBulkDeleteModalClose,
    setBulkDeleteResult,
    setDeleteProgress,
    clearSelection,
    removeFromSelection,
    toggleRowSelection,
    selectAll,
    isSelected,
    isAllSelected,
    isSomeSelected,
  };
}