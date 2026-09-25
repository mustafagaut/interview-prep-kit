import assert from 'node:assert/strict';
import test from 'node:test';
import type { IRequirement, IQuestion, IFlashcard, IDaySchedule } from '../models/Kit.js';

interface KitStructure {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: {
    summary: string;
    what_they_do: string;
    sources: string[];
  };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: IRequirement[];
  };
  questions: IQuestion[];
  flashcards: IFlashcard[];
  schedule: {
    days_available: number;
    days: IDaySchedule[];
  };
  coverage: {
    uncovered_requirement_ids: string[];
    passes: number;
  };
}

test('structure validation checks required fields exist', () => {
  const incompleteKit: any = {
    source: {
      company: 'Test Company',
      company_url: 'https://example.com',
      role: 'Developer',
      location: 'Remote',
      jd_chars: 100,
      researched_at: new Date().toISOString(),
      pages_used: [],
    },
    // Missing required fields
  };
  
  const requiredFields = [
    'source.company',
    'source.company_url', 
    'source.role',
    'source.location',
    'source.jd_chars',
    'source.researched_at',
    'source.pages_used',
    'company_brief.summary',
    'company_brief.what_they_do',
    'company_brief.sources',
    'role.title',
    'role.seniority',
    'role.responsibilities',
    'role.requirements',
    'questions',
    'flashcards',
    'schedule.days_available',
    'schedule.days',
    'coverage.uncovered_requirement_ids',
    'coverage.passes'
  ];
  
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    const parts = field.split('.');
    let current = incompleteKit;
    for (const part of parts) {
      if (!current || !current.hasOwnProperty(part)) {
        missingFields.push(field);
        break;
      }
      current = current[part];
    }
  });
  
  assert.equal(missingFields.length > 0, true);
});

test('structure validation checks requirement ID format', () => {
  const invalidRequirements: IRequirement[] = [
    { id: 'invalid-id', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const validRequirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const isValidFormat = (requirements: IRequirement[]) => {
    return requirements.every(req => /^r\d+$/.test(req.id));
  };
  
  assert.equal(isValidFormat(invalidRequirements), false);
  assert.equal(isValidFormat(validRequirements), true);
});

test('structure validation checks question ID format', () => {
  const invalidQuestions: IQuestion[] = [
    { id: 'invalid', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const validQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const isValidFormat = (questions: IQuestion[]) => {
    return questions.every(q => /^q\d+$/.test(q.id));
  };
  
  assert.equal(isValidFormat(invalidQuestions), false);
  assert.equal(isValidFormat(validQuestions), true);
});

test('structure validation checks flashcard ID format', () => {
  const invalidFlashcards: IFlashcard[] = [
    { id: 'invalid', front: 'Question', back: 'Answer', requirement_ids: ['r1'] },
  ];
  
  const validFlashcards: IFlashcard[] = [
    { id: 'f1', front: 'Question', back: 'Answer', requirement_ids: ['r1'] },
  ];
  
  const isValidFormat = (flashcards: IFlashcard[]) => {
    return flashcards.every(f => /^f\d+$/.test(f.id));
  };
  
  assert.equal(isValidFormat(invalidFlashcards), false);
  assert.equal(isValidFormat(validFlashcards), true);
});

test('structure validation checks difficulty range', () => {
  const invalidQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 5 },
  ];
  
  const validQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const isValidDifficulty = (questions: IQuestion[]) => {
    return questions.every(q => q.difficulty >= 1 && q.difficulty <= 3);
  };
  
  assert.equal(isValidDifficulty(invalidQuestions), false);
  assert.equal(isValidDifficulty(validQuestions), true);
});

test('structure validation checks schedule day range', () => {
  const invalidSchedule = {
    days_available: 65,
    days: [],
  };
  
  const validSchedule = {
    days_available: 30,
    days: [],
  };
  
  const isValidDayRange = (schedule: { days_available: number }) => {
    return schedule.days_available >= 1 && schedule.days_available <= 60;
  };
  
  assert.equal(isValidDayRange(invalidSchedule), false);
  assert.equal(isValidDayRange(validSchedule), true);
});

test('structure validation checks minute allocation are integers', () => {
  const invalidDays: IDaySchedule[] = [
    { day: 1, focus: 'Focus', question_ids: ['q1'], minutes: 45.5 },
  ];
  
  const validDays: IDaySchedule[] = [
    { day: 1, focus: 'Focus', question_ids: ['q1'], minutes: 45 },
  ];
  
  const areIntegerMinutes = (days: IDaySchedule[]) => {
    return days.every(day => Number.isInteger(day.minutes));
  };
  
  assert.equal(areIntegerMinutes(invalidDays), false);
  assert.equal(areIntegerMinutes(validDays), true);
});

test('structure validation checks question references in schedule', () => {
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const invalidSchedule: IDaySchedule[] = [
    { day: 1, focus: 'Focus', question_ids: ['q999'], minutes: 30 },
  ];
  
  const validSchedule: IDaySchedule[] = [
    { day: 1, focus: 'Focus', question_ids: ['q1'], minutes: 30 },
  ];
  
  const validReferences = (schedule: IDaySchedule[], availableQuestions: IQuestion[]) => {
    const availableIds = new Set(availableQuestions.map(q => q.id));
    return schedule.every(day => 
      day.question_ids.every(qId => availableIds.has(qId))
    );
  };
  
  assert.equal(validReferences(invalidSchedule, questions), false);
  assert.equal(validReferences(validSchedule, questions), true);
});