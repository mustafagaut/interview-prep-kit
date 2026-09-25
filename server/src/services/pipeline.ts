import type { IRequirement, IQuestion } from '../models/Kit.js';
import { crawlCompanySite } from './crawler.js';
import { generateInterviewDraft, type LlmDraft } from './llm.js';
import { generateSchedule } from './scheduler.js';

export interface PipelineInput {
  jd: string;
  company_url: string;
  days: number;
  company?: string;
  role?: string;
  location?: string;
}

export interface GeneratedKit {
  source: {
    company: string;
    company_url: string;
    role: string;
    location: string;
    jd_chars: number;
    researched_at: string;
    pages_used: string[];
  };
  company_brief: { summary: string; what_they_do: string; sources: string[] };
  role: {
    title: string;
    seniority: string;
    responsibilities: string[];
    requirements: IRequirement[];
  };
  questions: IQuestion[];
  flashcards: { id: string; front: string; back: string; requirement_ids: string[] }[];
  schedule: ReturnType<typeof generateSchedule>;
  coverage: { uncovered_requirement_ids: string[]; passes: number };
}

const technicalTerms = /typescript|javascript|python|java|sql|api|database|cloud|aws|azure|gcp|react|node|testing|security|data|software|programming|architecture/i;
const behaviouralTerms = /communicat|collaborat|lead|mentor|stakeholder|ownership|team|conflict/i;
const architectureTerms = /architect|scalab|distributed|high[- ]availability|system design|performance|caching|deployment|infrastructure|real[- ]time|websocket|microservice/i;
const technicalFocuses = [
  { label: 'JavaScript and TypeScript', pattern: /javascript|typescript/i },
  { label: 'React development', pattern: /react/i },
  { label: 'React performance optimization', pattern: /react.*perform|perform.*react|frontend performance/i },
  { label: 'Node.js', pattern: /node(?:\.js)?/i },
  { label: 'Express.js', pattern: /express(?:\.js)?/i },
  { label: 'MongoDB', pattern: /mongo/i },
  { label: 'REST API design', pattern: /rest|api/i },
  { label: 'Authentication and authorization', pattern: /authenticat|authoriz|oauth|jwt/i },
  { label: 'Third-party API integration', pattern: /third[- ]party|integration|external api/i },
  { label: 'Redis and caching', pattern: /redis|cach/i },
  { label: 'Socket.IO and WebSockets', pattern: /socket|websocket|real[- ]time/i },
  { label: 'Testing strategy', pattern: /test|jest|cypress|playwright/i },
  { label: 'AWS cloud services', pattern: /aws|cloud/i },
  { label: 'Docker', pattern: /docker|container/i },
  { label: 'CI/CD', pattern: /ci\/cd|continuous integration|pipeline|github actions/i },
  { label: 'Application security', pattern: /security|xss|csrf|owasp|encryption/i },
  { label: 'Performance optimization', pattern: /performance|latency|throughput|optimization/i },
];
const systemDesignFocuses = [
  { label: 'scalable MERN application architecture', pattern: /mern|full[- ]stack|architecture|scalab/i },
  { label: 'API scalability and reliability', pattern: /api|scalab|reliab|high[- ]availability/i },
  { label: 'MongoDB schema and indexing at scale', pattern: /mongo|database|schema|index/i },
  { label: 'Redis caching architecture', pattern: /redis|cach/i },
  { label: 'authentication and authorization architecture', pattern: /authenticat|authoriz|security/i },
  { label: 'real-time WebSocket architecture', pattern: /socket|websocket|real[- ]time/i },
  { label: 'file upload and object storage architecture', pattern: /file|upload|storage|s3/i },
  { label: 'production deployment and CI/CD', pattern: /deploy|ci\/cd|docker|aws|cloud|production/i },
];
const behaviouralFocuses = ['a production incident', 'a difficult technical decision', 'a code review disagreement', 'a deadline or prioritization conflict', 'collaboration with QA, product, or design'];
const companyFitFocuses = ['why this role', 'why this company', 'your most relevant experience', 'your motivation', 'ownership and engineering culture'];

function splitLines(text: string): string[] {
  return text
    .split(/\r?\n|(?<=[.!?])\s+/)
    .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(line => line.length >= 12);
}

function inferKind(text: string): IRequirement['kind'] {
  if (behaviouralTerms.test(text)) return 'behavioural';
  if (technicalTerms.test(text)) return 'technical';
  return 'domain';
}

