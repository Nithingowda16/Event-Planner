import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserProfile, LoginInput, RegisterInput } from '@celebrateos/shared';
import { api, tokenStorage, ApiError } from '../services/api.js';

export interface AuthContextValue {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(tokenStorage.get());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
    async function initAuth() {
      const storedToken = tokenStorage.get();
      if (!storedToken) {
        if (mounted) setIsLoading(false);
        return;
      }

      try {
        const { user } = await api.auth.getMe();
        if (mounted) {
          setUser(user);
          setToken(storedToken);
        }
      } catch {
        if (mounted) {
          tokenStorage.clear();
          setUser(null);
          setToken(null);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    initAuth();
    return () => {
      mounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.auth.login(credentials);
      setUser(result.user);
      setToken(result.token);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.auth.register(data);
      setUser(result.user);
      setToken(result.token);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Registration failed';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      setToken(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
