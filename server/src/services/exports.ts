import type { IKit } from '../models/Kit.js';

export function exportKitMarkdown(kit: Pick<IKit, 'source' | 'role' | 'questions' | 'flashcards' | 'schedule'>): string {
  const questions = kit.questions.map(question => `### ${question.id} · ${question.category}\n\n${question.prompt}\n\n**Answer outline:** ${question.answer_outline}`).join('\n\n');
  const schedule = kit.schedule.days.map(day => `- Day ${day.day}: ${day.focus} (${day.minutes} minutes)`).join('\n');
  return `# ${kit.role.title || kit.source.role} Interview Kit\n\nCompany: ${kit.source.company}\n\n## Requirements\n\n${kit.role.requirements.map(requirement => `- ${requirement.id} (${requirement.priority}): ${requirement.text}`).join('\n')}\n\n## Questions\n\n${questions}\n\n## Schedule\n\n${schedule}\n`;
}

export function exportKitCsv(kit: Pick<IKit, 'questions'>): string {
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return ['id,category,prompt,answer_outline,difficulty', ...kit.questions.map(question => [question.id, question.category, question.prompt, question.answer_outline, String(question.difficulty)].map(escape).join(','))].join('\n');
}