'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface DayPlan {
  top_question_ids: string[];
  flashcard_ids: string[];
  company_summary: string;
  introduction: string;
  star_story_ids: string[];
  questions_to_ask: string[];
}

interface Debrief {
  remembered_questions: string[];
  unanswered_topics: string[];
  interviewer_feedback: string;
  confidence: number;
  outcome: string;
  predicted_topics: string[];
  gaps: string[];
  next_focus: string[];
}

export function InterviewDay({ kitId }: { kitId: string }) {
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/api/kits/${kitId}/interview-day`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        setPlan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching interview day plan:', err);
        setLoading(false);
      });
  }, [kitId]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-sm font-medium text-slate-400">
        Loading interview day preparation material...
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-sm font-medium text-slate-400">
        No interview day preparation data found for this kit.
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
          Distraction-Free Preparation
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
          Interview Day
        </h2>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          High-priority material compiled for rapid warm-up and final review right before your session.
        </p>
      </div>

      {/* Priority Review Focus */}
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              Priority Questions
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              {plan.top_question_ids.length} Items
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.top_question_ids.map((id) => (
              <span
                key={id}
                className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300"
              >
                {id}
              </span>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm tracking-wide">
              Weakest Flashcards
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {plan.flashcard_ids.length} Items
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plan.flashcard_ids.map((id) => (
              <span
                key={id}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
              >
                {id}
              </span>
            ))}
          </div>
        </article>
      </div>

      {/* Core Speaking Points Card */}
      <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6">
        {/* Pitch Introduction */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
            Elevator Pitch & Introduction
          </span>
          <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
            {plan.introduction}
          </p>
        </div>

        {/* Company Summary */}
        <div className="space-y-2 border-t border-slate-800/80 pt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
            Company Brief & Context
          </span>
          <p className="text-sm leading-relaxed text-slate-200 bg-slate-950/60 rounded-xl border border-slate-800/80 p-4">
            {plan.company_summary}
          </p>
        </div>

        {/* Questions to Ask */}
        <div className="space-y-3 border-t border-slate-800/80 pt-5">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
            Questions to Ask Interviewers
          </span>
          <ul className="space-y-2">
            {plan.questions_to_ask.map((question, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-950/40 rounded-lg border border-slate-800/60 p-3"
              >
                <span className="text-blue-400 font-bold">•</span>
                <span>{question}</span>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>
  );
}

export function DebriefMode({ kitId }: { kitId: string }) {
  const [remembered, setRemembered] = useState('');
  const [unanswered, setUnanswered] = useState('');
  const [feedback, setFeedback] = useState('');
  const [confidence, setConfidence] = useState(2);
  const [outcome, setOutcome] = useState('pending');
  const [result, setResult] = useState<Debrief | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rememberedRef = useRef<HTMLTextAreaElement>(null);
  const feedbackRef = useRef<HTMLTextAreaElement>(null);

  const handleRememberedChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setRemembered(e.target.value);
    if (rememberedRef.current) {
      rememberedRef.current.style.height = 'auto';
      rememberedRef.current.style.height = `${rememberedRef.current.scrollHeight}px`;
    }
  };

  const handleFeedbackChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(e.target.value);
    if (feedbackRef.current) {
      feedbackRef.current.style.height = 'auto';
      feedbackRef.current.style.height = `${feedbackRef.current.scrollHeight}px`;
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/debrief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remembered_questions: remembered.split('\n').filter(Boolean),
          unanswered_topics: unanswered
            .split(',')
            .map((topic) => topic.trim())
            .filter(Boolean),
          interviewer_feedback: feedback,
          confidence,
          outcome,
        }),
      });
      if (response.ok) {
        setResult(await response.json());
      }
    } catch (err) {
      console.error('Error submitting debrief:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
          After the Interview
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
          Post-Interview Debrief
        </h2>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Log questions, knowledge gaps, and interviewer feedback to calibrate future practice sessions.
        </p>
      </div>

      {/* Debrief Form Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Questions Remembered
          </label>
          <textarea
            ref={rememberedRef}
            value={remembered}
            onChange={handleRememberedChange}
            placeholder="List questions you remember being asked (one per line)..."
            rows={3}
            className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Unanswered / Difficult Topics
          </label>
          <input
            value={unanswered}
            onChange={(event) => setUnanswered(event.target.value)}
            placeholder="Topics or concepts you struggled with (comma-separated)..."
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            Interviewer Feedback & Notes
          </label>
          <textarea
            ref={feedbackRef}
            value={feedback}
            onChange={handleFeedbackChange}
            placeholder="Direct feedback, subtle hints, or verbal cues given during the call..."
            rows={2}
            className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            Self-Assessed Confidence
            <select
              value={confidence}
              onChange={(event) => setConfidence(Number(event.target.value))}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-medium normal-case text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            >
              <option value={1}>1 - Low Confidence</option>
              <option value={2}>2 - Mixed / Uncertain</option>
              <option value={3}>3 - High Confidence</option>
            </select>
          </label>

          <label className="space-y-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
            Interview Outcome
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm font-medium normal-case text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
            >
              <option value="pending">Pending</option>
              <option value="advanced">Advanced to Next Round</option>
              <option value="offer">Received Offer</option>
              <option value="declined">Declined / Rejected</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={submitting}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? 'Saving Debrief...' : 'Save Debrief'}
        </button>
      </div>

      {/* Generated Practice Focus Card */}
      {result && (
        <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Analysis Complete
            </span>
            <span className="text-xs font-medium text-slate-400 capitalize">
              Outcome: {result.outcome}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-100">
            Recommended Next Practice Focus
          </h3>

          <ul className="space-y-2">
            {result.next_focus.map((topic, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3.5"
              >
                <span className="text-blue-400 font-bold">•</span>
                <span>{topic}</span>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}