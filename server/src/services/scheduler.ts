import type { IQuestion, IRequirement, IDaySchedule } from '../models/Kit.js';

export function generateSchedule(
  daysAvailable: number,
  requirements: IRequirement[],
  questions: IQuestion[]
): { days_available: number; days: IDaySchedule[] } {
  // Normalize days between 1 and 60
  const daysCount = Math.max(1, Math.min(60, daysAvailable));
  
  // Identify must-have requirement IDs
  const mustReqIds = new Set(
    requirements.filter(r => r.priority === 'must').map(r => r.id)
  );

  // Sort questions: High difficulty (3) & Must-haves first
  const sortedQuestions = [...questions].sort((a, b) => {
    const aHasMust = a.requirement_ids.some(id => mustReqIds.has(id));
    const bHasMust = b.requirement_ids.some(id => mustReqIds.has(id));

    if (aHasMust && !bHasMust) return -1;
    if (!aHasMust && bHasMust) return 1;
    return b.difficulty - a.difficulty; // Descending difficulty
  });

  // Distribute questions across available days
  const scheduleDays: IDaySchedule[] = Array.from({ length: daysCount }, (_, i) => ({
    day: i + 1,
    focus: `Day ${i + 1} Target Preparation`,
    question_ids: [],
    minutes: 0,
  }));

  sortedQuestions.forEach((q, idx) => {
    const targetDayIndex = idx % daysCount;
    const scheduleDay = scheduleDays[targetDayIndex];
    if (!scheduleDay) return;

    scheduleDay.question_ids.push(q.id);
    // Integer minute allocation based on difficulty: 15 min per difficulty point
    scheduleDay.minutes += q.difficulty * 15;
  });

  // Ensure minimum focus area name per day
  scheduleDays.forEach(d => {
    if (d.question_ids.length === 0) {
      d.focus = 'General Review & Core Concepts';
      d.minutes = 30;
    } else {
      d.focus = `Focus: ${d.question_ids.length} Key Interview Scenarios`;
    }
  });

  return {
    days_available: daysCount,
    days: scheduleDays,
  };
}