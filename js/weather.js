// ===== Weather (Open-Meteo) =====
// Free, no API key. Stores only the chosen city (or last-allowed GPS coords)
// in localStorage. Caches the last forecast for 10 minutes so opening the
// panel feels instant and doesn't hammer the API.
//
// Data flow:
//   1. User opens the Weather overlay.
//   2. We use the saved location (city or GPS coords) if present.
//   3. If a cached response < 10 min old exists for those coords, render it.
//   4. Otherwise fetch from Open-Meteo and cache.
//
// The API endpoint:
//   https://api.open-meteo.com/v1/forecast
//   ?latitude=11.55&longitude=104.92
//   &current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m
//   &hourly=temperature_2m,weather_code
//   &daily=weather_code,temperature_2m_max,temperature_2m_min
//   &timezone=auto

const Weather = (() => {

  const STORAGE_LOC   = 'kh-cal-weather-location';
  const STORAGE_CACHE = 'kh-cal-weather-cache';
  const CACHE_TTL_MS  = 10 * 60 * 1000;          // 10 minutes

  // Curated city list — Cambodia provinces first, then a few hubs for
  // the Khmer diaspora and trading partners.
  const CITIES = [
    // Cambodia
    { id: 'pnh', km: 'ភ្នំពេញ',         en: 'Phnom Penh',      zh: '金边',     lat: 11.5564, lon: 104.9282, country: 'KH' },
    { id: 'sr',  km: 'សៀមរាប',         en: 'Siem Reap',       zh: '暹粒',     lat: 13.3633, lon: 103.8564, country: 'KH' },
    { id: 'shv', km: 'ព្រះសីហនុ',       en: 'Sihanoukville',   zh: '西哈努克市', lat: 10.6280, lon: 103.5219, country: 'KH' },
    { id: 'btb', km: 'បាត់ដំបង',       en: 'Battambang',      zh: '马德望',    lat: 13.0957, lon: 103.2022, country: 'KH' },
    { id: 'kpc', km: 'កំពង់ចាម',       en: 'Kampong Cham',    zh: '磅湛',     lat: 12.0000, lon: 105.4500, country: 'KH' },
    { id: 'kt',  km: 'កំពត',           en: 'Kampot',          zh: '贡布',     lat: 10.6104, lon: 104.1810, country: 'KH' },
    { id: 'kep', km: 'កែប',            en: 'Kep',             zh: '白马',     lat: 10.4830, lon: 104.3160, country: 'KH' },
    { id: 'mdk', km: 'មណ្ឌលគិរី',     en: 'Mondulkiri',      zh: '蒙多基里',  lat: 12.7879, lon: 107.1011, country: 'KH' },
    { id: 'rtk', km: 'រតនគិរី',         en: 'Ratanakiri',      zh: '腊塔纳基里', lat: 13.7395, lon: 106.9879, country: 'KH' },
    { id: 'pst', km: 'ពោធិ៍សាត់',      en: 'Pursat',          zh: '菩萨',     lat: 12.5388, lon: 103.9192, country: 'KH' },
    { id: 'tk',  km: 'តាកែវ',           en: 'Takeo',           zh: '茶胶',     lat: 10.9908, lon: 104.7848, country: 'KH' },
    { id: 'svr', km: 'ស្វាយរៀង',       en: 'Svay Rieng',      zh: '柴桢',     lat: 11.0877, lon: 105.7993, country: 'KH' },
    { id: 'pvg', km: 'ព្រៃវែង',        en: 'Prey Veng',       zh: '波萝勉',    lat: 11.4862, lon: 105.3253, country: 'KH' },
    { id: 'kdl', km: 'កណ្តាល',         en: 'Kandal',          zh: '干丹',     lat: 11.4730, lon: 104.9540, country: 'KH' },
    { id: 'bmc', km: 'បន្ទាយមានជ័យ', en: 'Banteay Meanchey', zh: '班迭棉吉', lat: 13.5859, lon: 102.9737, country: 'KH' },
    { id: 'kpt', km: 'កំពង់ធំ',         en: 'Kampong Thom',    zh: '磅同',     lat: 12.7111, lon: 104.8887, country: 'KH' },
    { id: 'kpp', km: 'កំពង់ស្ពឺ',       en: 'Kampong Speu',    zh: '磅士卑',    lat: 11.4564, lon: 104.5209, country: 'KH' },
    { id: 'kpn', km: 'កំពង់ឆ្នាំង',     en: 'Kampong Chhnang', zh: '磅清扬',    lat: 12.2505, lon: 104.6664, country: 'KH' },
    { id: 'krc', km: 'ក្រចេះ',         en: 'Kratie',          zh: '桔井',     lat: 12.4881, lon: 106.0188, country: 'KH' },
    { id: 'stg', km: 'ស្ទឹងត្រែង',     en: 'Stung Treng',     zh: '上丁',     lat: 13.5259, lon: 105.9683, country: 'KH' },
    { id: 'tkm', km: 'ត្បូងឃ្មុំ',     en: 'Tboung Khmum',    zh: '特本克蒙',   lat: 11.9180, lon: 105.6800, country: 'KH' },
    { id: 'odm', km: 'ឧត្តរមានជ័យ',  en: 'Oddar Meanchey',  zh: '奥多棉吉',   lat: 14.1810, lon: 103.5060, country: 'KH' },
    { id: 'pln', km: 'ប៉ៃលិន',         en: 'Pailin',          zh: '拜林',     lat: 12.8489, lon: 102.6086, country: 'KH' },
    // Regional / diaspora
    { id: 'bkk', km: 'បាងកក',           en: 'Bangkok',         zh: '曼谷',     lat: 13.7563, lon: 100.5018, country: 'TH' },
    { id: 'sgn', km: 'ហូជីមិញ',        en: 'Ho Chi Minh City', zh: '胡志明市',  lat: 10.8231, lon: 106.6297, country: 'VN' },
    { id: 'vte', km: 'វៀងចន្ទន៍',       en: 'Vientiane',       zh: '万象',     lat: 17.9757, lon: 102.6331, country: 'LA' },
    { id: 'sin', km: 'សិង្ហបុរី',       en: 'Singapore',       zh: '新加坡',    lat:  1.3521, lon: 103.8198, country: 'SG' },
    { id: 'kul', km: 'គូឡាឡាំពួរ',     en: 'Kuala Lumpur',    zh: '吉隆坡',    lat:  3.1390, lon: 101.6869, country: 'MY' },
    { id: 'tyo', km: 'តូក្យូ',          en: 'Tokyo',           zh: '东京',     lat: 35.6762, lon: 139.6503, country: 'JP' },
    { id: 'lax', km: 'ឡូសអាន់ហ្គឺឡេស', en: 'Los Angeles',     zh: '洛杉矶',    lat: 34.0522, lon: -118.2437, country: 'US' },
    { id: 'par', km: 'ប៉ារីស',          en: 'Paris',           zh: '巴黎',     lat: 48.8566, lon:    2.3522, country: 'FR' }
  ];

  function _read(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function _write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  /** Returns the saved location or null. */
  function getLocation() {
    return _read(STORAGE_LOC, null);
  }

  /** Persist a location { kind: 'city'|'gps', id?, name?, lat, lon } */
  function setLocation(loc) {
    _write(STORAGE_LOC, loc);
  }

  function findCity(id) {
    return CITIES.find(c => c.id === id) || null;
  }

  function cityName(c, lang) {
    if (!c) return '';
    return c[lang] || c.km || c.en || '';
  }

  /** Returns a Promise of GPS coords via browser/Capacitor geolocation. */
  function getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const Plugins = window.Capacitor && window.Capacitor.Plugins;
      // Prefer the Capacitor Geolocation plugin on native (has proper runtime
      // permission handling on Android 6+ and asks the user explicitly).
      if (Plugins && Plugins.Geolocation) {
        const Geo = Plugins.Geolocation;
        // Step 1: check current permission state. Request if not granted yet.
        const ensurePermission = (Geo.checkPermissions
          ? Geo.checkPermissions().then(s => {
              const granted = s && (s.location === 'granted' || s.coarseLocation === 'granted');
              if (granted) return s;
              if (!Geo.requestPermissions) return s;
              return Geo.requestPermissions({ permissions: ['location'] });
            })
          : Promise.resolve());
        ensurePermission
          .then(() => Geo.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }))
          .then(p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }))
          .catch(reject);
        return;
      }
      if (!navigator.geolocation) { reject(new Error('geolocation unavailable')); return; }
      navigator.geolocation.getCurrentPosition(
        (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
        (e) => reject(e),
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
      );
    });
  }

  /** Cache helpers — keyed by rounded coords so nearby points reuse the cache */
  function _cacheKey(lat, lon) {
    return Math.round(lat * 10) / 10 + ',' + Math.round(lon * 10) / 10;
  }

  function _getCached(lat, lon) {
    const all = _read(STORAGE_CACHE, {});
    const entry = all[_cacheKey(lat, lon)];
    if (!entry) return null;
    if (Date.now() - entry.t > CACHE_TTL_MS) return null;
    return entry.data;
  }

  function _setCached(lat, lon, data) {
    const all = _read(STORAGE_CACHE, {});
    all[_cacheKey(lat, lon)] = { t: Date.now(), data };
    // Keep cache trimmed
    const keys = Object.keys(all);
    if (keys.length > 8) {
      // Keep the 8 most recently used
      keys.sort((a, b) => all[b].t - all[a].t);
      const trimmed = {};
      keys.slice(0, 8).forEach(k => { trimmed[k] = all[k]; });
      _write(STORAGE_CACHE, trimmed);
    } else {
      _write(STORAGE_CACHE, all);
    }
  }

  /**
   * Fetch a forecast for the given coordinates from Open-Meteo.
   * Returns a Promise resolving to the parsed JSON, or rejecting on error.
   * Honors the 10-min cache when forceFresh is false.
   */
  function fetchForecast(lat, lon, opts) {
    opts = opts || {};
    if (!opts.forceFresh) {
      const cached = _getCached(lat, lon);
      if (cached) return Promise.resolve(cached);
    }
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=' + encodeURIComponent(lat)
      + '&longitude=' + encodeURIComponent(lon)
      + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature'
      + '&hourly=temperature_2m,weather_code'
      + '&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset'
      + '&timezone=auto'
      + '&forecast_days=7';
    return fetch(url).then(r => {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    }).then(data => {
      _setCached(lat, lon, data);
      return data;
    });
  }

  // ---------- WMO weather-code mapping → emoji + i18n keys ----------
  // Per the Open-Meteo / WMO spec.
  const CODES = {
    0:  { icon: '☀️',  km: 'មេឃស្រឡះ',       en: 'Clear sky',          zh: '晴' },
    1:  { icon: '🌤️',  km: 'មេឃភ្លឺច្បាស់',   en: 'Mainly clear',       zh: '大致晴朗' },
    2:  { icon: '⛅',  km: 'មានពពកខ្លះ',      en: 'Partly cloudy',      zh: '局部多云' },
    3:  { icon: '☁️',  km: 'មេឃស្រទាប',       en: 'Overcast',           zh: '阴' },
    45: { icon: '🌫️',  km: 'អ័ព្ទ',              en: 'Fog',                zh: '雾' },
    48: { icon: '🌫️',  km: 'អ័ព្ទកក',           en: 'Rime fog',           zh: '雾凇' },
    51: { icon: '🌦️',  km: 'ភ្លៀងស្រិចៗ',      en: 'Light drizzle',      zh: '小毛雨' },
    53: { icon: '🌦️',  km: 'ភ្លៀងស្រិច',        en: 'Drizzle',            zh: '毛毛雨' },
    55: { icon: '🌦️',  km: 'ភ្លៀងស្រិចខ្លាំង',  en: 'Heavy drizzle',      zh: '浓毛毛雨' },
    56: { icon: '🌧️',  km: 'ភ្លៀងកករឹង',       en: 'Freezing drizzle',   zh: '冻毛毛雨' },
    57: { icon: '🌧️',  km: 'ភ្លៀងកករឹងខ្លាំង', en: 'Heavy freezing drizzle', zh: '强冻毛毛雨' },
    61: { icon: '🌧️',  km: 'ភ្លៀងតិច',          en: 'Light rain',         zh: '小雨' },
    63: { icon: '🌧️',  km: 'ភ្លៀង',             en: 'Rain',               zh: '雨' },
    65: { icon: '🌧️',  km: 'ភ្លៀងធំ',           en: 'Heavy rain',         zh: '大雨' },
    66: { icon: '🌧️',  km: 'ភ្លៀងកក',           en: 'Freezing rain',      zh: '冻雨' },
    67: { icon: '🌧️',  km: 'ភ្លៀងកកធំ',         en: 'Heavy freezing rain', zh: '强冻雨' },
    71: { icon: '🌨️',  km: 'ព្រិលតិច',          en: 'Light snow',         zh: '小雪' },
    73: { icon: '🌨️',  km: 'ព្រិល',              en: 'Snow',               zh: '雪' },
    75: { icon: '🌨️',  km: 'ព្រិលធំ',           en: 'Heavy snow',         zh: '大雪' },
    77: { icon: '🌨️',  km: 'ព្រិលគ្រាប់',      en: 'Snow grains',        zh: '雪粒' },
    80: { icon: '🌦️',  km: 'ភ្លៀងជាដំណាក់ៗ', en: 'Rain showers',       zh: '阵雨' },
    81: { icon: '🌧️',  km: 'ភ្លៀងលំហូរ',       en: 'Heavy showers',      zh: '强阵雨' },
    82: { icon: '⛈️',  km: 'ភ្លៀងព្យុះ',        en: 'Violent showers',    zh: '暴雨' },
    85: { icon: '🌨️',  km: 'ព្រិលជាដំណាក់ៗ', en: 'Snow showers',       zh: '阵雪' },
    86: { icon: '🌨️',  km: 'ព្រិលធំ',           en: 'Heavy snow showers', zh: '大阵雪' },
    95: { icon: '⛈️',  km: 'ព្យុះផ្គរ',         en: 'Thunderstorm',       zh: '雷雨' },
    96: { icon: '⛈️',  km: 'ព្យុះផ្គរនិងព្រិល', en: 'Thunderstorm with hail', zh: '雷雨夹冰雹' },
    99: { icon: '⛈️',  km: 'ព្យុះផ្គរធំ',        en: 'Heavy thunderstorm', zh: '强雷雨' }
  };

  function describeCode(code, lang) {
    const c = CODES[code];
    if (!c) return { icon: '❔', label: '' };
    return { icon: c.icon, label: c[lang] || c.en };
  }

  return {
    CITIES, findCity, cityName,
    getLocation, setLocation, getCurrentPosition,
    fetchForecast, describeCode
  };
})();
