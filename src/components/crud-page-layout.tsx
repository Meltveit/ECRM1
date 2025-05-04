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
  DialogFooter,
  DialogClose,
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

  // Expose handleOpenDialog via children render prop if needed by DataTable actions
   const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child) && typeof child.type !== 'string') {
      // Clone element and add props - adjust based on how DataTable actions are implemented
      // This example assumes DataTable might have an 'onEdit' prop
      return React.cloneElement(child as React.ReactElement<any>, { onEdit: handleOpenDialog });
    }
    return child;
  });


  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{title}</h1>
        <Button onClick={() => handleOpenDialog()} size="sm">
          <PlusCircle className="h-4 w-4 mr-2" />
          {addButtonText || `Add New ${title.replace(/s$/, '')}`}
        </Button>
      </div>

      {/* Render DataTable or other main content */}
      {childrenWithProps}


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
           {/* Footer is typically handled within the FormComponent now to include submit/cancel buttons */}
            {/* <DialogFooter className="mt-auto pt-4 border-t">
                <DialogClose asChild>
                 <Button type="button" variant="outline" onClick={handleCloseDialog}>
                    Cancel
                 </Button>
                </DialogClose>
                 {/* The Save button is likely part of the FormComponent now */}
                {/* <Button type="submit" form="entity-form">Save</Button> */}
            {/* </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
