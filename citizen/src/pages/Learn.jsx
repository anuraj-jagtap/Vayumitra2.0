import { useState, useEffect, useCallback } from 'react';
import {
  Wind, Activity, Clock, Shield, Flame, CheckCircle, Sliders,
  X, ChevronRight, Award, BookOpen, AlertTriangle
} from 'lucide-react';
import { clsx } from 'clsx';
import learnModules from '../data/learn.json';
import { calculateExposure, EXPOSURE_LEVELS } from '../data/simulator.js';

// ─── Icon map ────────────────────────────────────────────────────────────────
const ICON_MAP = {
  Wind, Activity, Clock, Shield, Flame, CheckCircle, Sliders,
};

// ─── localStorage helpers ────────────────────────────────────────────────────
const BADGE_KEY = 'vayu_learn_badges';
const AQI_KEY = 'vayu_aqi';

function getBadges() {
  try {
    return JSON.parse(localStorage.getItem(BADGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveBadge(id) {
  const badges = getBadges();
  if (!badges.includes(id)) {
    localStorage.setItem(BADGE_KEY, JSON.stringify([...badges, id]));
  }
}

// ─── Skeleton card ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-xl mb-4" />
      <div className="h-4 bg-gray-100 rounded-full w-3/4 mb-3" />
      <div className="h-3 bg-gray-100 rounded-full w-full mb-2" />
      <div className="h-3 bg-gray-100 rounded-full w-5/6 mb-6" />
      <div className="h-9 bg-gray-100 rounded-xl w-full" />
    </div>
  );
}

// ─── Quiz component ──────────────────────────────────────────────────────────
function Quiz({ quiz, onPass, moduleId }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleSelect = (qi, optIdx) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: optIdx }));
  };

  const handleSubmit = () => {
    let correct = 0;
    quiz.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });
    setScore(correct);
    setSubmitted(true);
    if (correct >= 2) {
      saveBadge(moduleId);
      onPass();
    }
  };

  const allAnswered = Object.keys(answers).length === quiz.length;

  return (
    <div className="mt-6 space-y-6">
      <h3 className="text-base font-bold text-brand-700 flex items-center gap-2">
        <BookOpen className="w-4 h-4" /> Quick Quiz
      </h3>

      {quiz.map((q, qi) => (
        <div key={qi} className="space-y-2">
          <p className="text-sm font-semibold text-gray-800">
            {qi + 1}. {q.q}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt, oi) => {
              const isSelected = answers[qi] === oi;
              const isCorrect = submitted && oi === q.answer;
              const isWrong = submitted && isSelected && oi !== q.answer;

              return (
                <button
                  key={oi}
                  onClick={() => handleSelect(qi, oi)}
                  className={clsx(
                    'text-left px-4 py-2.5 rounded-xl text-sm font-medium border transition-all',
                    isCorrect && 'bg-green-50 border-green-400 text-green-800',
                    isWrong && 'bg-red-50 border-red-400 text-red-700',
                    !submitted && isSelected && 'bg-brand-50 border-brand-400 text-brand-800',
                    !submitted && !isSelected && 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-brand-50 hover:border-brand-300',
                    submitted && !isCorrect && !isWrong && 'bg-gray-50 border-gray-200 text-gray-400',
                  )}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={clsx(
            'w-full py-3 rounded-xl font-bold text-sm transition-all',
            allAnswered
              ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed',
          )}
        >
          Submit Quiz
        </button>
      ) : (
        <div className={clsx(
          'rounded-2xl p-4 text-center',
          score >= 2 ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200',
        )}>
          {score >= 2 ? (
            <>
              <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="font-bold text-green-800">
                {score}/{quiz.length} correct — Module completed! 🎉
              </p>
              <p className="text-xs text-green-700 mt-1">Badge awarded and saved.</p>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="font-bold text-orange-800">
                {score}/{quiz.length} correct — Give the content another read and try again!
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Simulator component ─────────────────────────────────────────────────────
function Simulator() {
  const defaultAqi = parseInt(localStorage.getItem(AQI_KEY) || '150', 10);

  const [inputs, setInputs] = useState({
    aqi: defaultAqi,
    hoursOutdoors: 4,
    mask: 'none',
    healthProfile: 'general',
    indoorCondition: 'open',
  });

  const result = calculateExposure(inputs);

  const set = (key, val) => setInputs(prev => ({ ...prev, [key]: val }));

  const ORGAN_ICONS = { lungs: '🫁', heart: '❤️', eyes: '👁️', brain: '🧠' };

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* AQI slider */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
            AQI — {inputs.aqi}
          </label>
          <input
            type="range" min={0} max={500} step={5}
            value={inputs.aqi}
            onChange={e => set('aqi', parseInt(e.target.value, 10))}
            className="w-full accent-brand-600"
            aria-label="AQI value"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0 (Good)</span><span>500 (Severe)</span>
          </div>
        </div>

        {/* Hours outdoors slider */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
            Hours Outdoors — {inputs.hoursOutdoors}h
          </label>
          <input
            type="range" min={0} max={12} step={0.5}
            value={inputs.hoursOutdoors}
            onChange={e => set('hoursOutdoors', parseFloat(e.target.value))}
            className="w-full accent-brand-600"
            aria-label="Hours spent outdoors"
          />
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0h</span><span>12h</span>
          </div>
        </div>

        {/* Mask */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
            Mask Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none', label: 'None' },
              { value: 'cloth', label: 'Cloth' },
              { value: 'surgical', label: 'Surgical' },
              { value: 'n95', label: 'N95' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => set('mask', opt.value)}
                className={clsx(
                  'py-2 rounded-xl text-xs font-bold border transition-all',
                  inputs.mask === opt.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-brand-50 hover:border-brand-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Health profile */}
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
            Health Profile
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'general', label: 'General' },
              { value: 'child', label: 'Child' },
              { value: 'elderly', label: 'Elderly' },
              { value: 'asthma', label: 'Asthma' },
              { value: 'worker', label: 'Outdoor Worker' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => set('healthProfile', opt.value)}
                className={clsx(
                  'py-2 rounded-xl text-xs font-bold border transition-all',
                  inputs.healthProfile === opt.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-brand-50 hover:border-brand-300',
                  opt.value === 'worker' && 'col-span-2',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Indoor condition */}
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1.5">
            Indoor Condition
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'open', label: 'Windows Open' },
              { value: 'closed', label: 'Windows Closed' },
              { value: 'purifier', label: 'Air Purifier' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => set('indoorCondition', opt.value)}
                className={clsx(
                  'py-2 rounded-xl text-xs font-bold border transition-all',
                  inputs.indoorCondition === opt.value
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-brand-50 hover:border-brand-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className={clsx('rounded-2xl p-5 border transition-all', result.bgLight, 'border-white/50')}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Exposure Level</span>
          <span className={clsx('px-3 py-1 rounded-xl text-xs font-black text-white', result.color)}>
            {result.level}
          </span>
        </div>

        {/* Score bar */}
        <div className="mb-4">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>Low</span><span>Severe</span>
          </div>
          <div className="h-2.5 bg-white/70 rounded-full overflow-hidden">
            <div
              className={clsx('h-full rounded-full transition-all duration-500', result.color)}
              style={{ width: `${result.score}%` }}
            />
          </div>
          <div className="text-center text-xs font-bold mt-1.5 text-gray-600">
            Score: {result.score} / 100
          </div>
        </div>

        {/* Tip */}
        <div className="bg-white/60 rounded-xl p-3 text-sm font-medium text-gray-700 mb-4">
          💡 {result.tip}
        </div>

        {/* Organ panel */}
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Organ Risk Summary
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {Object.entries(result.organs).map(([organ, text]) => (
            <div key={organ} className="bg-white/60 rounded-xl p-3">
              <div className="text-xs font-bold text-gray-700 capitalize mb-1">
                {ORGAN_ICONS[organ]} {organ}
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-gray-400 text-center">
        Illustrative, not medical advice. Sources: CPCB, WHO.
      </p>
    </div>
  );
}

// ─── Module modal ────────────────────────────────────────────────────────────
function ModuleModal({ module, onClose, onBadgeEarned }) {
  const [badgeJustEarned, setBadgeJustEarned] = useState(false);

  const handlePass = useCallback(() => {
    setBadgeJustEarned(true);
    onBadgeEarned();
  }, [onBadgeEarned]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while modal open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const isSimulator = module.content === 'simulator';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 bg-white w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 id="modal-title" className="text-xl font-black text-gray-900 leading-tight">
              {module.title}
            </h2>
            {badgeJustEarned && (
              <span className="inline-flex items-center gap-1 mt-1.5 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                <Award className="w-3 h-3" /> Badge Earned!
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            aria-label="Close module"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-6 pt-4">
          {isSimulator ? (
            <Simulator />
          ) : (
            <>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mb-6">
                {module.content}
              </p>
              {module.quiz.length > 0 && (
                <Quiz
                  quiz={module.quiz}
                  moduleId={module.id}
                  onPass={handlePass}
                />
              )}
            </>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-[10px] text-gray-400 text-center">
            Sources: CPCB, WHO
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Learn card ──────────────────────────────────────────────────────────────
function LearnCard({ module, isCompleted, onClick }) {
  const Icon = ICON_MAP[module.icon] || BookOpen;
  const isSimulator = module.content === 'simulator';

  return (
    <div className="relative bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 flex flex-col transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-0.5">
      {/* Completion badge */}
      {isCompleted && (
        <span
          className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"
          aria-label="Module completed"
        >
          <Award className="w-3 h-3" /> Completed
        </span>
      )}

      {/* Icon */}
      <div className={clsx(
        'w-11 h-11 rounded-xl flex items-center justify-center mb-4 flex-shrink-0',
        isSimulator ? 'bg-brand-100' : isCompleted ? 'bg-green-100' : 'bg-brand-50',
      )}>
        <Icon className={clsx(
          'w-5 h-5',
          isSimulator ? 'text-brand-600' : isCompleted ? 'text-green-600' : 'text-brand-500',
        )} />
      </div>

      {/* Text */}
      <h3 className="font-bold text-gray-900 mb-2 text-base leading-snug pr-6">
        {module.title}
      </h3>
      <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">
        {module.summary}
      </p>

      {/* CTA */}
      <button
        onClick={onClick}
        className={clsx(
          'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
          isCompleted
            ? 'bg-green-50 text-green-700 hover:bg-green-100'
            : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
        )}
      >
        {isCompleted ? 'Review module' : 'Start module'}
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Main Learn page ─────────────────────────────────────────────────────────
export default function Learn() {
  const [ready, setReady] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [badges, setBadges] = useState([]);

  // Sync badges from localStorage
  const refreshBadges = useCallback(() => {
    setBadges(getBadges());
  }, []);

  useEffect(() => {
    refreshBadges();
    // Brief delay for smooth fade-in (data is static but gives visual polish)
    const t = setTimeout(() => setReady(true), 150);
    return () => clearTimeout(t);
  }, [refreshBadges]);

  const completedCount = badges.filter(id =>
    learnModules.some(m => m.id === id && m.quiz.length > 0)
  ).length;
  const totalWithQuiz = learnModules.filter(m => m.quiz.length > 0).length;

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex items-center gap-3 text-brand-700">
          <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Learn</h1>
            <p className="text-sm text-gray-500 font-medium">
              Understand air quality — earn badges as you go
            </p>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 bg-white rounded-2xl px-5 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50 self-start sm:self-auto">
          <Award className="w-4 h-4 text-brand-500" />
          <span className="text-sm font-bold text-gray-700">
            {completedCount} / {totalWithQuiz} modules completed
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {totalWithQuiz > 0 && (
        <div className="bg-white rounded-2xl px-6 py-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span className="font-bold text-brand-600">Your progress</span>
            <span>{Math.round((completedCount / totalWithQuiz) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-700"
              style={{ width: `${(completedCount / totalWithQuiz) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Card grid */}
      <div
        className={clsx(
          'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-opacity duration-500',
          ready ? 'opacity-100' : 'opacity-0',
        )}
      >
        {!ready
          ? Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)
          : learnModules.map(module => (
              <LearnCard
                key={module.id}
                module={module}
                isCompleted={badges.includes(module.id)}
                onClick={() => setActiveModule(module)}
              />
            ))
        }
      </div>

      {/* Footer */}
      <p className="text-[11px] text-center text-gray-400">
        Sources: CPCB, WHO — All content is educational and not a substitute for medical advice.
      </p>

      {/* Module modal */}
      {activeModule && (
        <ModuleModal
          module={activeModule}
          onClose={() => setActiveModule(null)}
          onBadgeEarned={refreshBadges}
        />
      )}
    </div>
  );
}
