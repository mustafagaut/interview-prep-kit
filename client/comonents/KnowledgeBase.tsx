'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface Note {
  _id: string;
  title: string;
  content: string;
  url: string;
  skills: string[];
  source_type: string;
}

export default function KnowledgeBase({ kitId }: { kitId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [skills, setSkills] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    apiFetch(`/api/kits/${kitId}/knowledge`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        setNotes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching knowledge notes:', err);
        setLoading(false);
      });
  }, [kitId]);

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const addNote = async () => {
    if (!title.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/knowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          url,
          skills: skills
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean),
          source_type: 'note',
        }),
      });

      if (response.ok) {
        const createdNote = await response.json();
        setNotes((current) => [createdNote, ...current]);
        setTitle('');
        setContent('');
        setSkills('');
        setUrl('');
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await apiFetch(`/api/kits/${kitId}/knowledge/${noteId}`, {
        method: 'DELETE',
      });
      setNotes((current) => current.filter((note) => note._id !== noteId));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header & Export Action Group */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
            Connected Learning
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
            Knowledge Base
          </h2>
          <p className="mt-1 text-sm text-slate-400 max-w-2xl">
            Save notes, code snippets, and external references mapped directly to core skills and requirements.
          </p>
        </div>

        {/* Download / Export Options */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <span className="px-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Export
          </span>
          <a
            href={`/api/kits/${kitId}/export?format=markdown`}
            download
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
          >
            Markdown
          </a>
          <a
            href={`/api/kits/${kitId}/export?format=csv`}
            download
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
          >
            CSV
          </a>
          <a
            href={`/api/kits/${kitId}/export?format=json`}
            download
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-900 hover:text-white"
          >
            JSON
          </a>
        </div>
      </div>

      {/* Note Creation Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Add New Knowledge Entry
        </span>

        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Note title or key concept"
            className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
          <input
            value={skills}
            onChange={(event) => setSkills(event.target.value)}
            placeholder="Skills (comma-separated, e.g. React, Next.js)"
            className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
          />
        </div>

        <input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Source URL or documentation link (optional)"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Write a note, architecture explanation, or source-grounded insight..."
          rows={3}
          className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />

        <button
          type="button"
          onClick={() => void addNote()}
          disabled={submitting || !title.trim() || !content.trim()}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {submitting ? 'Saving Note...' : 'Save Note'}
        </button>
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-xs text-slate-500">
          Loading knowledge base notes...
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-sm text-slate-400">
          No knowledge notes saved yet. Create your first note above!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((note) => (
            <article
              key={note._id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg backdrop-blur-xl transition-all hover:border-slate-700 space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-100 text-base group-hover:text-blue-300 transition-colors">
                    {note.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => void deleteNote(note._id)}
                    className="rounded-lg p-1 text-xs font-semibold text-rose-400/70 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                    title="Delete Note"
                  >
                    Delete
                  </button>
                </div>

                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-300">
                  {note.content}
                </p>
              </div>

              <div className="space-y-3 border-t border-slate-800/80 pt-3">
                {/* Skills Tags */}
                {note.skills && note.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {note.skills.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-300"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* External URL Badge */}
                {note.url && (
                  <a
                    href={note.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 hover:underline truncate max-w-full"
                  >
                    <span className="text-[10px]">🔗</span>
                    <span className="truncate">{note.url}</span>
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}