// src/app/(app)/dashboard/page.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Phone, ActivitySquare, Package, Calendar, Clock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION, TEAM_USERS_SUBCOLLECTION, CONTACTS_SUBCOLLECTION, ACTIVITIES_SUBCOLLECTION, SUBSCRIPTIONS_SUBCOLLECTION } from '@/lib/constants';
import { useFirestoreCollection } from '@/hooks/useFirestoreQuery';
import type { Activity, Client } from '@/types/crm';
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

export default function DashboardPage() {
  const { teamId } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    contacts: 0,
    activities: 0,
    subscriptions: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isActivityDialogOpen, setIsActivityDialogOpen] = useState(false);

  // Fetch clients for mapping activity IDs to names
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
    [orderBy('date', 'desc'), limit(5)], // Order by date descending, limit to 5
    { enabled: !!teamId }
  );

  useEffect(() => {
    async function fetchStats() {
      if (!teamId) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
        const usersCount = await getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}`));
        const clientsCount = await getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${CLIENTS_SUBCOLLECTION}`));
        const contactsCount = await getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${CONTACTS_SUBCOLLECTION}`));
        const activitiesCount = await getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${ACTIVITIES_SUBCOLLECTION}`));
        const subscriptionsCount = await getCountFromServer(collection(db, `${TEAMS_COLLECTION}/${teamId}/${SUBSCRIPTIONS_SUBCOLLECTION}`));

        setStats({
          users: usersCount.data().count,
          clients: clientsCount.data().count,
          contacts: contactsCount.data().count,
          activities: activitiesCount.data().count,
          subscriptions: subscriptionsCount.data().count,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [teamId]);

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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.users}</div>
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
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.contacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.activities}</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? <Skeleton className="h-8 w-12" /> : stats.subscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="mt-8">
        <Card>
          <CardHeader className="flex justify-between items-center">
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
              </div>
            ) : activitiesError ? (
               <div className="text-destructive flex items-center gap-2">
                 <AlertCircle className="h-5 w-5" />
                 <span>Error loading activities: {activitiesError.message}</span>
               </div>
            ) : recentActivities && recentActivities.length > 0 ? (
              <ul className="space-y-3">
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
                          <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              <span>Due: {format(activity.dueDate.toDate(), 'PP')}</span>
                          </div>
                       )}
                       <div className="flex items-center gap-1">
                           <Calendar className="h-4 w-4" />
                           <span>{format(activity.date.toDate(), 'PP')}</span>
                       </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activities logged yet.</p>
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
                    {/* Change the parent <p> to <div> to fix nesting issue */}
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
    </div>
  );
}
