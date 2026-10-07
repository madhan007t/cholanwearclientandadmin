import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminAuth } from '../../store/adminAuthStore';
import { getErrorMessage } from '../../services/api';
import { Button, Field } from '../../components/ui';
import { useSEO } from '../../hooks';

export default function Login() {
  useSEO('Admin login');
  const { admin, status, bootstrap, login } = useAdminAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (status === 'idle') bootstrap(); }, [status, bootstrap]);
  if (admin) return <Navigate to={state?.from && state.from.startsWith('/admin') ? state.from : '/admin'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.');
    setBusy(true);
    setError('');
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(state?.from || '/admin', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-black px-4 py-10">
      <div className="w-full max-w-md animate-fade-up">
        <img src="/logo.png" alt="CHOLAN WEAR" className="mx-auto h-20 w-auto" />
        <form onSubmit={submit} noValidate className="mt-10 border border-line-dark bg-surface-darker p-7 sm:p-9">
          <p className="eyebrow-dark">Admin access</p>
          <h1 className="mt-2 font-display text-2xl uppercase tracking-wide !text-brand-white">Sign in</h1>
          {error && <p role="alert" className="mt-5 border border-danger/60 bg-danger/10 px-3 py-2 text-sm text-brand-white">{error}</p>}
          <div className="mt-6 space-y-4">
            <Field label="Email" htmlFor="a-email"><input id="a-email" type="email" autoComplete="username" autoFocus value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field !border-line-dark !bg-brand-black !text-brand-white" /></Field>
            <Field label="Password" htmlFor="a-pass">
              <div className="relative">
                <input id="a-pass" type={show ? 'text' : 'password'} autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field !border-line-dark !bg-brand-black !pr-12 !text-brand-white" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-white/60 hover:text-gold">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
              </div>
            </Field>
          </div>
          <Button type="submit" variant="gold" loading={busy} className="mt-7 w-full py-4">Sign in</Button>
        </form>
        <p className="mt-6 text-center text-xs text-brand-white/40">Authorised personnel only</p>
      </div>
    </div>
  );
}
