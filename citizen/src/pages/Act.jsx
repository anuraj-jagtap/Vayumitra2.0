import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  CheckCircle2,
  Circle,
  Star,
  Car,
  Flame,
  ShieldCheck,
  Sparkles,
  Leaf,
  AlertTriangle,
  MapPin,
  Camera,
  FileText,
  Send,
  RefreshCw,
  X,
  Clock,
  ChevronDown,
  CheckCheck,
  Info,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { fetchApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

// ─── Tailwind merge helper ────────────────────────────────────────────────────
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// ─── Leaflet icon fix ─────────────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Constants ────────────────────────────────────────────────────────────────
const LS_CHECKLIST_KEY = 'vayu_checklist';
const LS_LAST_REPORT_KEY = 'vayu_last_report';
const THROTTLE_MS = 60_000;

const CHECKLIST_ITEMS = [
  {
    id: 'carpool',
    icon: Car,
    title: 'Carpool or take the metro',
    why: 'Reduces vehicle exhaust, the top source of urban NOx',
    pts: 5,
  },
  {
    id: 'no_burn',
    icon: Flame,
    title: 'Do not burn waste or leaves',
    why: 'Open burning contributes heavily to PM2.5 in winter',
    pts: 10,
  },
  {
    id: 'puc',
    icon: ShieldCheck,
    title: 'Get the vehicle PUC check done',
    why: 'PUC-compliant vehicles emit 40% less particulates',
    pts: 10,
  },
  {
    id: 'no_firecrackers',
    icon: Sparkles,
    title: 'Avoid firecrackers',
    why: 'Firecrackers spike PM2.5 by 5–10× overnight',
    pts: 10,
  },
  {
    id: 'plants',
    icon: Leaf,
    title: 'Add indoor plants',
    why: 'Small effect on air quality; they do not replace ventilation or a purifier',
    pts: 2,
  },
  {
    id: 'report_idling',
    icon: AlertTriangle,
    title: 'Report vehicle idling',
    why: 'Help authorities track and fine idling engines near schools and signals',
    pts: 5,
    reportTab: true, // clicking links to Report tab with category pre-set
  },
];

const CATEGORIES = [
  'Construction Dust',
  'Garbage/Biomass Burning',
  'Industrial Smoke',
  'Traffic Jam',
  'Vehicle Idling',
];

const DEFAULT_CENTER = { lat: 28.614, lng: 77.209 }; // New Delhi

// ─── Utility: round to 3 decimals ────────────────────────────────────────────
function round3(n) {
  return Math.round(n * 1000) / 1000;
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'checklist', label: 'Things You Can Do' },
  { id: 'report', label: 'Report Pollution' },
];

// ─── Map click handler sub-component ─────────────────────────────────────────
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick({ lat: round3(e.latlng.lat), lng: round3(e.latlng.lng) });
    },
  });
  return null;
}

// ─── DraggableMarker ─────────────────────────────────────────────────────────
function DraggableMarker({ position, onDragEnd }) {
  const markerRef = useRef(null);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const latlng = marker.getLatLng();
        onDragEnd({ lat: round3(latlng.lat), lng: round3(latlng.lng) });
      }
    },
  };

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={[position.lat, position.lng]}
      ref={markerRef}
    />
  );
}

