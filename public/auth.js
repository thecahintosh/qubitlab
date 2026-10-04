import {
  createClient
} from "https://esm.sh/@supabase/supabase-js@2";


let supabase = null;


export async function initializeAuth() {
  const response =
    await fetch(
      "/api/config"
    );


  if (!response.ok) {
    throw new Error(
      "Unable to load authentication configuration."
    );
  }


  const config =
    await response.json();


  if (
    !config.supabaseUrl ||
    !config.supabasePublishableKey
  ) {
    throw new Error(
      "Supabase configuration is missing."
    );
  }


  supabase =
    createClient(
      config.supabaseUrl,
      config.supabasePublishableKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );


  return supabase;
}


function requireClient() {
  if (!supabase) {
    throw new Error(
      "Supabase has not been initialized."
    );
  }


  return supabase;
}


export function getSupabaseClient() {
  return requireClient();
}


export async function signUp(
  email,
  password
) {
  const client =
    requireClient();


  const {
    data,
    error
  } =
    await client.auth.signUp({
      email,
      password
    });


  if (error) {
    throw error;
  }


  return data;
}


export async function signIn(
  email,
  password
) {
  const client =
    requireClient();


  const {
    data,
    error
  } =
    await client.auth.signInWithPassword({
      email,
      password
    });


  if (error) {
    throw error;
  }


  return data;
}


export async function signOut() {
  const client =
    requireClient();


  const {
    error
  } =
    await client.auth.signOut();


  if (error) {
    throw error;
  }
}


export async function getCurrentUser() {
  const client =
    requireClient();


  const {
    data,
    error
  } =
    await client.auth.getUser();


  if (error) {
    return null;
  }


  return (
    data.user ??
    null
  );
}


export async function getAccessToken() {
  const client =
    requireClient();


  const {
    data,
    error
  } =
    await client.auth.getSession();


  if (error) {
    throw error;
  }


  return (
    data.session?.access_token ??
    null
  );
}


export function watchAuthState(
  callback
) {
  const client =
    requireClient();


  const {
    data
  } =
    client.auth.onAuthStateChange(
      (
        event,
        session
      ) => {
        callback(
          session?.user ?? null,
          event
        );
      }
    );


  return data.subscription;
}