'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PracticeMode from '@/comonents/PracticeMode';
import ReadinessRadar, { type ReadinessReport } from '@/comonents/ReadinessRadar';
import PressureMode from '@/comonents/PressureMode';
import ResumeAnalysis from '@/comonents/ResumeAnalysis';
import StoryBank from '@/comonents/StoryBank';
import WeaknessMode from '@/comonents/WeaknessMode';
import { DebriefMode, InterviewDay } from '@/comonents/InterviewDay';
import LabsMode from '@/comonents/LabsMode';
import KnowledgeBase from '@/comonents/KnowledgeBase';
import { apiFetch, isLoggedIn } from '@/lib/auth';

type Category = 'technical' | 'behavioural' | 'system-design' | 'company-fit';

interface Question {
  id: string;
  requirement_ids: string[];
  category: Category;
  prompt: string;
  answer_outline: string;
  difficulty: number;
  is_edited?: boolean;
  is_pinned?: boolean;
  is_custom?: boolean;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence_score?: number;
}

interface Kit {
  source: { company: string; company_url: string };
  role: { title: string; requirements: { id: string; text: string }[] };
  company_brief: { summary: string; what_they_do: string };
  questions: Question[];
  flashcards: Flashcard[];
  schedule: {
    days_available: number;
    days: { day: number; focus: string; question_ids: string[]; minutes: number }[];
  };
}

const apiBase = process.env.NEXT_PUBLIC_API_URL || '/api';

