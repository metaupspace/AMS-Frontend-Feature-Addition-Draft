import { useCallback } from "react";
import { toast } from "@/hooks/use-toast";

interface BulkDeleteResult {
  success: { id: string; [key: string]: any }[];
  failed: { id: string; error: string; [key: string]: any }[];
}

interface DeleteProgress {
  completed: number;
  total: number;
}

interface UseBulkOperationsProps<T> {
  selectedRows: string[];
  selectedItems: T[];
  bulkDeleteMutation: any; // The mutation hook
  setBulkDeleteResult: (result: BulkDeleteResult | null) => void;
  setDeleteProgress: (progress: DeleteProgress) => void;
  setShowBulkDeleteModal: (show: boolean) => void;
  removeFromSelection: (ids: string[]) => void;
  entityName: string; // e.g., "role", "location", "GRN"
  getItemDisplayName: (item: T) => string; // Function to get display name from item
}

interface UseBulkOperationsReturn {
  handleBulkDelete: () => Promise<void>;
}

// Helper function to get the display name key based on entity type - moved outside to avoid re-creation
const getDisplayNameKey = (entityName: string) => {
  switch (entityName) {
    case 'role':
      return 'roleName';
    case 'location':
      return 'title';
    case 'GRN':
      return 'grnId';
    case 'supplier':
      return 'name';
    default:
      return 'name';
  }
};

export function useBulkOperations<T extends { id: string }>({
  selectedRows,
  selectedItems,
  bulkDeleteMutation,
  setBulkDeleteResult,
  setDeleteProgress,
  setShowBulkDeleteModal,
  removeFromSelection,
  entityName,
  getItemDisplayName,
}: UseBulkOperationsProps<T>): UseBulkOperationsReturn {

  const handleBulkDelete = useCallback(async () => {
    if (selectedRows.length === 0) return;

    setBulkDeleteResult(null);
    setDeleteProgress({ completed: 0, total: selectedRows.length });
    
    if (selectedItems.length === 0) {
      return;
    }

    try {
      bulkDeleteMutation(
        { 
          ids: selectedRows, 
          options: { 
            suppressToast: true, 
            onProgress: (completed: number, total: number) => {
              setDeleteProgress({ completed, total });
            }
          } 
        },
        {
          onSuccess: (result: BulkDeleteResult) => {
            // Enhance result with display names
            const displayNameKey = getDisplayNameKey(entityName);
            const enhancedResult: BulkDeleteResult = {
              success: result.success.map(item => {
                const foundItem = selectedItems.find(si => si.id === item.id);
                return { 
                  ...item, 
                  [displayNameKey]: foundItem ? getItemDisplayName(foundItem) : undefined 
                };
              }),
              failed: result.failed.map(item => {
                const foundItem = selectedItems.find(si => si.id === item.id);
                return { 
                  ...item, 
                  [displayNameKey]: foundItem ? getItemDisplayName(foundItem) : undefined 
                };
              })
            };
            
            setBulkDeleteResult(enhancedResult);
            
            // Remove successfully deleted items from selection
            const successfulIds = result.success.map(item => item.id);
            removeFromSelection(successfulIds);
            
            // Show appropriate toast messages
            if (result.success.length > 0 && result.failed.length === 0) {
              toast({
                title: "Success",
                description: `Successfully deleted ${result.success.length} ${entityName}(s)`,
              });
            } else if (result.success.length > 0 && result.failed.length > 0) {
              toast({
                title: "Partial Success",
                description: `Deleted ${result.success.length} ${entityName}(s), ${result.failed.length} failed`,
                variant: "default",
              });
            } else if (result.failed.length > 0) {
              toast({
                title: "Delete Failed",
                description: `Failed to delete ${result.failed.length} ${entityName}(s)`,
                variant: "destructive",
              });
            }
            
            // Auto-close modal after delay
            setTimeout(() => {
              setShowBulkDeleteModal(false);
              setBulkDeleteResult(null);
              setDeleteProgress({ completed: 0, total: 0 });
            }, 3000); 
          },
          onError: (error: any) => {
            console.error('Bulk delete error:', error);
            
            // Create failed result for all selected items
            const displayNameKey = getDisplayNameKey(entityName);
            const failedResult: BulkDeleteResult = {
              success: [],
              failed: selectedItems.map(item => ({
                id: item.id,
                [displayNameKey]: getItemDisplayName(item),
                error: error?.message || 'Unexpected error occurred'
              }))
            };
            
            setBulkDeleteResult(failedResult);
            
            toast({
              title: "Bulk Delete Failed",
              description: "An error occurred during bulk delete operation",
              variant: "destructive",
            });
            
            setTimeout(() => {
              setShowBulkDeleteModal(false);
              setBulkDeleteResult(null);
              setDeleteProgress({ completed: 0, total: 0 });
            }, 4000);
          }
        }
      );
    } catch (error) {
      console.error('Unexpected error during bulk delete:', error);
      
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
      
      setShowBulkDeleteModal(false);
      setBulkDeleteResult(null);
      setDeleteProgress({ completed: 0, total: 0 });
    }
  }, [
    selectedRows, 
    selectedItems, 
    bulkDeleteMutation, 
    setBulkDeleteResult, 
    setDeleteProgress, 
    setShowBulkDeleteModal, 
    removeFromSelection, 
    entityName, 
    getItemDisplayName // Added missing dependency
  ]);

  return {
    handleBulkDelete,
  };
}