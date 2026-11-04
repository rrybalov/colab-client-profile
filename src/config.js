// Runtime settings. Set window.COLAB_CONFIG in /config.js (loaded before app.js) to point the app at an API
// without rebuilding. For testing, ?api=<base url> in the address does the same for one visit; that override
// only works while the app is on sample data, so a deployed, API-backed site can't be pointed elsewhere by a link.
const DEFAULTS = { dataSource: 'local', api: { baseUrl: '/api', headers: {}, credentials: 'same-origin', timeoutMs: 15000 } };

export function readConfig() {
  const given = (typeof window !== 'undefined' && window.COLAB_CONFIG) || {};
  const config = { ...DEFAULTS, ...given, api: { ...DEFAULTS.api, ...(given.api || {}) } };
  const param = new URLSearchParams(location.search).get('api');
  if (param && config.dataSource === 'local') { config.dataSource = 'api'; config.api.baseUrl = param; }
  return config;
}
