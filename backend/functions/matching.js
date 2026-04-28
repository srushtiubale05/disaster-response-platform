'use strict';

/**
 * Haversine distance between two lat/lng points (km).
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Score a single volunteer against a task.
 * Returns { total, breakdown, matchedSkills, distanceKm }
 */
function computeMatchScore(volunteer, task) {
  const breakdown = {};

  // 1. Skill match: 0-50 pts
  const required = new Set((task.requiredSkills || []).map((s) => s.toLowerCase()));
  const has = new Set((volunteer.skills || []).map((s) => s.toLowerCase()));
  const matchedSkills = [...required].filter((s) => has.has(s));
  breakdown.skill = required.size === 0 ? 50 : (matchedSkills.length / required.size) * 50;

  // 2. Proximity: 0-25 pts
  const distanceKm = calculateDistance(
    volunteer.lat ?? 0, volunteer.lng ?? 0,
    task.lat ?? 0, task.lng ?? 0
  );
  breakdown.proximity = Math.max(0, 25 - distanceKm * 2.5);
  breakdown.distanceKm = Math.round(distanceKm * 10) / 10;

  // 3. Reliability: 0-15 pts
  breakdown.reliability = ((volunteer.reliabilityScore ?? 100) / 100) * 15;

  // 4. Availability: 0 or 10 pts
  const taskDay = (task.scheduledDay || '').toLowerCase();
  const available = (volunteer.availability || []).some((d) => d.toLowerCase() === taskDay);
  breakdown.availability = available ? 10 : 0;

  const total = breakdown.skill + breakdown.proximity + breakdown.reliability + breakdown.availability;

  return {
    total: Math.round(total * 100) / 100,
    breakdown,
    matchedSkills,
    distanceKm: breakdown.distanceKm,
  };
}

/**
 * Return top N volunteers sorted by match score.
 */
function getTopMatches(volunteers, task, topN = 5) {
  const available = volunteers.filter((v) => v.isAvailable !== false);
  const scored = available.map((v) => ({
    ...v,
    ...computeMatchScore(v, task),
  }));
  scored.sort((a, b) => b.total - a.total);
  return scored.slice(0, topN);
}

module.exports = { computeMatchScore, getTopMatches };
