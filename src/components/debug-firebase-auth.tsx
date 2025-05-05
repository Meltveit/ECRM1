// src/components/debug-firebase-auth.tsx
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function DebugFirebaseAuth() {
  const [showDebug, setShowDebug] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const { user, teamId, refreshAuthToken } = useAuth();

  const handleShowToken = async () => {
    if (!user) return;
    
    try {
      const token = await user.getIdToken();
      const tokenDetails = JSON.parse(atob(token.split('.')[1])); // Decode JWT
      setUserData({
        uid: user.uid,
        email: user.email,
        token: {
          exp: new Date(tokenDetails.exp * 1000).toLocaleString(),
          auth_time: new Date(tokenDetails.auth_time * 1000).toLocaleString(),
          iat: new Date(tokenDetails.iat * 1000).toLocaleString(),
        },
        teamId,
      });
      setShowDebug(true);
    } catch (error) {
      console.error("Error getting token:", error);
    }
  };

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showDebug ? (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleShowToken}
          className="opacity-70 hover:opacity-100"
        >
          Debug Auth
        </Button>
      ) : (
        <Card className="w-80">
          <CardHeader>
            <CardTitle className="text-sm">Firebase Auth Debug</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className="overflow-auto max-h-40">
              {JSON.stringify(userData, null, 2)}
            </pre>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button size="sm" variant="outline" onClick={() => setShowDebug(false)}>
              Close
            </Button>
            <Button size="sm" onClick={refreshAuthToken}>
              Refresh Token
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}