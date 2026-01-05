
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile } from '../services/mockBackend';
// Use namespace import for auth to resolve potential named export issues
import * as firebaseAuth from 'firebase/auth';

const { onAuthStateChanged, signOut } = firebaseAuth as any;

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
    // Modular onAuthStateChanged usage
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
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
    // Modular signOut usage
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
