// src/app/(app)/dashboard/page.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Phone, ActivitySquare, Package, Calendar, Clock, User as UserIcon, AlertCircle, DollarSign, TrendingUp } from 'lucide-react'; // Added sales icons
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState, useMemo } from 'react'; // Import useMemo
import { collection, getCountFromServer, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION, TEAM_USERS_SUBCOLLECTION, CONTACTS_SUBCOLLECTION, ACTIVITIES_SUBCOLLECTION, SUBSCRIPTIONS_SUBCOLLECTION } from '@/lib/constants';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import type { Activity, Client, MonthlySalesData } from '@/types/crm'; // Import MonthlySalesData
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { SalesChart } from '@/components/sales-chart'; // Import SalesChart
import DebugFirebaseAuth from '@/components/debug-firebase-auth'; // Import the debug component

export default function DashboardPage() {
  const { teamId } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    contacts: 0,
    activities: 0,
    subscriptions: 0, // Keep this if relevant, otherwise remove
    totalWonValue: 0, // Add sales stat
    dealsWon: 0,     // Add sales stat
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  // Fetch clients for stats and recent activity mapping
  const clientsQueryKey = teamId ? ['teams', teamId, CLIENTS_SUBCOLLECTION] : null;
  const clientsPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}` : '';
  const { data: clients, isLoading: isLoadingClients } = useFirestoreCollection<Client>(
    clientsPath,
    clientsQueryKey || [],
    [],
    { enabled: !!teamId }
  );

  // Fetch recent activities
  const recentActivitiesQueryKey = teamId ? ['teams', teamId, ACTIVITIES_SUBCOLLECTION, 'recent'] : null;
  const activitiesPath = teamId ? `${TEAMS_COLLECTION}/${teamId}/${ACTIVITIES_SUBCOLLECTION}` : '';
  const { data: recentActivities, isLoading: isLoadingActivities, error: activitiesError } = useFirestoreCollection<Activity>(
    activitiesPath,
    recentActivitiesQueryKey || [],
    [orderBy('date', 'desc'), limit(5)],
    { enabled: !!teamId }
  );

  // Calculate Sales Metrics when clients data is available
   useEffect(() => {
    if (clients) {
      const wonDeals = clients.filter(c => c.pipelineStage === 'closed-won');
      const totalWonValue = wonDeals.reduce((sum, client) => sum + (client.value || 0), 0);
      const dealsWon = wonDeals.length;
       setStats(prev => ({ ...prev, totalWonValue, dealsWon }));
    }
  }, [clients]);

   // Fetch Counts
  useEffect(() => {
    async function fetchCounts() {
      if (!teamId) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
         // Fetch counts in parallel
          const [usersCountSnap, clientsCountSnap, contactsCountSnap, activitiesCountSnap] = await Promise.all([
              getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}`)),
              getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}`)),
              getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${CONTACTS_SUBCOLLECTION}`)),
              getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${ACTIVITIES_SUBCOLLECTION}`)),
              // getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${SUBSCRIPTIONS_SUBCOLLECTION}`)) // Optional: keep if needed
          ]);

        setStats(prev => ({
            ...prev, // Keep existing sales stats
            users: usersCountSnap.data().count,
            clients: clientsCountSnap.data().count,
            contacts: contactsCountSnap.data().count,
            activities: activitiesCountSnap.data().count,
            // subscriptions: subscriptionsCountSnap.data().count, // Optional
        }));
      } catch (error) {
        console.error("Error fetching stats:", error);
         // Set counts to 0 or handle error state appropriately
         setStats(prev => ({
            ...prev,
            users: 0,
            clients: 0,
            contacts: 0,
            activities: 0,
            subscriptions: 0,
         }));
      } finally {
        setLoadingStats(false);
      }
    }
    fetchCounts();
  }, [teamId]);

  // Prepare monthly sales data for the chart
  const monthlySalesData = useMemo(() => {
      if (!clients) return [];
      const wonDeals = clients.filter(c => c.pipelineStage === 'closed-won' && c.closedAt);
      const salesByMonth: { [key: string]: number } = {};

      wonDeals.forEach(deal => {
           if (deal.closedAt) {
             let closedDate: Date | null = null;
             if (deal.closedAt instanceof Date) {
                 closedDate = deal.closedAt;
             } else if (deal.closedAt && typeof deal.closedAt.toDate === 'function') {
                 closedDate = deal.closedAt.toDate();
             }
             if (closedDate) {
               const monthKey = format(closedDate, 'yyyy-MM');
               salesByMonth[monthKey] = (salesByMonth[monthKey] || 0) + (deal.value || 0);
             }
           }
      });

      return Object.entries(salesByMonth)
          .map(([month, totalValue]) => ({ month, totalValue }))
          .sort((a, b) => a.month.localeCompare(b.month));
  }, [clients]);


  const handleActivityClick = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsActivityDialogOpen(true);
  };

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || 'Unknown Client';
  };

  const isLoading = loadingStats || isLoadingClients || isLoadingActivities;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"> {/* Adjusted grid columns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Won Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : `€${stats.totalWonValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-12" /> : stats.dealsWon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.activities}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.users}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Chart and Recent Activity Feed */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
         {/* Sales Chart Section */}
         <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sales Overview</CardTitle>
               <Link href="/sales" className="text-sm text-primary hover:underline">
                 View Full Report
               </Link>
            </CardHeader>
            <CardContent className="pl-2">
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : monthlySalesData.length > 0 ? (
                <SalesChart data={monthlySalesData} />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No sales data yet. Close some deals!
                </div>
              )}
            </CardContent>
         </Card>

         {/* Recent Activity Feed Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Activity</CardTitle>
            <Link href="/activities" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingActivities ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : activitiesError ? (
               <div className="text-destructive flex items-center gap-2">
                 <AlertCircle className="h-5 w-5" />
                 <span>Error loading activities: {activitiesError.message}</span>
               </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <ul className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {recentActivities.map((activity) => (
                  <li
                    key={activity.id}
                    onClick={() => handleActivityClick(activity)}
                    className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 flex-1 min-w-0">
                       <Badge variant="outline" className="flex-shrink-0 w-fit sm:w-auto">{activity.type}</Badge>
                       <span className="font-medium truncate">{getClientName(activity.clientId)}</span>
                       <span className="text-sm text-muted-foreground truncate hidden sm:block">{activity.notes.substring(0, 40)}{activity.notes.length > 40 ? '...' : ''}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground flex-shrink-0 ml-4">
                       {activity.dueDate && (
                          <div className="flex items-center gap-1" title={`Due: ${format(activity.dueDate.toDate(), 'PP')}`}>
                              <Clock className="h-4 w-4" />
                              <span className="hidden sm:inline">Due: {format(activity.dueDate.toDate(), 'PP')}</span>
                          </div>
                       )}
                       <div className="flex items-center gap-1" title={`Logged: ${format(activity.date.toDate(), 'PP')}`}>
                           <Calendar className="h-4 w-4" />
                           <span className="hidden sm:inline">{format(activity.date.toDate(), 'PP')}</span>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4 h-[300px] flex items-center justify-center">No recent activities logged yet.</p>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Activity Details Dialog */}
      <Dialog open={isActivityDialogOpen} onOpenChange={setIsActivityDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
             {selectedActivity && (
                <DialogDescription>
                     Activity logged on {format(selectedActivity.date.toDate(), 'PPP \'at\' p')}
                </DialogDescription>
             )}
          </DialogHeader>
          {selectedActivity && (
            <div className="space-y-4 py-4">
                <div>
                    <span className="text-sm font-medium text-muted-foreground">Client:</span>
                    <p className="font-semibold">{getClientName(selectedActivity.clientId)}</p>
                </div>
                <div>
                    <span className="text-sm font-medium text-muted-foreground">Type:</span>
                    <div><Badge variant="outline">{selectedActivity.type}</Badge></div>
                </div>
                {selectedActivity.dueDate && (
                   <div>
                        <span className="text-sm font-medium text-muted-foreground">Due Date:</span>
                        <p className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {format(selectedActivity.dueDate.toDate(), 'PPPP')}
                         </p>
                   </div>
                )}
                 <div>
                    <span className="text-sm font-medium text-muted-foreground">Created By:</span>
                    <p className="flex items-center gap-1">
                        <UserIcon className="h-4 w-4" />
                        {selectedActivity.userName || 'Unknown User'}
                    </p>
                 </div>
                <div>
                    <span className="text-sm font-medium text-muted-foreground">Notes:</span>
                    <p className="whitespace-pre-wrap bg-secondary/50 p-3 rounded-md border mt-1">{selectedActivity.notes}</p>
                </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add the debug component in development mode */}
      {process.env.NODE_ENV !== 'production' && <DebugFirebaseAuth />}
    </div>
  );
}