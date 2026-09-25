import { Router } from 'express';
import mongoose from 'mongoose';
import type { IStory } from '../models/Kit.js';
import Kit from '../models/Kit.js';
import InterviewSession from '../models/InterviewSession.js';
import KnowledgeNote from '../models/KnowledgeNote.js';
import Event from '../models/Event.js';
import { generateSchedule } from '../services/scheduler.js';
import { generateKit, generateQuestionsForCategory } from '../services/pipeline.js';
import { calculateReadiness } from '../services/readiness.js';
import { createPressureSession, interviewerPersonalities, pressureLevels, type InterviewerPersonality, type PressureLevel } from '../services/pressure.js';
import { updateSessionMemory } from '../services/sessionMemory.js';
import { createArchitectureLab, createCodingLab, evaluateArchitectureSubmission, evaluateCodingSubmission } from '../services/labs.js';
import { exportKitCsv, exportKitMarkdown } from '../services/exports.js';
import { isFeatureEnabled } from '../services/featureFlags.js';
import { analyzeResume } from '../services/resume.js';
import { analyzeStory, storyCategories, type StoryCategory, type StoryInput } from '../services/stories.js';
import { createDailyWeakness, findBlindSpots } from '../services/weakness.js';
import { analyzeDebrief, createInterviewDayPlan, type DebriefInput } from '../services/interviewDay.js';
import { createMissionControl, getNextBestAction } from '../services/nextAction.js';
import type { AuthedRequest } from '../middleware/auth.js';

const router = Router();

function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

router.get('/features', async (_req, res) => {
  const { getFeatureFlags } = await import('../services/featureFlags.js');
  res.json(getFeatureFlags());
});

// POST generate and persist a complete preparation kit.
router.post('/', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const { jd, company_url, days, company, role, location } = req.body ?? {};
  if (typeof jd !== 'string' || !jd.trim()) return res.status(400).json({ error: 'jd is required' });
  if (typeof company_url !== 'string' || !company_url.trim()) return res.status(400).json({ error: 'company_url is required' });

  try {
    const generatedKit = await generateKit({
      jd,
      company_url,
      days: Number(days) || 1,
      company,
      role,
      location,
    });
    const kit = await Kit.create({
      userId,
      ...generatedKit,
    });
    res.status(201).json(kit);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Kit generation failed';
    res.status(422).json({ error: message });
  }
});

// GET all user kits
router.get('/', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const kits = await Kit.find({ userId }).sort({ createdAt: -1 });
  res.json(kits);
});

router.get('/dashboard', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const kit = await Kit.findOne({ userId }).sort({ updatedAt: -1 });
  if (!kit) return res.json({ kit: null, message: 'Create your first interview kit to start mission control.' });
  res.json({ kit: createMissionControl(kit) });
});

// GET single kit by ID
router.get('/:id', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(kit);
});

router.get('/:id/readiness', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(calculateReadiness({
    title: kit.role.title,
    requirements: kit.role.requirements,
    questions: kit.questions,
    flashcards: kit.flashcards,
    companyBrief: kit.company_brief,
  }));
});

router.get('/:id/next-action', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(getNextBestAction(kit));
});

router.get('/:id/events', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isFeatureEnabled('event_tracking')) return res.json([]);
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.exists({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(await Event.find({ kit_id: req.params.id }).sort({ createdAt: -1 }).limit(100).lean());
});

router.post('/:id/events', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isFeatureEnabled('event_tracking')) return res.status(404).json({ error: 'Event tracking is disabled' });
  const { type, payload } = req.body ?? {};
  if (typeof type !== 'string' || !type.trim()) return res.status(400).json({ error: 'type is required' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.exists({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const event = await Event.create({ kit_id: req.params.id, type, payload: payload && typeof payload === 'object' ? payload : {}, actor: 'candidate' });
  res.status(201).json(event);
});

router.get('/:id/export', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const format = req.query.format || 'json';
  if (format === 'markdown') return res.type('text/markdown').send(exportKitMarkdown(kit));
  if (format === 'csv') return res.type('text/csv').send(exportKitCsv(kit));
  if (format !== 'json') return res.status(400).json({ error: 'format must be json, markdown, or csv' });
  res.json(kit);
});

router.get('/:id/knowledge', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.exists({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(await KnowledgeNote.find({ kit_id: req.params.id }).sort({ updatedAt: -1 }).lean());
});

router.post('/:id/knowledge', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const { title, content, url, skills, source_type } = req.body ?? {};
  if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) return res.status(400).json({ error: 'title and content are required' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.exists({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const note = await KnowledgeNote.create({ kit_id: req.params.id, title, content, url: url || '', skills: Array.isArray(skills) ? skills : [], source_type: source_type || 'note' });
  res.status(201).json(note);
});

router.delete('/:id/knowledge/:noteId', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.noteId)) return res.status(400).json({ error: 'Invalid ID format' });
  const kitOwned = await Kit.exists({ _id: req.params.id, userId });
  if (!kitOwned) return res.status(404).json({ error: 'Kit not found' });
  const deleted = await KnowledgeNote.findOneAndDelete({ _id: req.params.noteId, kit_id: req.params.id });
  if (!deleted) return res.status(404).json({ error: 'Knowledge note not found' });
  res.status(204).send();
});

router.get('/:id/progress', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const rated = kit.flashcards.filter(card => (card.confidence_score || 0) > 0);
  const averageConfidence = rated.length === 0 ? 0 : rated.reduce((total, card) => total + (card.confidence_score || 0), 0) / rated.length;
  res.json({ questions: kit.questions.length, flashcards: kit.flashcards.length, rated_flashcards: rated.length, average_confidence: Number(averageConfidence.toFixed(1)), readiness: calculateReadiness({ title: kit.role.title, requirements: kit.role.requirements, questions: kit.questions, flashcards: kit.flashcards, companyBrief: kit.company_brief }) });
});

