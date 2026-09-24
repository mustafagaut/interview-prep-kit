import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewSession extends Document {
  kit_id: mongoose.Types.ObjectId;
  mode: 'pressure' | 'simulation';
  level: string;
  personality: string;
  turns: unknown[];
  current_turn: number;
  status: 'active' | 'completed';
  memory: {
    claims: string[];
    weaknesses: string[];
    contradictions: string[];
    unfinished_topics: string[];
  };
}

const InterviewSessionSchema = new Schema<IInterviewSession>({
  kit_id: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
  mode: { type: String, enum: ['pressure', 'simulation'], default: 'pressure' },
  level: { type: String, required: true },
  personality: { type: String, required: true },
  turns: { type: [Schema.Types.Mixed], default: [] },
  current_turn: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  memory: {
    claims: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    contradictions: { type: [String], default: [] },
    unfinished_topics: { type: [String], default: [] },
  },
}, { timestamps: true });

export default mongoose.model<IInterviewSession>('InterviewSession', InterviewSessionSchema);