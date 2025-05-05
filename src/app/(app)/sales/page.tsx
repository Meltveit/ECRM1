// src/app/(app)/sales/page.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DollarSign, Users, Target, Calendar, TrendingUp } from 'lucide-react';
import { SalesChart } from '@/components/sales-chart'; // Assuming this component exists or will be created
import { ClosedDealsTable } from '@/components/closed-deals-table'; // Assuming this component exists or will be created
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import { Client } from '@/types/crm';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function SalesPage() {
  const { teamId } = useAuth();

  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const collectionPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';

  // Fetch all clients to calculate metrics
  const { data: clients, isLoading, error } = useFirestoreCollection<Client>(
    collectionPath,
    clientsQueryKey || [],
    [], // No specific constraints here, filter locally
    { enabled: !!teamId }
  );

  // Calculate Sales Metrics
  const salesMetrics = React.useMemo(() => {
    if (!clients) return { totalWonValue: 0, dealsWon: 0, dealsLost: 0, averageDealValue: 0, winRate: 0 };

    const closedWon = clients.filter(c => c.pipelineStage === 'closed-won');
    const closedLost = clients.filter(c => c.pipelineStage === 'closed-lost');

    const totalWonValue = closedWon.reduce((sum, client) => sum + (client.value || 0), 0);
    const dealsWon = closedWon.length;
    const dealsLost = closedLost.length;
    const totalClosedDeals = dealsWon + dealsLost;
    const averageDealValue = dealsWon > 0 ? totalWonValue / dealsWon : 0;
    const winRate = totalClosedDeals > 0 ? (dealsWon / totalClosedDeals) * 100 : 0;

    return { totalWonValue, dealsWon, dealsLost, averageDealValue, winRate };
  }, [clients]);

  // Prepare data for the sales chart (monthly aggregation)
  const monthlySalesData = React.useMemo(() => {
    if (!clients) return [];

    const wonDeals = clients.filter(c => c.pipelineStage === 'closed-won' && c.closedAt);
    const salesByMonth: { [key: string]: number } = {};

    wonDeals.forEach(deal => {
      if (deal.closedAt) {
          // Ensure closedAt is a valid Timestamp or Date
          let closedDate: Date | null = null;
          if (deal.closedAt instanceof Date) {
              closedDate = deal.closedAt;
          } else if (deal.closedAt && typeof deal.closedAt.toDate === 'function') {
              // Assuming it's a Firestore Timestamp
              closedDate = deal.closedAt.toDate();
          }

          if (closedDate) {
            const monthKey = format(closedDate, 'yyyy-MM'); // Format as YYYY-MM
            salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (deal.value || 0);
          }
      }
    });

    // Convert to array format suitable for charts, sorted by month
    return Object.entries(salesByMonth)
      .map(([month, totalValue]) => ({ month, totalValue }))
      .sort((a, b) => a.month.localeCompare(b.month));

  }, [clients]);


  if (error) {
    return <div className="container mx-auto py-6">Error loading sales data: {error.message}</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold">Sales Performance</h1>

      {/* Sales Metrics Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Won Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">€{salesMetrics.totalWonValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-12" /> : (
                 <div className="text-2xl font-bold">{salesMetrics.dealsWon}</div>
             )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-16" /> : (
                <div className="text-2xl font-bold">{salesMetrics.winRate.toFixed(1)}%</div>
             )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Deal Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-20" /> : (
                 <div className="text-2xl font-bold">€{salesMetrics.averageDealValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
             )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Lost</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {isLoading ? <Skeleton className="h-8 w-12" /> : (
                 <div className="text-2xl font-bold">{salesMetrics.dealsLost}</div>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Over Time</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          {isLoading ? (
             <Skeleton className="h-[350px] w-full" />
          ) : monthlySalesData.length > 0 ? (
             <SalesChart data={monthlySalesData} />
          ) : (
             <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                No sales data available to display chart.
             </div>
          )}
        </CardContent>
      </Card>

      {/* Closed Deals Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recently Closed Deals (Won)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
           ) : (
             <ClosedDealsTable clients={clients?.filter(c => c.pipelineStage === 'closed-won') || []} />
           )}
        </CardContent>
      </Card>

       {/* Optional: Add Sales Goals Section Here */}
      {/*
      <Card>
        <CardHeader>
          <CardTitle>Sales Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sales goal tracking coming soon!</p>
          // Add components for setting and tracking goals
        </CardContent>
      </Card>
      */}
    </div>
  );
}
