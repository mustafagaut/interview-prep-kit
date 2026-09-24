'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';

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

interface InterviewDayProps {
  kitId: string;
  onOpenQuestion: (questionId: string) => void;
  onOpenFlashcard: (flashcardId: string) => void;
}

export function InterviewDay({
  kitId,
  onOpenQuestion,
  onOpenFlashcard,
}: InterviewDayProps) {
  const [plan, setPlan] = useState<DayPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPlan = async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/kits/${kitId}/interview-day`);

        if (!response.ok) {
          throw new Error('Failed to fetch interview day preparation plan');
        }

        const data: DayPlan = await response.json();

        if (!cancelled) {
          setPlan(data);
        }
      } catch (err) {
        console.error('Error fetching interview day plan:', err);

        if (!cancelled) {
          setPlan(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchPlan();

    return () => {
      cancelled = true;
    };
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

        <p className="mt-1 max-w-2xl text-sm text-slate-400">
          High-priority material compiled for rapid warm-up and final review right before your session.
        </p>
      </div>

      {/* Priority Review Focus */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Priority Questions */}
        <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wide text-slate-100">
              Priority Questions
            </h3>

            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              {plan.top_question_ids.length} Items
            </span>
          </div>

          {plan.top_question_ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plan.top_question_ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenQuestion(id)}
                  title={`Open question ${id}`}
                  className="cursor-pointer rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-all hover:border-blue-400 hover:bg-blue-500/20 hover:text-blue-200 active:scale-95"
                >
                  {id}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No priority questions available.
            </p>
          )}
        </article>

        {/* Weakest Flashcards */}
        <article className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wide text-slate-100">
              Weakest Flashcards
            </h3>

            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
              {plan.flashcard_ids.length} Items
            </span>
          </div>

          {plan.flashcard_ids.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {plan.flashcard_ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenFlashcard(id)}
                  title={`Open flashcard ${id}`}
                  className="cursor-pointer rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-all hover:border-amber-400 hover:bg-amber-500/20 hover:text-amber-200 active:scale-95"
                >
                  {id}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No weak flashcards available.
            </p>
          )}
        </article>
      </div>

      {/* Core Speaking Points */}
      <article className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl sm:p-8">
        {/* Pitch Introduction */}
        <div className="space-y-2">
          <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">
            Elevator Pitch & Introduction
          </span>

          <p className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
            {plan.introduction}
          </p>
        </div>

        {/* Company Summary */}
        <div className="space-y-2 border-t border-slate-800/80 pt-5">
          <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">
            Company Brief & Context
          </span>

          <p className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
            {plan.company_summary}
          </p>
        </div>

        {/* Questions to Ask */}
        <div className="space-y-3 border-t border-slate-800/80 pt-5">
          <span className="block text-xs font-bold uppercase tracking-wider text-blue-400">
            Questions to Ask Interviewers
          </span>

          {plan.questions_to_ask.length > 0 ? (
            <ul className="space-y-2">
              {plan.questions_to_ask.map((question, idx) => (
                <li
                  key={`${idx}-${question}`}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40 p-3 text-xs text-slate-300 sm:text-sm"
                >
                  <span className="font-bold text-blue-400">•</span>
                  <span>{question}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500">
              No interviewer questions available.
            </p>
          )}
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
      const response = await fetch(`/api/kits/${kitId}/debrief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remembered_questions: remembered.split('\n').filter(Boolean),
          unanswered_topics: unanswered.split(',').map((topic) => topic.trim()).filter(Boolean),
          interviewer_feedback: feedback,
          confidence,
          outcome,
        }),
      });

      if (response.ok) {
        const data: Debrief = await response.json();
        setResult(data);
      }
    } catch (err) {
      console.error('Error submitting debrief:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl backdrop-blur-xl">
        <h2 className="text-xl font-bold text-slate-100">Post-Interview Debrief</h2>
        <p className="mt-1 text-sm text-slate-400">
          Record your experience to generate insights and track your interview performance over time.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Questions You Remember Being Asked (One per line)
            </label>
            <textarea
              ref={rememberedRef}
              value={remembered}
              onChange={handleRememberedChange}
              placeholder="e.g. How do you handle database migration locks?"
              className="mt-2 min-h-24 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Unanswered or Difficult Topics (Comma separated)
            </label>
            <input
              type="text"
              value={unanswered}
              onChange={(e) => setUnanswered(e.target.value)}
              placeholder="e.g. Kafka partition rebalancing, CSS Grid auto-fit"
              className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Interviewer Feedback / Notes
            </label>
            <textarea
              ref={feedbackRef}
              value={feedback}
              onChange={handleFeedbackChange}
              placeholder="Any specific comments or feedback shared during the call..."
              className="mt-2 min-h-20 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Overall Confidence (1 to 5)
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Outcome Status
              </label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-200 outline-none focus:border-blue-500"
              >
                <option value="pending">Pending</option>
                <option value="passed">Passed / Next Round</option>
                <option value="rejected">Rejected</option>
                <option value="offer">Offer Extended</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="mt-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Save Debrief'}
          </button>
        </div>

        {result && (
          <div className="mt-8 border-t border-slate-800 pt-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-100">Debrief Analysis Result</h3>
            {result.predicted_topics?.length > 0 && (
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase">Predicted Next Round Topics</span>
                <ul className="mt-2 list-disc list-inside text-sm text-slate-300">
                  {result.predicted_topics.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.gaps?.length > 0 && (
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase">Identified Knowledge Gaps</span>
                <ul className="mt-2 list-disc list-inside text-sm text-slate-300">
                  {result.gaps.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}