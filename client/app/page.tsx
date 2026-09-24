'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';

interface MissionControl {
  kit_id: string;
  target_role: string;
  company: string;
  readiness: { overall: number };
  next_action: { title: string; reason: string; target_tab: string };
  top_risks: { topic: string; average_confidence: number }[];
}

export default function Home() {
  const router = useRouter();
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [days, setDays] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [mission, setMission] = useState<MissionControl | null>(null);
  const [missionVisible, setMissionVisible] = useState(true);

  useEffect(() => {
    setMissionVisible(window.localStorage.getItem('interview-prep-mission-hidden') !== 'true');
    fetch(`${apiBase}/kits/dashboard`)
      .then((response) =>
        response.ok ? response.json() : Promise.reject(new Error('Dashboard unavailable'))
      )
      .then((data) => setMission(data.kit))
      .catch(() => setMission(null));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/kits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, company_url: companyUrl, company, role, days }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to generate kit');
      router.push(`/kit/${data._id}`);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to generate kit');
    } finally {
      setIsSubmitting(false);
    }
  }

  const toggleMissionVisibility = (visible: boolean) => {
    setMissionVisible(visible);
    if (visible) {
      window.localStorage.removeItem('interview-prep-mission-hidden');
    } else {
      window.localStorage.setItem('interview-prep-mission-hidden', 'true');
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F5F7FA]">
      <div className="mx-auto max-w-7xl space-y-10 px-6 py-10 lg:px-12">
        {/* Mission Control Card */}
        {mission && missionVisible && (
          <section className="relative rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_12px_36px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-8">
            <button
              type="button"
              title="Hide mission control"
              aria-label="Hide mission control"
              onClick={() => toggleMissionVisibility(false)}
              className="absolute right-4 top-4 rounded-lg border border-white/10 px-2.5 py-1 text-sm text-[#6F7887] transition-colors hover:border-white/30 hover:text-white"
            >
              ×
            </button>

            <div className="flex flex-wrap items-start justify-between gap-6 pr-8">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#6F7887]">
                  Interview Mission Control
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {mission.target_role}
                </h2>
                <p className="mt-1 text-sm text-[#A7AFBD]">{mission.company}</p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-4xl font-black text-[#60A5FA]">
                  {mission.readiness.overall}
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-[#6F7887]">
                  Readiness / 100
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <div className="rounded-xl border border-blue-400/20 bg-[#2563EB]/10 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-200">
                  What should you do now?
                </p>
                <p className="mt-1 text-lg sm:text-xl font-bold text-white">
                  {mission.next_action.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-blue-100">
                  {mission.next_action.reason}
                </p>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/kit/${mission.kit_id}`)}
                className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-blue-500 active:scale-[0.98]"
              >
                Start Next Best Practice
              </button>
            </div>

            {mission.top_risks.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2 pt-2 border-t border-white/5">
                <span className="text-xs font-bold uppercase tracking-wide text-[#6F7887] mr-1">
                  Top Risks
                </span>
                {mission.top_risks.map((risk) => (
                  <span
                    key={risk.topic}
                    className="rounded-full bg-red-400/10 border border-red-500/20 px-3 py-1 text-xs font-semibold text-red-200"
                  >
                    {risk.topic} · {risk.average_confidence}/3
                  </span>
                ))}
              </div>
            )}
          </section>
        )}

        {!missionVisible && mission && (
          <button
            type="button"
            onClick={() => toggleMissionVisibility(true)}
            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-[#A7AFBD] transition-colors hover:border-white/30 hover:text-white"
          >
            Show Mission Control
          </button>
        )}

        {/* Hero & Form Section */}
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <section className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#60A5FA]">
              Interview Intelligence OS
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight tracking-tight sm:text-6xl sm:leading-[1.05]">
              Walk into the interview with a plan.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-[#A7AFBD] sm:text-lg">
              Turn a job description and a company URL into a targeted question bank, practice deck, and adaptive preparation system.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs sm:text-sm text-[#A7AFBD]">
              <div>
                <strong className="block text-xl sm:text-2xl font-bold text-[#F5F7FA]">01</strong>
                Requirements
              </div>
              <div>
                <strong className="block text-xl sm:text-2xl font-bold text-[#F5F7FA]">02</strong>
                Questions
              </div>
              <div>
                <strong className="block text-xl sm:text-2xl font-bold text-[#F5F7FA]">03</strong>
                Practice
              </div>
            </div>
          </section>

          {/* Builder Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white p-6 text-[#111827] shadow-[12px_12px_0_#1d4ed8] sm:p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-5">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Build Your Kit</h2>
                <p className="mt-1 text-sm text-slate-500">
                  A little context makes the generated questions sharper.
                </p>
              </div>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 shrink-0">
                1-60 days
              </span>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Job Description <span className="text-red-500">*</span>
                <textarea
                  required
                  value={jd}
                  onChange={(event) => setJd(event.target.value)}
                  placeholder="Paste the full job description or key responsibilities..."
                  className="mt-1.5 min-h-40 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3.5 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Company URL <span className="text-red-500">*</span>
                  <input
                    required
                    type="url"
                    value={companyUrl}
                    onChange={(event) => setCompanyUrl(event.target.value)}
                    placeholder="https://company.com"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Prep Duration (Days) <span className="text-red-500">*</span>
                  <input
                    required
                    type="number"
                    min={1}
                    max={60}
                    value={days}
                    onChange={(event) => setDays(Number(event.target.value))}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Company Name
                  <input
                    value={company}
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="Optional (e.g. Acme Corp)"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </label>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Role Title
                  <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Optional (e.g. Senior Data Analyst)"
                    className="mt-1.5 w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-sm font-normal text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600"
                  />
                </label>
              </div>
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
              className="mt-6 w-full rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60 shadow-md"
            >
              {isSubmitting ? 'Researching and building kit...' : 'Generate Interview Kit'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}