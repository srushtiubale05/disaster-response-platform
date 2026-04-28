import { useEffect, useRef } from 'react';
import { useNeeds } from '../../hooks/useNeeds';
import { SkeletonList } from '../../components/Common/LoadingSpinner';
import { formatCategory } from '../../utils/formatters';

// Urgency → marker color
function urgencyToColor(score: number): string {
  if (score >= 75) return '#ef4444'; // red
  if (score >= 50) return '#f97316'; // orange
  if (score >= 25) return '#eab308'; // yellow
  return '#22c55e';                  // green
}

function urgencyToRadius(score: number): number {
  if (score >= 75) return 22;
  if (score >= 50) return 18;
  if (score >= 25) return 14;
  return 10;
}

export default function NeedsMap() {
  const { needs, loading } = useNeeds();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (loading || !mapRef.current || needs.length === 0) return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then((L) => {
      // Add Leaflet CSS if not already added
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Destroy existing map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      // Center on India
      const map = L.map(mapRef.current!, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // OpenStreetMap tiles — free, no API key
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Plot each need as a circle marker
      needs.forEach((need) => {
        // Skip needs with missing or zero coordinates
        if (!need.lat || !need.lng || need.lat === 0 || need.lng === 0) return;
        // India bounding box: 6–37°N, 68–98°E
        if (need.lat < 6 || need.lat > 37 || need.lng < 68 || need.lng > 98) return;

        const color = urgencyToColor(need.urgencyScore);
        const radius = urgencyToRadius(need.urgencyScore);

        const marker = L.circleMarker([need.lat, need.lng], {
          radius,
          fillColor: color,
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        }).addTo(map);

        const urgencyLabel =
          need.urgencyScore >= 75 ? 'Critical' :
          need.urgencyScore >= 50 ? 'Urgent' :
          need.urgencyScore >= 25 ? 'Moderate' : 'Low';

        marker.bindPopup(`
          <div style="font-family: Inter, sans-serif; min-width: 200px;">
            <div style="font-weight: 700; font-size: 14px; margin-bottom: 4px;">${need.area}</div>
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 8px;">
              <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600;">
                ${urgencyLabel} · ${need.urgencyScore.toFixed(0)}/100
              </span>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
              📂 ${formatCategory(need.category)} &nbsp;·&nbsp; ⚠️ ${need.severity}
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
              📊 ${need.reportedCount} reports
            </div>
            <div style="font-size: 12px; color: #374151; line-height: 1.4;">
              ${need.description.slice(0, 100)}${need.description.length > 100 ? '...' : ''}
            </div>
          </div>
        `, { maxWidth: 260 });
      });

      // Fit map to markers — valid India coordinates
      const validNeeds = needs.filter(n =>
        n.lat && n.lng && n.lat !== 0 && n.lng !== 0 &&
        n.lat >= 6 && n.lat <= 37 && n.lng >= 68 && n.lng <= 98
      );
      if (validNeeds.length > 0) {
        const bounds = L.latLngBounds(validNeeds.map(n => [n.lat, n.lng]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } else {
        // Default to India center
        map.setView([20.5937, 78.9629], 5);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [needs, loading]);

  if (loading) return <SkeletonList count={2} />;

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Needs Map</h2>
          <p className="text-sm text-gray-500">All reported needs plotted by urgency</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {[
            { color: '#ef4444', label: 'Critical (≥75)' },
            { color: '#f97316', label: 'Urgent (≥50)' },
            { color: '#eab308', label: 'Moderate (≥25)' },
            { color: '#22c55e', label: 'Low' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ background: color }} />
              <span className="text-gray-600 hidden sm:inline">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Total', value: needs.length, color: 'bg-gray-50 border-gray-200' },
          { label: 'Critical', value: needs.filter(n => n.urgencyScore >= 75).length, color: 'bg-red-50 border-red-200' },
          { label: 'Urgent', value: needs.filter(n => n.urgencyScore >= 50 && n.urgencyScore < 75).length, color: 'bg-orange-50 border-orange-200' },
          { label: 'Moderate', value: needs.filter(n => n.urgencyScore >= 25 && n.urgencyScore < 50).length, color: 'bg-yellow-50 border-yellow-200' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-xl border p-3 text-center ${color}`}>
            <div className="text-xl font-black text-gray-900">{value}</div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Map container */}
      {needs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500">No needs to display on map yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div ref={mapRef} style={{ height: '480px', width: '100%' }} />
        </div>
      )}

      {/* Needs list below map */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">All Locations</h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {[...needs]
          .filter(n => n.lat >= 6 && n.lat <= 37 && n.lng >= 68 && n.lng <= 98)
          .sort((a, b) => b.urgencyScore - a.urgencyScore)
          .map((need) => (
            <div key={need.needId} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: urgencyToColor(need.urgencyScore) }} />
                <span className="text-gray-700 font-medium">{need.area}</span>
                <span className="text-gray-400 text-xs capitalize">{formatCategory(need.category)}</span>
              </div>
              <span className="font-bold text-gray-600 text-xs">{need.urgencyScore.toFixed(0)}/100</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
