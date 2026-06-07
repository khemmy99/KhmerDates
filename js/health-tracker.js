// ===== Women's Health Tracker (opt-in) =====
// Stores per-profile period logs in localStorage only — no network calls.
//
// Data model:
//   kh-cal-health-settings: { enabled, activeProfileId, defaultCycle, defaultPeriod }
//   kh-cal-health-profiles: [{ id, name, color }]
//   kh-cal-health-profile-{id}: {
//     id, name, color,
//     avgCycle: number | null,   (override; null = use defaultCycle)
//     avgPeriod: number | null,
//     periods: [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD'|null }, ...]
//   }

const HealthTracker = (() => {

  const SETTINGS_KEY = 'kh-cal-health-settings';
  const PROFILES_KEY = 'kh-cal-health-profiles';
  const PROFILE_PREFIX = 'kh-cal-health-profile-';

  const DEFAULT_CYCLE  = 28;
  const DEFAULT_PERIOD = 5;
  // Luteal phase length is biologically near-constant (~14 days), so
  // ovulation typically falls 14 days BEFORE the next expected period.
  const LUTEAL_LENGTH = 14;
  // Fertile window = sperm survival window before ovulation + ovulation day + 1
  const FERTILE_DAYS_BEFORE = 4;
  const FERTILE_DAYS_AFTER  = 1;

  // Default profile palette — pinks, corals, purples
  const PROFILE_COLORS = ['#ff6b9d', '#f59e8c', '#b794f4', '#fb7185', '#ec4899'];

  function _ymd(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function _parseYmd(s) {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  function _diffDays(a, b) {
    return Math.round((a - b) / 86400000);
  }

  function _safeRead(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }

  function _safeWrite(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* quota or disabled storage — ignore */ }
  }

  // ----- Settings -----

  function getSettings() {
    const s = _safeRead(SETTINGS_KEY, null);
    return {
      enabled:         s && s.enabled === true,
      activeProfileId: s ? s.activeProfileId : null,
      defaultCycle:    (s && s.defaultCycle)  || DEFAULT_CYCLE,
      defaultPeriod:   (s && s.defaultPeriod) || DEFAULT_PERIOD
    };
  }

  function setSettings(patch) {
    const next = Object.assign(getSettings(), patch);
    _safeWrite(SETTINGS_KEY, next);
    return next;
  }

  function isEnabled() { return getSettings().enabled === true; }

  // ----- Profiles -----

  function getProfiles() {
    return _safeRead(PROFILES_KEY, []);
  }

  function getProfile(id) {
    if (!id) return null;
    return _safeRead(PROFILE_PREFIX + id, null);
  }

  function getActiveProfile() {
    const s = getSettings();
    if (!s.activeProfileId) return null;
    return getProfile(s.activeProfileId);
  }

  function addProfile(name) {
    const profiles = getProfiles();
    const id = 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    const color = PROFILE_COLORS[profiles.length % PROFILE_COLORS.length];
    const meta = { id, name: name || 'Profile ' + (profiles.length + 1), color };

    profiles.push(meta);
    _safeWrite(PROFILES_KEY, profiles);
    _safeWrite(PROFILE_PREFIX + id, {
      id, name: meta.name, color,
      avgCycle: null, avgPeriod: null, periods: []
    });

    // If this is the first profile, make it active
    const s = getSettings();
    if (!s.activeProfileId) setSettings({ activeProfileId: id });

    return meta;
  }

  function renameProfile(id, name) {
    const profiles = getProfiles().map(p => p.id === id ? Object.assign({}, p, { name }) : p);
    _safeWrite(PROFILES_KEY, profiles);
    const full = getProfile(id);
    if (full) _safeWrite(PROFILE_PREFIX + id, Object.assign({}, full, { name }));
  }

  function deleteProfile(id) {
    const profiles = getProfiles().filter(p => p.id !== id);
    _safeWrite(PROFILES_KEY, profiles);
    try { localStorage.removeItem(PROFILE_PREFIX + id); } catch (e) {}

    // If the deleted profile was active, switch to the first remaining
    const s = getSettings();
    if (s.activeProfileId === id) {
      setSettings({ activeProfileId: profiles.length ? profiles[0].id : null });
    }
  }

  function setActiveProfile(id) { setSettings({ activeProfileId: id }); }

  function updateProfile(id, patch) {
    const full = getProfile(id);
    if (!full) return;
    _safeWrite(PROFILE_PREFIX + id, Object.assign({}, full, patch));
  }

  // ----- Period logging -----

  function logPeriod(profileId, startDate, endDate) {
    const p = getProfile(profileId);
    if (!p) return;
    const startYmd = typeof startDate === 'string' ? startDate : _ymd(startDate);
    const endYmd   = endDate ? (typeof endDate === 'string' ? endDate : _ymd(endDate)) : null;

    const periods = (p.periods || []).filter(x => x.start !== startYmd);
    periods.push({ start: startYmd, end: endYmd });
    periods.sort((a, b) => a.start.localeCompare(b.start));

    updateProfile(profileId, { periods });
  }

  function deletePeriod(profileId, startYmd) {
    const p = getProfile(profileId);
    if (!p) return;
    updateProfile(profileId, { periods: (p.periods || []).filter(x => x.start !== startYmd) });
  }

  // ----- Cycle math -----

  /** Effective cycle length: average of last 3 intervals, else profile default, else 28 */
  function getEffectiveCycleLength(profile) {
    const s = getSettings();
    const fallback = profile.avgCycle || s.defaultCycle || DEFAULT_CYCLE;
    const periods = (profile.periods || []).slice().sort((a, b) => a.start.localeCompare(b.start));
    if (periods.length < 2) return fallback;
    const recent = periods.slice(-4); // up to last 3 intervals (4 start dates)
    const intervals = [];
    for (let i = 1; i < recent.length; i++) {
      intervals.push(_diffDays(_parseYmd(recent[i].start), _parseYmd(recent[i - 1].start)));
    }
    const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    // Clamp to sane range (21-40) so a single weird entry doesn't break predictions
    return Math.max(21, Math.min(40, Math.round(avg)));
  }

  /** Effective period length: profile.avgPeriod else setting else 5 */
  function getEffectivePeriodLength(profile) {
    const s = getSettings();
    return profile.avgPeriod || s.defaultPeriod || DEFAULT_PERIOD;
  }

  /**
   * For a given date and profile, return an object describing the cycle state:
   *   { kind: 'period' | 'predicted-period' | 'fertile' | 'ovulation' | 'normal' | 'none',
   *     logged: bool,   (true only if kind='period' and date is within a logged period)
   *     dayInCycle: int,
   *     daysToNextPeriod: int (only when known) }
   * Returns { kind: 'none' } when there's no history or feature disabled.
   */
  function getDayInfo(date, profileId) {
    const s = getSettings();
    if (!s.enabled) return { kind: 'none' };
    const profile = getProfile(profileId || s.activeProfileId);
    if (!profile) return { kind: 'none' };

    const ymd = _ymd(date);
    const periods = (profile.periods || []).slice().sort((a, b) => a.start.localeCompare(b.start));

    // (1) Is this date within a LOGGED period?
    for (const p of periods) {
      if (p.start <= ymd && (p.end ? ymd <= p.end : ymd === p.start)) {
        // dayInCycle relative to this period's start
        const dayInPeriod = _diffDays(_parseYmd(ymd), _parseYmd(p.start)) + 1;
        return { kind: 'period', logged: true, dayInPeriod };
      }
    }

    if (periods.length === 0) return { kind: 'none' };

    // (2) Find the most recent logged period that STARTED ON OR BEFORE this date.
    // (Without this, a date sitting between two logged periods would incorrectly
    // use the future one as the reference.)
    let referencePeriod = null;
    for (const p of periods) {
      if (p.start <= ymd) {
        if (!referencePeriod || p.start > referencePeriod.start) {
          referencePeriod = p;
        }
      }
    }
    if (!referencePeriod) return { kind: 'none' };  // date is before first logged period

    const cycleLen   = getEffectiveCycleLength(profile);
    const periodLen  = getEffectivePeriodLength(profile);
    const daysSinceLastStart = _diffDays(date, _parseYmd(referencePeriod.start));

    const cycleNum = Math.floor(daysSinceLastStart / cycleLen);
    const dayInCycle = (daysSinceLastStart % cycleLen) + 1;

    // (3) Predicted period day? (cycleNum >= 1 — i.e. we've passed the logged period)
    if (cycleNum >= 1 && dayInCycle <= periodLen) {
      return {
        kind: 'predicted-period',
        dayInPeriod: dayInCycle,
        cycleNum,
        daysToNextPeriod: 0
      };
    }

    // (4) Fertile window / ovulation
    const ovulationDay = cycleLen - LUTEAL_LENGTH;        // 1-based day of cycle
    const fertileStart = Math.max(1, ovulationDay - FERTILE_DAYS_BEFORE);
    const fertileEnd   = ovulationDay + FERTILE_DAYS_AFTER;

    if (dayInCycle === ovulationDay) {
      return { kind: 'ovulation', dayInCycle, cycleNum };
    }
    if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) {
      return { kind: 'fertile', dayInCycle, cycleNum };
    }

    // (5) Normal day in cycle — return how many days until next predicted period
    let daysToNextPeriod;
    if (dayInCycle <= cycleLen) {
      daysToNextPeriod = cycleLen - dayInCycle + 1;
    } else {
      daysToNextPeriod = 0;
    }
    return { kind: 'normal', dayInCycle, cycleNum, daysToNextPeriod };
  }

  /** Return YYYY-MM-DD string for the next N predicted period starts. */
  function predictNextPeriods(profileId, count) {
    const profile = getProfile(profileId);
    if (!profile || !profile.periods || profile.periods.length === 0) return [];
    const periods = profile.periods.slice().sort((a, b) => a.start.localeCompare(b.start));
    const last = _parseYmd(periods[periods.length - 1].start);
    const cycleLen = getEffectiveCycleLength(profile);
    const out = [];
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let candidate = new Date(last);
    while (out.length < count) {
      candidate = new Date(candidate.getTime() + cycleLen * 86400000);
      if (candidate >= today || out.length === 0) out.push(_ymd(candidate));
    }
    return out;
  }

  return {
    // Settings
    getSettings, setSettings, isEnabled,
    // Profiles
    getProfiles, getProfile, getActiveProfile,
    addProfile, renameProfile, deleteProfile, updateProfile, setActiveProfile,
    // Period logging
    logPeriod, deletePeriod,
    // Cycle math
    getDayInfo, getEffectiveCycleLength, getEffectivePeriodLength,
    predictNextPeriods,
    // Helpers (exposed for tests / UI)
    _ymd
  };
})();
