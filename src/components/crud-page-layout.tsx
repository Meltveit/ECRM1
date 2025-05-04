// src/components/crud-page-layout.tsx
"use client";

import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CrudPageLayoutProps<TData> {
  title: string;
  children: React.ReactNode; // Typically the DataTable component
  formComponent: React.ComponentType<{ data?: TData | null; onSave: () => void; onCancel: () => void }>; // Form for adding/editing
  // Optional: Add button text
  addButtonText?: string;
   // Optional: Description for the dialog
  addDialogDescription?: string;
}

export function CrudPageLayout<TData>({
  title,
  children,
  formComponent: FormComponent, // Rename for clarity
  addButtonText,
  addDialogDescription,
}: CrudPageLayoutProps<TData>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editData, setEditData] = useState<TData | null>(null); // Store data for editing

  const handleOpenDialog = (data?: TData) => {
    setEditData(data || null); // Set data if editing, null if adding
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditData(null); // Clear edit data on close/cancel
  };

  const handleSave = () => {
    handleCloseDialog(); // Close dialog after save
    // Data invalidation/refetching should be handled by the mutation hook used within FormComponent
  };

  // Expose handleOpenDialog via window object for external access
  if (typeof window !== 'undefined') {
    (window as any).handleOpenEditDialog = handleOpenDialog;
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          {addButtonText || `Add New ${title.replace(/s$/, '')}`}
        </Button>
      </div>

      {/* Render DataTable or other main content */}
      {children}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editData ? `Edit ${title.replace(/s$/, '')}` : `Add New ${title.replace(/s$/, '')}`}</DialogTitle>
             {addDialogDescription && !editData && (
              <DialogDescription>{addDialogDescription}</DialogDescription>
            )}
          </DialogHeader>
           <ScrollArea className="flex-grow overflow-y-auto pr-6 pl-1 py-4">
                <FormComponent
                    data={editData}
                    onSave={handleSave}
                    onCancel={handleCloseDialog}
                 />
           </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}