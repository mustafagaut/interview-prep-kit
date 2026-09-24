import type { IRequirement } from '../models/Kit.js';

export type ClaimRisk = 'safe' | 'needs-clarification' | 'likely-follow-up' | 'high-risk';

export type ClaimType =
  | 'achievement'
  | 'architecture'
  | 'integration'
  | 'responsibility'
  | 'experience'
  | 'technology'
  | 'project'
  | 'skill'
  | 'context';

export interface ResumeClaim {
  id: string;
  text: string;
  type: ClaimType;
  risk: ClaimRisk;
  reason: string;
  suggested_evidence: string;
  requirement_ids: string[];
}

export interface ResumeAnalysis {
  claims: ResumeClaim[];
  questions: { id: string; prompt: string; claim_id: string; requirement_ids: string[] }[];
  needs_evidence: string[];
  skills?: string[];
}

const SECTION_HEADING_PATTERN = /^(?:summary|profile|professional\s+summary|executive\s+summary|technical\s+skills|skills(?:\s+and\s+(?:abilities|competencies|tools))?|core\s+competencies|experience|work\s+experience|professional\s+experience|employment(?:\s+history)?|work\s+history|projects|key\s+projects|academic\s+projects|personal\s+projects|education|academic\s+background|certifications|licenses(?:\s+and\s+certifications)?|achievements|honors(?:\s+and\s+awards)?|contact(?:\s+information)?|publications|volunteer(?:\s+experience)?|interests|languages)[\s:]*$/i;

const SECTION_COMPOUND_PATTERN = /^(?:(?:technical\s+skills|projects|skills|experience|education)\s*(?:&|and|\/)\s*(?:competencies|experience|abilities|training|certifications|tools))[\s:]*$/i;

export function isSectionHeading(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (SECTION_HEADING_PATTERN.test(trimmed) || SECTION_COMPOUND_PATTERN.test(trimmed)) return true;
  if (/^[A-Z\s&/\\|-]{3,40}$/.test(trimmed) && !/\b(?:built|designed|developed|using|with|led|implemented)\b/i.test(trimmed)) {
    if (/(?:SKILL|EXPERIENCE|PROJECT|EDUCATION|CERTIF|SUMMARY|PROFILE|CONTACT|COMPETENC)/.test(trimmed)) {
      return true;
    }
  }
  return false;
}

export function isContactMetadata(line: string): boolean {
  const trimmed = line.trim();
  if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed)) return true;
  if (/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/.test(trimmed) && trimmed.replace(/[\d\s+\-().]/g, '').length < 6) return true;
  if (/(?:https?:\/\/|www\.|linkedin\.com\/|github\.com\/|gitlab\.com\/)[^\s]+/i.test(trimmed)) return true;
  if (/^(?:[A-Za-z\s]+,\s*[A-Z]{2}|remote|hybrid|open\s+to\s+relocation|authorized\s+to\s+work|us\s+citizen)[\s.]*$/i.test(trimmed)) return true;
  return false;
}

export function isDateOrTenure(line: string): boolean {
  const trimmed = line.trim();
  if (/^(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?\d{4}|present|current)[\s.]*$/i.test(trimmed)) {
    return true;
  }
  if (/^(?:present|current)[\s.]*$/i.test(trimmed)) return true;
  if (/^(?:\d+\+?|\+)?\s*(?:years?|yrs?)\b/i.test(trimmed) && !/\b(?:built|designed|implemented|reduced|optimized|architected|migrated|improved)\b/i.test(trimmed)) {
    return true;
  }
  return false;
}

