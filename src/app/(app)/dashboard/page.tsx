// src/app/(app)/dashboard/page.tsx
'use client';

// Removed ProtectedRoute as it's handled by the layout
// Removed MainLayout as it's handled by the layout
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Phone, ActivitySquare, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { collection, getCountFromServer, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TEAMS_COLLECTION, CLIENTS_SUBCOLLECTION, TEAM_USERS_SUBCOLLECTION, CONTACTS_SUBCOLLECTION, ACTIVITIES_SUBCOLLECTION, SUBSCRIPTIONS_SUBCOLLECTION } from '@/lib/constants';

export default function DashboardPage() {
  const { teamId } = useAuth();
  const [stats, setStats] = useState({
    users: 0,
    clients: 0,
    contacts: 0,
    activities: 0,
    subscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!teamId) {
          setLoading(false); // Stop loading if no teamId
          return;
      }
      
      setLoading(true); // Start loading when teamId is available
      try {
        // Fetch counts for each collection
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
        setLoading(false);
      }
    }
    
    fetchStats();
  }, [teamId]);

  return (
    // ProtectedRoute and MainLayout are now handled by src/app/(app)/layout.tsx
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.users}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contacts</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.contacts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
            <ActivitySquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.activities}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : stats.subscriptions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading recent activities...</p>
            ) : stats.activities > 0 ? (
              <p className="text-muted-foreground">Recent activities will be displayed here.</p>
            ) : (
              <p className="text-muted-foreground">No activities logged yet. Start by adding a client and logging activities.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
