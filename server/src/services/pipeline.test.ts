import assert from 'node:assert/strict';
import test from 'node:test';
import type { IQuestion, IRequirement } from '../models/Kit.js';
import { evaluateCoverage, generateQuestionBank, validateQuestionBank } from './pipeline.js';
import { generateSchedule } from './scheduler.js';

const requirements: IRequirement[] = [
  { id: 'r1', text: 'Build APIs', kind: 'technical', priority: 'must' },
  { id: 'r2', text: 'Communicate clearly', kind: 'behavioural', priority: 'nice' },
];

const questions: IQuestion[] = [
  {
    id: 'q1',
    requirement_ids: ['r1'],
    category: 'technical',
    prompt: 'Design an API.',
    answer_outline: 'Explain trade-offs.',
    difficulty: 3,
  },
];

test('coverage returns uncovered must requirements only', () => {
  assert.deepEqual(evaluateCoverage(requirements, questions), []);
  assert.deepEqual(evaluateCoverage(requirements, []), ['r1']);
});

test('schedule clamps days and allocates difficulty minutes', () => {
  const schedule = generateSchedule(0, requirements, questions);
  assert.equal(schedule.days_available, 1);
  assert.deepEqual(schedule.days[0]?.question_ids, ['q1']);
  assert.equal(schedule.days[0]?.minutes, 45);
});

test('schedule prioritizes must requirements before nice requirements', () => {
  const mustQuestion = questions[0];
  if (!mustQuestion) throw new Error('Test question fixture is missing');
  const niceQuestion: IQuestion = {
    id: 'q2',
    requirement_ids: ['r2'],
    category: 'technical',
    prompt: mustQuestion.prompt,
    answer_outline: mustQuestion.answer_outline,
    difficulty: 3,
  };
  const schedule = generateSchedule(2, requirements, [niceQuestion, mustQuestion]);
  assert.deepEqual(schedule.days[0]?.question_ids, ['q1']);
  assert.deepEqual(schedule.days[1]?.question_ids, ['q2']);
});

test('question validation accepts the 20-question category distribution', () => {
  const categories: IQuestion['category'][] = [
    ...Array<IQuestion['category']>(10).fill('technical'),
    ...Array<IQuestion['category']>(4).fill('system-design'),
    ...Array<IQuestion['category']>(3).fill('behavioural'),
    ...Array<IQuestion['category']>(3).fill('company-fit'),
  ];
  const balancedQuestions = categories.map((category, index): IQuestion => ({
    id: `q${index + 1}`,
    requirement_ids: ['r1'],
    category,
    prompt: `${category} question ${index + 1}`,
    answer_outline: 'Explain the approach and result.',
    difficulty: category === 'system-design' ? 3 : 2,
  }));
  assert.deepEqual(validateQuestionBank(balancedQuestions, [requirements[0] as IRequirement], 20, 'Senior MERN Stack Developer'), []);
});

test('question validation rejects company-fit domination', () => {
  const companyFitQuestions = Array.from({ length: 20 }, (_, index): IQuestion => ({
    id: `q${index + 1}`,
    requirement_ids: ['r1'],
    category: 'company-fit',
    prompt: `Company question ${index + 1}`,
    answer_outline: 'Explain the motivation.',
    difficulty: 2,
  }));
  assert.ok(validateQuestionBank(companyFitQuestions, [requirements[0] as IRequirement], 20, 'Senior MERN Stack Developer').includes('company-fit-dominates'));
});

test('question generator scales to the 30-question distribution', () => {
  const generated = generateQuestionBank(
    [requirements[0] as IRequirement],
    'Senior MERN Stack Developer responsible for scalable MERN architecture, React, Node.js, MongoDB, Redis, AWS, Docker, WebSockets, security, and CI/CD.',
    'Senior MERN Stack Developer',
    30,
  );
  const counts = generated.reduce<Record<IQuestion['category'], number>>((result, question) => {
    result[question.category] += 1;
    return result;
  }, { technical: 0, 'system-design': 0, behavioural: 0, 'company-fit': 0 });
  assert.deepEqual(counts, { technical: 15, 'system-design': 6, behavioural: 5, 'company-fit': 4 });
});