function extractRequirements(jd: string): IRequirement[] {
  const lines = splitLines(jd);
  
  // Handle thin descriptions (2-line stubs with almost no detail)
  if (lines.length < 3) {
    return [
      { 
        id: 'r1', 
        text: 'Demonstrate relevant experience for this role based on the limited job description provided.', 
        kind: 'domain', 
        priority: 'must' 
      }
    ];
  }
  
  const candidates = lines.filter(line =>
    /\b(require|must|need|experience|proficien|skill|ability|knowledge|familiar|responsib)/i.test(line)
  );
  const selected = (candidates.length > 0 ? candidates : lines).slice(0, 20);
  const requirements = selected.map((text, index): IRequirement => ({
    id: `r${index + 1}`,
    text,
    kind: inferKind(text),
    priority: /\b(required|must|required to|minimum|need to)\b/i.test(text) ? 'must' as const : 'nice' as const,
  }));

  if (requirements.length > 0) {
    const firstRequirement = requirements[0];
    if (firstRequirement && !requirements.some(requirement => requirement.priority === 'must')) firstRequirement.priority = 'must';
    return requirements;
  }

  return [{ id: 'r1', text: 'Demonstrate relevant experience for this role.', kind: 'domain', priority: 'must' }];
}

function requirementsFromDraft(draft: LlmDraft | null): IRequirement[] | null {
  const source = draft?.requirements?.filter(requirement => typeof requirement.text === 'string' && requirement.text.trim());
  if (!source?.length) return null;
  const requirements = source.slice(0, 20).map((requirement, index): IRequirement => ({
    id: `r${index + 1}`,
    text: requirement.text.trim(),
    kind: requirement.kind === 'behavioural' || requirement.kind === 'domain' ? requirement.kind : 'technical' as const,
    priority: requirement.priority === 'nice' ? 'nice' : 'must' as const,
  }));
  if (!requirements.some(requirement => requirement.priority === 'must')) {
    const first = requirements[0];
    if (first) first.priority = 'must';
  }
  return requirements;
}

interface CategoryQuota {
  technical: number;
  'system-design': number;
  behavioural: number;
  'company-fit': number;
}

function getCategoryQuota(totalQuestions: number): CategoryQuota {
  const total = Math.max(4, Math.round(totalQuestions));
  const technical = Math.max(1, Math.round(total * 0.5));
  const systemDesign = Math.max(1, Math.round(total * 0.2));
  const behavioural = Math.max(1, Math.round(total * 0.15));
  return {
    technical,
    'system-design': systemDesign,
    behavioural,
    'company-fit': Math.max(1, total - technical - systemDesign - behavioural),
  };
}

function isSeniorOrFullStack(title: string, text: string): boolean {
  return /senior|staff|principal|lead|full[- ]stack|mern/i.test(`${title} ${text}`);
}

function selectRequirement(requirements: IRequirement[], focus: string, category: IQuestion['category'], index: number): IRequirement {
  const matching = requirements.filter(requirement => new RegExp(focus.split(/\s+/).slice(0, 2).join('|'), 'i').test(requirement.text));
  if (matching[0]) return matching[index % matching.length] as IRequirement;
  const technical = requirements.filter(requirement => requirement.kind === 'technical' || requirement.kind === 'domain');
  if (technical[0]) return technical[index % technical.length] as IRequirement;
  return requirements[0] as IRequirement;
}

function questionFor(requirement: IRequirement, id: string, category: IQuestion['category'], focus = requirement.text): IQuestion {
  const prompt = category === 'technical'
    ? `How would you implement and test ${focus} in this role?`
    : category === 'system-design'
      ? `Design a production-ready solution for ${focus}. What trade-offs, failure modes, and scaling decisions would you make?`
      : category === 'behavioural'
        ? `Tell me about a time you handled ${focus}. What did you do, and what did you learn?`
        : `How does ${focus} connect to the way you would contribute in this role?`;
  return {
    id,
    requirement_ids: [requirement.id],
    category,
    prompt,
    answer_outline: 'State the context, explain the approach and trade-offs, then quantify the result and lessons learned.',
    difficulty: category === 'system-design' || requirement.priority === 'must' ? 3 : 2,
    is_edited: false,
    is_pinned: false,
    is_custom: false,
  };
}

