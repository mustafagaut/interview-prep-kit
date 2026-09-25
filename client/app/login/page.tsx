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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Manual Validation Helper Function
  function validateForm(): string | null {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      return 'Email address is required.';
    }

    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return 'Please enter a valid email address.';
    }

    if (!password) {
      return 'Password is required.';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long.';
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    // Run manual validation first
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Something went wrong');
      setToken(data.token);
      router.push('/');
    } catch (submissionError) {
      setError(
        submissionError instanceof Error ? submissionError.message : 'Something went wrong'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F5F7FA] flex items-center justify-center px-6 py-10">
      <form
        onSubmit={handleSubmit}
        noValidate /* Disables browser-default HTML5 tooltips/popups */
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white p-6 text-[#111827] shadow-[12px_12px_0_#1d4ed8] sm:p-8"
      >
        {/* Header Badge with Icon */}
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">
            Interview Intelligence OS
          </p>
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">
          {mode === 'login' ? 'Sign in' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {mode === 'login'
            ? 'Access your saved interview kits.'
            : 'Start building a kit in a minute.'}
        </p>

        <div className="mt-6 space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Email
            <div className="relative mt-1.5">
              <input
                type="text"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 pl-10 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                />
              </svg>
            </div>
          </label>

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Password
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 pl-10 pr-10 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
              />
              {/* Key Icon on Left */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
                />
              </svg>

              {/* Eye Toggle Button on Right */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 transition hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  /* Eye Off Icon */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  /* Eye Icon */
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12c1.07-3.29 4.21-5.625 7.964-5.625s6.894 2.335 7.964 5.625c-1.07 3.29-4.21 5.625-7.964 5.625S3.106 15.29 2.036 12z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </label>
        </div>

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}

        <button
          disabled={isSubmitting}
          type="submit"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? (
            'Please wait...'
          ) : mode === 'login' ? (
            <>
              Sign in
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </>
          ) : (
            'Create account'
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError('');
          }}
          className="mt-4 w-full text-center text-sm font-semibold text-blue-600 hover:text-blue-700"
        >
          {mode === 'login'
            ? "Don't have an account? Register"
            : 'Already have an account? Sign in'}
        </button>
      </form>
    </main>
  );
}