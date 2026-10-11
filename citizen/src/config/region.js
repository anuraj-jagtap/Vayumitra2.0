export const REGION_CONFIG = {
  name: 'Delhi NCR',
  defaultCenter: [28.6139, 77.2090],
  defaultZoom: 11,
  bounds: {
    minLat: 28.40,
    maxLat: 28.88,
    minLng: 76.84,
    maxLng: 77.35,
  },
  isWithinBounds: (lat, lng) => {
    return (
      lat >= 28.40 &&
      lat <= 28.88 &&
      lng >= 76.84 &&
      lng <= 77.35
    );
  }
};
