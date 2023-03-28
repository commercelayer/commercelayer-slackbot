import slackPkg from "@slack/bolt";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          created_at: string | null;
          updated_at: string | null;
          is_enterprise: boolean | null;
          slack_id: string;
          slack_installation_store: slackPkg.Installation<"v1" | "v2", boolean>;
          cl_app_credentials: Object | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          updated_at?: string | null;
          is_enterprise?: boolean | null;
          slack_id: string;
          slack_installation_store?: Object | null;
          cl_app_credentials?: Object | null;
        };
        Update: {
          id?: number;
          created_at?: string | null;
          updated_at?: string | null;
          is_enterprise?: boolean | null;
          slack_id?: string;
          slack_installation_store?: Object | null;
          cl_app_credentials?: Object | null;
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
