import mongoose, { Schema, Document } from 'mongoose';

export interface IRequirement {
  id: string; // e.g., 'r1'
  text: string;
  kind: 'technical' | 'behavioural' | 'domain';
  priority: 'must' | 'nice';
}

export interface IQuestion {
  id: string; // e.g., 'q1'
  requirement_ids: string[];
  category: 'technical' | 'behavioural' | 'system-design' | 'company-fit';
  prompt: string;
  answer_outline: string;
  difficulty: number; // 1-3
  is_edited?: boolean;
  is_pinned?: boolean;
  is_custom?: boolean;
}

export interface IFlashcard {
  id: string; // e.g., 'f1'
  front: string;
  back: string;
  requirement_ids: string[];
  confidence_score?: number; // 1-3 (for practice mode)
}

export interface IDaySchedule {
  day: number;
  focus: string;
  question_ids: string[];
  minutes: number;
}

export interface IResumeAnalysis {
  claims: {
    id: string;
    text: string;
    type: string;
    risk: string;
    reason: string;
    suggested_evidence: string;
    requirement_ids: string[];
  }[];
  questions: { id: string; prompt: string; claim_id: string; requirement_ids: string[] }[];
  needs_evidence: string[];
}

export interface IStory {
  id: string;
  title: string;
  category: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  analysis?: { missing: string[]; completeness: number; follow_ups: string[] };
}

export interface IInterviewDebrief {
  remembered_questions: string[];
  unanswered_topics: string[];
  interviewer_feedback: string;
  confidence: number;
  outcome: string;
  predicted_topics: string[];
  predicted_question_ids: string[];
  gaps: string[];
  next_focus: string[];
  created_at: string;
}

export interface IKit extends Document {
  userId: mongoose.Types.ObjectId;
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
  resume_analysis?: IResumeAnalysis;
  stories?: IStory[];
  debrief?: IInterviewDebrief;
}

const KitSchema = new Schema<IKit>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  source: {
    company: { type: String, default: '' },
    company_url: { type: String, required: true },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    jd_chars: { type: Number, default: 0 },
    researched_at: { type: String, default: () => new Date().toISOString() },
    pages_used: [{ type: String }],
  },
  company_brief: {
    summary: { type: String, default: '' },
    what_they_do: { type: String, default: '' },
    sources: [{ type: String }],
  },
  role: {
    title: { type: String, default: '' },
    seniority: { type: String, default: '' },
    responsibilities: [{ type: String }],
    requirements: [{
      id: String,
      text: String,
      kind: { type: String, enum: ['technical', 'behavioural', 'domain'] },
      priority: { type: String, enum: ['must', 'nice'] }
    }],
  },
  questions: [{
    id: String,
    requirement_ids: [String],
    category: { type: String, enum: ['technical', 'behavioural', 'system-design', 'company-fit'] },
    prompt: String,
    answer_outline: String,
    difficulty: { type: Number, min: 1, max: 3, required: true },
    is_edited: { type: Boolean, default: false },
    is_pinned: { type: Boolean, default: false },
    is_custom: { type: Boolean, default: false }
  }],
  flashcards: [{
    id: String,
    front: String,
    back: String,
    requirement_ids: [String],
    confidence_score: { type: Number, min: 0, max: 3, default: 0 }
  }],
  schedule: {
    days_available: { type: Number, min: 1, max: 60, required: true },
    days: [{
      day: Number,
      focus: String,
      question_ids: [String],
      minutes: Number
    }]
  },
  coverage: {
    uncovered_requirement_ids: [String],
    passes: { type: Number, default: 1 }
  },
  resume_analysis: { type: Schema.Types.Mixed, default: undefined },
  stories: { type: Schema.Types.Mixed, default: [] },
  debrief: { type: Schema.Types.Mixed, default: undefined }
}, { timestamps: true });

export default mongoose.model<IKit>('Kit', KitSchema);