// Simple replacement for corrupted types
export type Json = any;

export interface Database {
  public: {
    Tables: any;
    Views: any;
    Functions: any;
    Enums: any;
    CompositeTypes: any;
  };
}