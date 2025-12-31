
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile } from '../services/mockBackend';
// Fix: Using standard named imports from firebase/auth for modular SDK.
import { onAuthStateChanged, signOut } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  updateUserEnrollment: (courseId: string) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children?: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch extended profile from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile) {
          setUser(profile);
        } else {
          // If profile doesn't exist (e.g. created via console or error in reg), create default
          const newProfile: User = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: 'student',
            enrolledCourses: []
          };
          await createUserProfile(newProfile);
          setUser(newProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    // Fix: Updated to use the standard signOut function.
    await signOut(auth);
    setUser(null);
  };

  const updateUserEnrollment = (courseId: string) => {
    if (user) {
      setUser({ ...user, enrolledCourses: [...user.enrolledCourses, courseId] });
    }
  };

  const refreshProfile = async () => {
      if(auth.currentUser) {
          const profile = await getUserProfile(auth.currentUser.uid);
          if(profile) setUser(profile);
      }
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout, updateUserEnrollment, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
