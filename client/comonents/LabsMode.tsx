'use client';

import { ChangeEvent, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface Lab {
  title: string;
  prompt: string;
  requirements: string[];
  criteria: string[];
}

interface Evaluation {
  total: number;
  criteria: { label: string; score: number; evidence: string }[];
  strengths: string[];
  improvements: string[];
}

export default function LabsMode({ kitId }: { kitId: string }) {
  const [type, setType] = useState<'architecture' | 'coding'>('architecture');
  const [lab, setLab] = useState<Lab | null>(null);
  const [answer, setAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingLab, setLoadingLab] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const loadLab = async () => {
    setLoadingLab(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/labs/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      if (response.ok) {
        const data = await response.json();
        setLab(data.lab);
        setEvaluation(null);
        setAnswer('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error('Error loading lab:', err);
    } finally {
      setLoadingLab(false);
    }
  };

  const handleAnswerChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setAnswer(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/labs/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      if (response.ok) {
        const data = await response.json();
        setLab(data.lab);
        setEvaluation(data.evaluation);
      }
    } catch (err) {
      console.error('Error submitting evaluation:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
          Applied Engineering Practice
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
          Architecture & Coding Labs
        </h2>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Practice concrete system designs and technical implementations with instant AI evaluation of trade-offs, assumptions, and edge cases.
        </p>
      </div>

      {/* Lab Type Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setType('architecture')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              type === 'architecture'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture Lab
          </button>
          <button
            type="button"
            onClick={() => setType('coding')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
              type === 'coding'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Coding Lab
          </button>
        </div>

        <button
          type="button"
          onClick={() => void loadLab()}
          disabled={loadingLab}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-50"
        >
          {loadingLab ? 'Loading Lab...' : 'Generate New Lab'}
        </button>
      </div>

      {/* Lab Workspace */}
      {lab && (
        <div className="space-y-6">
          {/* Main Prompt Card */}
          <article className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
                {lab.title}
              </span>
              <span className="text-xs text-slate-500 capitalize">
                Type: {type}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold leading-relaxed text-slate-100">
              {lab.prompt}
            </h3>

            {/* Criteria Badges */}
            {lab.criteria && lab.criteria.length > 0 && (
              <div className="border-t border-slate-800/80 pt-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Target Criteria
                </span>
                <div className="flex flex-wrap gap-2">
                  {lab.criteria.map((item, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-300"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Answer Input */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Your Approach & Explanation
              </label>
              <textarea
                ref={textareaRef}
                value={answer}
                onChange={handleAnswerChange}
                placeholder="Describe your design, architectural assumptions, data structures, trade-offs, and testing strategies..."
                rows={6}
                className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              disabled={submitting || !answer.trim()}
              className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? 'Evaluating Solution...' : 'Evaluate Approach'}
            </button>
          </article>

          {/* Evaluation Results Card */}
          {evaluation && (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                    Feedback & Analysis
                  </span>
                  <h4 className="text-lg font-bold text-slate-100 mt-0.5">
                    Explainable Evaluation
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-blue-400 sm:text-4xl">
                    {evaluation.total}
                  </span>
                  <span className="text-xs font-bold text-slate-500 block">
                    /100 Points
                  </span>
                </div>
              </div>

              {/* Criteria Score Breakdown Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {evaluation.criteria.map((criterion, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-200">
                      <span>{criterion.label}</span>
                      <span className="text-blue-400 font-bold">
                        {criterion.score} pts
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-400">
                      {criterion.score > 0
                        ? 'Evidence detected in submission.'
                        : criterion.evidence}
                    </p>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-800/80 pt-5">
                {evaluation.strengths && evaluation.strengths.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Strengths Identified
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {evaluation.strengths.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {evaluation.improvements && evaluation.improvements.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                      Key Areas for Improvement
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {evaluation.improvements.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </article>
          )}
        </div>
      )}
    </section>
  );
}