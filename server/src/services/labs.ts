import type { IKit } from '../models/Kit.js';

export interface LabCriterion { key: string; label: string; score: number; evidence: string; }
export interface Lab { type: 'architecture' | 'coding'; title: string; prompt: string; requirements: string[]; criteria: string[]; }
export interface LabEvaluation { total: number; criteria: LabCriterion[]; strengths: string[]; improvements: string[]; }

const contains = (text: string, terms: string[]) => terms.some(term => text.toLowerCase().includes(term));

export function createArchitectureLab(kit: Pick<IKit, 'role' | 'questions'>): Lab {
  const systemQuestion = kit.questions.find(question => question.category === 'system-design');
  const requirementText = kit.role.requirements.filter(requirement => requirement.priority === 'must').slice(0, 5).map(requirement => requirement.text);
  return { type: 'architecture', title: 'Architecture defense lab', prompt: systemQuestion?.prompt || `Design a scalable system for the ${kit.role.title || 'target'} role.`, requirements: requirementText, criteria: ['requirements', 'api', 'data', 'scaling', 'failure handling', 'security', 'observability'] };
}

export function createCodingLab(kit: Pick<IKit, 'role' | 'questions'>): Lab {
  const technicalQuestion = kit.questions.find(question => question.category === 'technical');
  return { type: 'coding', title: 'Practical coding lab', prompt: technicalQuestion?.prompt || `Implement a production-ready feature for the ${kit.role.title || 'target'} role.`, requirements: kit.role.requirements.slice(0, 5).map(requirement => requirement.text), criteria: ['correctness', 'tests', 'edge cases', 'security', 'complexity'] };
}

export function evaluateArchitectureSubmission(answer: string): LabEvaluation {
  const criteria: LabCriterion[] = [
    { key: 'requirements', label: 'Requirements', score: contains(answer, ['requirement', 'constraint', 'assumption']) ? 100 : 0, evidence: 'Explicit requirements, constraints, or assumptions.' },
    { key: 'api', label: 'API design', score: contains(answer, ['endpoint', 'api', 'request', 'response']) ? 100 : 0, evidence: 'Concrete API or interaction design.' },
    { key: 'data', label: 'Data model', score: contains(answer, ['database', 'schema', 'index', 'mongo', 'sql']) ? 100 : 0, evidence: 'Data storage, schema, or indexing decisions.' },
    { key: 'scaling', label: 'Scaling', score: contains(answer, ['scale', 'shard', 'replica', 'cache', 'queue', 'load balanc']) ? 100 : 0, evidence: 'A concrete scaling strategy.' },
    { key: 'failure', label: 'Failure handling', score: contains(answer, ['failure', 'retry', 'timeout', 'fallback', 'outage']) ? 100 : 0, evidence: 'Failure modes and recovery behavior.' },
    { key: 'security', label: 'Security', score: contains(answer, ['security', 'auth', 'authorize', 'encrypt', 'rate limit']) ? 100 : 0, evidence: 'Threats and mitigations.' },
    { key: 'observability', label: 'Observability', score: contains(answer, ['metric', 'log', 'trace', 'monitor', 'alert', 'slo']) ? 100 : 0, evidence: 'Signals and operational feedback loops.' },
  ];
  return evaluate(criteria);
}

export function evaluateCodingSubmission(answer: string): LabEvaluation {
  return evaluate([
    { key: 'correctness', label: 'Correctness', score: contains(answer, ['return', 'result', 'condition', 'algorithm']) ? 100 : 0, evidence: 'An implementation path and expected result.' },
    { key: 'tests', label: 'Tests', score: contains(answer, ['test', 'assert', 'spec']) ? 100 : 0, evidence: 'Automated test coverage.' },
    { key: 'edge-cases', label: 'Edge cases', score: contains(answer, ['empty', 'null', 'error', 'edge', 'invalid']) ? 100 : 0, evidence: 'Boundary and invalid-input handling.' },
    { key: 'security', label: 'Security', score: contains(answer, ['auth', 'validate', 'sanitize', 'permission', 'security']) ? 100 : 0, evidence: 'Input validation and authorization considerations.' },
    { key: 'complexity', label: 'Complexity', score: contains(answer, ['complexity', 'o(n', 'latency', 'memory', 'trade-off']) ? 100 : 0, evidence: 'Time, space, latency, or trade-off analysis.' },
  ]);
}

function evaluate(criteria: LabCriterion[]): LabEvaluation {
  const strengths = criteria.filter(criterion => criterion.score > 0).map(criterion => criterion.label);
  const improvements = criteria.filter(criterion => criterion.score === 0).map(criterion => criterion.evidence);
  return { total: Math.round(criteria.reduce((total, criterion) => total + criterion.score, 0) / criteria.length), criteria, strengths, improvements };
}