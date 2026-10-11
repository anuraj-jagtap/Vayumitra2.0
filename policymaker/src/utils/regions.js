// Region definitions and station geographic mapping
export const REGIONS = [
  'Delhi NCR',
  'South Delhi',
  'North Delhi',
  'East Delhi',
  'West Delhi',
  'Noida',
  'Gurgaon',
  'Faridabad'
]

export const REGION_KEYWORDS = {
  'North Delhi': [
    'north campus', 'jahangirpuri', 'wazirpur', 'rohini', 'satyawati',
    'burari', 'narela', 'alipur', 'bawana', 'ashok vihar', 'model town'
  ],
  'South Delhi': [
    'r.k. puram', 'rk puram', 'okhla', 'lodhi road', 'jawaharlal nehru stadium',
    'nehru stadium', 'saket', 'siri fort', 'nehru nagar', 'aya nagar', 'karni singh',
    'crri mathura road', 'us embassy', 'mandir marg'
  ],
  'East Delhi': [
    'anand vihar', 'patparganj', 'parparganj', 'mother dairy', 'vivek vihar',
    'mayur vihar', 'shahdara', 'geeta colony', 'dilshad garden', 'sonia vihar'
  ],
  'West Delhi': [
    'shadipur', 'punjabi bagh', 'dwarka', 'janakpuri', 'mundka', 'pusa',
    'paschim vihar', 'najafgarh', 'rajouri garden'
  ],
  'Noida': [
    'noida', 'sector-1', 'sector-62', 'sector-125', 'greater noida'
  ],
  'Gurgaon': [
    'gurgaon', 'gurugram', 'sector-51', 'vikas sadan', 'gwal pahari'
  ],
  'Faridabad': [
    'faridabad', 'sector 16a', 'sector 11', 'new industrial town'
  ]
}

export function matchesRegion(station, region) {
  if (!region || region === 'Delhi NCR') return true

  const regionLower = region.toLowerCase().trim()
  const cityLower = (station.city || '').toLowerCase().trim()

  // 1. Direct city matches
  if (regionLower === 'noida' && (cityLower === 'noida' || cityLower.includes('noida'))) return true
  if (regionLower === 'gurgaon' && (cityLower === 'gurgaon' || cityLower === 'gurugram' || cityLower.includes('gurga'))) return true
  if (regionLower === 'faridabad' && (cityLower === 'faridabad' || cityLower.includes('faridabad'))) return true
  if (regionLower === 'ghaziabad' && (cityLower === 'ghaziabad' || cityLower.includes('ghaziabad'))) return true

  // 2. Keyword and locality lookup for Delhi zones and satellite cities
  const keywords = REGION_KEYWORDS[region]
  const textToSearch = [
    station.name,
    station.fullName,
    station.station_name,
    station.locality,
    station.city,
    station.zone
  ].filter(Boolean).join(' ').toLowerCase()

  if (textToSearch.includes(regionLower)) return true

  if (keywords && keywords.some(k => textToSearch.includes(k))) return true

  return false
}
