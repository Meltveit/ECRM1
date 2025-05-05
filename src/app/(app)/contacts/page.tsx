// src/app/(app)/contacts/page.tsx
"use client";
// Removed MainLayout import
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function ContactsPage() {
  return (
    // MainLayout removed as it's handled by the layout
     <div className="container mx-auto py-6">
       <h1 className="text-3xl font-bold mb-6">Contacts</h1>
        <Card>
           <CardHeader>
               <CardTitle>Manage Contacts</CardTitle>
           </CardHeader>
           <CardContent>
               <p className="text-muted-foreground">Contact management (linked to clients) functionality will be implemented here.</p>
               {/* Placeholder for DataTable and Add/Edit Contact functionality */}
           </CardContent>
       </Card>
     </div>
  );
}
