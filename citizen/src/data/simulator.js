export const EXPOSURE_LEVELS = [
  { maxScore: 20, level: 'Low', color: 'bg-green-500', text: 'text-green-700', bgLight: 'bg-green-50' },
  { maxScore: 45, level: 'Moderate', color: 'bg-yellow-400', text: 'text-yellow-700', bgLight: 'bg-yellow-50' },
  { maxScore: 70, level: 'High', color: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50' },
  { maxScore: 100, level: 'Severe', color: 'bg-red-600', text: 'text-red-700', bgLight: 'bg-red-50' },
];

const MASK_REDUCTION = { none: 0, cloth: 0.1, surgical: 0.3, n95: 0.6 };
const INDOOR_REDUCTION = { open: 0, closed: 0.3, purifier: 0.6 };

export function calculateExposure({ aqi, hoursOutdoors, mask, healthProfile, indoorCondition }) {
  let baseScore = 0;
  if (aqi <= 50) baseScore = 10;
  else if (aqi <= 100) baseScore = 25;
  else if (aqi <= 200) baseScore = 40;
  else if (aqi <= 300) baseScore = 60;
  else if (aqi <= 400) baseScore = 80;
  else baseScore = 100;

  const timeMultiplier = Math.min(hoursOutdoors / 8, 1);
  const maskReduction = MASK_REDUCTION[mask] || 0;
  const indoorReduction = INDOOR_REDUCTION[indoorCondition] || 0;
  const profileMultiplier = { general: 1, child: 1.3, elderly: 1.3, asthma: 1.5, worker: 1.1 }[healthProfile] || 1;

  let score = baseScore * (0.4 + 0.6 * timeMultiplier) * (1 - maskReduction * 0.5) * (1 - indoorReduction * 0.5) * profileMultiplier;
  score = Math.min(100, Math.round(score));

  const levelInfo = EXPOSURE_LEVELS.find(l => score <= l.maxScore) || EXPOSURE_LEVELS[EXPOSURE_LEVELS.length - 1];

  const organs = {
    lungs: score < 20
      ? 'Minimal risk. Normal breathing.'
      : score < 45
      ? 'Slight airway irritation possible during prolonged exertion.'
      : score < 70
      ? 'Airway inflammation likely with extended exposure. Avoid heavy exertion.'
      : 'High risk of acute respiratory distress. Stay indoors.',
    heart: score < 20
      ? 'No added cardiovascular risk.'
      : score < 45
      ? 'Minor added stress for those with pre-existing conditions.'
      : score < 70
      ? 'Elevated risk for people with heart disease.'
      : 'Serious risk. Those with heart conditions should consult a doctor.',
    eyes: score < 20
      ? 'No irritation expected.'
      : score < 45
      ? 'Mild irritation possible outdoors.'
      : score < 70
      ? 'Redness and watering likely outdoors.'
      : 'Significant irritation. Wear protective eyewear outdoors.',
    brain: score < 45
      ? 'No immediate neurological risk.'
      : score < 70
      ? 'Mild fatigue possible from reduced oxygen quality.'
      : 'Headaches and fatigue more likely. Reduce exertion.',
  };

  const tip = score < 20
    ? 'Air is safe today. Great time for outdoor activity!'
    : score < 45
    ? 'Consider an N95 mask if outdoors for extended periods.'
    : score < 70
    ? 'Reduce outdoor time, wear N95, and keep windows closed indoors.'
    : 'Stay indoors with windows closed. Run a purifier if available. Seek medical advice if symptomatic.';

  return { score, level: levelInfo.level, color: levelInfo.color, text: levelInfo.text, bgLight: levelInfo.bgLight, organs, tip };
}
