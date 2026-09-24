'use client';

import { useEffect, useState } from 'react';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  requirement_ids: string[];
  confidence_score?: number; // 0: unrated, 1: low, 2: medium, 3: high
}

interface PracticeModeProps {
  initialFlashcards: Flashcard[];
  onUpdateConfidence: (cardId: string, score: number) => void;
}

export default function PracticeMode({
  initialFlashcards,
  onUpdateConfidence,
}: PracticeModeProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialFlashcards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    setCards(initialFlashcards);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [initialFlashcards]);

  const currentCard = cards[currentIndex];

  const handleRating = (score: number) => {
    if (!currentCard) return;

    // 1. Update local state
    const updatedCards = cards.map((c) =>
      c.id === currentCard.id ? { ...c, confidence_score: score } : c
    );
    setCards(updatedCards);

    // 2. Notify parent / API
    onUpdateConfidence(currentCard.id, score);

    // 3. Reset flip state and move to next card
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Keyboard navigation & rating shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isFlipped) {
        if (e.key === '1') handleRating(1);
        if (e.key === '2') handleRating(2);
        if (e.key === '3') handleRating(3);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentCard]);

  // Sort deck prioritizing unrated cards and cards with lowest confidence score
  const sortByWeakestFirst = () => {
    const sorted = [...cards].sort((a, b) => {
      const scoreA = a.confidence_score || 0;
      const scoreB = b.confidence_score || 0;
      return scoreA - scoreB;
    });
    setCards(sorted);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  if (!cards || cards.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 p-12 text-center text-sm font-medium text-slate-400">
        No flashcards available in this kit.
      </div>
    );
  }

  const ratedCount = cards.filter((c) => (c.confidence_score || 0) > 0).length;
  const progressPercent = Math.round(((currentIndex + 1) / cards.length) * 100);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Progress Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-200">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <span className="text-slate-500">•</span>
            <span>
              Covered:{' '}
              <strong className="text-blue-400">{ratedCount}</strong> / {cards.length}
            </span>
          </div>

          <button
            type="button"
            onClick={sortByWeakestFirst}
            className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
          >
            Sort by Weakest First
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive 3D Flip Card Container */}
      <div className="[perspective:1000px]">
        <div
          role="button"
          tabIndex={0}
          aria-label="Flip flashcard"
          onClick={() => setIsFlipped((prev) => !prev)}
          className="relative h-80 w-full cursor-pointer text-center transition-transform duration-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-2xl"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front Side (Question) */}
          <div className="absolute inset-0 flex flex-col items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-xl [backface-visibility:hidden]">
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-400">
                Question
              </span>
              {currentCard?.confidence_score ? (
                <span className="text-[10px] font-semibold text-slate-500">
                  Last Conf: {currentCard.confidence_score}/3
                </span>
              ) : null}
            </div>

            <p className="my-auto text-lg sm:text-xl font-bold leading-relaxed text-slate-100 px-4">
              {currentCard?.front}
            </p>

            <span className="text-xs font-medium text-slate-500">
              Click or press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">Space</kbd> to reveal answer
            </span>
          </div>

          {/* Back Side (Answer) */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/50 via-slate-900/90 to-slate-900 p-8 shadow-2xl backdrop-blur-xl [backface-visibility:hidden]"
            style={{ transform: 'rotateY(180deg)' }}
          >
            <div className="flex w-full items-center justify-between">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Answer
              </span>
            </div>

            <p className="my-auto text-lg sm:text-xl font-bold leading-relaxed text-slate-100 px-4">
              {currentCard?.back}
            </p>

            <span className="text-xs font-medium text-slate-400">
              Rate your confidence below
            </span>
          </div>
        </div>
      </div>

      {/* Confidence Rating Bar */}
      {isFlipped && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-center backdrop-blur-md space-y-3 animate-fadeIn">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Rate your confidence level
          </p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              aria-label="Rate low confidence"
              onClick={() => handleRating(1)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition-all hover:bg-rose-500/20 hover:border-rose-500/50 active:scale-95"
            >
              <span>★</span>
              <span>Low (1)</span>
            </button>

            <button
              type="button"
              aria-label="Rate medium confidence"
              onClick={() => handleRating(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-300 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 active:scale-95"
            >
              <span>★★</span>
              <span>Medium (2)</span>
            </button>

            <button
              type="button"
              aria-label="Rate high confidence"
              onClick={() => handleRating(3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-300 transition-all hover:bg-emerald-500/20 hover:border-emerald-500/50 active:scale-95"
            >
              <span>★★★</span>
              <span>High (3)</span>
            </button>
          </div>
        </div>
      )}

      {/* Card Navigation Footer */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex((prev) => prev - 1);
          }}
          className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={currentIndex === cards.length - 1}
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex((prev) => prev + 1);
          }}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          Next
        </button>
      </div>
    </div>
  );
}