const KNOWN_TECH_PATTERN = /\b(?:react|angular|vue|svelte|next(?:\.js)?|node(?:\.js)?|express(?:\.js)?|nest(?:\.js)?|javascript|typescript|python|java|c\+\+|c#|golang|go|rust|ruby|rails|php|html5?|css3?|tailwind(?:\s+css)?|sass|bootstrap|redux|zustand|graphql|rest|restful|sql|mysql|postgresql|postgres|mongodb|mongo|redis|cassandra|elasticsearch|dynamodb|aws|azure|gcp|docker|kubernetes|k8s|git|github(?:\s+actions)?|gitlab|ci\/cd|terraform|ansible|nginx|apache|kafka|rabbitmq|sqs|sns|jest|cypress|playwright|mocha|chai|webpack|vite|linux)\b/i;

export function isRawSkillList(line: string): boolean {
  const trimmed = line.trim();
  if (/^(?:skills|technical\s+skills|core\s+skills|languages|frameworks|libraries|databases|tools|technologies|devops|cloud)[\s:]+/i.test(trimmed)) {
    return true;
  }
  const hasSubstantiveVerb = /\b(?:built|developed|implemented|designed|architected|engineered|created|integrated|migrated|refactored|optimized|reduced|increased|improved|automated|deployed|configured|scaled|debugged|profiled|containerized|tested|secured|maintained|led|owned|delivered|introduced)\b/i.test(trimmed);
  if (!hasSubstantiveVerb) {
    const delimiters = (trimmed.match(/[,|•/·;]/g) || []).length;
    if (delimiters >= 2 && KNOWN_TECH_PATTERN.test(trimmed)) {
      return true;
    }
  }
  return false;
}

export function isStandaloneJobTitle(line: string): boolean {
  const trimmed = line.trim();
  const titlePattern = /^(?:(?:senior|junior|lead|staff|principal|associate|chief|vp|head\s+of|intern)\s+)?(?:mern(?:\s+stack)?|full[- ]stack|frontend|backend|cloud|devops|software|systems?|mobile|qa|site\s+reliability|security)?\s*(?:developer|engineer|architect|consultant|manager|lead|specialist|intern)(?:\s*(?:\||-|–|—|at|\/)\s*.*)?$/i;
  if (titlePattern.test(trimmed)) {
    return !/\b(?:built|developed|implemented|designed|architected|integrated|migrated|refactored|optimized|reduced|automated)\b/i.test(trimmed);
  }
  return false;
}

export function isProjectHeading(line: string): boolean {
  const trimmed = line.trim();
  if (/^(?:project\s*:\s*)?[A-Z][A-Za-z0-9\s-]{2,40}(?:\s*\([^)]+\))?$/i.test(trimmed)) {
    if (/\b(?:platform|system|application|portal|website|app|tool|dashboard|service|tracker|engine|api)\b/i.test(trimmed)) {
      return !/\b(?:built|developed|implemented|designed|architected|engineered|integrated|migrated|refactored|optimized|reduced|automated|scaled)\b/i.test(trimmed);
    }
  }
  return false;
}

export const ENGINEERING_ACTION_VERBS = /\b(?:built|developed|implemented|designed|architected|engineered|created|integrated|migrated|refactored|optimized|reduced|increased|improved|automated|deployed|configured|scaled|debugged|profiled|containerized|tested|secured|maintained|led|owned|delivered|introduced|added|served|handled|supported|authored|achieved)\b/i;

export const METRIC_PATTERN = /(?:\b(?:improved|increased|decreased|reduced|boosted|saved|grew|cut|accelerated|dropped|served|handled|supported|achieved)\w*\s+[^.!?]*?)?(\d+(?:\.\d+)?%|\d+x|\d+(?:\.\d+)?\s*(?:ms|s|seconds|minutes|hrs|hours)|\d+\s*(?:million|billion|m|k|b)\+?|\d+[kKmMbB]\+?|\d{1,3}(?:,\d{3})+\+?\s*(?:users|requests|events|queries|transactions|records)|\b99\.\d+%\b)/i;

export function isSubstantiveClaim(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 15) return false;
  if (isSectionHeading(trimmed)) return false;
  if (isContactMetadata(trimmed)) return false;
  if (isDateOrTenure(trimmed)) return false;
  if (isRawSkillList(trimmed)) return false;
  if (isStandaloneJobTitle(trimmed)) return false;
  if (isProjectHeading(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 4) return false;

  return ENGINEERING_ACTION_VERBS.test(trimmed) || METRIC_PATTERN.test(trimmed);
}

