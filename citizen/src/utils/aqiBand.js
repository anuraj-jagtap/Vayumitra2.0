export function getAqiBand(aqi) {
  if (aqi <= 50) return { label: 'Good', color: 'bg-green-500', hexColor: '#22C55E', text: 'text-green-500', border: 'border-green-500', bgLight: 'bg-green-50' };
  if (aqi <= 100) return { label: 'Satisfactory', color: 'bg-lime-500', hexColor: '#84CC16', text: 'text-lime-500', border: 'border-lime-500', bgLight: 'bg-lime-50' };
  if (aqi <= 200) return { label: 'Moderate', color: 'bg-yellow-500', hexColor: '#EAB308', text: 'text-yellow-600', border: 'border-yellow-500', bgLight: 'bg-yellow-50' };
  if (aqi <= 300) return { label: 'Poor', color: 'bg-orange-500', hexColor: '#F97316', text: 'text-orange-500', border: 'border-orange-500', bgLight: 'bg-orange-50' };
  if (aqi <= 400) return { label: 'Very Poor', color: 'bg-red-500', hexColor: '#EF4444', text: 'text-red-500', border: 'border-red-500', bgLight: 'bg-red-50' };
  return { label: 'Severe', color: 'bg-red-900', hexColor: '#7F1D1D', text: 'text-red-900', border: 'border-red-900', bgLight: 'bg-red-100' };
}
