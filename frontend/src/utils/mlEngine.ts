/**
 * Client-side ML Engine
 * Mirrors the Python ML logic so the web app works without Cloud Functions.
 *
 * 1. computeUrgencyScore  — weighted formula (Volume + Severity + Recency + Category)
 * 2. classifySurveyText   — keyword-based NLP category classifier
 */

// ── Urgency Scoring ───────────────────────────────────────────────────────────

export interface UrgencyBreakdown {
  volume: number;
  severity: number;
  recency: number;
  category: number;
}

export interface UrgencyResult {
  score: number;
  breakdown: UrgencyBreakdown;
  label: 'CRITICAL' | 'URGENT' | 'MODERATE' | 'LOW';
}

const SEVERITY_MAP: Record<string, number> = {
  low: 0,
  medium: 10,
  high: 22,
  critical: 30,
};

const CATEGORY_MAP: Record<string, number> = {
  medical: 15,
  shelter: 12,
  food_distribution: 10,
  water_sanitation: 8,
  education: 6,
  general: 3,
};

export function computeUrgencyScore(
  reportedCount: number,
  severity: string,
  daysSinceReport: number,
  category: string
): UrgencyResult {
  // Component 1: Volume (max 35)
  const volume = Math.min(reportedCount / 30, 1.0) * 35;

  // Component 2: Severity (max 30)
  const sev = SEVERITY_MAP[severity.toLowerCase()] ?? 0;

  // Component 3: Recency (max 20, decays 2pts/day)
  const recency = Math.max(0, 20 - daysSinceReport * 2);

  // Component 4: Category weight (max 15)
  const cat = CATEGORY_MAP[category.toLowerCase()] ?? 3;

  const total = Math.min(volume + sev + recency + cat, 100);

  const label: UrgencyResult['label'] =
    total >= 80 ? 'CRITICAL' :
    total >= 60 ? 'URGENT' :
    total >= 35 ? 'MODERATE' : 'LOW';

  return {
    score: Math.round(total * 100) / 100,
    breakdown: {
      volume: Math.round(volume * 100) / 100,
      severity: sev,
      recency: Math.round(recency * 100) / 100,
      category: cat,
    },
    label,
  };
}

// ── NLP Category Classifier ───────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food_distribution: [
    'food', 'ration', 'hunger', 'meals', 'grain', 'rice', 'starving',
    'starvation', 'eating', 'feed', 'nutrition', 'famine', 'wheat', 'dal',
    'groceries', 'supplies', 'distribute', 'distribution',
  ],
  medical: [
    'medicine', 'doctor', 'hospital', 'sick', 'injury', 'vaccination',
    'health', 'medical', 'nurse', 'ambulance', 'treatment', 'disease',
    'fever', 'wound', 'bleeding', 'emergency', 'clinic', 'patient',
    'cholera', 'malaria', 'dengue', 'covid',
  ],
  shelter: [
    'shelter', 'flood', 'roof', 'house', 'displacement', 'homeless',
    'tent', 'camp', 'evacuate', 'evacuation', 'building', 'collapsed',
    'damaged', 'destroyed', 'cyclone', 'earthquake', 'landslide',
    'temporary', 'accommodation', 'housing',
  ],
  education: [
    'school', 'books', 'children', 'teaching', 'students', 'stationery',
    'education', 'learn', 'class', 'teacher', 'pencil', 'notebook',
    'uniform', 'fees', 'dropout', 'literacy',
  ],
  water_sanitation: [
    'water', 'toilet', 'sanitation', 'hygiene', 'well', 'pump',
    'drinking', 'clean', 'contaminated', 'sewage', 'latrine',
    'handwash', 'soap', 'purification', 'borewell',
  ],
};

export interface NLPResult {
  category: string;
  confidence: number; // 0-1
  scores: Record<string, number>;
}

export function classifySurveyText(text: string): NLPResult {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter((kw) => lower.includes(kw)).length;
  }

  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const total = Object.values(scores).reduce((a, b) => a + b, 0);

  return {
    category: best[1] > 0 ? best[0] : 'general',
    confidence: total > 0 ? best[1] / total : 0,
    scores,
  };
}

// ── Urgency label helpers ─────────────────────────────────────────────────────

export function urgencyLabelFromScore(score: number) {
  if (score >= 80) return { label: 'CRITICAL', color: 'bg-red-100 text-red-700 border border-red-300' };
  if (score >= 60) return { label: 'URGENT', color: 'bg-orange-100 text-orange-700 border border-orange-300' };
  if (score >= 35) return { label: 'MODERATE', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300' };
  return { label: 'LOW', color: 'bg-green-100 text-green-700 border border-green-300' };
}
