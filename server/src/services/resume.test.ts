import assert from 'node:assert/strict';
import test from 'node:test';
import type { IRequirement } from '../models/Kit.js';
import {
  analyzeResume,
  isContactMetadata,
  isDateOrTenure,
  isProjectHeading,
  isRawSkillList,
  isSectionHeading,
  isStandaloneJobTitle,
  isSubstantiveClaim,
} from './resume.js';

const requirements: IRequirement[] = [
  { id: 'r1', text: 'Redis caching and API performance', kind: 'technical', priority: 'must' },
  { id: 'r2', text: 'Authentication and security architecture', kind: 'technical', priority: 'must' },
  { id: 'r3', text: 'Third-party API and payment integration', kind: 'technical', priority: 'must' },
];

test('resume scanner flags measurable claims and links supported requirements', () => {
  const analysis = analyzeResume('Built a Redis caching layer and improved API performance by 70%.', requirements);
  assert.equal(analysis.claims.length, 1);
  assert.equal(analysis.claims[0]?.risk, 'high-risk');
  assert.deepEqual(analysis.claims[0]?.requirement_ids, ['r1']);
  assert.equal(analysis.needs_evidence[0], 'c1');
  assert.match(analysis.questions[0]?.prompt || '', /measured/);
});

test('resume scanner does not invent unsupported candidate facts', () => {
  const analysis = analyzeResume('Worked with a collaborative engineering team.', requirements);
  assert.equal(analysis.claims[0]?.requirement_ids.length, 0);
  assert.equal(analysis.questions.length, 0);
});

test('resume segmentation helpers accurately detect non-substantive elements', () => {
  assert.equal(isSectionHeading('TECHNICAL SKILLS'), true);
  assert.equal(isSectionHeading('PROFESSIONAL EXPERIENCE'), true);
  assert.equal(isSectionHeading('PROJECTS & COMPETENCIES'), true);
  assert.equal(isSectionHeading('Built a Redis caching layer'), false);

  assert.equal(isContactMetadata('john.doe@example.com'), true);
  assert.equal(isContactMetadata('+91 9876543210'), true);
  assert.equal(isContactMetadata('linkedin.com/in/example'), true);
  assert.equal(isContactMetadata('Built scalable services'), false);

  assert.equal(isDateOrTenure('2022 - Present'), true);
  assert.equal(isDateOrTenure('Dec 2022 - Present'), true);
  assert.equal(isDateOrTenure('5+ years of software engineering experience'), true);
  assert.equal(isDateOrTenure('Reduced API latency by 45%'), false);

  assert.equal(isRawSkillList('React, TypeScript, JavaScript, Node.js, MongoDB'), true);
  assert.equal(isRawSkillList('Languages: Python, Go, TypeScript, Java'), true);
  assert.equal(isRawSkillList('Implemented Redis caching that reduced response time'), false);

  assert.equal(isStandaloneJobTitle('MERN Stack Developer'), true);
  assert.equal(isStandaloneJobTitle('Senior Software Engineer'), true);
  assert.equal(isStandaloneJobTitle('Full Stack Developer | React | Node.js'), true);
  assert.equal(isStandaloneJobTitle('Built a multi-tenant SaaS platform using React'), false);

  assert.equal(isProjectHeading('E-Commerce Platform'), true);
  assert.equal(isProjectHeading('Real-Time Collaboration Application'), true);
  assert.equal(isProjectHeading('Integrated a third-party payment gateway and webhooks'), false);
});

test('non-substantive lines do not generate cross-examination questions', () => {
  const noisyResume = `
    John Doe
    john.doe@example.com | +1 (555) 123-4567 | linkedin.com/in/johndoe
    
    TECHNICAL SKILLS
    React, TypeScript, JavaScript, Node.js, MongoDB, Redis
    
    PROFESSIONAL EXPERIENCE
    Senior MERN Stack Developer
    2021 - Present
    5+ years of software engineering experience
    
    PROJECTS
    E-Commerce Platform
  `;

  const analysis = analyzeResume(noisyResume, requirements);
  assert.equal(analysis.questions.length, 0);
  assert.ok(analysis.skills && analysis.skills.includes('React'));
  assert.ok(analysis.skills.includes('TypeScript'));
  assert.ok(analysis.skills.includes('Node.js'));
  assert.ok(analysis.skills.includes('MongoDB'));
});

