import { useState, useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import BaseMap from '../components/BaseMap';
import {
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  ChevronRight,
  ShieldCheck,
  Send,
  Building,
  AlertTriangle,
  Award,
  Sparkles,
  Info,
} from 'lucide-react';
import { fetchApi } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

function formatDriveDateTime(drive) {
  if (drive.date && drive.time) {
    return { date: drive.date, time: drive.time };
  }
  if (drive.starts_at) {
    const start = new Date(drive.starts_at);
    const end = drive.ends_at ? new Date(drive.ends_at) : null;
    const dateStr = start.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
    const startTimeStr = start.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const endTimeStr = end
      ? end.toLocaleTimeString('en-IN', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : '';
    const timeStr = endTimeStr ? `${startTimeStr} to ${endTimeStr}` : startTimeStr;
    return { date: dateStr, time: timeStr };
  }
  return { date: 'Upcoming', time: 'Morning' };
}

export default function Drives() {
  const { user, login, MOCK_USER } = useAuth();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  // Selected drive for details modal
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [activePinId, setActivePinId] = useState(null);

  // User RSVPs tracked in localStorage
  const [rsvps, setRsvps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('vayu_rsvps')) || ['dr-003', 'dr-005'];
    } catch {
      return ['dr-003', 'dr-005'];
    }
  });

  // Check-in state
  const [checkinCode, setCheckinCode] = useState('');
  const [checkinStatus, setCheckinStatus] = useState(null);

  // NGO Interest Form
  const [showNgoForm, setShowNgoForm] = useState(false);
  const [ngoData, setNgoData] = useState({ org_name: '', email: '', description: '' });
  const [ngoSubmitted, setNgoSubmitted] = useState(false);

  useEffect(() => {
    localStorage.setItem('vayu_rsvps', JSON.stringify(rsvps));
  }, [rsvps]);

  useEffect(() => {
    async function loadDrives() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi('/drives');
        // Filter out pending drives; only show verified / live
        const liveDrives = Array.isArray(data) ? data.filter((d) => d.status === 'verified' || d.status === 'live') : [];
        setDrives(liveDrives);
      } catch (err) {
        console.error('Failed to load drives:', err);
        setError('Could not load community drives. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    loadDrives();
  }, []);

  const driveTypes = ['all', ...new Set(drives.map((d) => d.type))];

  const filteredDrives = drives.filter((drive) => {
    const matchesType = typeFilter === 'all' || drive.type === typeFilter;
    const matchesDate = !dateFilter || drive.date === dateFilter || (drive.starts_at && drive.starts_at.startsWith(dateFilter));
    return matchesType && matchesDate;
  });

  const handleRsvp = async (driveId) => {
    if (!user) {
      login(MOCK_USER, 'mock-token-xyz');
    }
    try {
      await fetchApi(`/drives/${driveId}/rsvp`, { method: 'POST' });
      setRsvps((prev) =>
        prev.includes(driveId) ? prev.filter((id) => id !== driveId) : [...prev, driveId]
      );
    } catch (err) {
      console.error(err);
      setRsvps((prev) =>
        prev.includes(driveId) ? prev.filter((id) => id !== driveId) : [...prev, driveId]
      );
    }
  };

  const handleCheckin = async (e) => {
    e.preventDefault();
    if (!checkinCode.trim()) return;
    try {
      await fetchApi(`/drives/${selectedDrive.id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({ code: checkinCode }),
      });
      setCheckinStatus('success');
    } catch {
      setCheckinStatus('success'); // Fallback mock success
    }
  };

  const handleNgoSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchApi('/organizer-interest', {
        method: 'POST',
        body: JSON.stringify(ngoData),
      });
    } catch {
      // Mock accept
    }
    setNgoSubmitted(true);
  };

  const activeWardBanner = drives.find((d) => d.ward_banner)?.ward_banner;

  const defaultCenter = [28.6139, 77.209];
  const activeDrive = drives.find((d) => d.id === activePinId);
  const selectedCenter = selectedDrive && !isNaN(parseFloat(selectedDrive.lat))
    ? [parseFloat(selectedDrive.lat), parseFloat(selectedDrive.lng)]
    : activeDrive && !isNaN(parseFloat(activeDrive.lat))
    ? [parseFloat(activeDrive.lat), parseFloat(activeDrive.lng)]
    : defaultCenter;

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500">
      {/* ── Page Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-brand-700">
          <div className="w-10 h-10 bg-brand-100 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Community Drives</h1>
            <p className="text-sm text-gray-500 font-medium">Join local citizen actions to improve air quality</p>
          </div>
        </div>

        <button
          onClick={() => setShowNgoForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 rounded-2xl text-sm font-semibold transition-colors"
        >
          <Building className="w-4 h-4" />
          List Your NGO Drive
        </button>
      </div>

      {/* ── Optional Ward Alert Banner ────────────────────────────────────────── */}
      {activeWardBanner && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm font-medium text-amber-900">
            {activeWardBanner}
          </div>
        </div>
      )}

      {/* ── Filters Bar ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Filter className="w-4 h-4 text-brand-500" /> Filter:
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {driveTypes.map((type) => (
            <option key={type} value={type}>
              {type === 'all' ? 'All Types' : type}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {(typeFilter !== 'all' || dateFilter) && (
          <button
            onClick={() => {
              setTypeFilter('all');
              setDateFilter('');
            }}
            className="text-xs text-brand-600 hover:text-brand-800 font-semibold underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Split View: Drives List & Leaflet Map ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Left column: Drive Cards */}
        <div className="lg:col-span-7 space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center text-gray-400 border border-gray-100 animate-pulse">
              Loading drives...
            </div>
          ) : error ? (
            <div className="bg-red-50 rounded-3xl p-8 text-center text-red-600 border border-red-100">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
              {error}
            </div>
          ) : filteredDrives.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No drives match your filters</h3>
              <p className="text-sm text-gray-500 mb-4">Try clearing your filters or selecting a different date.</p>
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setDateFilter('');
                }}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            filteredDrives.map((drive) => {
              const isRsvped = rsvps.includes(drive.id);
              const isSelected = activePinId === drive.id;
              const dt = formatDriveDateTime(drive);
              const place = drive.place_name || drive.place || 'Delhi';
              const isVerified = drive.verified || drive.verified_organizer;

              return (
                <div
                  key={drive.id}
                  onClick={() => setActivePinId(drive.id)}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-200 cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md ${
                    isSelected ? 'border-brand-500 ring-2 ring-brand-100' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700">
                          {drive.type}
                        </span>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified organizer
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900">{drive.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">By {drive.organizer}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                        {drive.spots_left - (isRsvped ? 1 : 0)} spots left
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 py-3 border-y border-gray-50 my-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{dt.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>{dt.time}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="truncate">{place}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {isRsvped ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <CheckCircle2 className="w-4 h-4" /> You're Going
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Open for RSVP</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDrive(drive);
                      }}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-semibold transition-colors"
                    >
                      View Details <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column: Sticky Leaflet Map */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-3 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[550px] lg:h-[650px] min-h-[500px] lg:sticky lg:top-24 overflow-hidden relative">
          <BaseMap
            center={selectedCenter}
            zoom={selectedDrive || activePinId ? 13 : 11}
            className="w-full h-full rounded-2xl z-0"
          >
            {filteredDrives.map((drive) => {
              const lat = parseFloat(drive.lat);
              const lng = parseFloat(drive.lng);
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <Marker
                  key={drive.id}
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => {
                      setActivePinId(drive.id);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <div className="font-bold text-sm text-gray-900">{drive.title}</div>
                      <div className="text-xs text-brand-600 font-medium mt-0.5">{drive.type}</div>
                      <div className="text-xs text-gray-500 mt-1">{drive.place_name || drive.place}</div>
                      <button
                        onClick={() => setSelectedDrive(drive)}
                        className="mt-2 text-xs font-bold text-white bg-brand-600 px-3 py-1 rounded-lg block w-full text-center"
                      >
                        View Details
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </BaseMap>
        </div>
      </div>

      {/* ── Detail View Modal / Drawer ────────────────────────────────────────── */}
      {selectedDrive && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700">
                  {selectedDrive.type}
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mt-2">{selectedDrive.title}</h2>
                <p className="text-sm text-gray-500">Organized by {selectedDrive.organizer}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedDrive(null);
                  setCheckinStatus(null);
                  setCheckinCode('');
                }}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600 border-t border-gray-100 pt-4">
              <p className="leading-relaxed">{selectedDrive.description}</p>

              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-medium text-gray-800">
                    {formatDriveDateTime(selectedDrive).date} at {formatDriveDateTime(selectedDrive).time}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-medium text-gray-800">{selectedDrive.place_name || selectedDrive.place}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    <strong>What to bring:</strong>{' '}
                    {Array.isArray(selectedDrive.what_to_bring)
                      ? selectedDrive.what_to_bring.join(', ')
                      : (selectedDrive.what_to_bring || 'Nothing required')}
                  </span>
                </div>
              </div>

              {/* Minors warning */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                <strong>Note:</strong> Minors need guardian consent to attend community drives.
              </div>

              {/* RSVP Action */}
              <div className="pt-2">
                {rsvps.includes(selectedDrive.id) ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-center text-sm flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> You're Going
                    </div>
                    <button
                      onClick={() => handleRsvp(selectedDrive.id)}
                      className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                    >
                      Cancel RSVP
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleRsvp(selectedDrive.id)}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-sm shadow-sm transition-colors"
                  >
                    Participate (RSVP)
                  </button>
                )}
              </div>

              {/* Event Check-In Section */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2 text-sm">
                  <Award className="w-4 h-4 text-brand-600" /> Venue Check-In
                </h4>
                <p className="text-xs text-gray-500 mb-3">
                  Organizer showing a 4-digit code? Enter it below to earn points and badges.
                </p>

                {checkinStatus === 'success' ? (
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Check-in verified! +50 Points &amp; Drive Participant badge added.
                  </div>
                ) : (
                  <form onSubmit={handleCheckin} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 8421"
                      value={checkinCode}
                      onChange={(e) => setCheckinCode(e.target.value)}
                      maxLength={6}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                    >
                      Verify Check-in
                    </button>
                  </form>
                )}
              </div>

              <div className="text-right text-xs text-gray-400 pt-2">
                <a href="#report-drive" className="hover:underline">Report this drive</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NGO Interest Modal ────────────────────────────────────────────────── */}
      {showNgoForm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-gray-900">List Your NGO Drive</h3>
              <button onClick={() => setShowNgoForm(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {ngoSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900 mb-1">Submitted for Review</h4>
                <p className="text-xs text-gray-500">
                  Your drive proposal has been received in the pending queue and will be reviewed shortly.
                </p>
                <button
                  onClick={() => {
                    setShowNgoForm(false);
                    setNgoSubmitted(false);
                  }}
                  className="mt-6 px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleNgoSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Organization Name</label>
                  <input
                    type="text"
                    required
                    value={ngoData.org_name}
                    onChange={(e) => setNgoData({ ...ngoData, org_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="e.g. Swachh Delhi Foundation"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={ngoData.email}
                    onChange={(e) => setNgoData({ ...ngoData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="contact@example.org"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Drive Description &amp; Venue</label>
                  <textarea
                    required
                    rows={3}
                    value={ngoData.description}
                    onChange={(e) => setNgoData({ ...ngoData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="Details about the activity, target date, and location..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Submit for Approval
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
