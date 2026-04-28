import { Timestamp } from 'firebase/firestore';

export function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return '—';
  return ts.toDate().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function urgencyLabel(score: number): string {
  if (score >= 75) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}

export function urgencyColor(score: number): string {
  if (score >= 75) return 'bg-red-600 text-white';
  if (score >= 50) return 'bg-orange-500 text-white';
  if (score >= 25) return 'bg-yellow-400 text-gray-900';
  return 'bg-green-500 text-white';
}

export function taskStatusColor(status: string): string {
  switch (status) {
    case 'open': return 'bg-blue-100 text-blue-800';
    case 'assigned': return 'bg-purple-100 text-purple-800';
    case 'in_progress': return 'bg-orange-100 text-orange-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}
