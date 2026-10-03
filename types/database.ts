import type { AppRole, ElectionStatus, RegistrationStatus, TransactionStatus, TransactionType } from "./domain";

type Table<Row, Insert = Partial<Row>, Update = Partial<Insert>> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Table<{
        id: string; email: string; display_name: string; role: AppRole; wallet_address: string | null; created_at: string; updated_at: string;
      }>;
      elections: Table<{
        id: string; title: string; description: string; start_time: string; end_time: string; status: ElectionStatus; contract_election_id: number | null; contract_address: string | null; chain_id: number | null; created_by: string; created_at: string; updated_at: string;
      }>;
      candidates: Table<{
        id: string; election_id: string; contract_candidate_id: number | null; name: string; description: string; metadata: Record<string, unknown>; created_at: string;
      }>;
      voter_registrations: Table<{
        id: string; election_id: string; user_id: string; status: RegistrationStatus; reviewed_by: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
      }>;
      blockchain_transactions: Table<{
        id: string; user_id: string; election_id: string; type: TransactionType; transaction_hash: string; chain_id: number; status: TransactionStatus; created_at: string; confirmed_at: string | null;
      }>;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      app_role: AppRole; election_status: ElectionStatus; registration_status: RegistrationStatus; transaction_type: TransactionType; transaction_status: TransactionStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
