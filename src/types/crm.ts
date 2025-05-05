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
}

export interface Client extends BaseDoc {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  description?: string; // For AI suggestions
  pipelineStage?: string; // For sales pipeline tracking
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

export interface Subscription extends BaseDoc {
  clientId?: string; // Optional: Link to a specific client
  planName: string;
  status: 'active' | 'inactive' | 'trial' | 'cancelled';
  startDate: Timestamp;
  endDate?: Timestamp;
  price?: number;
}

export interface Team extends BaseDoc {
  name: string;
  adminUserId: string; // ID of the user who created/administers the team
}

// Input type for AI suggestions, combining necessary client/activity info
export interface AISuggestionInput {
    clientName: string;
    clientDescription: string;
    pastInteractions: string;
}
