import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import SectionTitle from '../components/SectionTitle.jsx';
import { useAuth } from '../providers/AuthProvider.jsx';
import { useToast } from '../providers/ToastProvider.jsx';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const toast = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    try {
      await login(form, mode);
      toast.success({ title: 'Welcome', description: mode === 'login' ? 'Signed in successfully.' : 'Account created successfully.' });
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
      toast.error({ title: 'Auth failed', description: submitError.message });
    }
  };

  const handleGoogleSuccess = async (response) => {
    const credential = response?.credential;
    if (!credential) {
      const message = 'Google login failed. Please try again.';
      setError(message);
      toast.error({ title: 'Google auth failed', description: message });
      return;
    }

    setError('');
    try {
      await loginWithGoogle(credential);
      toast.success({ title: 'Welcome', description: 'Signed in with Google.' });
      navigate('/dashboard');
    } catch (submitError) {
      setError(submitError.message);
      toast.error({ title: 'Google auth failed', description: submitError.message });
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <SectionTitle
            eyebrow="Account"
            title="Sign in and keep every design synced"
            description="Sign in to save and generate."
          />
        </div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="rounded-[2rem] border border-black/8 bg-white/80 p-6 backdrop-blur"
        >
          <div className="flex gap-2 rounded-full border border-black/10 bg-paper p-1">
            {['login', 'register'].map((entry) => (
              <button
                key={entry}
                type="button"
                onClick={() => setMode(entry)}
                className={`flex-1 rounded-full px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] transition ${
                  mode === entry ? 'bg-ink text-paper' : 'text-black/55 hover:text-ink'
                }`}
              >
                {entry}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            {mode === 'register' ? (
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Full name"
                className="w-full rounded-[1.5rem] border border-black/10 bg-paper px-4 py-4 outline-none"
              />
            ) : null}
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email address"
              className="w-full rounded-[1.5rem] border border-black/10 bg-paper px-4 py-4 outline-none"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                placeholder="Password"
                className="w-full rounded-[1.5rem] border border-black/10 bg-paper px-4 py-4 pr-14 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white/70 p-2 text-black/60 transition hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="mt-6 w-full rounded-full bg-ink px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-paper">
            {mode === 'login' ? 'Login' : 'Create account'}
          </button>

          <div className="mt-4">
            {googleClientId ? (
              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {
                    const message = 'Google sign-in popup could not be completed.';
                    setError(message);
                    toast.error({ title: 'Google auth failed', description: message });
                  }}
                  text={mode === 'login' ? 'signin_with' : 'signup_with'}
                  shape="pill"
                  size="large"
                />
              </div>
            ) : (
              <button
                type="button"
                disabled
                className="w-full cursor-not-allowed rounded-full border border-black/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-black/40"
              >
                Google auth not configured
              </button>
            )}
          </div>

          {error ? <p className="mt-4 text-sm text-crimson">{error}</p> : null}
        </motion.form>
      </div>
    </div>
  );
}
