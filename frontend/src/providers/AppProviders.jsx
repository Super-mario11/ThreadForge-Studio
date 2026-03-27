import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './AuthProvider.jsx';
import { CartProvider } from './CartProvider.jsx';
import { ToastProvider } from './ToastProvider.jsx';

export function AppProviders({ children }) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const appTree = (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>{children}</ToastProvider>
      </CartProvider>
    </AuthProvider>
  );

  return (
    <BrowserRouter>
      {googleClientId ? <GoogleOAuthProvider clientId={googleClientId}>{appTree}</GoogleOAuthProvider> : appTree}
    </BrowserRouter>
  );
}
