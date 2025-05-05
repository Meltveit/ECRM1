// src/components/auth-token-refresher.tsx
"use client";

import { useEffect } from 'react';
import { auth } from '@/lib/firebase';

export default function AuthTokenRefresher() {
  useEffect(() => {
    const refreshToken = async () => {
      try {
        // Force a token refresh
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true);
          console.log("Auth token refreshed successfully");
        }
      } catch (error) {
        console.error("Error refreshing token:", error);
      }
    };

    refreshToken();
  }, []);

  // This component doesn't render anything
  return null;
}