export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      availability: {
        Row: {
          date: string;
          place_id: string;
          status: Database["public"]["Enums"]["availability_status"];
          updated_at: string;
        };
        Insert: {
          date: string;
          place_id: string;
          status: Database["public"]["Enums"]["availability_status"];
          updated_at?: string;
        };
        Update: {
          date?: string;
          place_id?: string;
          status?: Database["public"]["Enums"]["availability_status"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "availability_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      events: {
        Row: {
          created_at: string;
          id: number;
          place_id: string;
          type: Database["public"]["Enums"]["event_type"];
        };
        Insert: {
          created_at?: string;
          id?: never;
          place_id: string;
          type: Database["public"]["Enums"]["event_type"];
        };
        Update: {
          created_at?: string;
          id?: never;
          place_id?: string;
          type?: Database["public"]["Enums"]["event_type"];
        };
        Relationships: [
          {
            foreignKeyName: "events_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          billable: boolean;
          comment: string | null;
          created_at: string;
          date_from: string | null;
          date_to: string | null;
          guests: number | null;
          id: string;
          name: string;
          phone: string;
          place_id: string;
          status: Database["public"]["Enums"]["lead_status"];
        };
        Insert: {
          billable?: boolean;
          comment?: string | null;
          created_at?: string;
          date_from?: string | null;
          date_to?: string | null;
          guests?: number | null;
          id?: string;
          name: string;
          phone: string;
          place_id: string;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Update: {
          billable?: boolean;
          comment?: string | null;
          created_at?: string;
          date_from?: string | null;
          date_to?: string | null;
          guests?: number | null;
          id?: string;
          name?: string;
          phone?: string;
          place_id?: string;
          status?: Database["public"]["Enums"]["lead_status"];
        };
        Relationships: [
          {
            foreignKeyName: "leads_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
      owners: {
        Row: {
          created_at: string;
          id: string;
          link_code: string | null;
          name: string;
          phone: string | null;
          telegram_chat_id: number | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          link_code?: string | null;
          name: string;
          phone?: string | null;
          telegram_chat_id?: number | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          link_code?: string | null;
          name?: string;
          phone?: string | null;
          telegram_chat_id?: number | null;
        };
        Relationships: [];
      };
      places: {
        Row: {
          address_text: string | null;
          capacity_max: number | null;
          created_at: string;
          description_kk: string | null;
          description_ru: string | null;
          direction: Database["public"]["Enums"]["place_direction"];
          drive_minutes: number | null;
          featured_until: string | null;
          has_banya: boolean;
          has_bbq: boolean;
          has_chan: boolean;
          has_kitchen: boolean;
          has_pool: boolean;
          has_wifi: boolean;
          id: string;
          instagram_url: string | null;
          lat: number | null;
          lng: number | null;
          name_kk: string | null;
          name_ru: string;
          owner_id: string | null;
          pets_allowed: boolean;
          photos: string[];
          photos_permission: boolean;
          plan: Database["public"]["Enums"]["place_plan"];
          price_from: number | null;
          price_unit: Database["public"]["Enums"]["price_unit"];
          slug: string;
          status: Database["public"]["Enums"]["place_status"];
          type: Database["public"]["Enums"]["place_type"];
          updated_at: string;
          video_url: string | null;
          whatsapp_phone: string;
          winter_ok: boolean;
        };
        Insert: {
          address_text?: string | null;
          capacity_max?: number | null;
          created_at?: string;
          description_kk?: string | null;
          description_ru?: string | null;
          direction: Database["public"]["Enums"]["place_direction"];
          drive_minutes?: number | null;
          featured_until?: string | null;
          has_banya?: boolean;
          has_bbq?: boolean;
          has_chan?: boolean;
          has_kitchen?: boolean;
          has_pool?: boolean;
          has_wifi?: boolean;
          id?: string;
          instagram_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          name_kk?: string | null;
          name_ru: string;
          owner_id?: string | null;
          pets_allowed?: boolean;
          photos?: string[];
          photos_permission?: boolean;
          plan?: Database["public"]["Enums"]["place_plan"];
          price_from?: number | null;
          price_unit?: Database["public"]["Enums"]["price_unit"];
          slug: string;
          status?: Database["public"]["Enums"]["place_status"];
          type: Database["public"]["Enums"]["place_type"];
          updated_at?: string;
          video_url?: string | null;
          whatsapp_phone: string;
          winter_ok?: boolean;
        };
        Update: {
          address_text?: string | null;
          capacity_max?: number | null;
          created_at?: string;
          description_kk?: string | null;
          description_ru?: string | null;
          direction?: Database["public"]["Enums"]["place_direction"];
          drive_minutes?: number | null;
          featured_until?: string | null;
          has_banya?: boolean;
          has_bbq?: boolean;
          has_chan?: boolean;
          has_kitchen?: boolean;
          has_pool?: boolean;
          has_wifi?: boolean;
          id?: string;
          instagram_url?: string | null;
          lat?: number | null;
          lng?: number | null;
          name_kk?: string | null;
          name_ru?: string;
          owner_id?: string | null;
          pets_allowed?: boolean;
          photos?: string[];
          photos_permission?: boolean;
          plan?: Database["public"]["Enums"]["place_plan"];
          price_from?: number | null;
          price_unit?: Database["public"]["Enums"]["price_unit"];
          slug?: string;
          status?: Database["public"]["Enums"]["place_status"];
          type?: Database["public"]["Enums"]["place_type"];
          updated_at?: string;
          video_url?: string | null;
          whatsapp_phone?: string;
          winter_ok?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "places_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "owners";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      place_availability_updates: {
        Row: {
          last_updated_at: string | null;
          place_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "availability_place_id_fkey";
            columns: ["place_id"];
            isOneToOne: false;
            referencedRelation: "places";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      availability_status: "free" | "limited" | "full";
      event_type: "view" | "whatsapp_click" | "phone_click" | "instagram_click";
      lead_status:
        "new" | "sent_to_owner" | "confirmed" | "cancelled" | "no_answer";
      place_direction:
        | "gory_almaty"
        | "talgar"
        | "issyk_turgen"
        | "kaskelen"
        | "kapshagay"
        | "charyn_kolsai"
        | "drugoe";
      place_plan: "free" | "pro";
      place_status: "draft" | "published" | "hidden";
      place_type:
        | "glamping"
        | "aframe"
        | "house"
        | "zona_otdyha"
        | "banya_complex"
        | "guesthouse";
      price_unit: "per_night_unit" | "per_person";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      availability_status: ["free", "limited", "full"],
      event_type: ["view", "whatsapp_click", "phone_click", "instagram_click"],
      lead_status: [
        "new",
        "sent_to_owner",
        "confirmed",
        "cancelled",
        "no_answer",
      ],
      place_direction: [
        "gory_almaty",
        "talgar",
        "issyk_turgen",
        "kaskelen",
        "kapshagay",
        "charyn_kolsai",
        "drugoe",
      ],
      place_plan: ["free", "pro"],
      place_status: ["draft", "published", "hidden"],
      place_type: [
        "glamping",
        "aframe",
        "house",
        "zona_otdyha",
        "banya_complex",
        "guesthouse",
      ],
      price_unit: ["per_night_unit", "per_person"],
    },
  },
} as const;
