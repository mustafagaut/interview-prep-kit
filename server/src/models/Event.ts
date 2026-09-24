import mongoose, { Schema, Document } from 'mongoose';

export interface IEvent extends Document {
  kit_id?: mongoose.Types.ObjectId;
  type: string;
  payload: Record<string, unknown>;
  actor: 'candidate' | 'system';
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>({
  kit_id: { type: Schema.Types.ObjectId, ref: 'Kit', index: true },
  type: { type: String, required: true, index: true },
  payload: { type: Schema.Types.Mixed, default: {} },
  actor: { type: String, enum: ['candidate', 'system'], default: 'system' },
}, { timestamps: true });

export default mongoose.model<IEvent>('Event', EventSchema);