test('substantive experience claims generate targeted interview questions', () => {
  const realResume = `
    TECHNICAL SKILLS
    React, Node.js, MongoDB, Redis, Docker, AWS
    
    EXPERIENCE
    Built a multi-tenant SaaS platform using React, Node.js and MongoDB.
    Implemented Redis caching that reduced API response time by 45%.
    Designed JWT-based authentication and role-based authorization.
    Integrated a third-party payment gateway and implemented webhook handling.
    Automated CI/CD deployment using Docker and GitHub Actions.
  `;

  const analysis = analyzeResume(realResume, requirements);
  assert.equal(analysis.claims.length, 5);
  assert.ok(analysis.questions.length >= 4);

  // Metric claim should probe baseline and measurement
  const metricQuestion = analysis.questions.find(q => q.prompt.includes('45%') || q.prompt.includes('baseline'));
  assert.ok(metricQuestion, 'Expected a baseline/measurement question for 45% improvement');
  assert.match(metricQuestion.prompt, /baseline|measured/);

  // Integration claim should probe failure handling and webhooks
  const integrationQuestion = analysis.questions.find(q => q.prompt.toLowerCase().includes('webhook') || q.prompt.toLowerCase().includes('idempotency'));
  assert.ok(integrationQuestion, 'Expected an integration failure/idempotency question');

  // Architecture claim should probe trade-offs and failure modes
  const authQuestion = analysis.questions.find(q => q.prompt.toLowerCase().includes('trade-off') || q.prompt.toLowerCase().includes('jwt'));
  assert.ok(authQuestion, 'Expected a trade-off question for authentication/architecture');
});

test('regression: rate-limiting claim is classified as architecture and generates a targeted question', () => {
  const analysis = analyzeResume('Added rate limiting to sensitive endpoints.', requirements);
  assert.equal(analysis.claims.length, 1);
  assert.equal(analysis.claims[0]?.type, 'architecture');
  assert.equal(analysis.claims[0]?.risk, 'likely-follow-up');
  assert.equal(analysis.questions.length, 1);
  assert.match(analysis.questions[0]?.prompt || '', /rate-limiting algorithm/);
});

test('regression: operational scale and metric claims are recognized and prioritized', () => {
  // B: Supported an application used by 10,000+ users.
  const analysisB = analyzeResume('Supported an application used by 10,000+ users.', requirements);
  assert.equal(analysisB.claims.length, 1);
  assert.equal(analysisB.claims[0]?.type, 'achievement');
  assert.equal(analysisB.claims[0]?.risk, 'high-risk');
  assert.equal(analysisB.questions.length, 1);

  // C: Served 500k requests per day.
  const analysisC = analyzeResume('Served 500k requests per day.', requirements);
  assert.equal(analysisC.claims.length, 1);
  assert.equal(analysisC.claims[0]?.type, 'achievement');
  assert.equal(analysisC.claims[0]?.risk, 'high-risk');
  assert.equal(analysisC.questions.length, 1);

  // D: Handled 1 million events per day.
  const analysisD = analyzeResume('Handled 1 million events per day.', requirements);
  assert.equal(analysisD.claims.length, 1);
  assert.equal(analysisD.claims[0]?.type, 'achievement');
  assert.equal(analysisD.questions.length, 1);
});

test('regression: date ranges, standalone tenure, and isolated verb tokens remain filtered', () => {
  // E: 2022 - 2024
  assert.equal(isDateOrTenure('2022 - 2024'), true);
  const analysisE = analyzeResume('2022 - 2024', requirements);
  assert.equal(analysisE.claims.length, 0);
  assert.equal(analysisE.questions.length, 0);

  // F: 5+ years of software engineering experience
  assert.equal(isDateOrTenure('5+ years of software engineering experience'), true);
  const analysisF = analyzeResume('5+ years of software engineering experience', requirements);
  assert.equal(analysisF.claims.length, 0);
  assert.equal(analysisF.questions.length, 0);

  // G: "Added" should not become a claim without substantive context
  assert.equal(isSubstantiveClaim('Added'), false);
  const analysisG = analyzeResume('Added', requirements);
  assert.equal(analysisG.claims.length, 0);
  assert.equal(analysisG.questions.length, 0);
});
