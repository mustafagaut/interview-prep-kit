import axios from 'axios';

export interface LlmDraft {
  requirements?: { text: string; kind?: string; priority?: string }[];
  questions?: { requirement_index?: number; category?: string; prompt?: string; answer_outline?: string; difficulty?: number }[];
}

function parseJson(content: string): LlmDraft | null {
  try {
    const parsed: unknown = JSON.parse(content);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed as LlmDraft;
  } catch {
    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1];
    if (!fenced) return null;
    try {
      return JSON.parse(fenced) as LlmDraft;
    } catch {
      return null;
    }
  }
}

export async function generateInterviewDraft(jd: string, research: string): Promise<LlmDraft | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const endpoint = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await axios.post(endpoint, {
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Return only JSON with requirements and questions. Never invent company facts not present in the input.' },
          { role: 'user', content: JSON.stringify({
            task: 'Extract requirements and interview questions.',
            required_shape: { requirements: [{ text: 'string', kind: 'technical|behavioural|domain', priority: 'must|nice' }], questions: [{ requirement_index: 0, category: 'technical|behavioural|system-design|company-fit', prompt: 'string', answer_outline: 'string', difficulty: 1 }] },
            jd,
            company_research: research.slice(0, 6000),
          }) },
        ],
      }, { timeout: 15000, headers: { Authorization: `Bearer ${apiKey}` } });
      return parseJson(response.data?.choices?.[0]?.message?.content || '');
    } catch (error) {
      lastError = error;
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (status !== 429 && (!status || status < 500)) break;
      await new Promise(resolve => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }

  if (lastError) console.warn('LLM generation unavailable; using deterministic fallback.');
  return null;
}