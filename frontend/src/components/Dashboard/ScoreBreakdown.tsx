import { ScoreBreakdown as SB } from '../../types/need.types';

interface Props { breakdown: SB }

const bars = [
  { key: 'volume'   as const, label: 'Volume',   max: 35, color: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-600' },
  { key: 'severity' as const, label: 'Severity', max: 30, color: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-600' },
  { key: 'recency'  as const, label: 'Recency',  max: 20, color: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-600' },
  { key: 'category' as const, label: 'Category', max: 15, color: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-600' },
];

export default function ScoreBreakdown({ breakdown }: Props) {
  if (!breakdown || Object.keys(breakdown).length === 0) return null;

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Score Breakdown</p>
      {bars.map(({ key, label, max, color, bg, text }) => {
        const val = breakdown[key] ?? 0;
        const pct = Math.min((val / max) * 100, 100);
        return (
          <div key={key} className="flex items-center gap-3">
            <span className={`text-xs font-medium w-16 shrink-0 ${text}`}>{label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`${color} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-xs font-semibold w-12 text-right ${text}`}>
              {val.toFixed(0)}<span className="text-gray-400 font-normal">/{max}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}