// ─── Checklist Section ────────────────────────────────────────────────────────
function ChecklistSection({ onReportTabLink }) {
  const [checked, setChecked] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_CHECKLIST_KEY)) || {};
    } catch {
      return {};
    }
  });

  const totalPoints = CHECKLIST_ITEMS.reduce(
    (sum, item) => sum + (checked[item.id] ? item.pts : 0),
    0,
  );
  const maxPoints = CHECKLIST_ITEMS.reduce((sum, item) => sum + item.pts, 0);

  const toggle = (id, reportTab) => {
    if (reportTab && !checked[id]) {
      // Navigate to report tab with Vehicle Idling pre-selected
      onReportTabLink('Vehicle Idling');
    }
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(LS_CHECKLIST_KEY, JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-6">
      {/* Points banner */}
      <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Your Action Score</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Check off actions you take to earn points
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="32" fill="none" stroke="#ede9fe" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(totalPoints / maxPoints) * 201} 201`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-brand-700 leading-none">
                  {totalPoints}
                </span>
                <span className="text-[9px] text-gray-400 font-semibold uppercase tracking-wide">
                  pts
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              out of <span className="font-bold text-gray-800">{maxPoints}</span> pts
            </div>
          </div>
        </div>
      </div>

      {/* Checklist cards */}
      <div className="grid gap-3">
        {CHECKLIST_ITEMS.map((item) => {
          const Icon = item.icon;
          const isDone = !!checked[item.id];
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id, item.reportTab)}
              className={cn(
                'w-full text-left bg-white rounded-2xl p-5 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border transition-all duration-200 flex items-start gap-4 group',
                isDone
                  ? 'border-brand-200 bg-brand-50/40'
                  : 'border-gray-100 hover:border-brand-200 hover:shadow-[0_4px_20px_rgb(0,0,0,0.07)]',
              )}
            >
              {/* Leading icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors',
                  isDone ? 'bg-brand-100 text-brand-600' : 'bg-gray-100 text-gray-400 group-hover:bg-brand-50 group-hover:text-brand-400',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div
                  className={cn(
                    'font-semibold text-sm leading-snug',
                    isDone ? 'text-brand-700 line-through decoration-brand-300' : 'text-gray-800',
                  )}
                >
                  {item.title}
                  {item.reportTab && (
                    <span className="ml-2 text-[10px] font-bold bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full no-underline" style={{textDecoration:'none'}}>
                      → Report tab
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-1 mt-1">
                  <Info className="w-3 h-3 text-gray-300 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">{item.why}</p>
                </div>
              </div>

              {/* Points chip + checkbox */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <span
                  className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    isDone
                      ? 'bg-brand-600 text-white'
                      : 'bg-gray-100 text-gray-500',
                  )}
                >
                  +{item.pts} pts
                </span>
                <div className="mt-1">
                  {isDone ? (
                    <CheckCircle2 className="w-6 h-6 text-brand-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-gray-300 group-hover:text-brand-300" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {totalPoints === maxPoints && (
        <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 flex items-center gap-3 text-brand-700">
          <CheckCheck className="w-6 h-6 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">All actions complete!</p>
            <p className="text-xs text-brand-500 mt-0.5">
              You're doing your part for cleaner air. Share your score!
            </p>
          </div>
          <Star className="w-5 h-5 ml-auto flex-shrink-0 text-brand-400" />
        </div>
      )}
    </div>
  );
}

// ─── Report Section ───────────────────────────────────────────────────────────
function ReportSection({ preCategory }) {
  const { user } = useAuth();

  // Form state
  const [category, setCategory] = useState(preCategory || CATEGORIES[0]);
  const [location, setLocation] = useState(null); // { lat, lng }
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState(null);
  const [photo, setPhoto] = useState(null); // { file, preview, error }
  const [note, setNote] = useState('');

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Throttle state
  const [throttleLeft, setThrottleLeft] = useState(0);

  // Auth modal
  const [showAuthBanner, setShowAuthBanner] = useState(false);

  // Sync preCategory when parent changes it
  useEffect(() => {
    if (preCategory) setCategory(preCategory);
  }, [preCategory]);

  // Throttle countdown
  useEffect(() => {
    const check = () => {
      const last = parseInt(localStorage.getItem(LS_LAST_REPORT_KEY) || '0', 10);
      const diff = THROTTLE_MS - (Date.now() - last);
      setThrottleLeft(diff > 0 ? Math.ceil(diff / 1000) : 0);
    };
    check();
    const interval = setInterval(check, 1000);
    return () => clearInterval(interval);
  }, []);

  // Geolocation on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation not supported. Click the map to set your location.');
      setLocation(DEFAULT_CENTER);
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: round3(pos.coords.latitude),
          lng: round3(pos.coords.longitude),
        });
        setGeoLoading(false);
      },
      () => {
        setGeoError('Location access denied. Click the map to set your location.');
        setLocation(DEFAULT_CENTER);
        setGeoLoading(false);
      },
      { timeout: 6000 },
    );
  }, []);

  // Photo handler
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setPhoto({ error: 'Image exceeds 5 MB limit. Please choose a smaller file.' });
      return;
    }
    const preview = URL.createObjectURL(file);
    setPhoto({ file, preview, error: null });
  };

  const removePhoto = () => {
    if (photo?.preview) URL.revokeObjectURL(photo.preview);
    setPhoto(null);
  };

  // Submit
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      if (!user) {
        setShowAuthBanner(true);
        return;
      }

      if (throttleLeft > 0) return;

      if (!location) {
        setSubmitError('Please set a location by clicking on the map.');
        return;
      }

      setSubmitting(true);
      setSubmitError(null);

      try {
        const payload = {
          category,
          lat: location.lat,
          lng: location.lng,
          note: note.trim() || null,
          // photo is omitted from JSON; in a real app use FormData
        };

        const result = await fetchApi('/reports', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        localStorage.setItem(LS_LAST_REPORT_KEY, String(Date.now()));
        setSuccess(result);
      } catch (err) {
        setSubmitError('Failed to submit report. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [user, throttleLeft, location, category, note],
  );

  const resetForm = () => {
    setCategory(CATEGORIES[0]);
    setNote('');
    removePhoto();
    setSuccess(null);
    setSubmitError(null);
    setShowAuthBanner(false);
  };

  const mapCenter = location
    ? [location.lat, location.lng]
    : [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng];

  // ── Success card ─────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <div className="text-center max-w-md">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Report Received!</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{success.message}</p>
          {success.id && (
            <p className="text-xs text-gray-400 mt-3 font-mono">
              Ref: {success.id}
            </p>
          )}
        </div>
        <button
          onClick={resetForm}
          className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Report Another
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auth banner */}
      {showAuthBanner && !user && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-800 text-sm">Sign in to submit</p>
            <p className="text-xs text-amber-600 mt-0.5">
              You need to be signed in to file a pollution report. Your data helps authorities act
              faster.
            </p>
          </div>
          <button onClick={() => setShowAuthBanner(false)}>
            <X className="w-4 h-4 text-amber-400 hover:text-amber-600" />
          </button>
        </div>
      )}

      {/* Throttle warning */}
      {throttleLeft > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3 text-blue-700">
          <Clock className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Please wait <span className="font-bold">{throttleLeft}s</span> before submitting another
            report.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── Left: Form ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
          <h2 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Send className="w-5 h-5 text-brand-500" />
            Report Pollution
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Category <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent pr-10"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Location display */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Location <span className="text-red-400">*</span>
              </label>
              {geoLoading ? (
                <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Detecting your location…
                </div>
              ) : (
                <div
                  className={cn(
                    'flex items-center gap-2 text-sm px-4 py-3 rounded-xl border',
                    location
                      ? 'bg-brand-50 border-brand-200 text-brand-700'
                      : 'bg-gray-50 border-gray-200 text-gray-400',
                  )}
                >
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  {location
                    ? `${location.lat}, ${location.lng}`
                    : 'No location set — click the map'}
                </div>
              )}
              {geoError && (
                <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                  <Info className="w-3 h-3 flex-shrink-0" />
                  {geoError}
                </p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                Drag the pin or click the map to adjust
              </p>
            </div>

            {/* Photo upload */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Photo <span className="text-gray-300">(optional, max 5 MB)</span>
              </label>

              {photo?.preview ? (
                <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 h-36">
                  <img
                    src={photo.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-300 hover:bg-brand-50/30 transition-colors group">
                  <Camera className="w-6 h-6 text-gray-300 group-hover:text-brand-400 mb-1" />
                  <span className="text-xs text-gray-400 group-hover:text-brand-500">
                    Tap to upload a photo
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              )}

              {photo?.error && (
                <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                  {photo.error}
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Note <span className="text-gray-300">(optional, any language)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Describe what you see… (e.g. truck burning tyres near flyover)"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            {/* Submit error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting || throttleLeft > 0 || geoLoading}
              className={cn(
                'w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all',
                submitting || throttleLeft > 0 || geoLoading
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm hover:shadow-brand-200 hover:shadow-md',
              )}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Submitting…
                </>
              ) : throttleLeft > 0 ? (
                <>
                  <Clock className="w-4 h-4" />
                  Wait {throttleLeft}s
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Report
                </>
              )}
            </button>

            {!user && (
              <p className="text-center text-xs text-gray-400">
                You'll be asked to sign in when submitting.
              </p>
            )}
          </form>
        </div>

        {/* ── Right: Map ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl p-2 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 min-h-[420px] overflow-hidden relative z-0">
          {geoLoading ? (
            <div className="w-full h-full min-h-[420px] rounded-[20px] bg-gray-50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3 text-gray-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-sm">Loading map…</span>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '420px', width: '100%', minHeight: '420px' }}
              className="rounded-[20px]"
              zoomControl={false}

            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapClickHandler
                onMapClick={(latlng) => {
                  setLocation(latlng);
                  setGeoError(null);
                }}
              />
              {location && (
                <DraggableMarker
                  position={location}
                  onDragEnd={(latlng) => {
                    setLocation(latlng);
                    setGeoError(null);
                  }}
                />
              )}
            </MapContainer>
          )}

          {/* Map hint overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-1.5 text-[11px] text-gray-500 font-medium shadow-sm pointer-events-none z-[400]">
            <MapPin className="w-3 h-3 inline-block mr-1 text-brand-500" />
            Drag pin or click to reposition
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Act Page ────────────────────────────────────────────────────────────
export default function Act() {
  const [activeTab, setActiveTab] = useState('checklist');
  const [preCategory, setPreCategory] = useState(null);

  // Called when user clicks "Report vehicle idling" in checklist
  const handleReportTabLink = (category) => {
    setPreCategory(category);
    setActiveTab('report');
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Page header */}
      <div className="flex items-center gap-3 text-brand-700">
        <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
          <Star className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Act</h1>
          <p className="text-sm text-gray-500 font-medium">
            Take action & report pollution in your area
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'checklist' ? (
        <ChecklistSection onReportTabLink={handleReportTabLink} />
      ) : (
        <ReportSection preCategory={preCategory} />
      )}
    </div>
  );
}
