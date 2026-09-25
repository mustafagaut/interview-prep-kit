'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/auth';

interface Claim {
  id: string;
  text: string;
  type: string;
  risk: string;
  reason: string;
  suggested_evidence: string;
}

interface Analysis {
  claims: Claim[];
  questions: { id: string; prompt: string }[];
  needs_evidence: string[];
  skills?: string[];
}

const riskStyles: Record<string, string> = {
  safe: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'needs-clarification': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'likely-follow-up': 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  'high-risk': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export default function ResumeAnalysis({ kitId }: { kitId: string }) {
  const [resume, setResume] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [error, setError] = useState('');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null); // Ref to target results container

  useEffect(() => {
    let isMounted = true;
    apiFetch(`/api/kits/${kitId}/resume-analysis`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data && data.claims && data.claims.length > 0) {
          setAnalysis(data);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [kitId]);

  const updateTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleTextareaChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setResume(e.target.value);
    updateTextareaHeight();
  };

  const loadPdfJsScript = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      // @ts-ignore
      if (window.pdfjsLib) {
        // @ts-ignore
        resolve(window.pdfjsLib);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        // @ts-ignore
        const pdfjsLib = window.pdfjsLib;
        if (pdfjsLib) {
          pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          resolve(pdfjsLib);
        } else {
          reject(new Error('Failed to initialize PDF parser library.'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load PDF parser script from CDN.'));
      document.body.appendChild(script);
    });
  };

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjsLib = await loadPdfJsScript();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let textContent = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const text = await page.getTextContent();
      const pageStrings = text.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      textContent += pageStrings + '\n';
    }

    return textContent.trim();
  };

  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setParsingPdf(true);
      try {
        const text = await extractPdfText(file);
        if (!text) throw new Error('Could not extract text from PDF.');
        setResume(text);
        setTimeout(updateTextareaHeight, 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error parsing PDF file');
      } finally {
        setParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === 'string' ? reader.result : '';
        setResume(content);
        setTimeout(updateTextareaHeight, 0);
      };
      reader.readAsText(file);
    }
  };

  const analyze = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await apiFetch(`/api/kits/${kitId}/resume-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Unable to analyze resume');
      
      setAnalysis(data);

      // Smoothly scroll down to the analysis results container after render
      setTimeout(() => {
        analysisRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);

    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : 'Unable to analyze resume'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
          Candidate Evidence
        </div>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-100 sm:text-3xl">
          Resume Cross-Examination
        </h2>
        <p className="mt-1 text-sm text-slate-400 max-w-2xl">
          Claims are extracted directly from your resume text to highlight areas interviewers will pressure test.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl shadow-xl space-y-4">
        <textarea
          ref={textareaRef}
          value={resume}
          onChange={handleTextareaChange}
          placeholder="Paste your resume content here or upload a file (.pdf, .txt, .md)..."
          rows={5}
          className="w-full resize-none overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-4">
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
            {parsingPdf ? 'Extracting PDF...' : 'Upload PDF or text file'}
            <input
              type="file"
              accept=".pdf,.txt,.md,.text"
              onChange={(e) => void readFile(e)}
              disabled={parsingPdf}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            disabled={loading || parsingPdf || resume.trim().length < 20}
            onClick={() => void analyze()}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Scanning claims...
              </span>
            ) : (
              'Analyze Resume'
            )}
          </button>
        </div>

        {error && (
          <p role="alert" className="text-xs text-rose-400 font-medium pt-1">
            {error}
          </p>
        )}
      </div>

      {/* Attach ref here so browser scrolls precisely to the generated results */}
      <div ref={analysisRef}>
        {analysis && (
          <div className="space-y-6">
            {analysis.skills && analysis.skills.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Extracted Technical Skills
                </span>
                <div className="mt-3 flex flex-wrap gap-2">
                  {analysis.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                Identified Claims ({analysis.claims.length})
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {analysis.claims.map((claim) => (
                  <article
                    key={claim.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md transition-all hover:border-slate-700 shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-bold leading-relaxed text-slate-100">
                          {claim.text}
                        </p>
                        <span
                          className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
                            riskStyles[claim.risk] || riskStyles.safe
                          }`}
                        >
                          {claim.risk.replaceAll('-', ' ')}
                        </span>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-slate-400">
                        {claim.reason}
                      </p>
                    </div>

                    <div className="mt-4 border-t border-slate-800/80 pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        Suggested Preparation
                      </span>
                      <p className="mt-1 text-xs font-medium text-slate-300 leading-relaxed">
                        {claim.suggested_evidence}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {analysis.questions.length > 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Likely Follow-up Questions
                </span>
                <div className="mt-4 space-y-2.5">
                  {analysis.questions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs text-slate-200 leading-relaxed"
                    >
                      <span className="text-blue-400 font-bold">Q.</span>
                      <p>{question.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}