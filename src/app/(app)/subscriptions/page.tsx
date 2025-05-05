// src/app/(app)/subscriptions/page.tsx
"use client";
// Removed MainLayout import
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function SubscriptionsPage() {
  return (
    // MainLayout removed as it's handled by the layout
     <div className="container mx-auto py-6">
       <h1 className="text-3xl font-bold mb-6">Subscriptions</h1>
       <Card>
           <CardHeader>
               <CardTitle>Manage Subscriptions</CardTitle>
           </CardHeader>
           <CardContent>
               <p className="text-muted-foreground">Subscription management functionality will be implemented here.</p>
               {/* Placeholder for DataTable and Add/Edit Subscription functionality */}
           </CardContent>
       </Card>
     </div>
  );
}
