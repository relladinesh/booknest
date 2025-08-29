import type { SupabaseClient } from '@supabase/supabase-js';

declare module '../../supa/supabaseclient' {
  export const supabase: SupabaseClient;
}
