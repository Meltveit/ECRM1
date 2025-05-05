// src/app/(app)/layout.tsx
import MainLayout from '@/components/main-layout';
import ProtectedRoute from '@/components/protected-route';
import { SidebarProvider } from '@/components/ui/sidebar';
import AuthTokenRefresher from '@/components/auth-token-refresher';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AuthTokenRefresher /> {/* Add this line */}
      <SidebarProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}