router.post('/:id/pressure-session', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const level = req.body?.level || 'normal';
  const personality = req.body?.personality || 'friendly-engineer';
  if (!pressureLevels.includes(level as PressureLevel)) return res.status(400).json({ error: 'Invalid pressure level' });
  if (!interviewerPersonalities.includes(personality as InterviewerPersonality)) return res.status(400).json({ error: 'Invalid interviewer personality' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const session = createPressureSession(kit.questions, kit.role.requirements, level as PressureLevel, personality as InterviewerPersonality);
  const savedSession = await InterviewSession.create({ kit_id: kit._id, mode: 'pressure', level, personality, turns: session.turns, memory: { claims: [], weaknesses: [], contradictions: [], unfinished_topics: [] } });
  res.json({ ...session, session_id: savedSession.id, memory: savedSession.memory });
});

router.get('/:id/sessions/:sessionId', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.sessionId)) return res.status(400).json({ error: 'Invalid ID format' });
  const kitOwned = await Kit.exists({ _id: req.params.id, userId });
  if (!kitOwned) return res.status(404).json({ error: 'Kit not found' });
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, kit_id: req.params.id });
  if (!session) return res.status(404).json({ error: 'Interview session not found' });
  res.json(session);
});

router.post('/:id/sessions/:sessionId/answer', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const answer = req.body?.answer;
  if (typeof answer !== 'string' || !answer.trim()) return res.status(400).json({ error: 'answer is required' });
  if (!isValidObjectId(req.params.id) || !isValidObjectId(req.params.sessionId)) return res.status(400).json({ error: 'Invalid ID format' });
  const kitOwned = await Kit.exists({ _id: req.params.id, userId });
  if (!kitOwned) return res.status(404).json({ error: 'Kit not found' });
  const session = await InterviewSession.findOne({ _id: req.params.sessionId, kit_id: req.params.id });
  if (!session) return res.status(404).json({ error: 'Interview session not found' });
  updateSessionMemory(session, { answer, topic: req.body?.topic });
  session.current_turn = Math.min(session.current_turn + 1, session.turns.length);
  if (session.current_turn >= session.turns.length) session.status = 'completed';
  await session.save();
  res.json({ session_id: session.id, current_turn: session.current_turn, status: session.status, memory: session.memory });
});

router.post('/:id/labs/architecture', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const lab = createArchitectureLab(kit);
  res.json(req.body?.answer ? { lab, evaluation: evaluateArchitectureSubmission(req.body.answer) } : { lab });
});

router.post('/:id/labs/coding', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const lab = createCodingLab(kit);
  res.json(req.body?.answer ? { lab, evaluation: evaluateCodingSubmission(req.body.answer) } : { lab });
});

router.get('/:id/resume-analysis', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(kit.resume_analysis || { claims: [], questions: [], needs_evidence: [], skills: [] });
});

router.post('/:id/resume-analysis', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const resume = req.body?.resume;
  if (typeof resume !== 'string' || resume.trim().length < 20) return res.status(400).json({ error: 'resume must contain at least 20 characters' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const analysis = analyzeResume(resume, kit.role.requirements);
  kit.resume_analysis = analysis;
  await kit.save();
  res.json(analysis);
});

router.get('/:id/stories', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(kit.stories || []);
});

