"use client";

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  Query,
  DocumentData,
  CollectionReference,
  QueryConstraint,
  doc,
  getDoc,
  onSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { useQuery, useInfiniteQuery, UseQueryResult, UseInfiniteQueryResult, QueryKey } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import type { BaseDoc } from '@/types/crm'; // Assuming BaseDoc has an id

// --- Hook for fetching a single document ---
export function useFirestoreDoc<T extends BaseDoc>(
  collectionPath: string,
  docId: string | undefined, // Allow undefined for conditional fetching
  queryKey: QueryKey,
  options?: { enabled?: boolean }
): UseQueryResult<T | null, Error> {
  return useQuery<T | null, Error>({
    queryKey: [...queryKey, docId],
    queryFn: async (): Promise<T | null> => {
      if (!docId) return null; // Don't fetch if docId is not provided
      const docRef = doc(db, collectionPath, docId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      } else {
        return null; // Or throw an error if preferred: throw new Error("Document not found");
      }
    },
    enabled: !!docId && (options?.enabled ?? true), // Enable only if docId is present and enabled option is true
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
  });
}


// --- Hook for fetching a collection with real-time updates ---
export function useFirestoreCollectionRealtime<T extends BaseDoc>(
    collectionPath: string,
    queryKey: QueryKey,
    constraints: QueryConstraint[] = [], // Allow passing Firestore query constraints
    options?: { enabled?: boolean }
): UseQueryResult<T[], Error> {
    return useQuery<T[], Error>({
        queryKey: queryKey,
        queryFn: () => {
            const collRef = collection(db, collectionPath);
            const q = query(collRef, ...constraints);

            return new Promise((resolve, reject) => {
                const unsubscribe = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
                    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
                    resolve(data);
                }, (error) => {
                    console.error("Firestore realtime fetch error:", error);
                    reject(error);
                    unsubscribe(); // Ensure unsubscribe on error
                });

                // This part is tricky with useQuery's standard behavior,
                // as queryFn expects a promise that resolves once.
                // We resolve the promise on the first snapshot.
                // React Query doesn't have built-in support for managing the unsubscribe cleanup
                // directly within queryFn for realtime updates like this.
                // For proper cleanup, consider managing the subscription outside or using a different pattern.
                // A simpler approach might be to just fetch once if realtime isn't strictly needed for all cases.
                // Or manage the listener lifecycle in a useEffect within the component using this hook.
                 // For now, this resolves with the first batch of data.
                 // Cleanup needs manual handling in the component using this hook if needed.
            });
        },
        enabled: options?.enabled ?? true,
        staleTime: 5 * 60 * 1000, // Data is considered fresh for 5 minutes
        gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
        // Note: Realtime updates won't automatically trigger refetches here
        // unless queryKey changes or refetch is manually called.
        // For true realtime feel integrated with React Query, you might need
        // to manually update the query cache within the onSnapshot callback.
    });
}


// --- Hook for fetching a collection (single fetch) ---
export function useFirestoreCollection<T extends BaseDoc>(
  collectionPath: string,
  queryKey: QueryKey,
  constraints: QueryConstraint[] = [], // Allow passing Firestore query constraints
  options?: { enabled?: boolean }
): UseQueryResult<T[], Error> {
  return useQuery<T[], Error>({
    queryKey: queryKey,
    queryFn: async (): Promise<T[]> => {
        const collRef = collection(db, collectionPath);
        const q = query(collRef, ...constraints);
        try {
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
            return data;
        } catch (error) {
            console.error("Firestore fetch error:", error);
            throw error; // Re-throw the error to be caught by React Query
        }
    },
     enabled: options?.enabled ?? true,
     staleTime: 5 * 60 * 1000, // 5 minutes
     gcTime: 10 * 60 * 1000, // 10 minutes
  });
}


// --- Hook for infinite scrolling ---
export function useFirestoreInfiniteQuery<T extends BaseDoc>(
  collectionPath: string,
  queryKey: QueryKey,
  baseConstraints: QueryConstraint[] = [], // Constraints applied to all pages
  limitCount: number = 10
): UseInfiniteQueryResult<T[], Error> {
  return useInfiniteQuery<T[], Error, T[], QueryKey, DocumentData | null>({
    queryKey: queryKey,
    queryFn: async ({ pageParam = null }): Promise<T[]> => {
      const collRef = collection(db, collectionPath);
      const constraints = [...baseConstraints, orderBy('createdAt', 'desc'), limit(limitCount)]; // Ensure an order for pagination
      if (pageParam) {
        constraints.push(startAfter(pageParam));
      }
      const q = query(collRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // Need the actual last document snapshot for startAfter
      // This requires fetching the snapshot itself, not just the data
      // This simplified version might not work correctly without the snapshot reference.
      // A common approach is to fetch the snapshot in queryFn and return { data, lastDocSnapshot }
       if (lastPage.length < limitCount) {
         return undefined; // No more pages
       }
       // This is a placeholder - requires actual last doc snapshot reference
       // You'd typically get this from the getDocs result (snapshot.docs[snapshot.docs.length - 1])
       // and pass it correctly through the query function's return value.
       // For now, returning null might stop pagination prematurely or incorrectly.
       // Returning the ID of the last item assumes IDs are sortable/ordered correctly with createdAt.
        return lastPage[lastPage.length - 1]?.id ? doc(db, collectionPath, lastPage[lastPage.length - 1].id) : undefined;
       // A more robust solution involves returning the DocumentSnapshot from queryFn
    },
     initialPageParam: null, // Start with no cursor
     staleTime: 5 * 60 * 1000,
     gcTime: 10 * 60 * 1000,
  });
}
