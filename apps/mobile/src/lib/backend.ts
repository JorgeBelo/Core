import 'react-native-url-polyfill/auto';
import { AppState, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { createRepository, createTrainingRepository } from '@core/api-client';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = Boolean(url?.startsWith('http') && key && !key.includes('replace-with'));
// Native tokens go in OS-protected storage. Web tokens are memory-only: closing
// or reloading the page requires login, avoiding browser-persistent bearer tokens.
export const supabase = configured
  ? createClient(url!, key!, {
      auth: {
        persistSession: Platform.OS !== 'web',
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storage:
          Platform.OS === 'web'
            ? undefined
            : {
                getItem: SecureStore.getItemAsync,
                setItem: SecureStore.setItemAsync,
                removeItem: SecureStore.deleteItemAsync,
              },
      },
    })
  : null;
export const repository = supabase ? createRepository(supabase) : null;
export const trainingRepository = supabase ? createTrainingRepository(supabase) : null;
if (Platform.OS !== 'web' && supabase)
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
