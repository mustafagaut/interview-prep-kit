export const storyCategories = ['leadership', 'conflict', 'failure', 'difficult-bug', 'production-incident', 'performance-improvement', 'teamwork', 'ownership', 'learning', 'tight-deadline', 'customer-issue'] as const;
export type StoryCategory = typeof storyCategories[number];

export interface StoryInput {
  title: string;
  category: StoryCategory;
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface StoryAnalysis {
  missing: ('situation' | 'task' | 'action' | 'result')[];
  completeness: number;
  follow_ups: string[];
}

export function analyzeStory(story: StoryInput): StoryAnalysis {
  const fields = ['situation', 'task', 'action', 'result'] as const;
  const missing = fields.filter(field => story[field].trim().length < 12);
  const followUps = [
    'What was the measurable result?',
    'What trade-off did you consider?',
    'What would you do differently today?',
  ];
  return { missing, completeness: Math.round(((fields.length - missing.length) / fields.length) * 100), follow_ups: followUps.slice(0, missing.length > 0 ? 3 : 2) };
}