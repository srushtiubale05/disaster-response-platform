import { useEffect, useRef } from 'react';
import { useVolunteerTasks } from '../../hooks/useTasks';
import { useVolunteer } from '../../hooks/useVolunteers';
import { SkeletonList } from '../../components/Common/LoadingSpinner';
import TaskStatusChip from '../../components/Dashboard/TaskStatusChip';

interface Props { uid: string }

// Haversine distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Nearest-neighbor TSP approximation
function optimizeRoute(
  start: { lat: number; lng: number },
  stops: Array<{ id: string; lat: number; lng: number; title: string; area: string; status: string; scheduledDate: string }>
) {
  if (stops.length === 0) return { order: [], totalKm: 0 };

  const remaining = [...stops];
  const order: typeof stops = [];
  let current = start;
  let totalKm = 0;

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    remaining.forEach((stop, i) => {
      const d = haversine(current.lat, current.lng, stop.lat, stop.lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    });

    const nearest = remaining.splice(nearestIdx, 1)[0];
    order.push(nearest);
    totalKm += nearestDist;
    current = nearest;
  }

  return { order, totalKm: Math.round(totalKm * 10) / 10 };
}

export default function RouteOptimizer({ uid }: Props) {
  const { tasks, loading: tasksLoading } = useVolunteerTasks(uid);
  const { volunteer, loading: volLoading } = useVolunteer(uid);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  const loading = tasksLoading || volLoading;

  // Only include active tasks — show all even without coordinates for the list
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  // Only tasks with valid coordinates go on the map
  const mappableTasks = activeTasks.filter(t =>
    t.lat != null && t.lng != null && t.lat !== 0 && t.lng !== 0
  );

  const start = volunteer
    ? { lat: volunteer.lat ?? 18.5204, lng: volunteer.lng ?? 73.8567 }
    : { lat: 18.5204, lng: 73.8567 };

  const stops = mappableTasks.map(t => ({
    id: t.taskId,
    lat: t.lat,
    lng: t.lng,
    title: t.title,
    area: t.area,
    status: t.status,
    scheduledDate: t.scheduledDate,
  }));

  const { order, totalKm } = optimizeRoute(start, stops);

  // Draw route on map
  useEffect(() => {
    if (loading || !mapRef.current || order.length === 0) return;

    import('leaflet').then((L) => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapRef.current!, { center: [start.lat, start.lng], zoom: 11 });
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      // Start marker (volunteer location)
      const startIcon = L.divIcon({
        html: `<div style="background:#3b82f6;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏠</div>`,
        className: '',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      L.marker([start.lat, start.lng], { icon: startIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');

      // Route line points
      const routePoints: [number, number][] = [[start.lat, start.lng]];

      // Task markers
      order.forEach((stop, i) => {
        const stopIcon = L.divIcon({
          html: `<div style="background:#ef4444;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${i + 1}</div>`,
          className: '',
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        L.marker([stop.lat, stop.lng], { icon: stopIcon })
          .addTo(map)
          .bindPopup(`<b>Stop ${i + 1}: ${stop.title}</b><br>📍 ${stop.area}<br>📅 ${stop.scheduledDate}`);

        routePoints.push([stop.lat, stop.lng]);
      });

      // Draw route polyline
      L.polyline(routePoints, {
        color: '#3b82f6',
        weight: 3,
        opacity: 0.7,
        dashArray: '8, 6',
      }).addTo(map);

      // Fit bounds
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [40, 40] });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [order, loading]);

  if (loading) return <SkeletonList count={2} />;

  if (activeTasks.length === 0) {
    return (
      <div className="text-center py-20 fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">🛣️</div>
        <h3 className="text-lg font-semibold text-gray-700">Optimal Route</h3>
        <p className="text-gray-400 text-sm mt-1">No active tasks with location data to optimize</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-5 text-white">
        <h2 className="text-lg font-black mb-1">Optimal Route</h2>
        <p className="text-blue-200 text-sm">Suggested visit order to minimize travel distance</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="text-2xl font-black">{order.length}</div>
            <div className="text-xs text-blue-200">Stops</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="text-2xl font-black">{totalKm}</div>
            <div className="text-xs text-blue-200">Total km</div>
          </div>
          <div className="bg-white/20 rounded-xl px-3 py-2 text-center">
            <div className="text-2xl font-black">~{Math.round(totalKm * 3)}</div>
            <div className="text-xs text-blue-200">Est. mins</div>
          </div>
        </div>
      </div>

      {/* Algorithm note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
        <span className="text-lg">🤖</span>
        <p className="text-xs text-blue-700">
          <strong>Nearest-neighbor algorithm</strong> — starts from your location and always visits the closest unvisited task next. Reduces total travel distance vs random order.
        </p>
      </div>

      {/* Map — only shown when tasks have coordinates */}
      {mappableTasks.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div ref={mapRef} style={{ height: '360px', width: '100%' }} />
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-sm text-blue-700">📍 Map unavailable — tasks don't have location coordinates yet</p>
        </div>
      )}

      {/* Ordered stop list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-semibold text-gray-700 mb-4">Suggested Visit Order</h3>
        <div className="space-y-3">
          {/* Start */}
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">🏠</div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Your Location</p>
              <p className="text-xs text-gray-500">Starting point</p>
            </div>
          </div>

          {(order.length > 0 ? order : activeTasks.map(t => ({
            id: t.taskId, lat: t.lat ?? 0, lng: t.lng ?? 0,
            title: t.title, area: t.area, status: t.status, scheduledDate: t.scheduledDate,
          }))).map((stop, i) => {
            const distFromPrev = stop.lat && stop.lng && i > 0 && order[i-1]?.lat
              ? haversine(order[i - 1].lat, order[i - 1].lng, stop.lat, stop.lng)
              : stop.lat && stop.lng
              ? haversine(start.lat, start.lng, stop.lat, stop.lng)
              : null;

            return (
              <div key={stop.id}>
                {/* Connector */}
                <div className="flex items-center gap-3 pl-4 py-1">
                  <div className="w-0.5 h-4 bg-blue-200 ml-3.5" />
                  {distFromPrev !== null && (
                    <span className="text-xs text-gray-400">{distFromPrev.toFixed(1)} km</span>
                  )}
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{stop.title}</p>
                    <p className="text-xs text-gray-500">📍 {stop.area} · 📅 {stop.scheduledDate}</p>
                  </div>
                  <TaskStatusChip status={stop.status} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
