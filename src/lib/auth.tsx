import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserRole, Profile } from './supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectRoleFromPath(): UserRole {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin')) return 'super_admin';
  if (path.includes('teacher')) return 'teacher';
  return 'student';
}

function mockProfile(role: UserRole): Profile {
  const names: Record<UserRole, string> = {
    super_admin: 'Super Admin',
    teacher: 'Ahmed Al-Rashid',
    student: 'Sara Ibrahim',
  };
  const emails: Record<UserRole, string> = {
    super_admin: 'admin@institute.edu',
    teacher: 'teacher@institute.edu',
    student: 'student@institute.edu',
  };
  return {
    id: `mock-${role}`,
    role,
    full_name: names[role],
    email: emails[role],
    phone: '',
    language: 'ar',
    status: 'active',
    religion_enabled: role === 'student',
    religion_choice: 'islamic',
    religion_prompt_shown: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/** Returns true for demo/mock profile IDs (e.g. "mock-student"). Used to skip real DB calls. */
export function isMockId(id: string | null | undefined): boolean {
  return !id || id.startsWith('mock-');
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: Profile | null;
  loading: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string, phone: string, meta?: Record<string, any>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(detectRoleFromPath);
  const [profile, setProfile] = useState<Profile>(mockProfile(role));

  // When role changes, rebuild the mock profile
  function setRole(newRole: UserRole) {
    setRoleState(newRole);
    setProfile(mockProfile(newRole));
    // Update URL so refreshes preserve the role
    const path =
      newRole === 'super_admin' ? '/admin' :
      newRole === 'teacher'     ? '/teacher' :
                                  '/student';
    window.history.replaceState(null, '', path);
  }

  // Re-detect if user navigates via browser back/forward
  useEffect(() => {
    function onPop() {
      const detected = detectRoleFromPath();
      setRoleState(detected);
      setProfile(mockProfile(detected));
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const mockUser = { id: `mock-${role}`, email: profile.email };

  // These are no-ops in mock mode but kept so callers compile
  async function signIn(email: string, _password: string): Promise<{ error: string | null }> {
    const lower = email.toLowerCase();
    if (lower.includes('admin')) setRole('super_admin');
    else if (lower.includes('teacher')) setRole('teacher');
    else setRole('student');
    return { error: null };
  }

  async function signUp(_e: string, _p: string, fullName: string, _ph: string, meta?: Record<string, any>): Promise<{ error: string | null }> {
    const userType = meta?.userType as 'student' | 'teacher' || 'student';
    const targetRole: UserRole = userType === 'teacher' ? 'teacher' : 'student';
    setRole(targetRole);
    setProfile(prev => ({
      ...prev,
      full_name: fullName,
      status: 'pending',
      specialization: meta?.specialization,
      selected_country: meta?.country,
      grade_track: meta?.gradeTrack,
      certified_curriculums: meta?.certifiedCurriculums,
      phone_number: _ph,
    }));
    return { error: null };
  }

  async function signOut() {
    setRole('student');
  }

  async function refreshProfile() {
    setProfile(mockProfile(role));
  }

  return (
    <AuthContext.Provider value={{
      user: mockUser,
      profile,
      loading: false,
      role,
      setRole,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
