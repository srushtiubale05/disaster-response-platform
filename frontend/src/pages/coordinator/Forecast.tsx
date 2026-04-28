import { useNeeds } from '../../hooks/useNeeds';
import { formatCategory } from '../../utils/formatters';

// ── Seasonal risk model ───────────────────────────────────────────────────────
// India seasons:
//  Monsoon:      Jun–Sep  → shelter, water_sanitation spike
//  Post-monsoon: Oct–Nov  → medical (disease outbreaks), food_distribution
//  Winter:       Dec–Feb  → medical (cold), education
//  Summer:       Mar–May  → water_sanitation, food_distribution (heat)

interface ForecastItem {
  category: string;
  risk: 'high' | 'medium' | 'low';
  reason: string;
  action: string;
  trend: 'rising' | 'stable' | 'falling';
  predictedScore: number;
}

function getSeasonalForecasts(month: number, existingNeeds: any[]): ForecastItem[] {
  // Count existing needs per category
  const catCount: Record<string, number> = {};
  existingNeeds.forEach(n => { catCount[n.category] = (catCount[n.category] ?? 0) + 1; });

  const forecasts: ForecastItem[] = [];

  // Monsoon: June(5) - September(8)
  if (month >= 5 && month <= 8) {
    forecasts.push({
      category: 'shelter',
      risk: 'high',
      reason: 'Monsoon season — flooding displaces families in low-lying areas',
      action: 'Pre-position construction volunteers and tarpaulin supplies',
      trend: 'rising',
      predictedScore: 85,
    });
    forecasts.push({
      category: 'water_sanitation',
      risk: 'high',
      reason: 'Flood water contaminates wells and water sources',
      action: 'Deploy water purification kits and sanitation teams',
      trend: 'rising',
      predictedScore: 78,
    });
    forecasts.push({
      category: 'medical',
      risk: 'medium',
      reason: 'Waterborne diseases (cholera, typhoid) spike during monsoon',
      action: 'Stock ORS, chlorine tablets, and medical volunteers on standby',
      trend: 'rising',
      predictedScore: 62,
    });
    forecasts.push({
      category: 'food_distribution',
      risk: 'medium',
      reason: 'Supply chain disruptions due to flooded roads',
      action: 'Establish dry ration distribution points in flood-prone areas',
      trend: 'stable',
      predictedScore: 55,
    });
  }

  // Post-monsoon: October(9) - November(10)
  else if (month >= 9 && month <= 10) {
    forecasts.push({
      category: 'medical',
      risk: 'high',
      reason: 'Post-flood disease outbreaks — malaria, dengue, leptospirosis peak',
      action: 'Organize vaccination camps and vector control drives',
      trend: 'rising',
      predictedScore: 80,
    });
    forecasts.push({
      category: 'food_distribution',
      risk: 'high',
      reason: 'Crop damage from floods reduces food availability',
      action: 'Coordinate with government for ration distribution',
      trend: 'rising',
      predictedScore: 72,
    });
    forecasts.push({
      category: 'shelter',
      risk: 'medium',
      reason: 'Flood-damaged homes need repair before winter',
      action: 'Prioritize shelter repair tasks before December',
      trend: 'falling',
      predictedScore: 58,
    });
  }

  // Winter: December(11) - February(1)
  else if (month === 11 || month <= 1) {
    forecasts.push({
      category: 'medical',
      risk: 'high',
      reason: 'Cold wave increases respiratory illness in elderly and children',
      action: 'Distribute blankets and set up warm shelter camps',
      trend: 'rising',
      predictedScore: 75,
    });
    forecasts.push({
      category: 'education',
      risk: 'medium',
      reason: 'School reopening after monsoon — supplies and infrastructure needed',
      action: 'Organize school supply drives and infrastructure repair',
      trend: 'rising',
      predictedScore: 55,
    });
    forecasts.push({
      category: 'food_distribution',
      risk: 'medium',
      reason: 'Reduced agricultural activity in winter months',
      action: 'Maintain food distribution networks in rural areas',
      trend: 'stable',
      predictedScore: 50,
    });
  }

  // Summer: March(2) - May(4)
  else {
    forecasts.push({
      category: 'water_sanitation',
      risk: 'high',
      reason: 'Severe water scarcity — wells dry up, tanker dependency increases',
      action: 'Map water sources and pre-deploy water tanker routes',
      trend: 'rising',
      predictedScore: 82,
    });
    forecasts.push({
      category: 'food_distribution',
      risk: 'high',
      reason: 'Heat waves reduce outdoor work, affecting daily wage earners',
      action: 'Set up community kitchens and food distribution in urban slums',
      trend: 'rising',
      predictedScore: 70,
    });
    forecasts.push({
      category: 'medical',
      risk: 'medium',
      reason: 'Heat stroke and dehydration cases spike in May',
      action: 'Set up cooling centers and ORS distribution points',
      trend: 'rising',
      predictedScore: 65,
    });
  }

  // Boost risk if already seeing reports in that category
  return forecasts.map(f => ({
    ...f,
    predictedScore: Math.min(100, f.predictedScore + (catCount[f.category] ?? 0) * 3),
  }));
}

