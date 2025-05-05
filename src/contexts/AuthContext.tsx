// src/contexts/AuthContext.fixed.tsx

"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, updateDoc, serverTimestamp, getCountFromServer, limit } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';

import { auth, db } from '@/lib/firebase';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { TeamUser, Team } from '@/types/crm';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  teamId: string | null;
  team: Team | null;
  teamUser: TeamUser | null;
  memberCount: number;
  signOut: () => Promise<void>;
  refreshAuthToken: () => Promise<void>;
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
  const [team, setTeam] = useState<Team | null>(null);
  const [teamUser, setTeamUser] = useState<TeamUser | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshAuthToken = async () => {
    if (user) {
      try {
        await user.getIdToken(true);
        console.log("Auth token refreshed manually");
      } catch (error) {
        console.error("Failed to refresh auth token:", error);
      }
    }
  };

  // Handle auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user?.email || "No user");
      setUser(user);

      if (user) {
        setLoading(true); // Set loading true while fetching team data
        try {
          // Force token refresh immediately when auth state changes
          await user.getIdToken(true);
          console.log("Auth token refreshed on state change");
          
          // Try to get teamId from localStorage first
          let currentTeamId = localStorage.getItem('currentTeamId');
          console.log("Team ID from storage:", currentTeamId);

          // If not found in localStorage, try direct check instead of querying all teams
          if (!currentTeamId) {
            // Check for teams directly using the new method
            const userTeamIds = await findUserTeamsImproved(user.uid);
            if (userTeamIds.length > 0) {
              currentTeamId = userTeamIds[0];
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
              setMemberCount(0);
            }
          } else {
            // No team ID found or determined
            setTeam(null);
            setTeamUser(null);
            setMemberCount(0);
          }
        } catch (error) {
          console.error("Error loading user team data:", error);
          setTeamId(null);
          setTeam(null);
          setTeamUser(null);
          setMemberCount(0);
          localStorage.removeItem('currentTeamId');
        } finally {
          setLoading(false);
        }
      } else {
        // Clear team data when user logs out
        setTeamId(null);
        setTeam(null);
        setTeamUser(null);
        setMemberCount(0);
        localStorage.removeItem('currentTeamId');

        // Redirect to login if on a protected page
        const publicPages = ['/', '/login', '/register', '/forgot-password'];
        const isPublicPage = publicPages.some(page => pathname === page || (page !== '/' && pathname.startsWith(page + '/')));

        if (!isPublicPage) {
          console.log("Redirecting to login from protected page:", pathname);
          router.push('/login');
        }

        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router, pathname]);

  // Improved method with the fixed field name (adminUserId instead of adminId)
  const findUserTeamsImproved = async (userId: string): Promise<string[]> => {
    const teamIds: string[] = [];
    
    try {
      // Instead of querying all teams, try to get the team ID from any available data
      
      // First, try to get team ID from local storage - we already did this above but just being thorough
      const storedTeamId = localStorage.getItem('currentTeamId');
      
      if (storedTeamId) {
        // Verify this team membership directly
        const userDocRef = doc(db, `${TEAMS_COLLECTION}/${storedTeamId}/${TEAM_USERS_SUBCOLLECTION}/${userId}`);
        const userSnapshot = await getDoc(userDocRef);
        
        if (userSnapshot.exists()) {
          console.log(`User is still a member of team ${storedTeamId}`);
          teamIds.push(storedTeamId);
          return teamIds; // Return early if we found a match
        }
      }
      
      // If no team ID in storage or user is no longer a member, try finding teams
      // where the user is the admin (safer query)
      try {
        // FIXED: Changed 'adminId' to 'adminUserId' to match Firestore field name
        const adminTeamsQuery = query(
          collection(db, TEAMS_COLLECTION),
          where('adminUserId', '==', userId)
        );
        
        const adminTeamsSnapshot = await getDocs(adminTeamsQuery);
        if (!adminTeamsSnapshot.empty) {
          adminTeamsSnapshot.forEach(doc => {
            teamIds.push(doc.id);
          });
          console.log(`User is admin of teams: ${teamIds.join(', ')}`);
          return teamIds;
        }
      } catch (error) {
        console.error("Error querying admin teams:", error);
        // Continue to the next approach
      }
      
      // If we still haven't found any teams, the old method is our last resort
      // but we will add better error handling and limit the query
      if (teamIds.length === 0) {
        console.log("Trying fallback method to find teams");
        return await findUserTeams(userId);
      }
      
      return teamIds;
    } catch (error) {
      console.error("Error finding user teams (improved method):", error);
      return [];
    }
  };

  // Original method as fallback, with improvements
  const findUserTeams = async (userId: string): Promise<string[]> => {
    const teamIds: string[] = [];

    try {
      // Limit query to first 10 teams to reduce overhead
      const teamsQuery = query(
        collection(db, TEAMS_COLLECTION),
        limit(10)
      );
      
      const teamsSnapshot = await getDocs(teamsQuery);

      if (teamsSnapshot.empty) {
        console.log("No teams found in collection");
        return teamIds;
      }

      // Use Promise.all for parallel checks
      const checkResults = await Promise.all(teamsSnapshot.docs.map(async (teamDoc) => {
        try {
          const userDocRef = doc(db, `${TEAMS_COLLECTION}/${teamDoc.id}/${TEAM_USERS_SUBCOLLECTION}/${userId}`);
          const userSnapshot = await getDoc(userDocRef);
          if (userSnapshot.exists()) {
            return teamDoc.id;
          }
          return null;
        } catch (error) {
          console.error(`Error checking team ${teamDoc.id} membership:`, error);
          return null;
        }
      }));

      // Filter out nulls and add valid team IDs
      checkResults.filter(id => id !== null).forEach(id => {
        if (id) teamIds.push(id);
      });

      console.log(`Found teams for user ${userId}:`, teamIds);
    } catch (error) {
      console.error("Error finding user teams:", error);
    }

    return teamIds;
  };

  // Sign out function
  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      teamId, 
      team, 
      teamUser, 
      memberCount, 
      signOut,
      refreshAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};