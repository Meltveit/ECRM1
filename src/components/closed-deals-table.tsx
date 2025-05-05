// src/components/closed-deals-table.tsx
"use client";

import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DollarSign, User, Calendar } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { Client } from '@/types/crm';
import { formatTimestamp } from '@/lib/utils'; // Use the utility function
import { Badge } from '@/components/ui/badge'; // Use Badge for status/type

// Helper to format currency
const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return '-';
  return `€${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface ClosedDealsTableProps {
  clients: Client[]; // Expecting already filtered list of won deals
}

export function ClosedDealsTable({ clients }: ClosedDealsTableProps) {
  // Sort clients by closedAt date, descending (most recent first)
  const sortedClients = React.useMemo(() => {
    return [...clients].sort((a, b) => {
      const dateA = a.closedAt?.toDate()?.getTime() || 0;
      const dateB = b.closedAt?.toDate()?.getTime() || 0;
      return dateB - dateA; // Sort descending
    });
  }, [clients]);

  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: 'name',
      header: 'Client Name',
      cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
    },
    {
      accessorKey: 'value',
      header: () => <div className="text-right">Value</div>,
      cell: ({ row }) => (
        <div className="text-right font-medium flex items-center justify-end gap-1">
          <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          {formatCurrency(row.getValue('value'))}
        </div>
      ),
    },
    {
      accessorKey: 'assignedUserName',
      header: 'Closed By',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          {row.getValue('assignedUserName') || 'Unknown'}
        </div>
      ),
    },
    {
      accessorKey: 'closedAt',
      header: 'Date Closed',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {formatTimestamp(row.getValue('closedAt'), 'PP')} {/* Format as Oct 26, 2023 */}
        </div>
      ),
    },
     {
      id: 'status', // Simple status column since all are 'won' here
      header: 'Status',
      cell: () => <Badge variant="success">Won</Badge>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={sortedClients} // Use the sorted data
      filterInputPlaceholder="Filter by client name..."
      filterColumnId="name"
      // Optionally add onRowClick if you want to navigate to client details
    />
  );
}
