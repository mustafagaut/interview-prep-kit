import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateCoverage, generateQuestionBank, validateQuestionBank } from './pipeline.js';
import type { IQuestion, IRequirement } from '../models/Kit.js';

test('coverage check identifies uncovered must-have requirements', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have skill', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Another must-have', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Nice-to-have', kind: 'technical', priority: 'nice' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const uncovered = evaluateCoverage(requirements, questions);
  
  assert.equal(uncovered.length, 1);
  assert.equal(uncovered[0], 'r2');
});

test('coverage check returns empty array when all must-haves covered', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have skill', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Nice-to-have', kind: 'technical', priority: 'nice' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const uncovered = evaluateCoverage(requirements, questions);
  
  assert.equal(uncovered.length, 0);
});

test('coverage check handles questions covering multiple requirements', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have 1', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Must-have 2', kind: 'technical', priority: 'must' },
  ];
  
  const questions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1', 'r2'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const uncovered = evaluateCoverage(requirements, questions);
  
  assert.equal(uncovered.length, 0);
});

test('question bank generates correct total count', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'JavaScript experience', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'React experience', kind: 'technical', priority: 'must' },
  ];
  
  const questions = generateQuestionBank(requirements, 'Job description here', 'Developer', 10);
  
  assert.equal(questions.length, 10);
});

test('question bank generates all required categories', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Technical skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions = generateQuestionBank(requirements, 'Job description', 'Developer', 20);
  
  const categories = new Set(questions.map(q => q.category));
  assert.equal(categories.has('technical'), true);
  assert.equal(categories.has('behavioural'), true);
  assert.equal(categories.has('company-fit'), true);
});

test('question bank validation detects missing categories', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const incompleteQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const errors = validateQuestionBank(incompleteQuestions, requirements, 20, 'Developer');
  
  assert.equal(errors.length > 0, true);
  assert.equal(errors.some(error => error.includes('category:')), true);
});

test('question bank validation detects duplicate prompts', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const duplicateQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Same question', answer_outline: 'Answer', difficulty: 2 },
    { id: 'q2', requirement_ids: ['r1'], category: 'technical', prompt: 'Same question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const errors = validateQuestionBank(duplicateQuestions, requirements, 2, 'Developer');
  
  assert.equal(errors.length > 0, true);
});

test('question bank validation detects invalid requirement references', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const invalidQuestions: IQuestion[] = [
    { id: 'q1', requirement_ids: ['r999'], category: 'technical', prompt: 'Question', answer_outline: 'Answer', difficulty: 2 },
  ];
  
  const errors = validateQuestionBank(invalidQuestions, requirements, 1, 'Developer');
  
  assert.equal(errors.length > 0, true);
});

test('question bank generates stable IDs', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Skill', kind: 'technical', priority: 'must' },
  ];
  
  const questions1 = generateQuestionBank(requirements, 'Job description', 'Developer', 5);
  const questions2 = generateQuestionBank(requirements, 'Job description', 'Developer', 5);
  
  assert.equal(questions1.length, questions2.length);
  questions1.forEach((q, i) => {
    assert.equal(q.id, questions2[i].id);
  });
});

test('question bank preserves requirement references', () => {
  const requirements: IRequirement[] = [
    { id: 'r1', text: 'Must-have', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Nice-to-have', kind: 'technical', priority: 'nice' },
  ];
  
  const questions = generateQuestionBank(requirements, 'Job description', 'Developer', 5);
  
  questions.forEach(question => {
    question.requirement_ids.forEach(reqId => {
      assert.equal(requirements.some(r => r.id === reqId), true);
    });
  });
});