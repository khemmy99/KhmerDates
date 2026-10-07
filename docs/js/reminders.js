// ===== Daily Reminders =====
// Settings, plus the pre-computed schedule iOS needs.
//
// Android schedules and words its reminders natively (NotificationScheduler /
// KhmerNotifications): an alarm fires, and the text is built from the date at
// that moment. iOS cannot do that — UNUserNotificationCenter takes finished
// text up front and runs no code when a notification fires — so the wording has
// to exist before the notification does.
//
// Rather than port the calendar a second time into Swift, the schedule is built
// here, where the Khmer date, the ថ្ងៃសីល and the holidays already live, and
// handed to the native side as finished text through Capacitor Preferences.
// Swift only stores and posts it. That keeps one source of truth for wording
// and means a holidays.js change reaches iOS with no Swift edit.
//
// Both platforms therefore share this file for settings; only iOS reads the
// schedule.
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

  /** Where the finished iOS schedule is left for Swift to pick up. */
  const SCHEDULE_KEY = 'kh-cal-notif-schedule';

  /**
   * How far ahead to write notifications.
   *
   * iOS keeps at most 64 pending local notifications per app and silently drops
   * the rest, and a day can carry both a morning and an evening note — so 30
   * days is the most that reliably fits. The schedule is rewritten every time
   * the app opens, so in practice it only runs short for someone who has not
   * opened the app in a month, which is also the point at which iOS itself
   * starts holding back notifications from an unused app.
   */
  const HORIZON_DAYS = 30;
  const MAX_PENDING = 60;

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
    syncSchedule();
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
    syncSchedule();
  }

  function isValidTime(v) {
    return typeof v === 'string' && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v);
  }

  function platform() {
    return (window.Capacitor && typeof window.Capacitor.getPlatform === 'function')
      ? window.Capacitor.getPlatform()
      : 'web';
  }

  /**
   * True where a native scheduler exists, which means Android or iOS. A plain
   * PWA cannot wake itself at 07:00, so the settings block stays hidden on the
   * web rather than offering switches that would silently do nothing.
   */
  function isSupported() {
    const p = platform();
    return p === 'android' || p === 'ios';
  }

  /** iOS is the only platform that needs the schedule written out for it. */
  function needsSchedule() {
    return platform() === 'ios';
  }

  // ---------- wording ----------
  // Kept in step with KhmerNotifications.java, which words the same two
  // reminders on Android. Framing words follow the app's language setting; the
  // lunar reading itself stays in its own script, because it is the data rather
  // than a label.

  const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WEEKDAYS_ZH = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  function pick(lang, km, en, zh) {
    if (lang === 'en') return en;
    if (lang === 'zh') return zh;
    return km;
  }

  function silName(lang, kind) {
    if (kind === 'full') return pick(lang, 'ថ្ងៃពេញបូណ៌មី', 'full moon', '满月');
    if (kind === 'new') return pick(lang, 'ថ្ងៃដាច់ខែ', 'new moon', '新月');
    return pick(lang, 'ថ្ងៃសីលតូច', 'half moon', '弦月');
  }

  /** The lunar reading, e.g. "៣ កើត ខែស្រាពណ៍". */
  function khmerReading(lun) {
    const shown = lun.kd <= 15 ? lun.kd : lun.kd - 15;
    const phase = lun.kd <= 15 ? KhmerCalendar.RK[0] : KhmerCalendar.RK[1];
    return KhmerCalendar.khmerNumber(shown) + ' ' + phase
      + ' ខែ' + KhmerCalendar.khmerMonthNameFromKm(lun.km);
  }

  function lunarFor(date) {
    return KhmerCalendar.getKhmerDayMonthFromGregorian(date);
  }

  function silFor(date, lun) {
    return KhmerCalendar.silDayFromKhmer(lun.km, lun.kd, date.getFullYear());
  }

  /**
   * The holiday to speak about on a date, or null.
   *
   * A public holiday wins over an observance when both land on the same day,
   * matching nameFor() in KhmerHolidays.java. The name carries its
   * "ថ្ងៃទី N/total" part for a multi-day festival but not the public-holiday
   * badge, which the title already says.
   */
  function holidayFor(date, lang) {
    if (typeof KhmerHolidays === 'undefined') return null;
    const all = KhmerHolidays.getByDate(date);
    if (!all || !all.length) return null;

    let chosen = null;
    for (const h of all) {
      if (h.observance !== true) { chosen = h; break; }
      if (!chosen) chosen = h;
    }
    if (!chosen) return null;

    const base = chosen[lang] || chosen.km || '';
    let name = base;
    if (chosen.dayOfFestival && chosen.totalDays && chosen.totalDays > 1) {
      const toDigits = (n) => (lang === 'km') ? KhmerCalendar.khmerNumber(n) : String(n);
      const d = toDigits(chosen.dayOfFestival), t = toDigits(chosen.totalDays);
      const part = lang === 'km' ? `ថ្ងៃទី ${d}/${t}`
                 : lang === 'zh' ? `第${d}/${t}天`
                 :                  `Day ${d}/${t}`;
      name = `${base} (${part})`;
    }
    return { name: name, isPublic: chosen.observance !== true, raw: base };
  }

  /** Today's reading. Silent about anything else — the evening one covers that. */
  function dailyBody(lang, date, noteSil) {
    const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate();
    const lun = lunarFor(date);
    const be = KhmerCalendar.computeBEYear(y, m, lun.km, lun.kd);
    const dow = date.getDay();

    let body;
    if (lang === 'en') {
      body = `${WEEKDAYS_EN[dow]}, ${d} ${MONTHS_EN[m - 1]} · ${khmerReading(lun)} · BE ${be}`;
    } else if (lang === 'zh') {
      let s = `${WEEKDAYS_ZH[dow]} ${m}月${d}日`;
      const cn = chineseLabel(y, m, d);
      if (cn) s += ` · ${cn}`;
      body = `${s} · ${khmerReading(lun)}`;
    } else {
      body = `${KhmerCalendar.khmerWeekdayNameFromAD(y, m, d)} · ${khmerReading(lun)}`
           + ` · ព.ស.${KhmerCalendar.khmerNumber(be)}`;
    }

    // A ថ្ងៃសីល is worth a word even in the morning note, for anyone who has
    // the evening reminder switched off.
    if (noteSil && silFor(date, lun)) {
      body += ' · ' + pick(lang, 'ថ្ងៃសីល', 'holy day', '斋日');
    }
    return body;
  }

  function chineseLabel(y, m, d) {
    if (typeof ChineseCalendar === 'undefined' || !ChineseCalendar.solarToLunar) return null;
    try {
      const c = ChineseCalendar.solarToLunar(y, m, d);
      if (!c) return null;
      return (c.monthName || '') + (c.dayName || '') || null;
    } catch (e) {
      return null;
    }
  }

  /**
   * Title and body for the evening note about the given day, or null when it is
   * an ordinary day and nothing should be sent.
   *
   * One notification rather than two: when the day is both a holiday and an
   * observance day, the holiday leads and the សីល day is a second line.
   */
  function tomorrowText(lang, date, wantSil, wantHoliday) {
    const lun = lunarFor(date);
    const sil = wantSil ? silFor(date, lun) : null;
    let holiday = wantHoliday ? holidayFor(date, lang) : null;

    // ភ្ជុំបិណ្ឌ runs for fifteen days, and announcing every one of them would
    // turn the reminder into the thing the user mutes. Only the eve of the
    // first day speaks for a multi-day observance; the days off within it are
    // public holidays and still announce, as does any សីល day inside it.
    if (holiday && !holiday.isPublic) {
      const prev = new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
      const before = holidayFor(prev, lang);
      if (before && before.raw === holiday.raw) holiday = null;
    }
    if (!sil && !holiday) return null;

    let title;
    if (holiday) {
      title = holiday.isPublic
        ? pick(lang, 'ថ្ងៃឈប់សម្រាក ថ្ងៃស្អែក', 'Public holiday tomorrow', '明天是公共假日')
        : pick(lang, 'ពិធីបុណ្យ ថ្ងៃស្អែក', 'Observance tomorrow', '明天有节庆');
    } else {
      title = pick(lang, 'ថ្ងៃសីល ថ្ងៃស្អែក', 'Holy day tomorrow', '明天是斋日');
    }

    let body = '';
    if (holiday) body += holiday.name + '\n';
    body += pick(lang, 'ស្អែក ', 'Tomorrow: ', '明天：') + khmerReading(lun);
    if (sil) {
      body += ' — ' + pick(lang, 'ថ្ងៃសីល', 'holy day', '斋日')
            + ' (' + silName(lang, sil.kind) + ')';
    }
    return { title: title, body: body };
  }

  // ---------- the schedule ----------

  function minutesOf(which) {
    const parts = getTime(which).split(':');
    return (parseInt(parts[0], 10) * 60) + parseInt(parts[1], 10);
  }

  /**
   * Every notification due in the next HORIZON_DAYS, as
   * { at: epoch ms, title, body }, soonest first.
   *
   * The morning note describes the day it lands on; the evening note describes
   * the next day, which is the whole point of sending it the night before.
   * Anything already past is skipped so re-running this on app open cannot post
   * a notification for a moment that has gone.
   */
  function buildSchedule(now) {
    const from = now || new Date();
    const lang = I18n.getLang();
    const wantDaily = isOn('daily');
    const wantSil = isOn('sil');
    const wantHoliday = isOn('holiday');
    const morning = minutesOf('morning');
    const evening = minutesOf('evening');
    const out = [];

    for (let i = 0; i <= HORIZON_DAYS && out.length < MAX_PENDING; i++) {
      const day = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);

      if (wantDaily) {
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(),
                            Math.floor(morning / 60), morning % 60, 0, 0);
        if (at > from) {
          out.push({
            at: at.getTime(),
            title: pick(lang, 'ថ្ងៃនេះ', 'Today', '今天'),
            body: dailyBody(lang, day, wantSil)
          });
        }
      }

      if (wantSil || wantHoliday) {
        const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(),
                            Math.floor(evening / 60), evening % 60, 0, 0);
        if (at > from) {
          const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1);
          const text = tomorrowText(lang, next, wantSil, wantHoliday);
          if (text) out.push({ at: at.getTime(), title: text.title, body: text.body });
        }
      }
    }

    out.sort((a, b) => a.at - b.at);
    return out.slice(0, MAX_PENDING);
  }

  /**
   * Hands the schedule to the native side, or clears it when every reminder is
   * off. Cheap enough to call on any change: it is one Preferences write, and
   * Swift reschedules from it when the app next goes to the background.
   */
  function syncSchedule() {
    if (!needsSchedule()) return;
    let items = [];
    try {
      if (isOn('daily') || isOn('sil') || isOn('holiday')) items = buildSchedule(new Date());
    } catch (e) {
      // A calendar fault must not take the settings screen down with it; an
      // empty schedule simply means nothing is posted until the next open.
      items = [];
    }
    I18n.mirrorToNative(SCHEDULE_KEY, JSON.stringify(items));
  }

  /**
   * Pushes every current value across to the native side.
   *
   * Needed on first run after an update: an existing install has these in
   * localStorage (or nowhere at all, meaning the defaults), while the native
   * side only ever reads Preferences.
   */
  function syncToNative() {
    if (!isSupported()) return;
    Object.keys(SWITCHES).forEach(w => I18n.mirrorToNative(SWITCHES[w], isOn(w) ? 'on' : 'off'));
    Object.keys(TIMES).forEach(w => I18n.mirrorToNative(TIMES[w].key, getTime(w)));
    syncSchedule();
  }

  // A schedule only reaches thirty days out, and coming back to an app that
  // has been sitting in the background for a month is exactly when it has run
  // out. The page is not reloaded on resume, so DOMContentLoaded does not come
  // round again; this does.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) syncSchedule();
    });
  }

  return {
    isOn, setOn, getTime, setTime, isSupported, syncToNative,
    syncSchedule, buildSchedule, dailyBody, tomorrowText
  };
})();
