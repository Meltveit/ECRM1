// src/components/delete-confirmation-dialog.tsx
"use client";

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, ButtonProps, buttonVariants } from "@/components/ui/button"; // Import buttonVariants
import { Trash2 } from 'lucide-react';

interface DeleteConfirmationDialogProps {
  children?: React.ReactNode; // Allow passing a custom trigger component
  onConfirm: () => void;
  triggerText?: string; // Still allow text for default button
  triggerVariant?: ButtonProps['variant']; // For default button
  triggerSize?: ButtonProps['size']; // For default button
  dialogTitle?: string;
  dialogDescription?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  children,
  onConfirm,
  triggerText = "Delete",
  triggerVariant = "destructive",
  triggerSize = "sm", // Default to small size
  dialogTitle = "Are you absolutely sure?",
  dialogDescription = "This action cannot be undone. This will permanently delete the item and remove its data from our servers.",
  confirmText = "Delete",
  cancelText = "Cancel",
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {/* Render custom child trigger or default Button */}
        {children ? children : (
           <Button variant={triggerVariant} size={triggerSize} disabled={isLoading}>
            <Trash2 className="mr-2 h-4 w-4" /> {/* Show icon by default */}
            {triggerText}
           </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogTitle}</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
             onClick={(e) => {
                e.preventDefault(); // Prevent default form submission if inside a form
                onConfirm();
              }}
              disabled={isLoading}
              className={buttonVariants({ variant: "destructive" })} // Apply destructive variant directly
            >
              {isLoading ? "Deleting..." : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
