import type { Timestamp } from 'firebase/firestore';

// Using a mock team ID until authentication is implemented
export const MOCK_TEAM_ID = 'default-team';

// Base interface for Firestore documents
export interface BaseDoc {
  id: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  // Add any other common fields if necessary
  [key: string]: any; // Allow for other fields not explicitly defined
}

export interface TeamUser extends BaseDoc {
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'member'; // Example roles
  lastLogin?: Timestamp; // Add lastLogin
}

export interface Client extends BaseDoc {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string; // For AI suggestions
  pipelineStage?: 'lead' | 'contact' | 'negotiation' | 'closed'; // Use specific stages
}

export interface Contact extends BaseDoc {
  clientId: string; // Link to the client
  name: string;
  email?: string;
  phone?: string;
  role?: string; // e.g., 'Primary Contact', 'Billing Contact'
}

export interface Activity extends BaseDoc {
  clientId: string; // Link to the client
  type: 'Call' | 'Meeting' | 'Email' | 'Note' | 'Task'; // Example activity types
  date: Timestamp;
  notes: string;
  dueDate?: Timestamp;
  userId?: string; // User who created the activity
  userName?: string; // Name of the user who created the activity
  completed?: boolean; // Whether the activity is completed
  pastInteractionSummary?: string; // For AI suggestions input
}

// Represents a subscription *linked* to a client, not the team's main subscription
export interface Subscription extends BaseDoc {
  clientId?: string; // Optional: Link to a specific client
  planName: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled' | 'past_due'; // Added past_due
  startDate: Timestamp;
  endDate?: Timestamp | null; // Allow null
  price?: number; // Optional price field
  // Add fields relevant from Stripe if needed, e.g., stripeSubscriptionId
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Timestamp;
}


export interface Team extends BaseDoc {
  name: string;
  adminId: string; // ID of the user who created/administers the team
  planType?: 'free' | 'premium'; // Simplified plan types for now
  clientCount?: number; // Example counter, maybe replace with member count logic later
  subscriptionStatus?: 'active' | 'canceled' | 'incomplete' | 'past_due' | 'trialing'; // Reflects the team's subscription status
  stripeCustomerId?: string; // Stripe customer ID associated with the admin user paying for the team
  stripeSubscriptionId?: string; // Stripe subscription ID for the team's plan
}

// Input type for AI suggestions, combining necessary client/activity info
export interface AISuggestionInput {
    clientName: string;
    clientDescription: string;
    pastInteractions: string;
}

```