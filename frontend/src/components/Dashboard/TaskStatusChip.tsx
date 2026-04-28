const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  open:        { label: 'Open',        color: 'bg-blue-50 text-blue-700 border border-blue-200',     icon: '○' },
  assigned:    { label: 'Assigned',    color: 'bg-purple-50 text-purple-700 border border-purple-200', icon: '◎' },
  in_progress: { label: 'In Progress', color: 'bg-orange-50 text-orange-700 border border-orange-200', icon: '◉' },
  completed:   { label: 'Completed',   color: 'bg-green-50 text-green-700 border border-green-200',   icon: '✓' },
  cancelled:   { label: 'Cancelled',   color: 'bg-gray-100 text-gray-500 border border-gray-200',     icon: '✕' },
};

export default function TaskStatusChip({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    color: 'bg-gray-100 text-gray-600 border border-gray-200',
    icon: '·',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
      <span className="font-bold">{config.icon}</span>
      {config.label}
    </span>
  );
}
