// src/components/main-layout.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Users, 
  Briefcase, 
  Phone, 
  ActivitySquare, 
  Package,
  LogOut,
  Settings,
  User as UserIcon, // Renamed to avoid conflict with User type
  GitBranch,
  PanelLeft, // Import PanelLeft for the trigger
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarInset, // Use SidebarInset for main content area
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger, // Use SidebarTrigger
  SidebarFooter,
  SidebarSeparator,
  useSidebar, // Import useSidebar hook
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/users', label: 'Team Users', icon: Users },
  { href: '/clients', label: 'Clients', icon: Briefcase },
  { href: '/clients/pipeline', label: 'Sales Pipeline', icon: GitBranch },
  { href: '/contacts', label: 'Contacts', icon: Phone },
  { href: '/activities', label: 'Activities', icon: ActivitySquare },
  { href: '/subscriptions', label: 'Subscriptions', icon: Package },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, teamUser, signOut } = useAuth();
  const { isMobile } = useSidebar(); // Get isMobile state

  // Get user initials for avatar
  const getInitials = () => {
    if (teamUser?.firstName && teamUser?.lastName) {
      return `${teamUser.firstName[0]}${teamUser.lastName[0]}`.toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    // The outer div provided by SidebarProvider is handled in (app)/layout.tsx
    <>
      <Sidebar collapsible={isMobile ? "offcanvas" : "icon"}> {/* Use SidebarProvider settings */}
        <SidebarHeader className="p-4">
           <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
            </svg>
            {/* Text only shown when expanded */}
            <span className="group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200">ECRM</span>
           </Link>
        </SidebarHeader>
        <SidebarContent className="flex-1 p-2">
          <SidebarMenu>
            {/* Main menu items */}
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    isActive={pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')}
                    tooltip={item.label}
                  >
                    <item.icon />
                    {/* Label only shown when expanded */}
                     <span className="group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200">{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
            
            <SidebarSeparator className="my-2" />
            
            {/* Profile link */}
            <SidebarMenuItem>
              <Link href="/profile" passHref legacyBehavior>
                <SidebarMenuButton
                  isActive={pathname === '/profile'}
                  tooltip="Profile"
                >
                  <UserIcon />
                  <span className="group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200">Profile</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-2">
          <SidebarMenuItem>
            <Link href="/settings" passHref legacyBehavior>
              <SidebarMenuButton
                isActive={pathname === '/settings'}
                tooltip="Settings"
              >
                <Settings />
                <span className="group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200">Settings</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          
          {/* Sign out button */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              tooltip="Sign Out"
              variant="outline"
            >
              <LogOut />
              <span className="group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>

      {/* SidebarInset manages the main content area, adjusting its margin based on sidebar state */}
      <SidebarInset className="flex flex-col">
         <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 pt-2 pb-2">
           {/* Hamburger menu trigger - shown on mobile and when sidebar is collapsed */}
           <SidebarTrigger className="md:hidden" />
           {/* Placeholder div to push user menu to the right */}
           <div className="flex-grow"></div>
           {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuItem disabled>{user?.email}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* Ensure children take full width within the main area */}
          <div className="w-full">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
