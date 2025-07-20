/* eslint-disable @typescript-eslint/no-unused-vars */
// contexts/AuthContext.tsx
"use client"
import { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { HTTP_BACKEND } from "@/config";

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

type AuthAction = 
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'CLEAR_ERROR' };

interface AuthContextType extends AuthState {
  signup: (userData: { name: string; username: string; password: string }) => Promise<boolean>;
  login: (credentials: { username: string; password: string }) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'AUTH_LOGOUT':
      return {
        ...initialState,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userEmail = localStorage.getItem('userEmail');
    
    if (token && userEmail) {
      // You might want to verify token validity here
      const user: User = {
        id: 'temp-id', // You'd get this from your backend
        name: localStorage.getItem('userName') || '',
        email: userEmail,
      };
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
    }
  }, []);

  // Signup function
  const signup = async (userData: { name: string; username: string; password: string }): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    try {
      // Client-side validation
      if (!userData.name.trim() || !userData.username.trim() || !userData.password.trim()) {
        dispatch({ type: 'AUTH_ERROR', payload: 'All fields are required' });
        return false;
      }

      if (!userData.username.includes('@')) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Please enter a valid email address' });
        return false;
      }

      if (userData.password.length < 6) {
        dispatch({ type: 'AUTH_ERROR', payload: 'Password must be at least 6 characters long' });
        return false;
      }

      // API call
      const response = await fetch(`${HTTP_BACKEND}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && (data.token || data.userId)) {
        const user: User = {
          id: data.userId || 'temp-id',
          name: userData.name,
          email: userData.username,
        };

        // Store in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        localStorage.setItem('userEmail', userData.username);
        localStorage.setItem('userName', userData.name);

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: data.token }
        });

        return true;
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: data.message || `Error: ${response.status} ${response.statusText}`
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: 'Network error. Please check your connection and try again.'
      });
      return false;
    }
  };

  // Login function
  const login = async (credentials: { username: string; password: string }): Promise<boolean> => {
    dispatch({ type: 'AUTH_START' });

    try {
      const response = await fetch(`${HTTP_BACKEND}/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        const user: User = {
          id: data.userId || 'temp-id',
          name: data.name || '',
          email: credentials.username,
        };

        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', credentials.username);
        localStorage.setItem('userName', data.name || '');

        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user, token: data.token }
        });

        return true;
      } else {
        dispatch({
          type: 'AUTH_ERROR',
          payload: data.message || `Error: ${response.status} ${response.statusText}`
        });
        return false;
      }
    } catch (error) {
      dispatch({
        type: 'AUTH_ERROR',
        payload: 'Network error. Please check your connection and try again.'
      });
      return false;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    dispatch({ type: 'AUTH_LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    signup,
    login,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};