'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { setToken } from '@/lib/auth';

type Mode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setToken(data.token);
      router.push('/');
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F5F7FA] flex items-center justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 text-[#111827] shadow-[12px_12px_0_#1d4ed8] sm:p-8"
      >
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
          Interview Intelligence OS
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login' ? 'Access your saved interview kits.' : 'Start building a kit in a minute.'}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Email
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Password
            <input
              required
              type="password"
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          type="submit"
          className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 shadow-md"
        >
          {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          className="mt-4 w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  );
}