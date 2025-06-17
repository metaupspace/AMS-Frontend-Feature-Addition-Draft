import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";

interface WarningModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  logout?: boolean;
  description?: string;
  onDelete: () => void;
  actionLabel?: string;
  isLoading?: boolean;
  loadingText?: string; // Custom loading text
  showDeleteButton?: boolean; // Control whether to show delete button
  children?: ReactNode; // Custom content (for bulk delete results)
  cancelLabel?: string; // Custom cancel button text
  variant?: "destructive" | "default"; // Button variant
  preventAutoClose?: boolean; // Prevent automatic closing after delete action
}

export function WarningModal({
  open,
  onOpenChange,
  title = "Delete Item",
  logout,
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  onDelete,
  actionLabel,
  isLoading = false,
  loadingText = "Loading...",
  showDeleteButton = true,
  children,
  cancelLabel = "Cancel",
  variant = "destructive",
  preventAutoClose = false,
}: WarningModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  const handleDelete = () => {
    onDelete();
    // Only auto-close if not explicitly prevented
    if (!preventAutoClose) {
      onOpenChange(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleBackdropClick = () => {
    // Prevent closing on backdrop click when loading
    if (!isLoading) {
      handleClose();
    }
  };

  // Determine the button text
  const buttonText = actionLabel || (logout ? "Logout" : "Delete");

  // Render content - either children (for custom content) or description
  const renderContent = () => {
    if (children) {
      return (
        <div className="mt-2">
          {children}
        </div>
      );
    }
    
    if (description) {
      return (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      );
    }
    
    return null;
  };

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={handleBackdropClick} 
      />
      <div className="relative z-50 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg">
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        <h2 className="text-lg font-semibold pr-8">{title}</h2>
        
        {renderContent()}

        <div className="mt-6 flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          
          {showDeleteButton && (
            <Button 
              variant={variant} 
              onClick={handleDelete} 
              disabled={isLoading}
            >
              {isLoading ? loadingText : buttonText}
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}