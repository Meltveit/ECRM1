// src/app/(app)/layout.tsx
import MainLayout from '@/components/main-layout';
import ProtectedRoute from '@/components/protected-route';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
       {/* SidebarProvider wraps the layout for authenticated routes */}
      <SidebarProvider>
        {/* MainLayout provides the consistent structure with sidebar and content area */}
        <MainLayout>
            {children}
        </MainLayout>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
