// src/contexts/AuthContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, getCountFromServer } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { TeamUser, Team } from '@/types/crm';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teamId: string | null;
  team: Team | null; // Add full team data
  teamUser: TeamUser | null;
  memberCount: number; // Add member count
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
  const [team, setTeam] = useState<Team | null>(null); // State for full team data
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0); // State for member count
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");
      setUser(user);

      if (user) {
        setLoading(true); // Set loading true while fetching team data
        try {
          // Try to get teamId from localStorage first
          let currentTeamId = localStorage.getItem('currentTeamId');
          console.log("Team ID from storage:", currentTeamId);

          // If not found in localStorage, find teams the user is a member of
          if (!currentTeamId) {
            const userTeams = await findUserTeams(user.uid);
            if (userTeams.length > 0) {
              currentTeamId = userTeams[0]; // Assume user is part of one team for now
              localStorage.setItem('currentTeamId', currentTeamId);
              console.log("Found and set team ID:", currentTeamId);
            }
          }

          setTeamId(currentTeamId);

          // Get team details and user details from the team
          if (currentTeamId) {
            // Fetch Team Data
            const teamDocRef = doc(db, TEAMS_COLLECTION, currentTeamId);
            const teamDoc = await getDoc(teamDocRef);
            if (teamDoc.exists()) {
              setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team);
            } else {
                console.warn("Team document not found for ID:", currentTeamId);
                setTeam(null);
            }


            // Fetch Team User Data
            const userDocRef = doc(db, `${TEAMS_COLLECTION}/${currentTeamId}/${TEAM_USERS_SUBCOLLECTION}/${user.uid}`);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              // Update last login timestamp
              await updateDoc(userDocRef, {
                lastLogin: serverTimestamp()
              });

              setTeamUser({ id: userDoc.id, ...userDoc.data() } as TeamUser);

               // Fetch Member Count
                const membersCollectionRef = collection(db, `${TEAMS_COLLECTION}/${currentTeamId}/${TEAM_USERS_SUBCOLLECTION}`);
                const countSnapshot = await getCountFromServer(membersCollectionRef);
                setMemberCount(countSnapshot.data().count);

              // Redirect to dashboard if on login or register page
              const authPages = ['/login', '/register'];
              if (authPages.includes(pathname)) {
                console.log("Redirecting to dashboard from auth page");
                router.push('/dashboard');
              }
            } else {
                 console.warn("Team user document not found for user:", user.uid, "in team:", currentTeamId);
                 setTeamUser(null);
                 setMemberCount(0); // Reset member count if user doc not found in team
            }
          } else {
            // No team ID found or determined
            setTeam(null);
            setTeamUser(null);
            setMemberCount(0);
          }
        } catch (error) {
          console.error("Error loading user team data:", error);
          setTeamId(null); // Clear potentially invalid ID
          setTeam(null);
          setTeamUser(null);
          setMemberCount(0);
          localStorage.removeItem('currentTeamId'); // Clear storage if error occurs
        } finally {
            setLoading(false); // Ensure loading is set to false after all fetches/updates
        }
      } else {
        // Clear team data when user logs out
        setTeamId(null);
        setTeam(null);
        setTeamUser(null);
        setMemberCount(0);
        localStorage.removeItem('currentTeamId');

        // Redirect to login if on a protected page
        const publicPages = ['/', '/login', '/register', '/forgot-password']; // Add other public pages as needed
         // Check if the current pathname starts with any of the public page paths
        const isPublicPage = publicPages.some(page => pathname === page || (page !== '/' && pathname.startsWith(page + '/')));

        if (!isPublicPage) {
           console.log("Redirecting to login from protected page:", pathname);
           router.push('/login');
        }

        setLoading(false);
      }

    });

    return () => unsubscribe();
  }, [router, pathname]); // Removed user from dependency array to avoid loop on user state change


  // Find teams the user is a member of
  const findUserTeams = async (userId: string): Promise<string[]> => {
    const teamIds: string[] = [];

    try {
      // Query all teams where the user is a member in the subcollection
      const teamsQuery = query(
        collection(db, TEAMS_COLLECTION)
        // Firestore doesn't support querying across subcollections directly like this.
        // We need to iterate through teams or know the team ID beforehand.
        // For simplicity, we'll fetch all teams and check the subcollection.
        // This is inefficient for many teams. A better approach is needed for scale.
      );
      const teamsSnapshot = await getDocs(teamsQuery);

      // Use Promise.all for parallel checks (slightly more efficient)
      await Promise.all(teamsSnapshot.docs.map(async (teamDoc) => {
         const userDocRef = doc(db, `${TEAMS_COLLECTION}/${teamDoc.id}/${TEAM_USERS_SUBCOLLECTION}/${userId}`);
         const userSnapshot = await getDoc(userDocRef);
         if (userSnapshot.exists()) {
           teamIds.push(teamDoc.id);
         }
       }));

      console.log(`Found teams for user ${userId}:`, teamIds);

    } catch (error) {
      console.error("Error finding user teams:", error);
    }

    return teamIds;
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true); // Indicate loading during sign out
    try {
      await firebaseSignOut(auth);
      // State updates (user, teamId, etc.) will be handled by onAuthStateChanged
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false); // Ensure loading is false on error
    }
    // setLoading(false) will be called by the onAuthStateChanged listener when user becomes null
  };

  return (
    <AuthContext.Provider value={{ user, loading, teamId, team, teamUser, memberCount, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
```