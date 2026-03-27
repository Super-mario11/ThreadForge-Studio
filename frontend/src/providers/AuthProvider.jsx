import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAuthToken } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload, mode = 'login') => {
    const endpoint = mode === 'register' ? '/auth/register' : '/auth/login';
    const data = await api(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async (credential) => {
    const data = await api('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential })
    });

    if (data.token) {
      setAuthToken(data.token);
    }

    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    setAuthToken('');
    try {
      await api('/auth/logout', {
        method: 'POST'
      });
    } catch {
      // Ignore logout network failures.
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
