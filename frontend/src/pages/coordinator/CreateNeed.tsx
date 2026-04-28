import { useState, FormEvent, useEffect, useRef } from 'react';
import { createNeed } from '../../services/firestore';
import { useAuth } from '../../hooks/useAuth';
import { useFirestore } from '../../hooks/useFirestore';
import { CATEGORIES, SEVERITIES, MAHARASHTRA_LOCATIONS } from '../../utils/constants';
import { computeUrgencyScore, classifySurveyText, urgencyLabelFromScore } from '../../utils/mlEngine';
import toast from 'react-hot-toast';
import { Need } from '../../types/need.types';

interface Props { onCreated?: () => void }

export default function CreateNeed({ onCreated }: Props) {
  const { user } = useAuth();
  const db = useFirestore();
  const [area, setArea] = useState('');
  const [lat, setLat] = useState(18.5204);
  const [lng, setLng] = useState(73.8567);
  const [category, setCategory] = useState('general');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [reportedCount, setReportedCount] = useState(1);
  const [loading, setLoading] = useState(false);

  // NLP state
  const [nlpResult, setNlpResult] = useState<{ category: string; confidence: number } | null>(null);
  const [nlpApplied, setNlpApplied] = useState(false);
  const nlpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live urgency preview
  const urgency = computeUrgencyScore(reportedCount, severity, 0, category);
  const { label: urgencyLabel, color: urgencyColor } = urgencyLabelFromScore(urgency.score);

  // NLP: auto-classify description as user types (debounced 600ms)
  useEffect(() => {
    if (nlpTimer.current) clearTimeout(nlpTimer.current);
    if (description.trim().length < 10) { setNlpResult(null); return; }

    nlpTimer.current = setTimeout(() => {
      const result = classifySurveyText(description);
      if (result.category !== 'general' && result.confidence > 0.2) {
        setNlpResult(result);
      } else {
        setNlpResult(null);
      }
    }, 600);

    return () => { if (nlpTimer.current) clearTimeout(nlpTimer.current); };
  }, [description]);

  function applyNlpCategory() {
    if (!nlpResult) return;
    setCategory(nlpResult.category);
    setNlpApplied(true);
    setTimeout(() => setNlpApplied(false), 2000);
  }

  function pickLocation(e: React.ChangeEvent<HTMLSelectElement>) {
    const loc = MAHARASHTRA_LOCATIONS.find((l) => l.name === e.target.value);
    if (loc) { setArea(loc.name); setLat(loc.lat); setLng(loc.lng); }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      // Compute urgency score client-side (Cloud Function will overwrite if deployed)
      const result = computeUrgencyScore(reportedCount, severity, 0, category);
      await createNeed({
        area, lat, lng,
        category: category as Need['category'],
        description,
        severity: severity as Need['severity'],
        reportedCount,
        status: 'open',
        createdBy: user.uid,
        urgencyScore: result.score,
        scoreBreakdown: result.breakdown,
      } as any, db);
      toast.success(`Need reported! Urgency score: ${result.score.toFixed(0)}/100`);
      onCreated?.();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
    setLoading(false);
  }

  const categoryLabel = CATEGORIES.find((c) => c.value === category)?.label ?? category;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Live Urgency Score Preview */}
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-red-500">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">Live Urgency Preview</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-black text-gray-900">{urgency.score.toFixed(0)}</span>
              <span className="text-gray-400 text-lg">/100</span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${urgencyColor}`}>{urgencyLabel}</span>
            </div>
          </div>
          {/* Mini breakdown bars */}
          <div className="space-y-1 min-w-[180px]">
            {[
              { label: 'Volume', val: urgency.breakdown.volume, max: 35, color: 'bg-blue-400' },
              { label: 'Severity', val: urgency.breakdown.severity, max: 30, color: 'bg-orange-400' },
              { label: 'Recency', val: urgency.breakdown.recency, max: 20, color: 'bg-green-400' },
              { label: 'Category', val: urgency.breakdown.category, max: 15, color: 'bg-purple-400' },
            ].map(({ label, val, max, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className="text-gray-400 w-14 shrink-0">{label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div className={`${color} h-1.5 rounded-full transition-all duration-300`}
                    style={{ width: `${Math.min((val / max) * 100, 100)}%` }} />
                </div>
                <span className="text-gray-500 w-10 text-right">{val.toFixed(0)}/{max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Report a Disaster Need</h2>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Location picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quick Location</label>
            <select onChange={pickLocation}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select a location...</option>
              {MAHARASHTRA_LOCATIONS.map((l) => (
                <option key={l.name} value={l.name}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area / Address</label>
            <input required value={area} onChange={(e) => setArea(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Hadapsar, Pune" />
          </div>

          {/* Description with NLP */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <span className="ml-2 text-xs text-blue-500 font-normal">🤖 AI auto-detects category</span>
            </label>
            <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the situation... (e.g. 200 families need food ration kits after flooding)" />

            {/* NLP suggestion banner */}
            {nlpResult && !nlpApplied && (
              <div className="mt-2 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                <span className="text-blue-600 text-sm">🤖</span>
                <span className="text-sm text-blue-700 flex-1">
                  AI detected: <strong>{CATEGORIES.find(c => c.value === nlpResult.category)?.label ?? nlpResult.category}</strong>
                  {' '}({Math.round(nlpResult.confidence * 100)}% confidence)
                </span>
                <button type="button" onClick={applyNlpCategory}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700 transition">
                  Apply
                </button>
              </div>
            )}
            {nlpApplied && (
              <div className="mt-2 text-xs text-green-600 font-medium">✓ Category updated by AI</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
                {nlpApplied && <span className="ml-1 text-xs text-blue-500">🤖 AI</span>}
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Reports
              <span className="ml-2 text-xs text-gray-400">(affects urgency score)</span>
            </label>
            <input type="number" min={1} max={100} value={reportedCount}
              onChange={(e) => setReportedCount(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50">
            {loading ? 'Submitting...' : `Submit Need · Score ${urgency.score.toFixed(0)}/100`}
          </button>
        </form>
      </div>

      {/* CSV Upload */}
      <CSVUpload onImported={onCreated} />
    </div>
  );
}

// ── CSV Bulk Upload ────────────────────────────────────────────────────────────
function CSVUpload({ onImported }: { onImported?: () => void }) {
  const { user } = useAuth();
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  function parseCSV(text: string) {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const vals = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] ?? ''; });
      return row;
    });
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      setPreview(rows.slice(0, 3)); // show first 3 as preview
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const file = fileRef.current?.files?.[0];
    if (!file || !user) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = parseCSV(ev.target?.result as string);
      let count = 0;
      for (const row of rows) {
        try {
          const loc = MAHARASHTRA_LOCATIONS.find((l) =>
            l.name.toLowerCase().includes((row.area ?? '').toLowerCase())
          ) ?? { lat: 18.5204, lng: 73.8567 };

          const nlp = classifySurveyText(row.description ?? '');
          const cat = row.category || (nlp.category !== 'general' ? nlp.category : 'general');
          const sev = row.severity || 'medium';
          const rc = parseInt(row.reported_count ?? row.reportedcount ?? '1') || 1;
          const urgency = computeUrgencyScore(rc, sev, 0, cat);

          await createNeed({
            area: row.area || 'Unknown',
            lat: loc.lat, lng: loc.lng,
            category: cat as Need['category'],
            description: row.description || '',
            severity: sev as Need['severity'],
            reportedCount: rc,
            status: 'open',
            createdBy: user.uid,
            urgencyScore: urgency.score,
            scoreBreakdown: urgency.breakdown,
          } as any);
          count++;
        } catch (_) {}
      }
      toast.success(`Imported ${count} needs from CSV`);
      setPreview([]);
      if (fileRef.current) fileRef.current.value = '';
      setImporting(false);
      onImported?.();
    };
    reader.readAsText(file);
  }

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="font-semibold text-gray-700 mb-1">📂 Bulk CSV Import</h3>
      <p className="text-xs text-gray-400 mb-3">
        CSV columns: <code className="bg-gray-100 px-1 rounded">area, description, category, severity, reported_count</code>
      </p>
      <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
        className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />

      {preview.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2">Preview (first {preview.length} rows):</p>
          <div className="overflow-x-auto rounded-lg border border-gray-100">
            <table className="text-xs w-full">
              <thead className="bg-gray-50">
                <tr>{Object.keys(preview[0]).map((k) => <th key={k} className="px-2 py-1.5 text-left text-gray-500 font-medium">{k}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    {Object.values(row).map((v: any, j) => <td key={j} className="px-2 py-1.5 text-gray-700 max-w-[120px] truncate">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={handleImport} disabled={importing}
            className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition disabled:opacity-50">
            {importing ? 'Importing...' : 'Import All Rows'}
          </button>
        </div>
      )}
    </div>
  );
}


