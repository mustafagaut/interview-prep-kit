'use client';

export interface ReadinessDimension {
  key: string;
  label: string;
  score: number;
  factors: string[];
}

export interface ReadinessReport {
  overall: number;
  dimensions: ReadinessDimension[];
  weak_topics: {
    requirement_id: string;
    topic: string;
    confidence: number;
    reason: string;
  }[];
}

export default function ReadinessRadar({ report }: { report: ReadinessReport }) {
  const count = report.dimensions.length;

  const point = (index: number, value: number, radiusBase = 72) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    const radius = radiusBase * value;
    return {
      x: 120 + Math.cos(angle) * radius,
      y: 120 + Math.sin(angle) * radius,
      angle,
    };
  };

  const getPointsString = (value: number) =>
    report.dimensions
      .map((_, index) => {
        const p = point(index, value);
        return `${p.x},${p.y}`;
      })
      .join(' ');

  const outerPoints = getPointsString(1);
  const middlePoints = getPointsString(0.5);
  const scorePoints = report.dimensions
    .map((dimension, index) => {
      const p = point(index, dimension.score / 100);
      return `${p.x},${p.y}`;
    })
    .join(' ');

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-400">
            Interview Intelligence
          </div>
          <h2 className="mt-2 text-2xl font-extrabold text-slate-100">
            Readiness Radar
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Dimension scores are dynamically weighted across identified competencies.
          </p>
        </div>

        <div className="text-right">
          <div className="text-3xl font-black text-blue-400 sm:text-4xl">
            {report.overall}
            <span className="text-sm font-semibold text-slate-500">/100</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Overall Readiness
          </span>
        </div>
      </div>

      {/* Main Grid: Radar SVG & Dimension Details */}
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,0.9fr)_1.1fr] lg:items-center">
        {/* SVG Radar Chart */}
        <div className="mx-auto w-full max-w-[320px] p-2">
          <svg
            viewBox="0 0 240 240"
            role="img"
            aria-label={`Readiness radar overall score ${report.overall} out of 100`}
            className="h-auto w-full overflow-visible"
            shapeRendering="geometricPrecision"
          >
            <defs>
              <linearGradient id="radarGlow" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Outer Boundary */}
            <polygon
              points={outerPoints}
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Mid Gridline */}
            <polygon
              points={middlePoints}
              fill="none"
              stroke="#1E293B"
              strokeWidth="1"
              strokeDasharray="3 3"
            />

            {/* Axis Spokes */}
            {report.dimensions.map((dimension, index) => {
              const p = point(index, 1);
              return (
                <line
                  key={`spoke-${dimension.key}`}
                  x1="120"
                  y1="120"
                  x2={p.x}
                  y2={p.y}
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            })}

            {/* Score Shape */}
            <polygon
              points={scorePoints}
              fill="url(#radarGlow)"
              stroke="#60A5FA"
              strokeWidth="2"
              className="transition-all duration-500 ease-out"
            />

            {/* Vertex Nodes & Text Labels */}
            {report.dimensions.map((dimension, index) => {
              const scorePos = point(index, dimension.score / 100);
              const labelPos = point(index, 1.25); // Push text outwards

              return (
                <g key={`vertex-${dimension.key}`}>
                  {/* Vertex Score Dot */}
                  <circle
                    cx={scorePos.x}
                    cy={scorePos.y}
                    r="3.5"
                    className="fill-blue-400 stroke-slate-900"
                    strokeWidth="1.5"
                  />

                  {/* Dimension Label */}
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="fill-slate-400 text-[9px] font-semibold tracking-tight"
                  >
                    {dimension.label.length > 12
                      ? `${dimension.label.slice(0, 10)}...`
                      : dimension.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Dimension Breakdown Accordion */}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {report.dimensions.map((dimension) => (
            <details
              key={dimension.key}
              className="group rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-all hover:border-slate-700"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-semibold text-slate-200 select-none">
                <span className="truncate">{dimension.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-blue-400">
                    {dimension.score}
                  </span>
                  <svg
                    className="h-3.5 w-3.5 text-slate-500 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </summary>

              <ul className="mt-3 space-y-1.5 border-t border-slate-800/80 pt-2.5 text-[11px] leading-relaxed text-slate-400">
                {dimension.factors.map((factor) => (
                  <li key={factor} className="flex items-start gap-1.5">
                    <span className="text-blue-500 font-bold">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </div>

      {/* Weak Topics Section */}
      {report.weak_topics.length > 0 && (
        <div className="border-t border-slate-800/80 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
            Areas Impacting Score
          </span>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {report.weak_topics.map((topic) => (
              <span
                key={topic.requirement_id}
                title={topic.reason}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300"
              >
                <span>{topic.topic}</span>
                <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                  {topic.confidence}/3
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}