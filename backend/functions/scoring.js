'use strict';

const SEVERITY_MAP = { low: 0, medium: 10, high: 22, critical: 30 };
const CATEGORY_MAP = {
  medical: 15, shelter: 12, food_distribution: 10,
  water_sanitation: 8, education: 6, general: 3,
};

/**
 * Compute urgency score (0-100) for a need document.
 * @param {object} need - Firestore document data
 * @returns {{ total: number, breakdown: object }}
 */
function computeUrgencyScore(need) {
  // Volume: 0-35 pts
  const volumeScore = Math.min((need.reportedCount || 1) / 30, 1.0) * 35;

  // Severity: 0-30 pts
  const severityScore = SEVERITY_MAP[need.severity] ?? 0;

  // Recency: 0-20 pts, decays 2 pts/day
  let daysSince = 0;
  if (need.createdAt && need.createdAt.toDate) {
    daysSince = Math.floor((Date.now() - need.createdAt.toDate().getTime()) / 86400000);
  }
  const recencyScore = Math.max(0, 20 - daysSince * 2);

  // Category: 0-15 pts
  const categoryScore = CATEGORY_MAP[need.category] ?? 3;

  const total = volumeScore + severityScore + recencyScore + categoryScore;

  return {
    total: Math.round(Math.min(total, 100) * 100) / 100,
    breakdown: {
      volume: Math.round(volumeScore * 100) / 100,
      severity: severityScore,
      recency: recencyScore,
      category: categoryScore,
    },
  };
}

module.exports = { computeUrgencyScore };
