'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

const categories = [
  'leadership',
  'conflict',
  'failure',
  'difficult-bug',
  'production-incident',
  'performance-improvement',
  'teamwork',
  'ownership',
  'learning',
  'tight-deadline',
  'customer-issue',
] as const;

type Story = {
  id: string;
  title: string;
  category: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  analysis?: {
    missing: string[];
    completeness: number;
    follow_ups: string[];
  };
};

type StoryDraft = Omit<Story, 'id' | 'analysis'>;

const emptyDraft: StoryDraft = {
  title: '',
  category: 'leadership',
  situation: '',
  task: '',
  action: '',
  result: '',
};

function AutoResizingTextarea({
  value,
  onChange,
  placeholder,
  rows = 2,
  className = '',
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => {
        onChange(e.target.value);
        adjustHeight();
      }}
      className={`w-full resize-none overflow-hidden transition-all ${className}`}
    />
  );
}

export default function StoryBank({ kitId }: { kitId: string }) {
  const [stories, setStories] = useState<Story[]>([]);
  const [draft, setDraft] = useState<StoryDraft>(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ref targeted to scroll down to the story list/creation flow if needed
  const listTopRef = useRef<HTMLDivElement>(null);

  const loadStories = async () => {
    try {
      const response = await apiFetch(`/api/kits/${kitId}/stories`);
      if (response.ok) setStories(await response.json());
    } catch (err) {
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStories();
  }, [kitId]);

  const addStory = async () => {
    if (!draft.title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      if (response.ok) {
        const createdStory = await response.json();
        setStories((current) => [...current, createdStory]);
        setDraft(emptyDraft);

        // Smoothly scroll down to display the updated list/new item
        setTimeout(() => {
          listTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (err) {
      console.error('Failed to save story:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStory = async (story: Story, field: keyof StoryDraft, value: string) => {
    const updated = { ...story, [field]: value };
    setStories((current) =>
      current.map((item) => (item.id === story.id ? updated : item))
    );
    try {
      await apiFetch(`/api/kits/${kitId}/stories/${story.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Failed to update story:', err);
    }
  };

  const deleteStory = async (storyId: string) => {
    setStories((current) => current.filter((story) => story.id !== storyId));
    try {
      await apiFetch(`/api/kits/${kitId}/stories/${storyId}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to delete story:', err);
      void loadStories();
    }
  };

  return (
    <section className="space-y-8">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
          <span>Behavioral Preparation</span>
        </div>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white">
          Story Bank
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Craft evidence-rich STAR stories and discover areas interviewers are likely to probe.
        </p>
      </div>

      {/* Story Creation Form */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <h3 className="text-base font-semibold text-slate-200">Add New Story</h3>
          <span className="text-xs text-slate-500">Framework: STAR</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g., Scaling order processing service"
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Category</label>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors capitalize"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replaceAll('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {(['situation', 'task', 'action', 'result'] as const).map((field) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 capitalize">{field}</label>
              <AutoResizingTextarea
                value={draft[field]}
                rows={3}
                onChange={(val) => setDraft({ ...draft, [field]: val })}
                placeholder={`Detail the ${field}...`}
                className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!draft.title.trim() || isSubmitting}
            onClick={() => void addStory()}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {isSubmitting ? 'Saving...' : 'Save Story'}
          </button>
        </div>
      </div>

      {/* Target reference anchor for auto-scroll */}
      <div ref={listTopRef} />

      {/* Stories List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-slate-500">
          <svg className="mr-2 h-5 w-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading stories...
        </div>
      ) : stories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center">
          <h4 className="text-base font-semibold text-slate-200">No stories added yet</h4>
          <p className="mt-1 text-sm text-slate-500">Use the form above to add your first STAR story.</p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {stories.map((story) => {
            const score = story.analysis?.completeness || 0;
            return (
              <article
                key={story.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md transition-all hover:border-slate-700 shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-100">{story.title}</h3>
                      <span className="mt-1 inline-block rounded-md bg-slate-800 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-400">
                        {story.category.replaceAll('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex h-11 w-11 items-center justify-center">
                        <svg className="h-11 w-11 -rotate-90 transform" viewBox="0 0 36 36">
                          <path
                            className="text-slate-800"
                            strokeWidth="3.5"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-blue-500'}
                            strokeDasharray={`${score}, 100`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                        </svg>
                        <span className="absolute text-[10px] font-bold text-slate-200">{score}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {(['situation', 'task', 'action', 'result'] as const).map((field) => (
                      <div key={field} className="space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {field}
                        </span>
                        <AutoResizingTextarea
                          value={story[field]}
                          rows={2}
                          onChange={(val) => updateStory(story, field, val)}
                          className="rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-blue-500 focus:bg-slate-950 focus:text-slate-100 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {(story.analysis?.missing.length || 0) > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">
                      <span className="font-semibold">Suggested Additions:</span> {story.analysis?.missing.join(', ')}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  <p className="truncate text-slate-400 max-w-[80%]" title={story.analysis?.follow_ups[0]}>
                    {story.analysis?.follow_ups[0] ? `💡 ${story.analysis.follow_ups[0]}` : 'Ready for review'}
                  </p>
                  <button
                    type="button"
                    onClick={() => void deleteStory(story.id)}
                    className="font-medium text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}