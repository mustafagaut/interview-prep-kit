import type { IInterviewSession } from '../models/InterviewSession.js';

export interface SessionMemoryUpdate {
  answer: string;
  topic?: string;
}

export function updateSessionMemory(session: Pick<IInterviewSession, 'memory'>, input: SessionMemoryUpdate) {
  const answer = input.answer.trim();
  const uncertainty = /i don't know|not sure|never worked|can't remember/i.test(answer);
  if ((answer.length < 40 || uncertainty) && input.topic) session.memory.weaknesses.push(input.topic);
  if (/\b(i|we)\s+(built|designed|implemented|led|owned|delivered)\b/i.test(answer)) session.memory.claims.push(answer.slice(0, 240));
  if (uncertainty && input.topic) session.memory.unfinished_topics.push(input.topic);
  session.memory.claims = [...new Set(session.memory.claims)].slice(-20);
  session.memory.weaknesses = [...new Set(session.memory.weaknesses)].slice(-20);
  session.memory.unfinished_topics = [...new Set(session.memory.unfinished_topics)].slice(-20);
  return session.memory;
}