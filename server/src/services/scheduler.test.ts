import assert from 'node:assert/strict';
import test from 'node:test';
import { generateSchedule } from './scheduler.js';
import type { IQuestion, IRequirement } from '../models/Kit.js';

test('schedule allocation distributes questions across exact days requested', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'JavaScript experience', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'React experience', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Team collaboration', kind: 'behavioural', priority: 'nice' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'JS question', answer_outline: 'Answer', difficulty: 2 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'React question', answer_outline: 'Answer', difficulty: 3 },
    { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', prompt: 'Team question', answer_outline: 'Answer', difficulty: 1 },
  ];
  
  const schedule = generateSchedule(5, requirements, questions);
  
  assert.equal(schedule.days_available, 5);
  assert.equal(schedule.days.length, 5);
});

test('schedule allocation handles 1-day minimum', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Basic skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const schedule = generateSchedule(1, requirements, questions);
  
  assert.equal(schedule.days_available, 1);
  assert.equal(schedule.days.length, 1);
  assert.equal(schedule.days[0].question_ids.length, 1);
});

test('schedule allocation handles 60-day maximum', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const schedule = generateSchedule(65, requirements, questions);
  
  assert.equal(schedule.days_available, 60);
  assert.equal(schedule.days.length, 60);
});

test('schedule allocates integer minutes only', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const schedule = generateSchedule(3, requirements, questions);
  
  schedule.days.forEach(day => {
    assert.equal(Number.isInteger(day.minutes), true);
  });
});

test('schedule prioritizes must-have requirements earlier', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have skill', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Nice-to-have skill', kind: 'technical', priority: 'nice' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r2'], category: 'technical', prompt: 'Nice question', answer_outline: 'Answer', difficulty: 2 },
    { id: 'q2', requirement_ids: ['r1'], category: 'technical', prompt: 'Must question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const schedule = generateSchedule(3, requirements, questions);
  
  // First day should have the must-have question
  assert.equal(schedule.days[0].question_ids.includes('q2'), true);
});

test('schedule prioritizes higher difficulty earlier', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill A', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Skill B', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Easy question', answer_outline: 'Answer', difficulty: 1 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'Hard question', answer_outline: 'Answer', difficulty: 3 },
  ];
  
  const schedule = generateSchedule(3, requirements, questions);
  
  // First day should have the harder question
  assert.equal(schedule.days[0].question_ids.includes('q2'), true);
});

test('every must-have requirement appears in schedule', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have 1', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Must-have 2', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Nice-to-have', kind: 'technical', priority: 'nice' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question 1', answer_outline: 'Answer', difficulty: 2 },
    { id: 'q2', requirement_ids: ['r2'], category: 'technical', prompt: 'Question 2', answer_outline: 'Answer', difficulty: 2 },
    { id: 'q3', requirement_ids: ['r3'], category: 'technical', prompt: 'Question 3', answer_outline: 'Answer', difficulty: 1 },
  ];
  
  const schedule = generateSchedule(5, requirements, questions);
  
  const allQuestionIds = schedule.days.flatMap(day => day.question_ids);
  assert.equal(allQuestionIds.includes('q1'), true);
  assert.equal(allQuestionIds.includes('q2'), true);
});

test('schedule handles empty questions array', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [];
  
  const schedule = generateSchedule(3, requirements, questions);
  
  assert.equal(schedule.days_available, 3);
  assert.equal(schedule.days.length, 3);
  schedule.days.forEach(day => {
    assert.equal(day.question_ids.length, 0);
    assert.equal(day.minutes, 30); // Default for empty days
  });
});