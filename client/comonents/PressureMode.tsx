'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

const levels = ['warm-up', 'normal', 'technical', 'hard', 'stress'] as const;
const personalities = [
  'friendly-engineer',
  'senior-staff-engineer',
  'startup-cto',
  'big-tech-interviewer',
  'skeptical-reviewer',
  'system-design-expert',
  'hr-manager',
  'rapid-fire-technical',
] as const;

interface PressureTurn {
  id: string;
  kind: 'opening' | 'follow-up';
  prompt: string;
  purpose: string;
}

interface PressureSession {
  level: string;
  personality: string;
  guidance: string;
  turns: PressureTurn[];
}

export default function PressureMode({ kitId }: { kitId: string }) {
  const [level, setLevel] = useState<(typeof levels)[number]>('normal');
  const [personality, setPersonality] =
    useState<(typeof personalities)[number]>('friendly-engineer');
  const [session, setSession] = useState<PressureSession | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/pressure-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ level, personality }),
      });
      if (!response.ok) throw new Error('Unable to start pressure session');
      const nextSession = await response.json();
      setSession(nextSession);
      setSessionId(nextSession.session_id || '');
      setTurnIndex(0);
    } catch (err) {
      console.error('Error starting pressure session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const submitAnswer = async () => {
    if (sessionId && answer.trim() && currentTurn) {
      await apiFetch(`/api/kits/${kitId}/sessions/${sessionId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer, topic: currentTurn.prompt }),
      });
    }
    setAnswer('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setTurnIndex((index) =>
      Math.min(index + 1, (session?.turns.length || 1) - 1)
    );
  };

  const currentTurn = session?.turns[turnIndex];
  const isLastTurn = session ? turnIndex === session.turns.length - 1 : false;

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
          Progressive Interview Simulation
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
          Pressure Mode
        </h2>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Practice dynamic, unscripted probing. Defend technical decisions, state trade-offs, and outline concrete metrics under real interviewer personalities.
        </p>
      </div>

      {/* Setup Config Card */}
      {!session && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Pressure Level
              <select
                value={level}
                onChange={(event) =>
                  setLevel(event.target.value as (typeof levels)[number])
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-medium text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all capitalize"
              >
                {levels.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('-', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              Interviewer Persona
              <select
                value={personality}
                onChange={(event) =>
                  setPersonality(
                    event.target.value as (typeof personalities)[number]
                  )
                }
                className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-medium text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all capitalize"
              >
                {personalities.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll('-', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => void startSession()}
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-50 active:scale-[0.98]"
              >
                {loading ? 'Initializing Session...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Session View */}
      {session && currentTurn && (
        <div className="max-w-3xl space-y-5">
          {/* Progress & Persona Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 font-bold text-blue-300 capitalize">
                {session.personality.replaceAll('-', ' ')}
              </span>
              <span className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 font-semibold text-slate-400 capitalize">
                Level: {session.level.replaceAll('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-300">
                Turn {turnIndex + 1} of {session.turns.length}
              </span>
              {/* Progress Bar */}
              <div className="h-2 w-24 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${((turnIndex + 1) / session.turns.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Prompt & Answer Card */}
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-blue-400">
              {currentTurn.kind === 'opening'
                ? 'Opening Prompt'
                : `Follow-up Probe • ${currentTurn.purpose}`}
            </span>

            <h3 className="text-xl sm:text-2xl font-bold leading-relaxed text-slate-100">
              {currentTurn.prompt}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-800/80 pt-4">
              State explicit assumptions, explain architectural or process trade-offs, and detail specific metrics you would measure.
            </p>

            <textarea
              ref={textareaRef}
              value={answer}
              onChange={handleAnswerChange}
              placeholder="Type your response here..."
              rows={4}
              className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </article>

          {/* Action Bar */}
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setSession(null);
                setSessionId('');
                setAnswer('');
                setTurnIndex(0);
              }}
              className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-400 transition-colors hover:border-slate-700 hover:text-white"
            >
              End & Start New
            </button>

            <button
              type="button"
              onClick={() => void submitAnswer()}
              disabled={!answer.trim()}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLastTurn ? 'Complete Session' : 'Submit & Next Probe'}
            </button>
          </div>

          {/* Guidance Note */}
          {session.guidance && (
            <p className="text-xs text-slate-500 leading-relaxed italic border-t border-slate-800/60 pt-3">
              Focus Note: {session.guidance}
            </p>
          )}
        </div>
      )}
    </section>
  );
}