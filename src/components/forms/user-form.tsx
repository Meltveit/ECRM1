"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TeamUser } from '@/types/crm';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { collection, doc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';

interface UserFormProps {
  data?: TeamUser | null;
  onSave: () => void;
  onCancel: () => void;
}

export function UserForm({ data, onSave, onCancel }: UserFormProps) {
  const { toast } = useToast();
  const { teamId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState(data?.firstName || '');
  const [lastName, setLastName] = useState(data?.lastName || '');
  const [email, setEmail] = useState(data?.email || '');
  const [password, setPassword] = useState(''); // New password field
  const [role, setRole] = useState<"admin" | "member">(data?.role as "admin" | "member" || 'member');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teamId) {
      toast({
        title: "Error",
        description: "No team selected",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);

    try {
      if (data) {
        // Update existing user
        if (data.id) {
          const userRef = doc(db, `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}/${data.id}`);
          await updateDoc(userRef, {
            firstName,
            lastName,
            role,
            updatedAt: serverTimestamp()
          });
          
          toast({
            title: "User Updated",
            description: `${firstName} ${lastName}'s information has been updated`,
          });
        }
      } else {
        // Create new user in Firebase Auth
        // Note: This requires special security rules to allow admin users to create other users
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        
        // Add user to the team
        const userRef = doc(db, `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}/${userId}`);
        await setDoc(userRef, {
          firstName,
          lastName,
          email,
          role,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        toast({
          title: "User Created",
          description: `${firstName} ${lastName} has been added to your team`,
        });
      }
      
      onSave();
    } catch (error: any) {
      console.error("Error saving user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save user",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="user-form">
      <div>
        <Label htmlFor="firstName">First Name *</Label>
        <Input 
          id="firstName" 
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="John" 
          required 
          disabled={isLoading} 
        />
      </div>
      <div>
        <Label htmlFor="lastName">Last Name *</Label>
        <Input 
          id="lastName" 
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Doe" 
          required 
          disabled={isLoading} 
        />
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input 
          id="email" 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john.doe@example.com" 
          required 
          disabled={isLoading || !!data} // Disable email editing for existing users
        />
      </div>
      
      {/* Only show password field for new users */}
      {!data && (
        <div>
          <Label htmlFor="password">Password *</Label>
          <Input 
            id="password" 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••" 
            required 
            disabled={isLoading} 
            minLength={8}
          />
        </div>
      )}
      
      <div>
        <Label htmlFor="role">Role *</Label>
        <Select 
          value={role} 
          onValueChange={(value) => setRole(value as "admin" | "member")} 
          disabled={isLoading}
        >
          <SelectTrigger id="role">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="member">Member</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : (data ? 'Save Changes' : 'Add User')}
        </Button>
      </div>
    </form>
  );
}