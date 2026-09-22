'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { fetchProfile, upsertProfile, UserProfile } from '../lib/api';

export type { UserProfile };

export interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  profile: UserProfile | null;
  updateProfileState: (exp: number, level: number) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  profile: null,
  updateProfileState: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const updateProfileState = (exp: number, level: number) => {
    setProfile({ exp, level });
  };

  useEffect(() => {
    let isMounted = true;

    const loadUserProfile = async (userId: string) => {
      try {
        const existing = await fetchProfile(userId);
        if (existing) {
          if (isMounted) setProfile(existing);
          return;
        }
        const defaultProfile = { exp: 0, level: 1 };
        const created = await upsertProfile(userId, defaultProfile.exp, defaultProfile.level);
        if (isMounted) {
          setProfile(created ?? defaultProfile);
        }
      } catch (err: unknown) {
        console.error('Failed to load user profile:', err);
        if (isMounted) {
          setProfile({ exp: 0, level: 1 });
        }
      }
    };

    // 1. Get initial session
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error fetching Supabase session:', error.message);
        }
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            loadUserProfile(session.user.id);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        console.error('Unexpected error fetching session:', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    // 2. Listen to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          loadUserProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setProfile(null);
      await supabase.auth.signOut();
    } catch (err: unknown) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        loading,
        profile,
        updateProfileState,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