const SEASON_NAMES: Record<number, string> = {
  0: 'Winter', 1: 'Winter', 2: 'Summer', 3: 'Summer', 4: 'Summer',
  5: 'Monsoon', 6: 'Monsoon', 7: 'Monsoon', 8: 'Monsoon',
  9: 'Post-Monsoon', 10: 'Post-Monsoon', 11: 'Winter',
};

const CATEGORY_ICONS: Record<string, string> = {
  medical: '🏥', shelter: '🏠', food_distribution: '🍱',
  education: '📚', water_sanitation: '💧', general: '📋',
};

const RISK_CONFIG = {
  high:   { color: 'border-red-200 bg-red-50',    badge: 'bg-red-100 text-red-700',    bar: 'bg-red-500',    label: 'High Risk' },
  medium: { color: 'border-orange-200 bg-orange-50', badge: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500', label: 'Medium Risk' },
  low:    { color: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700', bar: 'bg-green-500',  label: 'Low Risk' },
};

const TREND_ICON = { rising: '📈', stable: '➡️', falling: '📉' };

export default function Forecast() {
  const { needs } = useNeeds();
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const season = SEASON_NAMES[month];
  const forecasts = getSeasonalForecasts(month, needs);

  const monthName = now.toLocaleString('en-IN', { month: 'long' });

  return (
    <div className="space-y-6 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-black mb-1">Predictive Need Forecast</h2>
            <p className="text-indigo-200 text-sm">AI-predicted needs based on season & historical patterns</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black">{season}</div>
            <div className="text-indigo-200 text-sm">{monthName} · India</div>
          </div>
        </div>

        {/* Season indicator */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {['Winter', 'Summer', 'Monsoon', 'Post-Monsoon'].map(s => (
            <span key={s} className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              s === season ? 'bg-white text-indigo-700' : 'bg-white/20 text-white/70'
            }`}>{s}</span>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🤖</span>
          <div>
            <p className="text-sm font-semibold text-blue-800">How this forecast works</p>
            <p className="text-xs text-blue-600 mt-1">
              Combines seasonal patterns from India disaster history, current month,
              and live need reports in your database. Higher existing reports in a category
              boost its predicted urgency score.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          Predicted High-Risk Categories — {monthName}
        </h3>
        {forecasts.map((f, i) => {
          const cfg = RISK_CONFIG[f.risk];
          return (
            <div key={f.category} className={`rounded-2xl border-2 p-5 ${cfg.color} fade-in`}
              style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{CATEGORY_ICONS[f.category] ?? '📋'}</span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-gray-900">{formatCategory(f.category)}</h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <span className="text-sm">{TREND_ICON[f.trend]}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{f.reason}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-black text-gray-900">{f.predictedScore}</div>
                  <div className="text-xs text-gray-500">predicted score</div>
                </div>
              </div>

              {/* Predicted score bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Predicted urgency</span>
                  <span>{f.predictedScore}/100</span>
                </div>
                <div className="bg-white/60 rounded-full h-2 overflow-hidden">
                  <div className={`${cfg.bar} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${f.predictedScore}%` }} />
                </div>
              </div>

              {/* Recommended action */}
              <div className="mt-4 flex items-start gap-2 bg-white/60 rounded-xl p-3">
                <span className="text-lg shrink-0">💡</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">Recommended Action</p>
                  <p className="text-xs text-gray-600 mt-0.5">{f.action}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current vs predicted comparison */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Current vs Predicted Needs</h3>
        <div className="space-y-3">
          {forecasts.map(f => {
            const current = needs.filter(n => n.category === f.category).length;
            const maxCurrent = Math.max(...forecasts.map(x => needs.filter(n => n.category === x.category).length), 1);
            return (
              <div key={f.category} className="flex items-center gap-3">
                <span className="text-sm w-32 shrink-0 text-gray-600">{formatCategory(f.category)}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">Current</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-400 h-1.5 rounded-full"
                        style={{ width: `${maxCurrent > 0 ? (current / maxCurrent) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-6">{current}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-16">Predicted</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className={`${RISK_CONFIG[f.risk].bar} h-1.5 rounded-full`}
                        style={{ width: `${f.predictedScore}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-600 w-6">{f.predictedScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
