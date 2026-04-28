import { useState } from 'react';
import { MatchedVolunteer } from '../../types/volunteer.types';

interface Props {
  volunteer: MatchedVolunteer;
  rank: number;
  selected: boolean;
  onSelect: (uid: string) => void;
}

const RANK_COLORS = ['bg-yellow-400 text-yellow-900', 'bg-gray-300 text-gray-700', 'bg-orange-300 text-orange-800'];

export default function VolunteerCard({ volunteer, rank, selected, onSelect }: Props) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const { matchScore, breakdown, matchedSkills } = volunteer;

  const scoreColor =
    matchScore >= 80 ? 'text-green-600' :
    matchScore >= 60 ? 'text-yellow-600' : 'text-red-500';

  const scoreBg =
    matchScore >= 80 ? 'bg-green-50 border-green-200' :
    matchScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';

  const breakdownItems = [
    { label: 'Skills',       value: breakdown.skill,        max: 50, color: 'bg-blue-500' },
    { label: 'Proximity',    value: breakdown.proximity,    max: 25, color: 'bg-green-500' },
    { label: 'Reliability',  value: breakdown.reliability,  max: 15, color: 'bg-purple-500' },
    { label: 'Availability', value: breakdown.availability, max: 10, color: 'bg-orange-500' },
  ];

  const rankColor = RANK_COLORS[rank - 1] ?? 'bg-gray-100 text-gray-500';

  return (
    <div
      className={`rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
        selected
          ? 'border-green-500 bg-green-50 shadow-md shadow-green-100'
          : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-md'
      }`}
      onClick={() => onSelect(volunteer.uid)}
    >
      <div className="flex items-start gap-3">
        {/* Rank badge */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${rankColor}`}>
          {rank <= 3 ? ['🥇','🥈','🥉'][rank-1] : `#${rank}`}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold text-gray-900">{volunteer.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                📍 {breakdown.distanceKm} km away · ⭐ {volunteer.reliabilityScore}% reliable
              </p>
            </div>
            {/* Score pill */}
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-black ${scoreBg} ${scoreColor}`}>
              {matchScore.toFixed(0)}
              <span className="text-xs font-normal text-gray-400">/100</span>
            </div>
          </div>

          {/* Matched skills */}
          {matchedSkills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {matchedSkills.map((skill) => (
                <span key={skill} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                  ✓ {skill}
                </span>
              ))}
            </div>
          )}

          {/* Breakdown toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowBreakdown(!showBreakdown); }}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
          >
            <span>{showBreakdown ? '▼' : '▶'}</span>
            {showBreakdown ? 'Hide' : 'Show'} score breakdown
          </button>

          {showBreakdown && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-2 slide-up">
              {breakdownItems.map(({ label, value, max, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-20 shrink-0">{label}</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${color} h-1.5 rounded-full transition-all duration-500`}
                      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                    {value.toFixed(0)}/{max}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkbox */}
        <div
          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
            selected ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'
          }`}
        >
          {selected && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
