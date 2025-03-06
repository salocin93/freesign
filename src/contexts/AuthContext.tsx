import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

type AuthContextType = {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development and preview
const mockUser: User = {
  uid: 'dev-user-id',
  email: 'dev@example.com',
  displayName: 'Dev User',
  photoURL: 'https://via.placeholder.com/150',
  emailVerified: true,
  isAnonymous: false,
  metadata: {
    creationTime: new Date().toISOString(),
    lastSignInTime: new Date().toISOString(),
  },
  providerData: [],
  refreshToken: '',
  tenantId: null,
  phoneNumber: null,
  providerId: 'google.com',
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({ token: '', expirationTime: '', authTime: '', issuedAtTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
  reload: async () => {},
  toJSON: () => ({}),
};

// Check if we're in a development or preview environment
const isDevOrPreview = import.meta.env.DEV || window.location.hostname.includes('lovable.app');

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In development or preview mode, automatically set mock user
    if (isDevOrPreview) {
      setCurrentUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (): Promise<void> => {
    // In development or preview mode, just set the mock user
    if (isDevOrPreview) {
      setCurrentUser(mockUser);
      return;
    }

    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Store user in localStorage for simpler state persistence
      const userData = {
        id: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        photoURL: result.user.photoURL
      };
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    // In development or preview mode, just clear the mock user
    if (isDevOrPreview) {
      setCurrentUser(null);
      return;
    }

    try {
      await signOut(auth);
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
