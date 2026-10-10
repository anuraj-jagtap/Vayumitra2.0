export const ADVICE = {
  'Good': {
    'general': { mask: 'No mask needed', outdoor: 'Enjoy outdoor activities', ventilation: 'Open windows to bring in fresh air', children: 'Great time for outdoor play' },
    'child': { mask: 'No mask needed', outdoor: 'Enjoy outdoor activities', ventilation: 'Open windows to bring in fresh air', children: 'Great time for outdoor play' },
    'elderly': { mask: 'No mask needed', outdoor: 'Enjoy outdoor activities', ventilation: 'Open windows to bring in fresh air', children: '-' },
    'asthma': { mask: 'No mask needed', outdoor: 'Enjoy outdoor activities', ventilation: 'Open windows', children: '-' },
    'worker': { mask: 'No mask needed', outdoor: 'Safe for outdoor work', ventilation: 'Open windows', children: '-' }
  },
  'Satisfactory': {
    'general': { mask: 'No mask needed', outdoor: 'Safe for outdoor activities', ventilation: 'Ventilation recommended', children: 'Safe for outdoor play' },
    'child': { mask: 'No mask needed', outdoor: 'Safe for outdoor activities', ventilation: 'Ventilation recommended', children: 'Safe for outdoor play' },
    'elderly': { mask: 'Optional', outdoor: 'Reduce prolonged heavy exertion if experiencing symptoms', ventilation: 'Ventilation recommended', children: '-' },
    'asthma': { mask: 'Optional', outdoor: 'Reduce prolonged heavy exertion if experiencing symptoms', ventilation: 'Ventilation recommended', children: '-' },
    'worker': { mask: 'No mask needed', outdoor: 'Safe for outdoor work', ventilation: 'Ventilation recommended', children: '-' }
  },
  'Moderate': {
    'general': { mask: 'Optional in high traffic', outdoor: 'Unusually sensitive people should consider reducing heavy exertion', ventilation: 'Keep windows closed during peak traffic', children: 'Reduce heavy outdoor exertion' },
    'child': { mask: 'Cloth or basic mask in heavy traffic', outdoor: 'Reduce prolonged heavy outdoor exertion', ventilation: 'Close windows during peak hours', children: 'Reduce heavy outdoor play' },
    'elderly': { mask: 'Mask recommended outdoors', outdoor: 'Reduce heavy exertion', ventilation: 'Keep windows closed', children: '-' },
    'asthma': { mask: 'Mask recommended outdoors', outdoor: 'Avoid heavy exertion', ventilation: 'Keep windows closed', children: '-' },
    'worker': { mask: 'Mask recommended', outdoor: 'Take breaks during heavy exertion', ventilation: 'Keep windows closed', children: '-' }
  },
  'Poor': {
    'general': { mask: 'N95 mask recommended', outdoor: 'Reduce prolonged or heavy exertion', ventilation: 'Keep windows closed, use purifier if available', children: 'Avoid heavy outdoor play' },
    'child': { mask: 'N95 mask recommended', outdoor: 'Avoid prolonged outdoor exertion', ventilation: 'Keep windows closed, use purifier', children: 'Avoid heavy outdoor play' },
    'elderly': { mask: 'N95 mask essential', outdoor: 'Avoid all physical exertion outdoors', ventilation: 'Keep windows closed, run purifier', children: '-' },
    'asthma': { mask: 'N95 mask essential', outdoor: 'Avoid all physical exertion outdoors', ventilation: 'Keep windows closed, run purifier', children: '-' },
    'worker': { mask: 'N95 mask essential', outdoor: 'Reduce heavy work, take frequent breaks', ventilation: 'Keep windows closed', children: '-' }
  },
  'Very Poor': {
    'general': { mask: 'N95 mask essential', outdoor: 'Avoid all outdoor exertion', ventilation: 'Keep windows strictly closed, run purifier', children: 'Keep children indoors' },
    'child': { mask: 'N95 mask essential', outdoor: 'Stay indoors', ventilation: 'Keep windows strictly closed, run purifier', children: 'Keep children indoors completely' },
    'elderly': { mask: 'N95 mask essential', outdoor: 'Stay indoors, keep activity levels low', ventilation: 'Keep windows strictly closed, run purifier', children: '-' },
    'asthma': { mask: 'N95 mask essential', outdoor: 'Stay indoors, keep asthma medication handy', ventilation: 'Keep windows strictly closed, run purifier', children: '-' },
    'worker': { mask: 'N95 mask essential', outdoor: 'Avoid outdoor work if possible', ventilation: 'Keep windows strictly closed', children: '-' }
  },
  'Severe': {
    'general': { mask: 'N95 mask essential if going out', outdoor: 'Stay indoors, avoid physical exertion', ventilation: 'Keep windows strictly closed, run purifier on max', children: 'Keep children indoors' },
    'child': { mask: 'N95 mask essential if going out', outdoor: 'Stay indoors completely', ventilation: 'Keep windows strictly closed, run purifier', children: 'Keep children indoors completely' },
    'elderly': { mask: 'N95 mask essential if going out', outdoor: 'Stay indoors completely', ventilation: 'Keep windows strictly closed, run purifier', children: '-' },
    'asthma': { mask: 'N95 mask essential if going out', outdoor: 'Stay indoors completely, consult doctor if symptoms arise', ventilation: 'Keep windows strictly closed, run purifier', children: '-' },
    'worker': { mask: 'N95 mask essential', outdoor: 'Stop outdoor work', ventilation: 'Keep windows strictly closed', children: '-' }
  }
};
