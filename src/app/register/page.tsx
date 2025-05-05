// src/app/register/page.tsx
"use client";

import { useState, useEffect } from 'react'; // Import useEffect
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';

import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

// Define the form schema
const registerFormSchema = z.object({
  firstName: z.string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: z.string().min(2, { message: 'Last name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  teamName: z.string().min(2, { message: 'Team name must be at least 2 characters.' }),
});

type RegisterFormValues = z.infer<typeof registerFormSchema>;

export default function RegisterPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, loading } = useAuth(); // Get user and loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

   // Redirect if user is already logged in
   useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Initialize form
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      teamName: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      // Create team document
      const teamRef = doc(collection(db, TEAMS_COLLECTION));
      await setDoc(teamRef, {
        name: data.teamName,
        adminUserId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        planType: 'free', // Default to free plan
        clientCount: 0,
      });
      
      // Add user to team
      const userRef = doc(db, `${TEAMS_COLLECTION}/${teamRef.id}/${TEAM_USERS_SUBCOLLECTION}/${user.uid}`);
      await setDoc(userRef, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: 'admin', // First user is admin
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
      
      // Store team ID in user profile or localStorage for future reference
      localStorage.setItem('currentTeamId', teamRef.id);
      
      toast({
        title: "Registration successful",
        description: "Your account has been created. Redirecting to dashboard...",
      });
      
      // Redirect handled by useEffect now
      // setTimeout(() => {
      //   router.push('/dashboard');
      // }, 1000);
      
    } catch (error: any) {
      let errorMessage = "There was an error creating your account.";
      if (error.code === 'auth/email-already-in-use') {
          errorMessage = "This email address is already in use. Please log in or use a different email.";
      }
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

   // Don't render the form if loading or user is already logged in
   if (loading || (!loading && user)) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <p>Loading...</p> 
        </div>
    );
   }

  return (
    // Use flex flex-col items-center justify-center for centering
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex justify-start mb-6">
          <Link href="/" className="text-primary hover:text-primary/80 flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to home</span>
          </Link>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-semibold text-lg text-primary mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
              <span>ECRM</span>
            </div>
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Get started with your free ECRM account</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john.doe@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                       <FormDescription>
                          Must be at least 8 characters long.
                       </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="teamName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team/Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Acme Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex justify-center border-t p-4">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