function buildQuestionsByCategory(
  requirements: IRequirement[],
  jd: string,
  title: string,
  quota: CategoryQuota,
): IQuestion[] {
  const sourceText = `${jd} ${requirements.map(requirement => requirement.text).join(' ')}`;
  const seniorRole = isSeniorOrFullStack(title, sourceText);
  const technicalFocuses = [
    ...technicalFocusesCatalog(sourceText),
  ];
  const systemFocuses = systemDesignFocuses.filter(focus => focus.pattern.test(sourceText));
  const selectedSystemFocuses = systemFocuses.length > 0 ? systemFocuses : systemDesignFocuses;
  const questions: IQuestion[] = [];
  let nextId = 1;

  const addQuestions = (category: IQuestion['category'], count: number, focuses: string[]) => {
    for (let index = 0; index < count; index += 1) {
      const focus = focuses[index % focuses.length] || requirements[index % requirements.length]?.text || 'the role requirements';
      const requirement = selectRequirement(requirements, focus, category, index);
      questions.push(questionFor(requirement, `q${nextId}`, category, focus));
      nextId += 1;
    }
  };

  addQuestions('technical', quota.technical, technicalFocuses);
  if (seniorRole || architectureTerms.test(sourceText)) addQuestions('system-design', quota['system-design'], selectedSystemFocuses.map(focus => focus.label));
  else addQuestions('system-design', quota['system-design'], ['a reliable application architecture']);
  addQuestions('behavioural', quota.behavioural, behaviouralFocuses);
  addQuestions('company-fit', quota['company-fit'], companyFitFocuses);
  return questions;
}

function technicalFocusesCatalog(sourceText: string): string[] {
  const matched = technicalFocuses.filter(focus => focus.pattern.test(sourceText)).map(focus => focus.label);
  return matched.length > 0 ? matched : ['the core technical requirements'];
}

function repairMustCoverage(questions: IQuestion[], requirements: IRequirement[]): string[] {
  let uncovered = evaluateCoverage(requirements, questions);
  const eligibleIndexes = questions
    .map((question, index) => ({ question, index }))
    .filter(item => item.question.category === 'technical' || item.question.category === 'system-design')
    .map(item => item.index);
  uncovered.slice(0, eligibleIndexes.length).forEach((requirementId, index) => {
    const questionIndex = eligibleIndexes[index];
    const requirement = requirements.find(item => item.id === requirementId);
    const existing = questionIndex === undefined ? undefined : questions[questionIndex];
    if (!requirement || existing === undefined || questionIndex === undefined) return;
    questions[questionIndex] = questionFor(requirement, existing.id, existing.category, requirement.text);
  });
  return evaluateCoverage(requirements, questions);
}

function renumberQuestions(questions: IQuestion[]): IQuestion[] {
  return questions.map((question, index) => ({ ...question, id: `q${index + 1}` }));
}

export function validateQuestionBank(
  questions: IQuestion[],
  requirements: IRequirement[],
  expectedTotal: number,
  roleText: string,
): string[] {
  const quota = getCategoryQuota(expectedTotal);
  const errors: string[] = [];
  const counts = questions.reduce<Record<IQuestion['category'], number>>((result, question) => {
    result[question.category] += 1;
    return result;
  }, { technical: 0, 'system-design': 0, behavioural: 0, 'company-fit': 0 });
  if (questions.length !== expectedTotal) errors.push('total-count');
  (Object.keys(quota) as IQuestion['category'][]).forEach(category => {
    if (counts[category] !== quota[category]) errors.push(`category:${category}`);
  });
  if (isSeniorOrFullStack(roleText, requirements.map(requirement => requirement.text).join(' ')) && counts['system-design'] === 0) errors.push('missing-system-design');
  if (counts['company-fit'] > Math.ceil(expectedTotal * 0.25)) errors.push('company-fit-dominates');
  const normalizedPrompts = new Set<string>();
  questions.forEach(question => {
    const normalized = question.prompt.toLowerCase().replace(/\W+/g, ' ').trim();
    if (normalizedPrompts.has(normalized)) errors.push(`category:${question.category}`);
    normalizedPrompts.add(normalized);
    if (question.requirement_ids.length === 0 || question.requirement_ids.some(id => !requirements.some(requirement => requirement.id === id))) errors.push(`category:${question.category}`);
  });
  return [...new Set(errors)];
}

export function evaluateCoverage(
  requirements: IRequirement[],
  questions: IQuestion[]
): string[] {
  const coveredReqIds = new Set<string>();

  questions.forEach(q => {
    q.requirement_ids.forEach(id => coveredReqIds.add(id));
  });

  // Return IDs of must-have requirements without questions
  return requirements
    .filter(r => r.priority === 'must' && !coveredReqIds.has(r.id))
    .map(r => r.id);
}

