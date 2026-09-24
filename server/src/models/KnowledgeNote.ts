import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeNote extends Document {
  kit_id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  url?: string;
  skills: string[];
  source_type: 'note' | 'article' | 'documentation' | 'cheatsheet';
}

const KnowledgeNoteSchema = new Schema<IKnowledgeNote>({
  kit_id: { type: Schema.Types.ObjectId, ref: 'Kit', required: true, index: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  url: { type: String, default: '' },
  skills: { type: [String], default: [] },
  source_type: { type: String, enum: ['note', 'article', 'documentation', 'cheatsheet'], default: 'note' },
}, { timestamps: true });

export default mongoose.model<IKnowledgeNote>('KnowledgeNote', KnowledgeNoteSchema);