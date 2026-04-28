interface Props {
  score: number;
  showScore?: boolean;
  size?: 'sm' | 'md';
}

function getUrgencyConfig(score: number) {
  if (score >= 75) return { label: 'Critical', color: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500', pulse: true };
  if (score >= 50) return { label: 'Urgent',   color: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500', pulse: false };
  if (score >= 25) return { label: 'Moderate', color: 'bg-yellow-100 text-yellow-700 border border-yellow-200', dot: 'bg-yellow-500', pulse: false };
  return                  { label: 'Low',      color: 'bg-green-100 text-green-700 border border-green-200',   dot: 'bg-green-500',  pulse: false };
}

export default function UrgencyBadge({ score, showScore = true, size = 'md' }: Props) {
  const { label, color, dot, pulse } = getUrgencyConfig(score);
  const textSize = size === 'sm' ? 'text-xs' : 'text-xs';
  const padding  = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 ${padding} rounded-full font-semibold ${textSize} ${color}`}>
      <span className="relative flex h-2 w-2">
        {pulse && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${dot} opacity-60`} />}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
      </span>
      {label}{showScore ? ` · ${score.toFixed(0)}` : ''}
    </span>
  );
}
