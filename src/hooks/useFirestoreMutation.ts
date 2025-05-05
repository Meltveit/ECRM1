"use client";

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  CollectionReference,
  DocumentReference,
  Timestamp,
  getCountFromServer
} from 'firebase/firestore';
import { useMutation, useQueryClient, MutateOptions, QueryKey } from '@tanstack/react-query';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db, functions as firebaseFunctions } from '@/lib/firebase';
import type { BaseDoc, Team } from '@/types/crm';
import { TEAMS_COLLECTION, TEAM_USERS_SUBCOLLECTION } from '@/lib/constants';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth to access team info
import { useToast } from './use-toast'; // Import useToast for notifications

type OptionalTimestamps<T> = Omit<T, 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};


// --- Add Document Mutation ---
interface AddMutationParams<T> {
  collectionPath: string;
  data: OptionalTimestamps<Omit<T, 'id'>>; // Exclude id, make timestamps optional
  invalidateQueryKeys?: QueryKey[];
}

export function useFirestoreAddMutation<T extends BaseDoc>() {
  const queryClient = useQueryClient();
  const { teamId } = useAuth(); // Get teamId for potential Stripe update check

  return useMutation<DocumentReference, Error, AddMutationParams<T>>({
    mutationFn: async ({ collectionPath, data }) => {
      const collRef = collection(db, collectionPath) as CollectionReference<OptionalTimestamps<Omit<T, 'id'>>>;
      // Add server timestamps
      const dataWithTimestamp = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      return await addDoc(collRef, dataWithTimestamp);
    },
    onSuccess: (docRef, variables) => {
      // Invalidate relevant queries after successful addition
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      // No direct Stripe update here, handled in UserForm after adding a user
    },
    onError: (error) => {
      console.error("Error adding document: ", error);
      // Handle error (e.g., show toast notification)
    },
  });
}


// --- Update Document Mutation ---
interface UpdateMutationParams<T> {
  collectionPath: string;
  docId: string;
  data: Partial<OptionalTimestamps<Omit<T, 'id'>>>; // Partial data, exclude id, make timestamps optional
  invalidateQueryKeys?: QueryKey[];
}

export function useFirestoreUpdateMutation<T extends BaseDoc>() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, UpdateMutationParams<T>>({
    mutationFn: async ({ collectionPath, docId, data }) => {
      const docRef = doc(db, collectionPath, docId) as DocumentReference<OptionalTimestamps<Omit<T, 'id'>>>;
      // Add server timestamp for update
      const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
      };
      await updateDoc(docRef, dataWithTimestamp);
    },
    onSuccess: (data, variables) => {
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
           // Invalidate specific document query as well
           queryClient.invalidateQueries({ queryKey: [...(key ?? []), variables.docId] });
        });

      }
       // Optimistic update example:
       // queryClient.setQueryData(['items', variables.docId], (oldData) => oldData ? { ...oldData, ...variables.data } : null);
    },
    onError: (error, variables) => {
      console.error(`Error updating document ${variables.docId}: `, error);
       // Rollback optimistic update if necessary
    },
  });
}

// --- Delete Document Mutation ---
interface DeleteMutationParams {
  collectionPath: string;
  docId: string;
  invalidateQueryKeys?: QueryKey[];
}

export function useFirestoreDeleteMutation() {
  const queryClient = useQueryClient();
  const { team, teamId } = useAuth(); // Get team info for Stripe check
  const { toast } = useToast();

    // Function to update Stripe subscription quantity
    const updateStripeQuantity = async (newQuantity: number) => {
        if (!teamId || !team || team.planType !== 'premium' || !team.stripeSubscriptionId) {
            console.log("Skipping Stripe quantity update (not premium or no subscription ID)");
            return; // Only update for premium teams with a subscription ID
        }

        try {
            const updateSubscriptionQuantity = httpsCallable(firebaseFunctions, 'updateSubscriptionQuantity');
            await updateSubscriptionQuantity({ teamId: teamId, quantity: newQuantity });
            toast({
                title: "Subscription Updated",
                description: `Team size updated to ${newQuantity} members.`,
            });
        } catch (error: any) {
            console.error("Error updating Stripe quantity:", error);
            toast({
                title: "Stripe Update Error",
                description: `Failed to update subscription quantity: ${error.message}. Please check billing manually.`,
                variant: "destructive",
            });
        }
    };


  return useMutation<void, Error, DeleteMutationParams>({
    mutationFn: async ({ collectionPath, docId }) => {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
    },
    onSuccess: async (data, variables) => {
      // Check if the deleted item was a team user to potentially update Stripe
      const isTeamUserDeletion = variables.collectionPath.endsWith(TEAM_USERS_SUBCOLLECTION) && teamId && variables.collectionPath.includes(teamId);

      if (isTeamUserDeletion) {
          // Fetch the new member count *after* deletion
          try {
             const membersCollectionRef = collection(db, `${TEAMS_COLLECTION}/${teamId}/${TEAM_USERS_SUBCOLLECTION}`);
             const countSnapshot = await getCountFromServer(membersCollectionRef);
             const newMemberCount = countSnapshot.data().count;
             await updateStripeQuantity(newMemberCount);
          } catch (error) {
              console.error("Error fetching member count after deletion:", error);
              toast({ title: "Warning", description: "Could not verify member count after deletion. Please check billing.", variant: "destructive" });
          }
      }

      // Invalidate queries after potential Stripe update
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
           // Also remove the specific document from the cache if possible
           queryClient.removeQueries({ queryKey: [...(key ?? []), variables.docId]});
        });
      }
    },
     onError: (error, variables) => {
      console.error(`Error deleting document ${variables.docId}: `, error);
      // Rollback optimistic delete if necessary
    },
  });
}


// --- Batch Write Mutation ---
interface BatchWriteParams {
  writes: Array<{
    type: 'add' | 'update' | 'delete';
    collectionPath: string;
    docId?: string; // Required for update/delete
    data?: Record<string, any>; // Required for add/update
  }>;
  invalidateQueryKeys?: QueryKey[];
}

export function useFirestoreBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, BatchWriteParams>({
    mutationFn: async ({ writes }) => {
      const batch = writeBatch(db);

      writes.forEach(write => {
        const { type, collectionPath, docId, data } = write;
        const collRef = collection(db, collectionPath);

        if (type === 'add' && data) {
          const newDocRef = doc(collRef); // Auto-generate ID
           const dataWithTimestamp = { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
          batch.set(newDocRef, dataWithTimestamp);
        } else if (type === 'update' && docId && data) {
          const docRef = doc(collRef, docId);
           const dataWithTimestamp = { ...data, updatedAt: serverTimestamp() };
          batch.update(docRef, dataWithTimestamp);
        } else if (type === 'delete' && docId) {
          const docRef = doc(collRef, docId);
          batch.delete(docRef);
        }
      });

      await batch.commit();
    },
     onSuccess: (data, variables) => {
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
    },
     onError: (error) => {
      console.error("Error performing batch write: ", error);
    },
  });
}
```