export function generateQuestionBank(
  requirements: IRequirement[],
  jd: string,
  roleTitle: string,
  questionCount = 20,
): IQuestion[] {
  const quota = getCategoryQuota(questionCount);
  let questions = buildQuestionsByCategory(requirements, jd, roleTitle, quota);
  let validationErrors = validateQuestionBank(questions, requirements, Math.max(4, Math.round(questionCount)), roleTitle);
  let validationPasses = 1;
  while (validationErrors.length > 0 && validationPasses < 2) {
    const deficientCategories = (Object.keys(quota) as IQuestion['category'][]).filter(category => validationErrors.includes(`category:${category}`));
    deficientCategories.forEach(category => {
      const preserved = questions.filter(question => question.category !== category);
      const replacementQuota: CategoryQuota = { technical: 0, 'system-design': 0, behavioural: 0, 'company-fit': 0 };
      replacementQuota[category] = quota[category];
      questions = [...preserved, ...buildQuestionsByCategory(requirements, jd, roleTitle, replacementQuota)];
    });
    questions = renumberQuestions(questions);
    validationPasses += 1;
    validationErrors = validateQuestionBank(questions, requirements, Math.max(4, Math.round(questionCount)), roleTitle);
  }
  repairMustCoverage(questions, requirements);
  return renumberQuestions(questions);
}

export async function generateKit(input: PipelineInput): Promise<GeneratedKit> {
  const researchedAt = new Date().toISOString();
  const crawl = await crawlCompanySite(input.company_url);
  const draft = await generateInterviewDraft(input.jd, `${crawl.content} ${crawl.searchContent}`);
  const requirements = requirementsFromDraft(draft) || extractRequirements(input.jd);
  const expectedQuestionCount = 20;
  const roleTitle = input.role || splitLines(input.jd)[0] || 'Interview Candidate';
  const questions = generateQuestionBank(requirements, input.jd, roleTitle, expectedQuestionCount);

  let uncovered = repairMustCoverage(questions, requirements);
  let passes = 1;
  while (uncovered.length > 0 && passes < 2) {
    const nextQuestions = uncovered.map(requirementId => {
      const requirement = requirements.find(item => item.id === requirementId);
      const existing = questions.find(question => question.category === 'technical' || question.category === 'system-design');
      return requirement && existing ? questionFor(requirement, existing.id, existing.category, requirement.text) : null;
    }).filter((question): question is IQuestion => question !== null);
    questions.splice(0, nextQuestions.length, ...nextQuestions);
    passes += 1;
    uncovered = evaluateCoverage(requirements, questions);
  }

  const title = roleTitle;
  const company = input.company || new URL(input.company_url).hostname.replace(/^www\./, '');
  const responsibilities = splitLines(input.jd)
    .filter(line => /\b(build|design|develop|lead|manage|own|deliver|create|improve|work)\b/i.test(line))
    .slice(0, 8);
  const flashcards = questions.map((question, index) => ({
    id: `f${index + 1}`,
    front: question.prompt,
    back: question.answer_outline,
    requirement_ids: question.requirement_ids,
  }));

  return {
    source: {
      company,
      company_url: input.company_url,
      role: title,
      location: input.location || 'Not specified',
      jd_chars: input.jd.length,
      researched_at: researchedAt,
      pages_used: crawl.pagesUsed,
    },
    company_brief: {
      summary: `${crawl.content} ${crawl.searchContent}`.trim().slice(0, 500),
      what_they_do: crawl.content.slice(0, 300),
      sources: [...crawl.pagesUsed, ...crawl.searchSources],
    },
    role: {
      title,
      seniority: /senior|staff|principal|lead/i.test(title) ? 'Senior' : 'Mid-level',
      responsibilities,
      requirements,
    },
    questions,
    flashcards,
    schedule: generateSchedule(input.days, requirements, questions),
    coverage: { uncovered_requirement_ids: uncovered, passes },
  };
}

export function generateQuestionsForCategory(
  requirements: IRequirement[],
  category: IQuestion['category'],
  startIndex = 1,
): IQuestion[] {
  const matchingRequirements = requirements.filter(requirement => {
    if (category === 'behavioural') return requirement.kind === 'behavioural';
    if (category === 'technical' || category === 'system-design') return requirement.kind === 'technical';
    return true;
  });
  return matchingRequirements.map((requirement, index) =>
    questionFor(requirement, `q${startIndex + index}`, category)
  );
}