'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, Target, Phone, Settings, ActivitySquare, Package } from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/users', label: 'Team Users', icon: Users },
  { href: '/clients', label: 'Clients', icon: Briefcase },
  { href: '/contacts', label: 'Contacts', icon: Phone },
  { href: '/activities', label: 'Activities', icon: ActivitySquare },
  { href: '/subscriptions', label: 'Subscriptions', icon: Package },
  // Add more items as needed
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
           <Link href="/" className="flex items-center gap-2 font-semibold text-lg text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
            <span>ECRM</span>
           </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        {/* SidebarFooter can be added here if needed */}
      </Sidebar>

      <SidebarInset className="flex flex-col">
         <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 pt-2 pb-2">
          {/* Header content, e.g., User menu, search bar */}
          <div> {/* Placeholder for left content */}
            <SidebarTrigger className="md:hidden" />
          </div>
          <div className="flex items-center gap-4">
            {/* Example User Menu */}
            {/* <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
              <Users className="h-5 w-5" />
            </Button> */}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </div>
  );
}
