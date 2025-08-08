import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { username: string; password: string }) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
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
  const validCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'doctor', password: 'doctor' },
    { username: 'nurse', password: 'nurse' },
    { username: 'user', password: 'password' }
  ];

  // Check for saved session on load
  useEffect(() => {
    const savedUser = localStorage.getItem('hmis_user');
    const hasVisitedBefore = localStorage.getItem('hmis_visited');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
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
      const user = { username: credentials.username };
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

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    showLanding,
    setShowLanding
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};