router.post('/:id/stories', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const input = req.body as Partial<StoryInput>;
  if (!input.title || !input.category || !storyCategories.includes(input.category as StoryCategory)) return res.status(400).json({ error: 'title and valid category are required' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const story: StoryInput = { title: input.title, category: input.category as StoryCategory, situation: input.situation || '', task: input.task || '', action: input.action || '', result: input.result || '' };
  const savedStory = { id: `s${(kit.stories?.length || 0) + 1}`, ...story, analysis: analyzeStory(story) };
  kit.stories = [...(kit.stories || []), savedStory];
  await kit.save();
  res.status(201).json(savedStory);
});

router.put('/:id/stories/:storyId', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const index = (kit.stories || []).findIndex(story => story.id === req.params.storyId);
  if (index < 0) return res.status(404).json({ error: 'Story not found' });
  const current = kit.stories?.[index];
  if (!current) return res.status(404).json({ error: 'Story not found' });
  const nextStory = { ...current, ...req.body } as IStory;
  if (!storyCategories.includes(nextStory.category as StoryCategory)) return res.status(400).json({ error: 'Invalid story category' });
  nextStory.analysis = analyzeStory({ ...nextStory, category: nextStory.category as StoryCategory });
  kit.stories = (kit.stories || []).map((story, storyIndex) => storyIndex === index ? nextStory : story);
  await kit.save();
  res.json(nextStory);
});

router.delete('/:id/stories/:storyId', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const stories = (kit.stories || []).filter(story => story.id !== req.params.storyId);
  if (stories.length === (kit.stories || []).length) return res.status(404).json({ error: 'Story not found' });
  kit.stories = stories;
  await kit.save();
  res.status(204).send();
});

router.get('/:id/blind-spots', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json({ blind_spots: findBlindSpots(kit.role.requirements, kit.questions, kit.flashcards) });
});

router.get('/:id/daily-weakness', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json({ daily_weakness: createDailyWeakness(kit.role.requirements, kit.questions, kit.flashcards) });
});

router.get('/:id/interview-day', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId }).lean();
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  res.json(createInterviewDayPlan(kit));
});

router.post('/:id/debrief', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const input = req.body as Partial<DebriefInput>;
  if (!Array.isArray(input.remembered_questions) || !Array.isArray(input.unanswered_topics)) return res.status(400).json({ error: 'remembered_questions and unanswered_topics must be arrays' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });
  const debrief = analyzeDebrief({ remembered_questions: input.remembered_questions, unanswered_topics: input.unanswered_topics, interviewer_feedback: input.interviewer_feedback || '', confidence: Number(input.confidence) || 0, outcome: input.outcome || '' }, kit);
  kit.debrief = debrief;
  await kit.save();
  res.status(201).json(debrief);
});

// PUT update kit (Inline Edits, Question Reordering, Pinning)
router.put('/:id', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const { questions, flashcards, role, company_brief } = req.body ?? {};
  if (questions !== undefined && !Array.isArray(questions)) return res.status(400).json({ error: 'questions must be an array' });
  if (flashcards !== undefined && !Array.isArray(flashcards)) return res.status(400).json({ error: 'flashcards must be an array' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });

  const update = Object.fromEntries(
    Object.entries({ questions, flashcards, role, company_brief }).filter(([, value]) => value !== undefined),
  );
  const updatedKit = await Kit.findOneAndUpdate(
    { _id: req.params.id, userId },
    { $set: update },
    { new: true, runValidators: true },
  );
  if (!updatedKit) return res.status(404).json({ error: 'Kit not found' });

  res.json(updatedKit);
});

// POST regenerate one category while preserving edited, custom, and pinned questions.
router.post('/:id/regenerate', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  const categories = ['technical', 'behavioural', 'system-design', 'company-fit'] as const;
  const category = req.body?.category;
  if (!categories.includes(category)) return res.status(400).json({ error: 'Invalid question category' });
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });

  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });

  const existingIds = kit.questions.map(question => Number(question.id.replace(/^q/, '')) || 0);
  const nextId = Math.max(0, ...existingIds) + 1;
  const preserved = kit.questions.filter(question => question.category !== category || question.is_edited || question.is_custom || question.is_pinned);
  const generated = generateQuestionsForCategory(kit.role.requirements, category, nextId);
  kit.questions = [...preserved, ...generated];
  kit.schedule = generateSchedule(kit.schedule.days_available, kit.role.requirements, kit.questions);
  await kit.save();

  res.json(kit);
});

// POST recalculate schedule arithmetic
router.post('/:id/reschedule', async (req, res) => {
  const userId = (req as AuthedRequest).userId as mongoose.Types.ObjectId;
  if (!isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid kit ID' });
  const kit = await Kit.findOne({ _id: req.params.id, userId });
  if (!kit) return res.status(404).json({ error: 'Kit not found' });

  const updatedSchedule = generateSchedule(
    kit.schedule.days_available,
    kit.role.requirements,
    kit.questions
  );

  kit.schedule = updatedSchedule;
  await kit.save();

  res.json(kit);
});

export default router;