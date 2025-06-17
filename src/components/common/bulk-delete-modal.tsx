"use client";

import React from "react";
import { WarningModal } from "@/components/common/warning-modal";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle } from "lucide-react";

interface BulkDeleteResult {
  success: { id: string; [key: string]: any }[];
  failed: { id: string; error: string; [key: string]: any }[];
}

interface DeleteProgress {
  completed: number;
  total: number;
}

interface BulkDeleteModalProps<T> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  selectedItems: T[];
  selectedIds: string[];
  isDeleting: boolean;
  deleteProgress: DeleteProgress;
  bulkDeleteResult: BulkDeleteResult | null;
  entityName: string; // e.g., "role", "location"
  entityDisplayName: string; // e.g., "roleName", "title"
  getItemName: (item: T) => string; // Function to get display name from item
}

export function BulkDeleteModal<T extends { id: string }>({
  open,
  onOpenChange,
  onDelete,
  selectedItems,
  selectedIds,
  isDeleting,
  deleteProgress,
  bulkDeleteResult,
  entityName,
  entityDisplayName,
  getItemName,
}: BulkDeleteModalProps<T>) {
  
  // Don't render the modal if there are no selected items and no operations in progress
  if (selectedIds.length === 0 && !bulkDeleteResult && !isDeleting && !deleteProgress.total) {
    return null;
  }
  
  const renderBulkDeleteModalContent = () => {
    if (bulkDeleteResult) {
      const { success, failed } = bulkDeleteResult;
      
      return (
        <div className="space-y-4">
          {success.length > 0 && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Successfully deleted {success.length} {entityName}(s):</strong>
                <ul className="mt-1 text-sm max-h-32 overflow-y-auto">
                  {success.map(({ id, [entityDisplayName]: name }) => (
                    <li key={id}>• {name || id}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          {failed.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Failed to delete {failed.length} {entityName}(s):</strong>
                <ul className="mt-1 text-sm space-y-1 max-h-32 overflow-y-auto">
                  {failed.map(({ id, [entityDisplayName]: name, error }) => (
                    <li key={id}>
                      • <strong>{name || id}</strong>: {error}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="text-center text-sm text-muted-foreground">
            Modal will close automatically in a few seconds...
          </div>
        </div>
      );
    }

    // Show progress during deletion
    if (isDeleting && deleteProgress.total > 0) {
      const progressPercentage = (deleteProgress.completed / deleteProgress.total) * 100;
      
      return (
        <div className="space-y-4">
          <p>Deleting {entityName}s... ({deleteProgress.completed}/{deleteProgress.total})</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progressPercentage}%` }} 
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Please wait while we delete the selected {entityName}s.
          </p>
        </div>
      );
    }

    // Only show the confirmation if we have items to delete
    if (selectedIds.length === 0) {
      return (
        <div className="text-center text-muted-foreground">
          No items selected for deletion.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p>
          Are you sure you want to delete <strong>{selectedIds.length}</strong> {entityName}(s)?
        </p>
        <div className="p-3 bg-gray-50 rounded border">
          <p className="text-sm font-medium text-gray-700 mb-2">Selected {entityName}s:</p>
          <div className="text-sm text-gray-600 max-h-32 overflow-y-auto">
            {selectedItems.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="w-4 h-4 flex items-center justify-center bg-red-100 text-red-600 rounded-full text-xs font-bold">
                  {index + 1}
                </span>
                <span>{getItemName(item)}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-red-600 font-medium">
          This action cannot be undone.
        </p>
      </div>
    );
  };

  return (
    <WarningModal
      open={open}
      onOpenChange={onOpenChange}
      onDelete={onDelete}
      title={`Delete Multiple ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}s`}
      isLoading={isDeleting}
      loadingText={deleteProgress.total > 0 
        ? `Deleting ${entityName}s... (${deleteProgress.completed}/${deleteProgress.total})`
        : `Preparing to delete ${entityName}s...`
      }
      showDeleteButton={!bulkDeleteResult && !isDeleting && selectedIds.length > 0}
      actionLabel={`Delete ${selectedIds.length} ${entityName.charAt(0).toUpperCase() + entityName.slice(1)}${selectedIds.length > 1 ? 's' : ''}`}
      preventAutoClose={true}
      cancelLabel="Close"
    >
      {renderBulkDeleteModalContent()}
    </WarningModal>
  );
}