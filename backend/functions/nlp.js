'use strict';

const CATEGORY_KEYWORDS = {
  food_distribution: ['food', 'ration', 'hunger', 'meals', 'grain', 'rice', 'starving', 'groceries', 'nutrition'],
  medical: ['medicine', 'doctor', 'hospital', 'sick', 'injury', 'vaccination', 'health', 'clinic', 'ambulance', 'nurse'],
  shelter: ['shelter', 'flood', 'roof', 'house', 'displacement', 'homeless', 'evacuation', 'tent', 'camp'],
  education: ['school', 'books', 'children', 'teaching', 'students', 'stationery', 'uniform', 'classroom', 'teacher'],
  water_sanitation: ['water', 'toilet', 'sanitation', 'hygiene', 'well', 'pump', 'clean water', 'drinking', 'sewage'],
};

/**
 * Classify free-text description into a category.
 * @param {string} description
 * @returns {string} category key
 */
function classifyNeedCategory(description) {
  const text = (description || '').toLowerCase();
  const scores = {};

  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    scores[cat] = keywords.filter((kw) => text.includes(kw)).length;
  }

  const best = Object.entries(scores).reduce((a, b) => (a[1] > b[1] ? a : b));
  return best[1] > 0 ? best[0] : 'general';
}

module.exports = { classifyNeedCategory };