export function classifyClaim(text: string): Pick<ResumeClaim, 'type' | 'risk' | 'reason' | 'suggested_evidence'> {
  const trimmed = text.trim();

  // 1. Measurable impact / Metric claim
  if (METRIC_PATTERN.test(trimmed) || /(?:\b(?:improv|increas|decreas|reduc|boost|saved|grew)\w*|\d+%|\d+x)/i.test(trimmed)) {
    return {
      type: 'achievement',
      risk: 'high-risk',
      reason: 'Measurable impact claims invite questions about how the result was measured.',
      suggested_evidence: 'Prepare the baseline, measurement window, sample size, and your direct contribution.',
    };
  }

  // 2. Integration claim (APIs, webhooks, payment gateways, messaging)
  if (/\b(integrated?|third[- ]party|gateway|webhooks?|oauth|sso|stripe|paypal|kafka|rabbitmq|sqs|sns|grpc|event[- ]driven)\b/i.test(trimmed)) {
    return {
      type: 'integration',
      risk: 'likely-follow-up',
      reason: 'Integration and API claims invite questions about failure handling, idempotency, and edge cases.',
      suggested_evidence: 'Prepare the API contracts, error-handling strategy, retry/dead-letter mechanics, and security controls.',
    };
  }

  // 3. Architecture & Security / Scalability claim
  if (/\b(architect(?:ed)?|scalab(?:ility|le)?|microservices?|distributed|cluster|sharding|caching|redis|load\s+balanc|failover|high[- ]availability|jwt|auth(?:enticat|oriz)?|rate\s*limit(?:ing|ed|s)?|firewall|rbac|encryption|security|secured)\b/i.test(trimmed)) {
    return {
      type: 'architecture',
      risk: 'likely-follow-up',
      reason: 'Architectural, security, and scaling claims invite probing into design trade-offs and failure modes.',
      suggested_evidence: 'Prepare the architecture diagram, trade-offs considered, bottleneck analysis, and failover design.',
    };
  }

  // 4. Responsibility & Leadership claim
  if (/\b(led|owned|managed|architected|delivered|established|mentored|spearheaded)\b/i.test(trimmed)) {
    return {
      type: 'responsibility',
      risk: 'likely-follow-up',
      reason: 'Ownership language invites questions about scope, autonomy, and decisions you directly drove.',
      suggested_evidence: 'Prepare the team size, constraints, decisions, and outcome you personally drove.',
    };
  }

  // 5. Engineering Implementation / Automation / Optimization
  if (ENGINEERING_ACTION_VERBS.test(trimmed)) {
    return {
      type: 'experience',
      risk: 'likely-follow-up',
      reason: 'Concrete technical implementation statements invite technical depth and testing questions.',
      suggested_evidence: 'Prepare the implementation approach, tricky edge cases, and test verification.',
    };
  }

  // 6. Project statement
  if (/\b(project|platform|application|service|system|product)\b/i.test(trimmed)) {
    return {
      type: 'project',
      risk: 'needs-clarification',
      reason: 'The project scope or your contribution may need clarification.',
      suggested_evidence: 'Prepare the architecture, your exact contribution, users, scale, and result.',
    };
  }

  // Fallback (safe general statement)
  return {
    type: 'experience',
    risk: 'safe',
    reason: 'The statement is a general supporting statement rather than a high-risk claim.',
    suggested_evidence: 'Keep one concrete example ready.',
  };
}

export function questionPromptForClaim(claim: ResumeClaim): string {
  const text = claim.text;
  if (/\brate\s*limit(?:ing|ed|s)?\b/i.test(text)) {
    return `For your work on: "${text}", what rate-limiting algorithm and storage strategy did you choose, how did you handle distributed deployments, and what response did clients receive when limits were exceeded?`;
  }
  switch (claim.type) {
    case 'achievement':
      return `In your claim: "${text}", what was the baseline prior to this result, how was the reported outcome measured or verified, and what specific technical changes drove the improvement?`;
    case 'integration':
      return `Regarding your work on: "${text}", how did you handle network failures, idempotency, and asynchronous webhook or event processing, and how were edge cases verified?`;
    case 'architecture':
      return `For your architecture in: "${text}", what core trade-offs did you evaluate, how did you handle failure modes or data consistency, and how does the system scale under peak load?`;
    case 'responsibility':
      return `In your ownership of: "${text}", what was your individual technical scope versus the broader team's, and what key technical decisions did you drive?`;
    case 'project':
      return `For: "${text}", what was the core system architecture, what was your exact contribution, and what technical challenges did you resolve?`;
    case 'experience':
    default:
      return `You mentioned: "${text}". What were the most critical edge cases in this implementation, and what testing or deployment strategy ensured production reliability?`;
  }
}

