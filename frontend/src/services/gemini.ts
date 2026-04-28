import { GoogleGenerativeAI, ChatSession } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? '';

let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) genAI = new GoogleGenerativeAI(API_KEY);
  return genAI;
}

export interface ChatContext {
  role: 'coordinator' | 'volunteer' | null;
  userName?: string;
  // Live data injected from Firestore
  needsCount?: number;
  criticalNeedsCount?: number;
  openTasksCount?: number;
  completedTasksCount?: number;
  topNeedAreas?: string[];
  volunteerSkills?: string[];
  volunteerReliability?: number;
  volunteerTasksCompleted?: number;
}

function buildSystemPrompt(ctx: ChatContext): string {
  const base = `You are an AI assistant for the Disaster Response Volunteer Coordination Platform — a Google Solutions Challenge project for India.

Your job is to help ${ctx.role === 'coordinator' ? 'NGO coordinators' : 'volunteers'} manage disaster relief operations efficiently across India.

Be concise, practical, and empathetic. Always respond in 2-4 sentences unless a detailed answer is needed. Use bullet points for lists.`;

  if (ctx.role === 'coordinator') {
    return `${base}

COORDINATOR CONTEXT:
- Current open needs in system: ${ctx.needsCount ?? 'unknown'}
- Critical needs (score ≥75): ${ctx.criticalNeedsCount ?? 'unknown'}
- Open tasks awaiting volunteers: ${ctx.openTasksCount ?? 'unknown'}
- Completed tasks: ${ctx.completedTasksCount ?? 'unknown'}
- Top areas with needs: ${ctx.topNeedAreas?.join(', ') ?? 'unknown'}

You help coordinators with:
- Prioritizing which needs to address first
- Understanding urgency scores and what they mean
- Creating effective tasks and assigning the right volunteers
- Interpreting AI match scores for volunteers
- Managing disaster response operations
- Understanding seasonal risk forecasts for Maharashtra
- Best practices for NGO coordination

Always reference the live data above when relevant.`;
  }

  return `${base}

VOLUNTEER CONTEXT:
- Volunteer name: ${ctx.userName ?? 'unknown'}
- Skills: ${ctx.volunteerSkills?.join(', ') ?? 'unknown'}
- Reliability score: ${ctx.volunteerReliability ?? 'unknown'}%
- Tasks completed: ${ctx.volunteerTasksCompleted ?? 0}
- Open tasks assigned: ${ctx.openTasksCount ?? 0}

You help volunteers with:
- Understanding their assigned tasks and what to bring
- Safety tips for specific disaster types (flood, earthquake, fire)
- First aid guidance for common disaster injuries
- How to navigate to task locations
- What to do when arriving at a relief site
- How to communicate with coordinators
- Building their reliability score
- Understanding their impact and achievements

Always be encouraging and safety-focused.`;
}

// Suggested questions per role
export const SUGGESTED_QUESTIONS = {
  coordinator: [
    'Which needs should I prioritize today?',
    'How does the urgency scoring work?',
    'What makes a good volunteer match?',
    'How do I prepare for monsoon season?',
    'What tasks should I create for a flood situation?',
  ],
  volunteer: [
    'What should I bring to a medical relief camp?',
    'How do I stay safe during flood relief?',
    'What first aid should I know for disaster response?',
    'How can I improve my reliability score?',
    'What do I do when I arrive at a relief site?',
  ],
};

let chatSession: ChatSession | null = null;
let currentContext: string = '';

export function startNewChat(ctx: ChatContext): void {
  const systemPrompt = buildSystemPrompt(ctx);
  // Reset if context changed significantly
  if (systemPrompt !== currentContext) {
    chatSession = null;
    currentContext = systemPrompt;
  }
}

export async function sendMessage(
  message: string,
  ctx: ChatContext
): Promise<string> {
  if (!API_KEY || API_KEY === 'your_gemini_api_key_here') {
    return '⚠️ Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file. Get a free key at [aistudio.google.com](https://aistudio.google.com).';
  }

  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: 'gemini-2.0-flash-lite',
      systemInstruction: buildSystemPrompt(ctx),
    });

    if (!chatSession) {
      chatSession = model.startChat({ history: [] });
    }

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  } catch (err: unknown) {
    const msg = (err as Error).message ?? 'Unknown error';
    if (msg.includes('API_KEY_INVALID') || msg.includes('API key')) {
      return '⚠️ Invalid Gemini API key. Please check your VITE_GEMINI_API_KEY in .env.';
    }
    if (msg.includes('quota') || msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
      return '⚠️ Gemini API rate limit hit. The free tier allows ~15 requests/minute. Wait 60 seconds and try again, or upgrade your API quota at [aistudio.google.com](https://aistudio.google.com).';
    }
    return `⚠️ Error: ${msg}`;
  }
}

export function resetChat(): void {
  chatSession = null;
}
