export type AppRole = "ADMIN" | "ORGANIZER" | "VOTER";
export type ElectionStatus = "DRAFT" | "REGISTRATION" | "ACTIVE" | "CLOSED";
export type RegistrationStatus = "PENDING" | "APPROVED" | "REJECTED";
export type TransactionType = "CREATE_ELECTION" | "ADD_CANDIDATE" | "APPROVE_VOTER" | "CAST_VOTE" | "CLOSE_ELECTION";
export type TransactionStatus = "PENDING" | "CONFIRMED" | "FAILED";

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: AppRole;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Election {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: ElectionStatus;
  contract_election_id: number | null;
  contract_address: string | null;
  chain_id: number | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  election_id: string;
  contract_candidate_id: number | null;
  name: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface VoterRegistration {
  id: string;
  election_id: string;
  user_id: string;
  status: RegistrationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockchainTransaction {
  id: string;
  user_id: string;
  election_id: string;
  type: TransactionType;
  transaction_hash: string;
  chain_id: number;
  status: TransactionStatus;
  created_at: string;
  confirmed_at: string | null;
}
