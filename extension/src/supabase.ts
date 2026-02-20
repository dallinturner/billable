import { createClient } from '@supabase/supabase-js'

// These get replaced at build time via webpack DefinePlugin
const SUPABASE_URL = process.env.SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      // Use chrome.storage.local for auth tokens so they persist across popup close
      getItem: (key: string) =>
        new Promise((resolve) => {
          chrome.storage.local.get([key], (result) => {
            resolve(result[key] ?? null)
          })
        }),
      setItem: (key: string, value: string) =>
        new Promise<void>((resolve) => {
          chrome.storage.local.set({ [key]: value }, resolve)
        }),
      removeItem: (key: string) =>
        new Promise<void>((resolve) => {
          chrome.storage.local.remove(key, resolve)
        }),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
