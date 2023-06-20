import { Installation } from "@slack/bolt";

export type credentialsJson = {
  accessToken: {
    token: string;
    createdAt: number;
    expiresAt: Date;
    expiresIn: number;
    scope: string;
    tokenType: string;
  };
  mode: string;
  endpoint: string;
  clientId: string;
  checkoutClientId: string;
};

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          slack_id: string;
          created_at: string | null;
          updated_at: string | null;
          is_enterprise: boolean | null;
          slack_installation_store: Installation<"v1" | "v2", boolean>;
          cl_app_credentials: credentialsJson | null;
        };
        Insert: {
          id?: number;
          slack_id: string;
          created_at?: string | null;
          updated_at?: string | null;
          is_enterprise?: boolean | null;
          slack_installation_store?: Object | null;
          cl_app_credentials?: credentialsJson | null;
        };
        Update: {
          id?: number;
          slack_id?: string;
          created_at?: string | null;
          updated_at?: string | null;
          is_enterprise?: boolean | null;
          slack_installation_store?: Object | null;
          cl_app_credentials?: credentialsJson | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
