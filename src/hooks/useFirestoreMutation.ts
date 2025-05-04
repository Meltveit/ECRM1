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
} from 'firebase/firestore';
import { useMutation, useQueryClient, MutateOptions, QueryKey } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import type { BaseDoc } from '@/types/crm';

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
    onSuccess: (data, variables) => {
      // Invalidate relevant queries after successful addition
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      }
      // Optionally, you could update the cache directly here for faster UI updates
      // Example: queryClient.setQueryData([...], (oldData) => [...oldData, { id: data.id, ...variables.data }])
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

  return useMutation<void, Error, DeleteMutationParams>({
    mutationFn: async ({ collectionPath, docId }) => {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
    },
    onSuccess: (data, variables) => {
      if (variables.invalidateQueryKeys) {
        variables.invalidateQueryKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key });
           // Also remove the specific document from the cache if possible
           queryClient.removeQueries({ queryKey: [...(key ?? []), variables.docId]});
        });
      }
      // Optimistic delete example:
      // queryClient.setQueryData(['items'], (oldData) => oldData?.filter(item => item.id !== variables.docId));
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
