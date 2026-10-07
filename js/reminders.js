// ===== Daily Reminders =====
// Settings only. The reminders themselves are scheduled and posted natively
// (NotificationScheduler / KhmerNotifications on Android), because an alarm has
// to survive the app being closed and a reboot, and a web page can do neither.
//
// Everything here therefore does one job: keep the user's choices in
// localStorage for this UI, and mirror them into Capacitor Preferences so the
// native side can read them out of the CapacitorStorage shared-preferences
// file. The scheduler re-reads them whenever the app is opened or backgrounded.
const Reminders = (() => {

  const SWITCHES = {
    daily:   'kh-cal-notif-daily',
    sil:     'kh-cal-notif-sil',
    holiday: 'kh-cal-notif-holiday'
  };

  const TIMES = {
    morning: { key: 'kh-cal-notif-morning', fallback: '07:00' },
    evening: { key: 'kh-cal-notif-evening', fallback: '18:00' }
  };

  /** Reminders are on unless turned off — the same default the native side uses. */
  function isOn(which) {
    const key = SWITCHES[which];
    if (!key) return false;
    try {
      return localStorage.getItem(key) !== 'off';
    } catch (e) {
      return true;
    }
  }

  function setOn(which, on) {
    const key = SWITCHES[which];
    if (!key) return;
    const value = on ? 'on' : 'off';
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
    I18n.mirrorToNative(key, value);
  }

  function getTime(which) {
    const spec = TIMES[which];
    if (!spec) return '';
    let v;
    try { v = localStorage.getItem(spec.key); } catch (e) { v = null; }
    return isValidTime(v) ? v : spec.fallback;
  }

  function setTime(which, value) {
    const spec = TIMES[which];
    if (!spec) return;
    // An <input type="time"> reports '' while it is being edited, and some
    // Android WebViews report a seconds field. Anything unusable is ignored
    // rather than written, so a half-typed value cannot silently move an alarm.
    if (!isValidTime(value)) return;
    const hhmm = value.slice(0, 5);
    try { localStorage.setItem(spec.key, hhmm); } catch (e) { /* private mode */ }
    I18n.mirrorToNative(spec.key, hhmm);
  }

  function isValidTime(v) {
    return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v);
  }

  /**
   * True only where a native scheduler actually exists, which today means
   * Android. The whole settings block is hidden elsewhere: a plain PWA cannot
   * wake itself at 07:00 and iOS has no counterpart to
   * NotificationScheduler yet, so a switch there would silently do nothing —
   * which is worse than no switch. isNativePlatform() is deliberately not used;
   * it is true on iOS too.
   */
  function isSupported() {
    return !!(window.Capacitor
      && typeof window.Capacitor.getPlatform === 'function'
      && window.Capacitor.getPlatform() === 'android');
  }

  /**
   * Pushes every current value across to the native side.
   *
   * Needed on first run after an update: an existing install has these in
   * localStorage (or nowhere at all, meaning the defaults), while the native
   * scheduler only ever reads Preferences.
   */
  function syncToNative() {
    if (!isSupported()) return;
    Object.keys(SWITCHES).forEach(w => I18n.mirrorToNative(SWITCHES[w], isOn(w) ? 'on' : 'off'));
    Object.keys(TIMES).forEach(w => I18n.mirrorToNative(TIMES[w].key, getTime(w)));
  }

  return { isOn, setOn, getTime, setTime, isSupported, syncToNative };
})();
