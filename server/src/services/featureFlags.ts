export type FeatureFlag = 'pressure_mode' | 'resume_analysis' | 'story_bank' | 'labs' | 'knowledge_base' | 'event_tracking';

const environmentKey = (flag: FeatureFlag) => `FEATURE_${flag.toUpperCase()}`;

export function isFeatureEnabled(flag: FeatureFlag): boolean {
  const value = process.env[environmentKey(flag)];
  return value === undefined ? true : ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

export function getFeatureFlags(): Record<FeatureFlag, boolean> {
  return { pressure_mode: isFeatureEnabled('pressure_mode'), resume_analysis: isFeatureEnabled('resume_analysis'), story_bank: isFeatureEnabled('story_bank'), labs: isFeatureEnabled('labs'), knowledge_base: isFeatureEnabled('knowledge_base'), event_tracking: isFeatureEnabled('event_tracking') };
}