// src/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { TeamUser } from '@/types/crm';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teamId: string | null;
  teamUser: TeamUser | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");
      setUser(user);
      
      if (user) {
        try {
          // Try to get teamId from localStorage first
          let currentTeamId = localStorage.getItem('currentTeamId');
          console.log("Team ID from storage:", currentTeamId);
          
          // If not found in localStorage, find teams the user is a member of
          if (!currentTeamId) {
            const userTeams = await findUserTeams(user.uid);
            if (userTeams.length > 0) {
              currentTeamId = userTeams[0];
              localStorage.setItem('currentTeamId', currentTeamId);
              console.log("Found team ID:", currentTeamId);
            }
          }
          
          setTeamId(currentTeamId);
          
          // Get user details from the team
          if (currentTeamId) {
            const userDocRef = doc(db, `${TEAMS_COLLECTION}/${currentTeamId}/${TEAM_USERS_SUBCOLLECTION}/${user.uid}`);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
              // Update last login timestamp
              await updateDoc(userDocRef, {
                lastLogin: serverTimestamp()
              });
              
              setTeamUser({ id: userDoc.id, ...userDoc.data() } as TeamUser);
              
              // Redirect to dashboard if on login or register page
              const authPages = ['/login', '/register'];
              if (authPages.includes(pathname)) {
                console.log("Redirecting to dashboard from auth page");
                router.push('/dashboard');
              }
            }
          }
        } catch (error) {
          console.error("Error loading user team data:", error);
        }
      } else {
        // Clear team data when user logs out
        setTeamId(null);
        setTeamUser(null);
        localStorage.removeItem('currentTeamId');
        
        // Redirect to login if on a protected page
        const publicPages = ['/', '/login', '/register', '/forgot-password'];
        if (!publicPages.some(page => pathname === page || pathname.startsWith(page + '/'))) {
          router.push('/login');
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // Find teams the user is a member of
  const findUserTeams = async (userId: string): Promise<string[]> => {
    const teamIds: string[] = [];
    
    try {
      // Query all teams with subcollection containing the user
      const teamsRef = collection(db, TEAMS_COLLECTION);
      const teamsSnapshot = await getDocs(teamsRef);
      
      for (const teamDoc of teamsSnapshot.docs) {
        const userRef = doc(db, `${TEAMS_COLLECTION}/${teamDoc.id}/${TEAM_USERS_SUBCOLLECTION}/${userId}`);
        const userSnapshot = await getDoc(userRef);
        
        if (userSnapshot.exists()) {
          teamIds.push(teamDoc.id);
        }
      }
    } catch (error) {
      console.error("Error finding user teams:", error);
    }
    
    return teamIds;
  };

  // Sign out function
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, teamId, teamUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};