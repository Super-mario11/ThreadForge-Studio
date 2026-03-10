import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

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
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await api('/auth/logout', {
      method: 'POST'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
