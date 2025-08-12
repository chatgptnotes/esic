import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
  role: 'admin' | 'doctor' | 'nurse' | 'user';
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string }) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  showLanding: boolean;
  setShowLanding: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState<boolean>(true);

  // Simple credentials - in production, this would be handled by a proper auth service
  // Admin password can be configured via env (VITE_ADMIN_PASSWORD); defaults to 'Murali'
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'Murali';
  const validCredentials = [
    { username: 'admin', password: ADMIN_PASSWORD, role: 'admin' as const },
    { username: 'doctor', password: 'doctor', role: 'doctor' as const },
    { username: 'nurse', password: 'nurse', role: 'nurse' as const },
    { username: 'user', password: 'password', role: 'user' as const }
  ];

  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('hmis_user');
    const hasVisitedBefore = localStorage.getItem('hmis_visited');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser.role) {
        parsedUser.role = parsedUser.username === 'admin' ? 'admin' : 'user';
      }
      setUser(parsedUser);
    }
    
    // Show landing page only for first-time visitors
    if (hasVisitedBefore) {
      setShowLanding(false);
    }
  }, []);

  const login = (credentials: { username: string; password: string }): boolean => {
    const isValid = validCredentials.some(
      cred => cred.username === credentials.username && cred.password === credentials.password
    );

    if (isValid) {
      const found = validCredentials.find(
        cred => cred.username === credentials.username && cred.password === credentials.password
      )!;
      const user: User = { username: found.username, role: found.role };
      setUser(user);
      localStorage.setItem('hmis_user', JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hmis_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    showLanding,
    setShowLanding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};