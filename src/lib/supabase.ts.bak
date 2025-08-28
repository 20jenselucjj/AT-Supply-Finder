import { createClient } from '@supabase/supabase-js'

// Debug logging for environment variables
console.log('Environment check:', {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  availableKeys: Object.keys(import.meta.env)
})

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://kplhjddghkjjewznxcou.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwbGhqZGRnaGtqamV3em54Y291Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDU2MjIsImV4cCI6MjA3MDU4MTYyMn0.nuF9IKOHsWynCM2-M41Gwf0Y6a05JTZiGrbwj60J8Eo',
  {
    auth: {
      persistSession: true,
      storageKey: 'wrap-wizard-auth',
      storage: window.localStorage,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
)

// Create an admin client for admin operations (user creation, invitations, etc.)
export const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)