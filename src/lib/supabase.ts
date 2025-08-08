import { createClient } from '@supabase/supabase-js';

// Simple database interface without the corrupted types
interface SimpleDatabase {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, any>;
        Insert: Record<string, any>;
        Update: Record<string, any>;
      };
    };
  };
}

// Use environment variables if available, fallback to hardcoded values
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

// Debug logging for production
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseAnonKey);
}

// Create supabase client with working types
export const supabase = createClient<SimpleDatabase>(supabaseUrl, supabaseAnonKey);

// Export for backward compatibility
export default supabase;