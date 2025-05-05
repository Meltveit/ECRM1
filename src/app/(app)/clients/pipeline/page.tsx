// src/app/(app)/clients/pipeline/page.tsx
"use client";

import React from 'react';
// Removed MainLayout import
import { SalesPipeline } from '@/components/sales-pipeline';

export default function PipelinePage() {
  return (
    // MainLayout removed as it's handled by the layout
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Sales Pipeline</h1>
      <SalesPipeline />
    </div>
  );
}
