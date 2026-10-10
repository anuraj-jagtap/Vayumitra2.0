import { User, Mail, MapPin, Heart, Globe, Star, Shield, LogOut, LogIn, Award, FileText, Car } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── Badge config ─────────────────────────────────────────────────────────────
const BADGE_STYLE = {
  'First Report':      { bg: 'bg-green-100',  text: 'text-green-700',  icon: FileText },
  'Drive Participant': { bg: 'bg-brand-100',   text: 'text-brand-700',  icon: Car },
  'Air Guardian':      { bg: 'bg-purple-100',  text: 'text-purple-700', icon: Shield },
};

const DEFAULT_BADGE_STYLE = { bg: 'bg-gray-100', text: 'text-gray-600', icon: Award };

// ── Drive titles (static map for display) ────────────────────────────────────
const DRIVE_TITLES = {
  'dr-003': 'Yamuna Riverbank Green Drive',
  'dr-005': 'East Delhi Ward Clean-Air Walk',
};

const HEALTH_PROFILE_LABELS = {
  general: 'General',
  child:   'Child',
  elderly: 'Elderly',
  asthma:  'Asthma / Heart Condition',
  worker:  'Outdoor Worker',
};

const LANG_LABELS = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Sub-components ────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-brand-600" />
      </div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
        <div className="text-sm font-semibold text-gray-800 mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function BadgePill({ name }) {
  const style = BADGE_STYLE[name] ?? DEFAULT_BADGE_STYLE;
  const Icon = style.icon;
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${style.bg} ${style.text} text-xs font-semibold`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {name}
    </div>
  );
}

function DriveItem({ driveId }) {
  const title = DRIVE_TITLES[driveId] ?? driveId;
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-2 h-2 rounded-full bg-brand-400 shrink-0" />
      <div>
        <div className="text-sm font-medium text-gray-800">{title}</div>
        <div className="text-[11px] text-gray-400 mt-0.5">ID: {driveId}</div>
      </div>
    </div>
  );
}

// ── Signed-out view ───────────────────────────────────────────────────────────
function SignedOutCard({ onLogin }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-50 p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-6">
          <User className="w-10 h-10 text-brand-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">You're not signed in</h2>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          Sign in to see your profile, earned badges, air-quality reports, and upcoming drives.
        </p>
        <button
          onClick={onLogin}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-semibold text-sm transition-colors shadow-sm"
        >
          <LogIn className="w-4 h-4" />
          Sign in with mock account
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Profile() {
  const { user, login, logout, MOCK_USER } = useAuth();

  if (!user) {
    return <SignedOutCard onLogin={() => login(MOCK_USER, 'mock-token-xyz')} />;
  }

  const initials = getInitials(user.name);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-brand-700">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
            <p className="text-sm text-gray-500 font-medium">Account &amp; preferences</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-gray-600 rounded-2xl font-medium text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>

      {/* ── Two-column grid ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT: Identity + details ──────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Identity card */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <div className="flex items-center gap-5 mb-8">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{user.name}</div>
                <div className="text-sm text-brand-600 font-medium mt-0.5">{user.email}</div>
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold">
                    <Star className="w-3 h-3" />
                    {user.points} pts
                  </span>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <InfoRow icon={MapPin}  label="Ward"           value={user.ward} />
              <InfoRow icon={Heart}   label="Health profile" value={HEALTH_PROFILE_LABELS[user.health_profile] ?? user.health_profile} />
              <InfoRow icon={Globe}   label="Language"       value={LANG_LABELS[user.language] ?? user.language.toUpperCase()} />
              <InfoRow icon={FileText} label="Reports filed" value={`${user.reports_filed} report${user.reports_filed !== 1 ? 's' : ''}`} />
            </div>
          </div>

          {/* My Drives */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <h3 className="font-bold text-base text-gray-800 flex items-center gap-2 mb-5">
              <Car className="w-5 h-5 text-brand-500" />
              My Drives
              <span className="ml-auto text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-lg">
                {user.my_drives?.length ?? 0} RSVPed
              </span>
            </h3>

            {user.my_drives?.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {user.my_drives.map((id) => (
                  <DriveItem key={id} driveId={id} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">No drives RSVPed yet.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: Points + Badges ────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Points card */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center mx-auto mb-4">
              <Star className="w-7 h-7 text-brand-600" />
            </div>
            <div className="text-5xl font-black text-brand-700 tracking-tighter">{user.points}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1 mb-4">Total Points</div>
            <div className="h-px bg-gray-100 mb-4" />
            <div className="text-sm text-gray-500">
              <span className="font-bold text-gray-800">{user.badges?.length ?? 0}</span> badge{(user.badges?.length ?? 0) !== 1 ? 's' : ''} earned
            </div>
          </div>

          {/* Badges card */}
          <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
            <h3 className="font-bold text-base text-gray-800 flex items-center gap-2 mb-5">
              <Award className="w-5 h-5 text-brand-500" />
              Badges
            </h3>

            {user.badges?.length > 0 ? (
              <div className="flex flex-col gap-2.5">
                {user.badges.map((badge) => (
                  <BadgePill key={badge} name={badge} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No badges yet — start contributing!</p>
            )}
          </div>

          {/* Reports stat card */}
          <div className="bg-brand-50 rounded-3xl p-6 border border-brand-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-brand-500">Reports filed</div>
                <div className="text-2xl font-black text-brand-700">{user.reports_filed}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
