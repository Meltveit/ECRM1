import MainLayout from '@/components/main-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Briefcase, Phone, ActivitySquare, Package } from 'lucide-react';

// Mock data function (replace with actual data fetching)
const getDashboardStats = async () => {
  // Simulate fetching data
  await new Promise(resolve => setTimeout(resolve, 50));
  return {
    users: 5,
    clients: 25,
    contacts: 50,
    activities: 120,
    subscriptions: 15,
  };
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              {/* <p className="text-xs text-muted-foreground">+2 since last month</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.clients}</div>
              {/* <p className="text-xs text-muted-foreground">+5 this week</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contacts</CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contacts}</div>
               {/* <p className="text-xs text-muted-foreground">View all</p> */}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activities Logged</CardTitle>
              <ActivitySquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activities}</div>
              {/* <p className="text-xs text-muted-foreground">+30 this month</p> */}
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subscriptions}</div>
              {/* <p className="text-xs text-muted-foreground">2 ending soon</p> */}
            </CardContent>
          </Card>
        </div>

        {/* Add more dashboard components here, e.g., recent activity feed, charts */}
        <div className="mt-8">
          <Card>
             <CardHeader>
                <CardTitle>Recent Activity (Placeholder)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Activity feed will be displayed here.</p>
               {/* Placeholder for a list or table of recent activities */}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
