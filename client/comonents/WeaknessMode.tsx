'use client';

import { useEffect, useState } from 'react';

interface BlindSpot {
  requirement_id: string;
  topic: string;
  priority: string;
  question_count: number;
  average_confidence: number;
  reason: string;
  impact: string;
}

interface DailyWeakness {
  date: string;
  requirement_id: string;
  topic: string;
  why_it_matters: string;
  explanation: string;
  flashcard_ids: string[];
  question_ids: string[];
  practical_scenario: string;
  follow_up: string;
}

export default function WeaknessMode({ kitId }: { kitId: string }) {
  const [blindSpots, setBlindSpots] = useState<BlindSpot[]>([]);
  const [daily, setDaily] = useState<DailyWeakness | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'high'>('all');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetch(`/api/kits/${kitId}/blind-spots`),
      fetch(`/api/kits/${kitId}/daily-weakness`),
    ])
      .then(async ([blindSpotResponse, dailyResponse]) => {
        const spotsData = blindSpotResponse.ok
          ? await blindSpotResponse.json()
          : { blind_spots: [] };
        const dailyData = dailyResponse.ok
          ? await dailyResponse.json()
          : { daily_weakness: null };

        if (isMounted) {
          setBlindSpots(spotsData.blind_spots || []);
          setDaily(dailyData.daily_weakness || null);
        }
      })
      .catch((err) => console.error('Error fetching weakness data:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [kitId]);

  const filteredSpots = blindSpots.filter((spot) =>
    filter === 'high' ? spot.impact.toLowerCase() === 'high' : true
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
            Adaptive Practice
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
            Blind Spots
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Key requirement topics thinly covered or weakly practiced relative to job description priorities.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({blindSpots.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('high')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              filter === 'high'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            High Impact ({blindSpots.filter((s) => s.impact.toLowerCase() === 'high').length})
          </button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-4">
          <div className="h-48 w-full animate-pulse rounded-2xl border border-slate-800 bg-slate-900/50" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-32 w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
            <div className="h-32 w-full animate-pulse rounded-xl border border-slate-800 bg-slate-900/50" />
          </div>
        </div>
      ) : (
        <>
          {/* Daily Focus Card */}
          {daily && (
            <article className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 via-slate-900/90 to-slate-900 p-6 shadow-xl backdrop-blur-md">
              <div className="absolute top-0 right-0 h-32 w-32 -mr-10 -mt-10 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400">
                    Daily Priority Focus • {daily.date}
                  </span>
                  <h3 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                    {daily.topic}
                  </h3>
                </div>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
                  Daily Focus
                </span>
              </div>

              <p className="mt-3 text-sm font-medium leading-relaxed text-blue-100/90">
                {daily.why_it_matters}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                {daily.explanation}
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Practical Scenario
                  </span>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {daily.practical_scenario}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Expected Follow-up
                  </span>
                  <p className="mt-1.5 text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {daily.follow_up}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-4 text-xs font-medium text-slate-400 border-t border-slate-800/80 pt-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  {daily.question_ids.length} Questions
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  {daily.flashcard_ids.length} Flashcards
                </span>
              </div>
            </article>
          )}

          {/* Blindspots Grid */}
          {filteredSpots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
              <p className="text-sm font-medium text-slate-400">
                No blind spots detected matching your current filter.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Keep practicing exercises to build comprehensive coverage.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredSpots.map((spot) => {
                const isHigh = spot.impact.toLowerCase() === 'high';
                return (
                  <article
                    key={spot.requirement_id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition-all hover:border-slate-700 shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-bold text-slate-100 text-base">
                          {spot.topic}
                        </h3>
                        <span
                          className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                            isHigh
                              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {spot.impact} impact
                        </span>
                      </div>

                      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-slate-400">
                        {spot.reason}
                      </p>
                    </div>

                    <div className="mt-5 border-t border-slate-800/80 pt-3.5 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        <span>{spot.question_count} questions</span>
                        <span className="capitalize text-slate-500">• {spot.priority} priority</span>
                      </div>

                      {/* Confidence Meter */}
                      <div className="flex items-center gap-1.5" title={`Confidence: ${spot.average_confidence}/3`}>
                        <span className="text-[10px] text-slate-500 uppercase font-semibold">Conf</span>
                        <div className="flex gap-1">
                          {[1, 2, 3].map((step) => (
                            <span
                              key={step}
                              className={`h-2 w-2 rounded-full ${
                                step <= spot.average_confidence
                                  ? spot.average_confidence <= 1
                                    ? 'bg-rose-500'
                                    : spot.average_confidence === 2
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}