export default function KitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [kit, setKit] = useState<Kit | null>(null);
  const [activeTab, setActiveTab] = useState<
    | 'brief'
    | 'questions'
    | 'flashcards'
    | 'schedule'
    | 'pressure'
    | 'resume'
    | 'stories'
    | 'blind-spots'
    | 'interview-day'
    | 'debrief'
    | 'labs'
    | 'knowledge'
  >('questions');

  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState<Category>('technical');
  const [newPrompt, setNewPrompt] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [selectedScheduleDay, setSelectedScheduleDay] = useState<number | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/login');
      return;
    }
    apiFetch(`${apiBase}/kits/${id}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load kit'))))
      .then((data) => setKit(data))
      .catch(() => setKit(null));
  }, [id]);

  useEffect(() => {
    if (!isLoggedIn()) return;
    apiFetch(`${apiBase}/kits/${id}/readiness`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('Unable to load readiness'))))
      .then((data) => setReadiness(data))
      .catch(() => setReadiness(null));
  }, [id, kit?.questions.length, kit?.flashcards.length]);

  const updateKit = async (nextKit: Kit) => {
    setKit(nextKit);
    setSaving(true);
    try {
      await apiFetch(`${apiBase}/kits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: nextKit.questions, flashcards: nextKit.flashcards }),
      });
    } finally {
      setSaving(false);
    }
  };

  const openQuestionFromInterviewDay = (questionId: string) => {
    setSelectedScheduleDay(null);
    setActiveTab('questions');
    setTimeout(() => {
      const el = document.getElementById(`question-${questionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const openFlashcardFromInterviewDay = (_flashcardId: string) => {
    setActiveTab('flashcards');
  };

  if (!kit) {
    return (
      <main className="min-h-screen bg-[#0B0D10] p-8 text-[#F5F7FA]">
        <div className="flex h-64 items-center justify-center text-slate-400">
          Loading interview kit...
        </div>
      </main>
    );
  }

  const moveQuestion = (questionIndex: number, direction: -1 | 1) => {
    const targetIndex = questionIndex + direction;
    if (targetIndex < 0 || targetIndex >= kit.questions.length) return;
    const questions = [...kit.questions];
    [questions[questionIndex], questions[targetIndex]] = [
      questions[targetIndex],
      questions[questionIndex],
    ];
    void updateKit({ ...kit, questions });
  };

  const regenerate = async (category: Category) => {
    const response = await apiFetch(`${apiBase}/kits/${id}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category }),
    });
    if (response.ok) {
      setKit(await response.json());
    }
  };

  const addQuestion = () => {
    const prompt = newPrompt.trim();
    const answer_outline = newAnswer.trim();
    if (!prompt || !answer_outline) return;
    const nextId =
      Math.max(0, ...kit.questions.map((question) => Number(question.id.replace(/^q/, '')) || 0)) + 1;
    const question: Question = {
      id: `q${nextId}`,
      requirement_ids: [],
      category: newCategory,
      prompt,
      answer_outline,
      difficulty: 2,
      is_edited: true,
      is_custom: true,
      is_pinned: false,
    };
    void updateKit({ ...kit, questions: [...kit.questions, question] });
    setNewPrompt('');
    setNewAnswer('');
  };

  const visibleQuestions =
    selectedScheduleDay === null
      ? kit.questions
      : kit.questions.filter((question) =>
          kit.schedule.days
            .find((day) => day.day === selectedScheduleDay)
            ?.question_ids.includes(question.id)
        );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0B0D10] text-[#F5F7FA]">
      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="border-b border-white/10 pb-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#A7AFBD]">
            Interview Preparation Kit
          </p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#F5F7FA] sm:text-4xl">
                {kit.role.title || 'Role Interview Kit'}
              </h1>
              <p className="mt-2 break-words text-sm text-[#A7AFBD]">
                {kit.source.company} <span className="px-1 text-[#6F7887]">·</span> {kit.source.company_url}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold text-[#A7AFBD]">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                {kit.role.requirements.length} Requirements
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                {kit.questions.length} Questions
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                {kit.schedule.days_available} Day Prep
              </span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav
          className="scrollbar-none sticky top-0 z-20 -mx-4 flex snap-x gap-1 overflow-x-auto border-b border-white/10 bg-[#0B0D10]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          aria-label="Kit Sections"
        >
          {(
            [
              'brief',
              'questions',
              'flashcards',
              'schedule',
              'pressure',
              'resume',
              'stories',
              'blind-spots',
              'interview-day',
              'debrief',
              'labs',
              'knowledge',
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-colors duration-150 ease-in-out ${
                activeTab === tab
                  ? 'bg-[#2563EB] text-white shadow-sm'
                  : 'text-[#A7AFBD] hover:bg-white/[0.08] hover:text-[#F5F7FA]'
              }`}
            >
              {tab.replace('-', ' ')}
            </button>
          ))}
          {saving && <span className="ml-auto shrink-0 self-center text-xs text-[#A7AFBD]">Saving...</span>}
        </nav>

        {/* Company Brief Tab */}
        {activeTab === 'brief' && (
          <section className="space-y-4">
            {readiness && <ReadinessRadar report={readiness} />}
            <div className="rounded-xl border border-white/10 bg-[#161B22] p-6 text-[#F5F7FA] shadow-lg sm:p-8">
              <h2 className="text-xl font-bold">Company Brief</h2>
              <p className="mt-4 max-w-3xl leading-7 text-[#A7AFBD]">
                {kit.company_brief.summary || 'No company summary was retrieved.'}
              </p>
              <p className="mt-4 max-w-3xl leading-7 text-[#A7AFBD]">{kit.company_brief.what_they_do}</p>
            </div>
          </section>
        )}

        {/* Questions Tab */}
        {activeTab === 'questions' && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6F7887]">
                  Practice Set
                </p>
                <h2 className="mt-1 text-2xl font-bold text-[#F5F7FA]">Question Bank</h2>
                {selectedScheduleDay !== null && (
                  <p className="mt-2 text-sm text-[#A7AFBD]">
                    Showing questions scheduled for Day {selectedScheduleDay}.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedScheduleDay !== null && (
                  <button
                    type="button"
                    onClick={() => setSelectedScheduleDay(null)}
                    className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-[#A7AFBD] transition-colors hover:border-white/30 hover:text-white"
                  >
                    Show all questions
                  </button>
                )}
                {(['technical', 'behavioural', 'system-design', 'company-fit'] as Category[]).map(
                  (category) => (
                    <button
                      key={category}
                      type="button"
                      title={`Regenerate ${category} questions`}
                      aria-label={`Regenerate ${category} questions`}
                      onClick={() => void regenerate(category)}
                      className="rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-[#A7AFBD] transition-colors duration-150 hover:border-[#60A5FA] hover:bg-[#2563EB]/15 hover:text-white"
                    >
                      ↻ <span className="ml-1 capitalize">{category.replace('-', ' ')}</span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Add Custom Question Row */}
            <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 md:grid-cols-[auto_1fr_1fr_auto] md:items-end">
              <label className="text-[11px] font-bold uppercase tracking-wide text-[#A7AFBD]">
                Category
                <select
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value as Category)}
                  className="mt-1 block h-10 rounded-lg border border-white/10 bg-[#11151B] p-2 text-sm font-normal normal-case text-[#F5F7FA]"
                >
                  <option value="technical">Technical</option>
                  <option value="behavioural">Behavioural</option>
                  <option value="system-design">System Design</option>
                  <option value="company-fit">Company Fit</option>
                </select>
              </label>

              <label className="text-[11px] font-bold uppercase tracking-wide text-[#A7AFBD]">
                Prompt
                <input
                  value={newPrompt}
                  onChange={(event) => setNewPrompt(event.target.value)}
                  placeholder="Add a custom question prompt"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#11151B] p-2 text-sm font-normal normal-case text-[#F5F7FA] placeholder:text-[#6F7887]"
                />
              </label>

              <label className="text-[11px] font-bold uppercase tracking-wide text-[#A7AFBD]">
                Answer Outline
                <input
                  value={newAnswer}
                  onChange={(event) => setNewAnswer(event.target.value)}
                  placeholder="Add an answer outline"
                  className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#11151B] p-2 text-sm font-normal normal-case text-[#F5F7FA] placeholder:text-[#6F7887]"
                />
              </label>

              <button
                type="button"
                onClick={addQuestion}
                className="h-10 rounded-lg bg-[#2563EB] px-4 text-sm font-bold text-white transition-colors duration-150 hover:bg-blue-500"
              >
                Add Question
              </button>
            </div>

            {/* Question Cards List */}
            {visibleQuestions.map((question) => {
              const kitQuestionIndex = kit.questions.findIndex((item) => item.id === question.id);
              return (
                <article
                  id={`question-${question.id}`}
                  key={question.id}
                  className="rounded-xl border border-white/10 bg-[#161B22] p-5 text-[#F5F7FA] shadow-lg transition-all duration-150 hover:border-white/20 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#60A5FA]">
                      {question.category.replace('-', ' ')}
                    </span>

                    <div className="flex items-center gap-3 text-xs text-[#A7AFBD]">
                      <span className="font-semibold uppercase tracking-wide">
                        Difficulty <span className="text-[#F5F7FA]">{question.difficulty}/3</span>
                      </span>

                      <div className="flex items-center gap-1 border-l border-white/10 pl-3">
                        <button
                          type="button"
                          title="Move question up"
                          aria-label={`Move ${question.id} up`}
                          disabled={kitQuestionIndex <= 0}
                          onClick={() => moveQuestion(kitQuestionIndex, -1)}
                          className="rounded-md border border-white/10 px-2 py-1 text-[#A7AFBD] transition-colors hover:border-blue-400 hover:text-white disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          title="Move question down"
                          aria-label={`Move ${question.id} down`}
                          disabled={kitQuestionIndex >= kit.questions.length - 1}
                          onClick={() => moveQuestion(kitQuestionIndex, 1)}
                          className="rounded-md border border-white/10 px-2 py-1 text-[#A7AFBD] transition-colors hover:border-blue-400 hover:text-white disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          title={question.is_pinned ? 'Unpin question' : 'Pin question'}
                          aria-label={`${question.is_pinned ? 'Unpin' : 'Pin'} ${question.id}`}
                          onClick={() =>
                            updateKit({
                              ...kit,
                              questions: kit.questions.map((item) =>
                                item.id === question.id
                                  ? { ...item, is_pinned: !item.is_pinned, is_edited: true }
                                  : item
                              ),
                            })
                          }
                          className={`rounded-md border border-white/10 px-2 py-1 transition-colors hover:border-amber-400 ${
                            question.is_pinned ? 'text-amber-400 border-amber-400/40' : 'text-[#6F7887]'
                          }`}
                        >
                          ◆
                        </button>
                        <button
                          type="button"
                          title="Delete question"
                          aria-label={`Delete ${question.id}`}
                          onClick={() =>
                            updateKit({
                              ...kit,
                              questions: kit.questions.filter((item) => item.id !== question.id),
                            })
                          }
                          className="rounded-md border border-white/10 px-2 py-1 text-[#6F7887] transition-colors hover:border-red-400/40 hover:text-red-400"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>

                  <textarea
                    aria-label={`${question.id} prompt`}
                    defaultValue={question.prompt}
                    onBlur={(event) => {
                      const prompt = event.target.value.trim();
                      if (prompt && prompt !== question.prompt) {
                        updateKit({
                          ...kit,
                          questions: kit.questions.map((item) =>
                            item.id === question.id ? { ...item, prompt, is_edited: true } : item
                          ),
                        });
                      }
                    }}
                    className="mt-4 min-h-20 w-full resize-y rounded-lg border border-transparent bg-transparent p-1 text-lg font-bold leading-7 text-[#F5F7FA] outline-none transition focus:border-white/10 focus:bg-[#0B0D10]/50"
                  />

                  <div className="mt-3 border-t border-white/10 pt-4">
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#6F7887]">
                      Answer Outline
                    </p>
                    <textarea
                      aria-label={`${question.id} answer outline`}
                      defaultValue={question.answer_outline}
                      onBlur={(event) => {
                        const answer_outline = event.target.value.trim();
                        if (answer_outline && answer_outline !== question.answer_outline) {
                          updateKit({
                            ...kit,
                            questions: kit.questions.map((item) =>
                              item.id === question.id
                                ? { ...item, answer_outline, is_edited: true }
                                : item
                            ),
                          });
                        }
                      }}
                      className="min-h-16 w-full resize-y rounded-lg border border-white/10 bg-[#0B0D10] p-3 text-sm leading-6 text-[#A7AFBD] outline-none transition-colors focus:border-blue-500 focus:text-[#F5F7FA]"
                    />
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {/* Flashcards Practice Mode */}
        {activeTab === 'flashcards' && (
          <PracticeMode
            initialFlashcards={kit.flashcards}
            onUpdateConfidence={async (cardId, score) => {
              const flashcards = kit.flashcards.map((card) =>
                card.id === cardId ? { ...card, confidence_score: score } : card
              );
              await updateKit({ ...kit, flashcards });
            }}
          />
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-[#F5F7FA]">
              {kit.schedule.days_available}-Day Preparation Schedule
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {kit.schedule.days.map((day) => (
                <button
                  type="button"
                  key={day.day}
                  onClick={() => {
                    setSelectedScheduleDay(day.day);
                    setActiveTab('questions');
                  }}
                  className="group rounded-xl border border-white/10 bg-[#161B22] p-5 text-left text-[#F5F7FA] shadow-lg transition-all duration-150 hover:-translate-y-0.5 hover:border-[#60A5FA] focus-visible:outline-blue-400"
                >
                  <div className="flex justify-between">
                    <h3 className="font-bold">Day {day.day}</h3>
                    <span className="text-sm font-semibold text-[#60A5FA]">{day.minutes} min</span>
                  </div>
                  <p className="mt-2 text-sm text-[#A7AFBD]">{day.focus}</p>
                  <p className="mt-2 text-xs text-[#6F7887]">
                    {day.question_ids.join(', ') || 'Review core concepts'}
                  </p>
                  <span className="mt-4 block text-xs font-bold text-[#60A5FA] opacity-0 transition-opacity group-hover:opacity-100">
                    View day questions →
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Modular Feature Tabs */}
        {activeTab === 'pressure' && <PressureMode kitId={id} />}
        {activeTab === 'resume' && <ResumeAnalysis kitId={id} />}
        {activeTab === 'stories' && <StoryBank kitId={id} />}
        {activeTab === 'blind-spots' && <WeaknessMode kitId={id} />}
        {activeTab === 'interview-day' && (
          <InterviewDay
            kitId={id}
            onOpenQuestion={openQuestionFromInterviewDay}
            onOpenFlashcard={openFlashcardFromInterviewDay}
          />
        )}
        {activeTab === 'debrief' && <DebriefMode kitId={id} />}
        {activeTab === 'labs' && <LabsMode kitId={id} />}
        {activeTab === 'knowledge' && <KnowledgeBase kitId={id} />}
      </div>
    </main>
  );
}