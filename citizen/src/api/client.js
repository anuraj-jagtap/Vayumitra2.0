const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';

export async function fetchApi(endpoint, options = {}) {
  let url = `${API_BASE}${endpoint}`;
  
  if (USE_MOCKS) {
    // Strip query params for mock file resolution
    const path = endpoint.split('?')[0];
    url = `/mocks${path}.json`;
    
    // Convert POST to GET for static JSON mocks
    if (options.method && options.method !== 'GET') {
      options.method = 'GET';
      delete options.body;
    }
  }

  const token = localStorage.getItem('access_token') || localStorage.getItem('vayu_token');
  const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

