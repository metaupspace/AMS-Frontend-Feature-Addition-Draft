// Backward Compatible Generic Form Modal
"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/regex";

interface GenericFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string; // NEW: Optional subtitle for additional info
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  maxWidth?: string;
  // NEW: Upload protection features (optional for backward compatibility)
  onInteractOutside?: (event: Event) => void;
  preventEscapeClose?: boolean;
  // NEW: Option to disable the default Card wrapper (for custom layouts like SKU form)
  useCardWrapper?: boolean;
}

export function GenericFormModal({
  isOpen,
  onClose,
  title,
  subtitle, // NEW
  isLoading = false,
  loadingText = "Loading...",
  children,
  maxWidth = "max-w-4xl",
  onInteractOutside, // NEW
  preventEscapeClose = false, // NEW
  useCardWrapper = true, // NEW: Default to true for backward compatibility
}: GenericFormModalProps) {
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleEscapeKeyDown = (e: KeyboardEvent) => {
    if (preventEscapeClose) {
      e.preventDefault();
      // Optionally call onInteractOutside if provided
      if (onInteractOutside) {
        onInteractOutside(e);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent 
        className={`${maxWidth} max-h-[90vh] overflow-y-auto`}
        onInteractOutside={onInteractOutside}
        onEscapeKeyDown={preventEscapeClose ? handleEscapeKeyDown : undefined}
      >
        <DialogHeader>
          <DialogTitle className={cn("text-primary")}>
            {title}
            {/* NEW: Optional subtitle */}
            {subtitle && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({subtitle})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-t-[#00A0A0] border-b-[#00A0A0] border-r-transparent border-l-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">{loadingText}</p>
          </div>
        ) : (
          <>
            {/* Conditional Card wrapper for backward compatibility */}
            {useCardWrapper ? (
              <Card className="overflow-hidden w-full shadow-sm border-0">
                <CardContent className="grid grid-cols-1 gap-4 p-4">
                  <div className="flex flex-col justify-center gap-4">
                    {children}
                  </div>
                </CardContent>
              </Card>
            ) : (
              // For components that provide their own Card wrapper (like SKU form)
              children
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}