import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://your-project.supabase.co');

if (!isConfigured) {
  if (__DEV__) {
    console.warn(
      '[mySun] Supabase URL or Anon Key is missing or using placeholder values. ' +
      'Define EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env to enable cloud sync.'
    );
  }
}

// Export a fallback mock client if keys are missing to prevent runtime app crashes.
export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : ({
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signUp: async () => ({ data: { session: null }, error: { message: 'Bulut yedekleme sistemi şu an yapılandırılmamış.' } }),
        signInWithPassword: async () => ({ data: { session: null }, error: { message: 'Bulut yedekleme sistemi şu an yapılandırılmamış.' } }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        upsert: async () => ({ error: { message: 'Bulut yedekleme sistemi şu an yapılandırılmamış.' } }),
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as any);
