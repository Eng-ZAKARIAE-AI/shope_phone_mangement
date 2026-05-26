import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, syncUserProfile } from '../services/firebase.ts';
import { UserProfile } from '../types.ts';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isSandboxMode: boolean;
  enterSandboxMode: (role: 'admin' | 'staff', email?: string, displayName?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSandboxMode, setIsSandboxMode] = useState(false);

  useEffect(() => {
    const cachedSandbox = localStorage.getItem('tecno_sandbox_session');
    if (cachedSandbox) {
      try {
        const session = JSON.parse(cachedSandbox);
        setUser(session.user);
        setProfile(session.profile);
        setIsSandboxMode(true);
        setLoading(false);
        return;
      } catch (e) {
        localStorage.removeItem('tecno_sandbox_session');
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const syncedProfile = await syncUserProfile(currentUser);
          setProfile(syncedProfile);
        } catch (err) {
          console.error("Error loading user details profile:", err);
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
        setIsSandboxMode(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const enterSandboxMode = (role: 'admin' | 'staff', email = 'admin@tecno.com', displayName = 'Demo Administrator') => {
    const mockUser = {
      uid: `sandbox-${role}-uid`,
      email,
      displayName,
      emailVerified: true
    };
    const mockProfile: UserProfile = {
      uid: mockUser.uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    setUser(mockUser);
    setProfile(mockProfile);
    setIsSandboxMode(true);
    localStorage.setItem('tecno_sandbox_session', JSON.stringify({ user: mockUser, profile: mockProfile }));
  };

  const logout = async () => {
    if (isSandboxMode) {
      localStorage.removeItem('tecno_sandbox_session');
      setUser(null);
      setProfile(null);
      setIsSandboxMode(false);
    } else {
      const { signOut: firebaseSignOut } = await import('firebase/auth');
      await firebaseSignOut(auth);
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isStaff: profile?.role === 'staff' || profile?.role === 'admin',
    isSandboxMode,
    enterSandboxMode,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used inside an AuthProvider zone');
  }
  return context;
}
