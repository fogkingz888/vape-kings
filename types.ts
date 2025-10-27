export enum Role {
  Owner = 'Owner',
  Staff = 'Staff',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  branch_id: string;
  password?: string; // Used for forms, not stored from DB
  dob?: string;
  has_changed_username?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  variant: string;
  price: number;
  size: string;
  image_url: string;
  barcode: string;
  created_at: string;
}

export interface StockLevel {
  id: string;
  product_id: string;
  branch_id: string;
  quantity: number;
}

export interface Sale {
  id: string;
  product_id: string;
  quantity: number;
  total_price: number;
  date: string;
  branch_id: string;
  user_id: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_name: string;
  action: string;
  details: string;
  created_at: string;
}

export interface AiProductInfo {
    name: string;
    brand: string;
    category: string;
    flavor: string;
    size: string;
}

export interface StockForecast {
  product_id: string;
  forecasts: {
    date: string;
    quantity: number;
  }[];
}

export interface ReorderSuggestion {
  product_id: string;
  suggestedQty: number;
  reason: string;
}

// Supabase DB Type Definition
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: Omit<Product, 'id' | 'created_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      stock_levels: {
        Row: StockLevel;
        Insert: Omit<StockLevel, 'id'>;
        Update: Partial<Omit<StockLevel, 'id'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'id'>;
        Update: never;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'created_at'>;
        Update: never;
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: Role;
          branch_id: string;
          has_changed_username: boolean;
        };
        Insert: Database['public']['Tables']['profiles']['Row'];
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      app_settings: {
        Row: {
          id: number;
          key: string;
          value: string;
        };
        Insert: {
          id?: number;
          key: string;
          value: string;
        };
        Update: {
          id?: number;
          key?: string;
          value?: string;
        };
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      [_ in never]: never
    };
    Enums: {
      user_role: "Owner" | "Staff"
    };
    CompositeTypes: {
      [_ in never]: never
    };
  }
}