function extractSkillsFromLine(line: string): string[] {
  const cleaned = line.replace(/^(?:skills|technical\s+skills|core\s+skills|languages|frameworks|libraries|databases|tools|technologies|devops|cloud)[\s:]+/i, '');
  return cleaned
    .split(/[,|•/·;]+/)
    .map(token => token.trim())
    .filter(token => token.length >= 2 && token.length <= 30 && !/\b(?:and|with|etc)\b/i.test(token));
}

export function analyzeResume(resume: string, requirements: IRequirement[]): ResumeAnalysis {
  const rawLines = resume.split(/\r?\n|(?<=[.!?])\s+/)
    .map(line => line.replace(/^(?:[-*•–—\s]+|\d+[\.)]\s+)/, '').trim())
    .filter(line => line.length >= 8);

  const extractedSkills = new Set<string>();
  const substantiveCandidates: string[] = [];

  for (const line of rawLines) {
    if (isSectionHeading(line) || isContactMetadata(line) || isDateOrTenure(line)) {
      continue;
    }
    if (isRawSkillList(line)) {
      for (const skill of extractSkillsFromLine(line)) {
        extractedSkills.add(skill);
      }
      continue;
    }
    if (isStandaloneJobTitle(line) || isProjectHeading(line)) {
      continue;
    }
    if (isSubstantiveClaim(line)) {
      substantiveCandidates.push(line);
    }
  }

  // Never fall back to headings, contacts, titles, dates, or skill lists
  const validFallbackLines = rawLines.filter(line =>
    !isSectionHeading(line) &&
    !isContactMetadata(line) &&
    !isDateOrTenure(line) &&
    !isRawSkillList(line) &&
    !isStandaloneJobTitle(line) &&
    !isProjectHeading(line)
  );

  const selectedLines = substantiveCandidates.length > 0
    ? substantiveCandidates.slice(0, 80)
    : validFallbackLines.slice(0, 80);

  const claims: ResumeClaim[] = selectedLines.map((text, index): ResumeClaim => {
    const matchedRequirements = requirements.filter(requirement => {
      const words = requirement.text.toLowerCase().split(/\W+/).filter(word => word.length > 4);
      return words.some(word => text.toLowerCase().includes(word));
    }).map(requirement => requirement.id);
    const classification = classifyClaim(text);
    return {
      id: `c${index + 1}`,
      text,
      ...classification,
      requirement_ids: matchedRequirements,
    };
  });

  // Prioritize questions: High-risk (metrics) first, then architecture/integration, then responsibility/experience
  const questionEligible = claims.filter(claim => claim.risk !== 'safe');

  const prioritizedClaims = [...questionEligible].sort((a, b) => {
    const priority = (c: ResumeClaim) => {
      if (c.risk === 'high-risk') return 1;
      if (c.type === 'architecture' || c.type === 'integration') return 2;
      if (c.requirement_ids.length > 0) return 3;
      if (c.type === 'responsibility') return 4;
      return 5;
    };
    return priority(a) - priority(b);
  }).slice(0, 10);

  const questions = prioritizedClaims.map((claim, index) => ({
    id: `rq${index + 1}`,
    prompt: questionPromptForClaim(claim),
    claim_id: claim.id,
    requirement_ids: claim.requirement_ids,
  }));

  return {
    claims,
    questions,
    needs_evidence: claims.filter(claim => claim.risk === 'high-risk' || claim.risk === 'needs-clarification').map(claim => claim.id),
    skills: [...extractedSkills],
  };
}