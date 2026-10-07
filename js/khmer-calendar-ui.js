// ===== Khmer Calendar App UI =====
// Full-screen calendar with Khmer lunar dates

const KhCal = (() => {
  const KC = KhmerCalendar;
  const CC = ChineseCalendar;
  const HL = (typeof KhmerHolidays !== 'undefined') ? KhmerHolidays : null;
  const DB = (typeof DailyBlock     !== 'undefined') ? DailyBlock     : null;
  const HT = (typeof HealthTracker  !== 'undefined') ? HealthTracker  : null;
  const WX = (typeof Weather        !== 'undefined') ? Weather        : null;
  // Single source of truth for the user-facing version label.
  // Keep this in sync with manifest.json `version` and android/app/build.gradle `versionName`.
  const APP_VERSION = '1.5.5';

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  // ===== Weather =====

  function _openWeather() {
    if (!WX) return;
    const overlay = document.getElementById('cal-weather-overlay');
    if (!overlay) return;
    _populateCitySelect();
    overlay.classList.add('open');
    _loadWeather();
  }

  function _populateCitySelect() {
    if (!WX) return;
    const sel = document.getElementById('weather-city-select');
    if (!sel) return;
    const lang = I18n.getLang();
    const saved = WX.getLocation();
    const savedId = saved && saved.kind === 'city' ? saved.id : 'pnh';
    sel.innerHTML = WX.CITIES.map(c =>
      `<option value="${escapeHtml(c.id)}"${c.id === savedId ? ' selected' : ''}>${escapeHtml(WX.cityName(c, lang))}</option>`
    ).join('');
  }

  function _useGpsLocation() {
    if (!WX) return;
    const cur = document.getElementById('weather-current');
    if (cur) cur.innerHTML =
      `<div class="weather-loading"><span class="weather-spinner"></span> <span>${escapeHtml(I18n.t('gpsRequesting') || 'Requesting location…')}</span></div>`;
    WX.getCurrentPosition().then(pos => {
      WX.setLocation({ kind: 'gps', lat: pos.lat, lon: pos.lon });
      _loadWeather();
    }).catch(err => {
      // Every failure used to read "Location unavailable. Pick a city above.",
      // which sent people to the city list when the fix was to turn location on
      // or grant the permission. getCurrentPosition() now says which it was.
      const key = { disabled: 'gpsOff', denied: 'gpsNoPermission', timeout: 'gpsTimeout' }[err && err.code]
                || 'gpsDenied';
      if (cur) cur.innerHTML =
        `<div class="weather-error">${escapeHtml(I18n.t(key) || 'Location unavailable. Pick a city above.')}</div>`;
    });
  }

  function _loadWeather() {
    if (!WX) return;
    const lang = I18n.getLang();
    let loc = WX.getLocation();
    if (!loc) {
      // Default to Phnom Penh on first open
      const city = WX.findCity('pnh');
      loc = { kind: 'city', id: city.id, name: WX.cityName(city, lang), lat: city.lat, lon: city.lon };
      WX.setLocation(loc);
    }
    const cur = document.getElementById('weather-current');
    const hourly = document.getElementById('weather-hourly');
    const daily  = document.getElementById('weather-daily');
    if (cur) cur.innerHTML = `<div class="weather-loading"><span class="weather-spinner"></span> <span>${escapeHtml(I18n.t('loading') || 'Loading…')}</span></div>`;
    if (hourly) hourly.innerHTML = '';
    if (daily)  daily.innerHTML  = '';

    WX.fetchForecast(loc.lat, loc.lon).then(data => {
      _renderWeather(data, loc, lang);
    }).catch(() => {
      if (cur) cur.innerHTML = `<div class="weather-error">${escapeHtml(I18n.t('weatherError') || 'Could not load weather. Check your connection.')}</div>`;
    });
  }

  function _renderWeather(data, loc, lang) {
    const cur = document.getElementById('weather-current');
    const hourlyEl = document.getElementById('weather-hourly');
    const dailyEl  = document.getElementById('weather-daily');

    // --- Current conditions ---
    const c = data.current || {};
    const cdesc = WX.describeCode(c.weather_code, lang);
    const locName = loc.kind === 'gps'
      ? (I18n.t('myLocation') || 'My location')
      : (loc.name || '');
    const updated = c.time ? c.time.replace('T', ' ').slice(0, 16) : '';
    if (cur) {
      cur.innerHTML = `
        <div class="weather-current-row">
          <div class="weather-current-icon">${cdesc.icon}</div>
          <div class="weather-current-info">
            <div class="weather-current-temp">${Math.round(c.temperature_2m)}°</div>
            <div class="weather-current-cond">${escapeHtml(cdesc.label)}</div>
            <div class="weather-current-loc">${escapeHtml(locName)}</div>
          </div>
          <div class="weather-current-extra">
            <div><span class="weather-extra-label">${escapeHtml(I18n.t('wxFeels') || 'Feels')}</span> ${Math.round(c.apparent_temperature)}°</div>
            <div><span class="weather-extra-label">${escapeHtml(I18n.t('wxHumidity') || 'Humidity')}</span> ${Math.round(c.relative_humidity_2m)}%</div>
            <div><span class="weather-extra-label">${escapeHtml(I18n.t('wxWind') || 'Wind')}</span> ${Math.round(c.wind_speed_10m)} km/h</div>
          </div>
        </div>
      `;
    }

    // --- Hourly (next 24 hours starting from "now") ---
    if (hourlyEl && data.hourly && data.hourly.time) {
      const now = new Date();
      const nowHourMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
      const times = data.hourly.time;
      const temps = data.hourly.temperature_2m;
      const codes = data.hourly.weather_code;
      let startIdx = times.findIndex(t => new Date(t).getTime() >= nowHourMs);
      if (startIdx < 0) startIdx = 0;
      const rows = [];
      for (let i = startIdx; i < Math.min(startIdx + 24, times.length); i++) {
        const dt = new Date(times[i]);
        const hh = String(dt.getHours()).padStart(2, '0') + ':00';
        const desc = WX.describeCode(codes[i], lang);
        const isFirst = i === startIdx;
        rows.push(`<div class="weather-hour${isFirst ? ' is-now' : ''}">
          <div class="weather-hour-time">${isFirst ? escapeHtml(I18n.t('wxNow') || 'Now') : hh}</div>
          <div class="weather-hour-icon">${desc.icon}</div>
          <div class="weather-hour-temp">${Math.round(temps[i])}°</div>
        </div>`);
      }
      hourlyEl.innerHTML = rows.join('');
    }

    // --- Daily (7 days) ---
    if (dailyEl && data.daily && data.daily.time) {
      const T = I18n.translations || {};
      const weekShort = (T[lang] && T[lang].weekdaysShort) || ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      const rows = data.daily.time.map((t, i) => {
        const dt = new Date(t);
        const desc = WX.describeCode(data.daily.weather_code[i], lang);
        const tmax = Math.round(data.daily.temperature_2m_max[i]);
        const tmin = Math.round(data.daily.temperature_2m_min[i]);
        const dayLabel = i === 0
          ? (I18n.t('wxToday') || 'Today')
          : weekShort[dt.getDay()];
        return `<div class="weather-day">
          <div class="weather-day-name">${escapeHtml(dayLabel)}</div>
          <div class="weather-day-icon">${desc.icon}</div>
          <div class="weather-day-cond">${escapeHtml(desc.label)}</div>
          <div class="weather-day-range">
            <span class="weather-day-max">${tmax}°</span>
            <span class="weather-day-sep">/</span>
            <span class="weather-day-min">${tmin}°</span>
          </div>
        </div>`;
      }).join('');
      dailyEl.innerHTML = rows;
    }
  }

  /**
   * Build a year-long list of unique holiday occurrences, grouped by month.
   * Consecutive days of the same holiday are collapsed into a date range.
   */
  // Walking a whole year of holidays is expensive, and the month-events card
  // asks for it on every render (i.e. every swipe). Memoise per year.
  const _yearEventsCache = {};

  function _collectYearEvents(year) {
    if (_yearEventsCache[year]) return _yearEventsCache[year];
    if (!HL) return [];
    const byMonth = {};
    for (let m = 0; m < 12; m++) byMonth[m] = [];

    // Walk every day of the year and capture each holiday entry per day
    const rows = [];
    for (let m = 0; m < 12; m++) {
      const lastDay = new Date(year, m + 1, 0).getDate();
      for (let d = 1; d <= lastDay; d++) {
        const dt = new Date(year, m, d);
        const list = HL.getByDate(dt);
        if (!list) continue;
        for (const h of list) {
          rows.push({
            month: m,
            day: d,
            ymd: year + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'),
            id: h.id || (h.km + '|' + h.en),  // synthetic id for fixed entries
            entry: h,
            isPublic: !h.observance
          });
        }
      }
    }

    // Collapse consecutive same-id rows into spans
    const collapsed = [];
    for (const r of rows) {
      const prev = collapsed[collapsed.length - 1];
      if (prev && prev.id === r.id && r.month === prev.endMonth) {
        // check day continuity (within same month)
        const prevDate = new Date(year, prev.endMonth, prev.endDay);
        const thisDate = new Date(year, r.month, r.day);
        const oneDay = (thisDate - prevDate) / 86400000;
        if (oneDay === 1) { prev.endDay = r.day; prev.endMonth = r.month; continue; }
      }
      // Or continuity across month boundary (e.g. Pchum Ben spans Sep→Oct)
      if (prev && prev.id === r.id) {
        const prevEnd = new Date(year, prev.endMonth, prev.endDay);
        const thisStart = new Date(year, r.month, r.day);
        if ((thisStart - prevEnd) / 86400000 === 1) {
          prev.endDay = r.day; prev.endMonth = r.month; continue;
        }
      }
      collapsed.push({
        id: r.id,
        startMonth: r.month, startDay: r.day,
        endMonth: r.month,   endDay: r.day,
        entry: r.entry,
        isPublic: r.isPublic
      });
    }

    // Group by START month for the section headers
    for (const c of collapsed) byMonth[c.startMonth].push(c);
    _yearEventsCache[year] = byMonth;
    return byMonth;
  }

  // ---------- Toast + clipboard ----------

  /**
   * Small transient message in the top-right corner.
   * NOTE: _toast() was already being called by the period-log flow but had
   * never been defined, which threw a ReferenceError there.
   */
  function _toast(msg, ms) {
    const box = document.getElementById('toast-container');
    if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .25s, transform .25s';
      el.style.opacity = '0';
      el.style.transform = 'translateY(-8px)';
      setTimeout(() => el.remove(), 280);
    }, ms || 1500);
  }

  function _copyText(text) {
    if (!text) return;

    // 1. Native bridge (iOS app shell) — most reliable: execCommand('copy')
    //    inside WKWebView is gated on user activation and often fails.
    const bridge = window.webkit && window.webkit.messageHandlers &&
                   window.webkit.messageHandlers.khmerCopy;
    if (bridge) {
      try {
        bridge.postMessage(text);
        _toast(I18n.t('copied'));
        return;
      } catch (e) { /* fall through to the web paths */ }
    }

    // 2. Async Clipboard API — needs a secure context (not file://).
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => _toast(I18n.t('copied')))
        .catch(() => _legacyCopy(text));
      return;
    }

    // 3. Selection + execCommand fallback (plain browser / PWA).
    _legacyCopy(text);
  }

  /**
   * iOS WKWebView ignores textarea.select() for copy purposes; it needs a real
   * Range selection over a contenteditable node, and the element must not be
   * display:none / zero-opacity or the selection is dropped.
   */
  function _legacyCopy(text) {
    const host = document.createElement('div');
    host.textContent = text;
    host.contentEditable = 'true';
    host.setAttribute('readonly', '');
    host.style.cssText =
      'position:fixed;left:0;bottom:0;width:1px;height:1px;overflow:hidden;' +
      'white-space:pre;color:transparent;background:transparent;border:0;' +
      'padding:0;-webkit-user-select:text;user-select:text;';
    document.body.appendChild(host);

    const sel = window.getSelection();
    const saved = sel.rangeCount ? sel.getRangeAt(0) : null;
    const range = document.createRange();
    range.selectNodeContents(host);
    sel.removeAllRanges();
    sel.addRange(range);

    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }

    sel.removeAllRanges();
    if (saved) sel.addRange(saved);
    document.body.removeChild(host);

    _toast(ok ? I18n.t('copied') : I18n.t('copyFailed'));
  }

  const _ICON_COPY  = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
  const _ICON_SHARE = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>';

  /** One labelled, selectable date line in the detail sheet plus its copy button. */
  function _copyRow(label, text, extraCls) {
    const safe = escapeHtml(text);
    const copyLabel = escapeHtml(I18n.t('copy'));
    return `<div class="detail-full-row">
      <div class="dinfo-main">
        <div class="dinfo-label">${escapeHtml(label)}</div>
        <div class="dinfo-text detail-selectable${extraCls ? ' ' + extraCls : ''}">${safe}</div>
      </div>
      <button type="button" class="detail-copy-btn" data-copy="${safe}"
              aria-label="${copyLabel}" title="${copyLabel}">${_ICON_COPY}</button>
    </div>`;
  }

  /**
   * Events card shown under the grid for whichever month is on screen.
   * Reuses the same rows as the full-year panel so the two stay consistent.
   */
  function _renderMonthEvents(year, month) {
    const bodyEl  = document.getElementById('month-events-body');
    const titleEl = document.getElementById('month-events-title');
    const countEl = document.getElementById('month-events-count');
    if (!bodyEl) return;

    const lang = I18n.getLang();
    if (titleEl) titleEl.textContent = I18n.t('eventsFooter');

    if (!HL) { bodyEl.innerHTML = ''; if (countEl) countEl.textContent = ''; return; }

    const events = (_collectYearEvents(year)[month] || []);

    if (countEl) {
      countEl.textContent = events.length
        ? (lang === 'km' ? KC.khmerNumber(events.length) : String(events.length))
        : '';
    }

    if (!events.length) {
      bodyEl.innerHTML = `<div class="month-events-empty">${escapeHtml(I18n.t('noEvents'))}</div>`;
      return;
    }

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayLabel = I18n.t('today') || 'Today';

    bodyEl.innerHTML = events.map(ev => {
      const name = ev.entry[lang] || ev.entry.km || '';
      const dotCls = ev.isPublic ? 'events-dot--public' : 'events-dot--observance';

      let dateStr = String(ev.startDay);
      if (ev.startMonth === ev.endMonth && ev.startDay !== ev.endDay) {
        dateStr = ev.startDay + '–' + ev.endDay;
      } else if (ev.startMonth !== ev.endMonth) {
        dateStr = ev.startDay + ' ' + I18n.gregMonthShort(ev.startMonth) +
                  ' – ' + ev.endDay + ' ' + I18n.gregMonthShort(ev.endMonth);
      }
      if (lang === 'km') dateStr = dateStr.replace(/\d+/g, n => KC.khmerNumber(+n));

      const evStart = new Date(year, ev.startMonth, ev.startDay).getTime();
      const evEnd   = new Date(year, ev.endMonth,   ev.endDay  ).getTime();
      let timeCls = '', badge = '';
      if (todayMidnight >= evStart && todayMidnight <= evEnd) {
        timeCls = ' events-row--today';
        badge = `<span class="events-today-badge">${escapeHtml(todayLabel)}</span>`;
      } else if (todayMidnight > evEnd) {
        timeCls = ' events-row--past';
      }

      return `<div class="events-row${ev.isPublic ? '' : ' events-row--observance'}${timeCls}"
                   data-m="${ev.startMonth}" data-d="${ev.startDay}">
        <span class="events-dot ${dotCls}"></span>
        <span class="events-date">${escapeHtml(dateStr)}</span>
        <span class="events-name">${escapeHtml(name)}</span>
        ${badge}
      </div>`;
    }).join('');
  }

  // ----- Events page -----
  const _ICON_PARTY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>';
  const _ICON_GRID  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>';

  let _eventsFilter = 'all'; // 'all' | 'public' | 'observance' | 'sil'

  /** Lunar reading for a row subtitle, e.g. "១៥ កើត ខែស្រាពណ៍". */
  function _lunarReading(lun) {
    const kd = lun.kd <= 15 ? lun.kd : lun.kd - 15;
    const kMonth = KC.khmerMonthNameFromKm(lun.km);
    if (I18n.getLang() === 'km') {
      return `${KC.khmerNumber(kd)} ${lun.kd <= 15 ? KC.RK[0] : KC.RK[1]} ខែ${kMonth}`;
    }
    return `${lun.kd <= 15 ? I18n.t('waxing') : I18n.t('waning')} ${kd} · ${kMonth}`;
  }

  /**
   * Every row for a year: holiday spans (a multi-day festival is one row on
   * its first day) plus each ថ្ងៃសីល, sorted by date.
   */
  function _collectEventRows(year, lang) {
    const rows = [];
    const byMonth = _collectYearEvents(year);
    for (let m = 0; m < 12; m++) {
      for (const ev of byMonth[m]) {
        const start = new Date(year, ev.startMonth, ev.startDay);
        const end   = new Date(year, ev.endMonth, ev.endDay);
        const span  = Math.round((end - start) / 86400000) + 1;
        let sub = I18n.t(ev.isPublic ? 'publicHoliday' : 'observanceDay');
        if (span > 1) {
          const endStr = ev.endMonth === ev.startMonth
            ? _num(ev.endDay)
            : _num(ev.endDay) + ' ' + I18n.gregMonthShort(ev.endMonth);
          sub += ` · ${_num(ev.startDay)}–${endStr} (${_num(span)} ${I18n.t('days')})`;
        }
        rows.push({ start, end, kind: ev.isPublic ? 'public' : 'observance',
                    name: ev.entry[lang] || ev.entry.km || '', sub });
      }
    }
    if (I18n.getSilDays()) {
      for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = new Date(year, d.getMonth(), d.getDate() + 1)) {
        const lun = KC.getKhmerDayMonthFromGregorian(d);
        if (!KC.silDayFromKhmer(lun.km, lun.kd, year)) continue;
        rows.push({ start: d, end: d, kind: 'sil', name: I18n.t('silDay'), sub: _lunarReading(lun) });
      }
    }
    const order = { public: 0, observance: 1, sil: 2 };
    return rows.sort((x, y) => (x.start - y.start) || (order[x.kind] - order[y.kind]));
  }

  function _renderEventChips() {
    const el = document.getElementById('events-chips');
    if (!el) return;
    const chips = [
      ['all', 'filterAll', _ICON_GRID],
      ['public', 'filterPublic', _ICON_PARTY],
      ['observance', 'filterObservance', _ICON_FLAG],
    ];
    if (I18n.getSilDays()) chips.push(['sil', 'silDay', _ICON_SIL]);
    if (!chips.some(c => c[0] === _eventsFilter)) _eventsFilter = 'all';
    el.innerHTML = chips.map(([id, key, icon]) =>
      `<button type="button" class="ev-chip ev-chip--${id}${id === _eventsFilter ? ' is-active' : ''}" data-filter="${id}">
        <span class="ev-chip-icon">${icon}</span>${escapeHtml(I18n.t(key))}
      </button>`).join('');
  }

  function _renderEventsList() {
    if (!HL) return;
    const lang = I18n.getLang();
    const listEl = document.getElementById('events-list');
    if (!listEl) return;

    const yearEl = document.getElementById('events-year');
    if (yearEl) yearEl.textContent = _num(_eventsYear);
    const todayNumEl = document.getElementById('events-today-num');
    if (todayNumEl) todayNumEl.textContent = new Date().getDate();
    _renderEventChips();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const icons = { public: _ICON_PARTY, observance: _ICON_FLAG, sil: _ICON_SIL };

    const rows = _collectEventRows(_eventsYear, lang)
      .filter(r => _eventsFilter === 'all' || r.kind === _eventsFilter);

    const sections = [];
    for (let m = 0; m < 12; m++) {
      const inMonth = rows.filter(r => r.start.getMonth() === m);
      if (!inMonth.length) continue;

      // Lunar month(s) the Gregorian month spans, as on the grid header
      const lastDay = new Date(_eventsYear, m + 1, 0).getDate();
      const km1 = KC.getKhmerDayMonthFromGregorian(new Date(_eventsYear, m, 1)).km;
      const km2 = KC.getKhmerDayMonthFromGregorian(new Date(_eventsYear, m, lastDay)).km;
      const lunarMonths = KC.khmerMonthNameFromKm(km1) + (km2 !== km1 ? ' · ' + KC.khmerMonthNameFromKm(km2) : '');

      const items = inMonth.map(r => {
        const dow = r.start.getDay();
        const wd = lang === 'km' ? KC.KD7[dow] : lang === 'zh' ? '周' + I18n.weekday(dow) : I18n.weekday(dow);
        const isToday = today >= r.start && today <= r.end;
        const timeCls = isToday ? ' ev-row--today' : r.end < today ? ' ev-row--past' : '';
        return `<div class="ev-row ev-row--${r.kind}${timeCls}" data-y="${_eventsYear}" data-m="${m}" data-d="${r.start.getDate()}">
          <div class="ev-date">
            <span class="ev-wd">${escapeHtml(wd)}</span>
            <span class="ev-day">${_num(r.start.getDate())}</span>
          </div>
          <span class="ev-icon">${icons[r.kind]}</span>
          <div class="ev-body">
            <div class="ev-name">${escapeHtml(r.name)}</div>
            <div class="ev-sub">${escapeHtml(r.sub)}</div>
          </div>
          ${isToday ? `<span class="ev-today-badge">${escapeHtml(I18n.t('today'))}</span>` : ''}
        </div>`;
      }).join('');

      sections.push(`<section class="ev-month">
        <div class="ev-month-head">
          <span class="ev-month-name">${escapeHtml(I18n.gregMonth(m))} ${_num(_eventsYear)}</span>
          <span class="ev-month-lunar">${escapeHtml(lunarMonths)}</span>
        </div>
        ${items}
      </section>`);
    }

    listEl.innerHTML = sections.length
      ? sections.join('')
      : `<div class="ev-empty">${escapeHtml(I18n.t('noEvents'))}</div>`;
  }

  /** Scroll the events page so the first event from today on is at the top. */
  function _scrollEventsToToday() {
    const listEl = document.getElementById('events-list');
    if (!listEl) return;
    const next = listEl.querySelector('.ev-row:not(.ev-row--past)');
    if (!next) { listEl.scrollTop = 0; return; }
    const head = next.parentElement.querySelector('.ev-month-head');
    // Land on the month header when the row opens its month; otherwise keep
    // the row just below the sticky header.
    listEl.scrollTop = next.previousElementSibling === head
      ? next.parentElement.offsetTop
      : next.offsetTop - (head ? head.offsetHeight : 0);
  }

  // ----- Day sheet sections -----
  const _ICON_FLAG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22V4"/><path d="M5 4h12l-2.5 4.5L17 13H5"/></svg>';
  const _ICON_SIL  = '<span class="detail-sil-icon" aria-hidden="true"></span>';

  /** Titled card; the title sits between two rules above the card. */
  function _sheetSection(title, body, extraCls) {
    return `<section class="dsec${extraCls ? ' ' + extraCls : ''}">
      <h3 class="dsec-title"><span>${escapeHtml(title)}</span></h3>
      <div class="dsec-card">${body}</div>
    </section>`;
  }

  /** One row inside a section: tone bar, icon, text (HTML), optional note. */
  function _sheetRow(tone, icon, textHtml, noteHtml) {
    return `<div class="dsec-row dsec-row--${tone}">
      <span class="dsec-bar"></span>
      <span class="dsec-icon">${icon}</span>
      <span class="dsec-text">${textHtml}</span>
      ${noteHtml ? `<span class="dsec-note">${noteHtml}</span>` : ''}
    </div>`;
  }

  function _silLabel(sil) {
    const phaseKey = sil.kind === 'full' ? 'silFull' : sil.kind === 'new' ? 'silNew' : 'silQuarter';
    return I18n.t('silDay') + ' · ' + I18n.t(phaseKey);
  }

  function _healthRow(dt) {
    if (!HT || !HT.isEnabled()) return '';
    const info = HT.getDayInfo(dt);
    if (!info || info.kind === 'none') return '';

    const profile = HT.getActiveProfile();
    const profileName = profile ? profile.name : '';
    const fill = (key, fallback, n) => (I18n.t(key) || fallback).replace('{n}', _num(n));

    let icon = '', kindLabel = '', detail = '';
    switch (info.kind) {
      case 'period':
        icon = '🔴';
        kindLabel = I18n.t('healthPeriod') || 'Period';
        detail = fill('healthDayN', 'Day {n}', info.dayInPeriod);
        break;
      case 'predicted-period':
        icon = '🩸';
        kindLabel = I18n.t('healthPredictedPeriod') || 'Predicted period';
        detail = fill('healthDayN', 'Day {n}', info.dayInPeriod);
        break;
      case 'ovulation':
        icon = '🥚';
        kindLabel = I18n.t('healthOvulation') || 'Ovulation';
        detail = fill('healthCycleDayN', 'Cycle day {n}', info.dayInCycle);
        break;
      case 'fertile':
        icon = '🌱';
        kindLabel = I18n.t('healthFertile') || 'Fertile window';
        detail = fill('healthCycleDayN', 'Cycle day {n}', info.dayInCycle);
        break;
      case 'normal':
        icon = '🌸';
        kindLabel = fill('healthCycleDayN', 'Cycle day {n}', info.dayInCycle);
        if (info.daysToNextPeriod > 0) {
          detail = fill('healthDaysToNext', '~{n} days to next period', info.daysToNextPeriod);
        }
        break;
    }

    const text = `<b class="dsec-health-kind">${escapeHtml(kindLabel)}</b>`
               + (detail ? `<span class="dsec-sub">${escapeHtml(detail)}</span>` : '');
    return _sheetRow('health dsec-row--' + info.kind, icon, text,
                     profileName ? escapeHtml(profileName) : '');
  }

  // ព្រឹត្តិការណ៍ — holidays, ថ្ងៃសីល and the cycle tracker for this day.
  // Red bar = public holiday, gold = observance (same split as the grid dots).
  function _renderDayEvents(dt, lang) {
    const rows = [];
    const list = HL ? HL.getByDate(dt) : null;
    (list || []).forEach(h => {
      rows.push(_sheetRow(h.observance === true ? 'gold' : 'red', _ICON_FLAG, escapeHtml(HL.nameFor(h, lang))));
    });
    if (I18n.getSilDays()) {
      const sil = KC.silDayFromGregorian(dt);
      if (sil) rows.push(_sheetRow('gold', _ICON_SIL, escapeHtml(_silLabel(sil))));
    }
    const health = _healthRow(dt);
    if (health) rows.push(health);
    return rows.length ? _sheetSection(I18n.t('eventsFooter'), rows.join('')) : '';
  }

  function _countdown(n) {
    return n === 1 ? I18n.t('tomorrow') : I18n.t('inNDays').replace('{n}', _num(n));
  }

  // បន្ទាប់ — the next ថ្ងៃសីល and the next couple of holidays after `dt`.
  // A holiday counts from the day it starts; a festival already running on
  // `dt` is skipped until it changes phase (e.g. Pchum Ben observance days
  // rolling into its public-holiday days).
  const UPCOMING_SCAN_DAYS = 90;
  const UPCOMING_MAX_HOLIDAYS = 2;

  function _renderUpcoming(dt, lang) {
    const keyOf = h => (h.id || h.km) + (h.observance === true ? ':o' : ':p');
    const keysOn = day => new Set(((HL && HL.getByDate(day)) || []).map(keyOf));

    const found = [];
    const seenHolidays = new Set();
    let needSil = I18n.getSilDays();
    let holidays = 0;
    let prevKeys = keysOn(dt);

    for (let i = 1; i <= UPCOMING_SCAN_DAYS && (needSil || holidays < UPCOMING_MAX_HOLIDAYS); i++) {
      const day = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + i);
      const lun = KC.getKhmerDayMonthFromGregorian(day);

      if (needSil && KC.silDayFromKhmer(lun.km, lun.kd, day.getFullYear())) {
        found.push(_sheetRow('gold', _ICON_SIL, escapeHtml(I18n.t('silDay')), escapeHtml(_countdown(i))));
        needSil = false;
      }

      const list = (HL && HL.getByDate(day)) || [];
      const keys = new Set();
      for (const h of list) {
        const key = keyOf(h);
        keys.add(key);
        const base = h.id || h.km;
        if (holidays >= UPCOMING_MAX_HOLIDAYS || prevKeys.has(key) || seenHolidays.has(base)) continue;
        seenHolidays.add(base);
        holidays++;
        found.push(_sheetRow(h.observance === true ? 'gold' : 'red', _ICON_FLAG,
                             escapeHtml(h[lang] || h.km || ''), escapeHtml(_countdown(i))));
      }
      prevKeys = keys;
    }
    return found.length ? _sheetSection(I18n.t('upNext'), found.join('')) : '';
  }

  function _renderDailyBlock(dt, lang) {
    if (!DB) return '';
    const groups = DB.getForDate(dt, lang);

    function row(item) {
      return `<div class="db-row db-row--${item.kind}">
        <span class="db-row-icon">${item.icon}</span>
        <span class="db-row-text">${escapeHtml(item.text)}</span>
      </div>`;
    }

    function group(key, items) {
      if (!items || !items.length) return '';
      return `<div class="db-group">
        <div class="db-group-label">${escapeHtml(I18n.t(key))}</div>
        ${items.map(row).join('')}
      </div>`;
    }

    const inner = [
      group('astrology', groups.astrology),
      group('salary',    groups.salary),
      group('bills',     groups.bills),
      group('school',    groups.school)
    ].filter(Boolean).join('');

    if (!inner) return '';
    return `<div class="detail-daily">
      <div class="detail-daily-title">${escapeHtml(I18n.t('dailyBlock'))}</div>
      ${inner}
    </div>`;
  }

  // --- State ---
  let _month = new Date().getMonth();
  let _year = new Date().getFullYear();
  let _selectedDate = null; // {y, m, d}
  let _pickerView = 'closed'; // 'closed' | 'months' | 'years'
  let _pickerYear = new Date().getFullYear(); // year shown in picker
  let _yearPageBase = 0; // base year for year grid
  let _eventsYear = new Date().getFullYear(); // year shown in events panel

  // === Number display: Khmer digits for km, normal for en/zh ===
  function _num(n) {
    return I18n.getLang() === 'km' ? KC.khmerNumber(n) : String(n);
  }

  // === Render weekday headers ===
  function _renderWeekdays() {
    const el = document.getElementById('cal-weekdays');
    if (!el) return;
    const dayOrder = I18n.getStartDay() === 'sun' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
    const lang = I18n.getLang();
    el.innerHTML = dayOrder.map((di) => {
      const cls = di === 0 ? ' sun' : di === 6 ? ' sat' : '';
      let label;
      if (lang === 'km') {
        label = KC.KD7[di];
      } else {
        label = I18n.weekday(di);
      }
      return `<div class="cal-wh${cls}">${label}</div>`;
    }).join('');
  }

  // === Render main calendar grid ===
  function _renderCalendar() {
    const year = _year, month = _month;
    const today = new Date();
    const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();
    const lang = I18n.getLang();

    // Month title — show FOUR columns side-by-side, each with its own divider:
    //   Khmer (មិថុនា)  |  English (June)  |  Chinese (六月)  |  Year (2026)
    // The active language column is highlighted; the others are dimmed.
    // Year uses Khmer digits when the active language is km.
    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) {
      const T = I18n.translations || {};
      const km = (T.km && T.km.gregMonths && T.km.gregMonths[month])           || '';
      const en = (T.en && T.en.gregMonths && T.en.gregMonths[month])           || '';
      const zh = (T.zh && T.zh.gregMonthsShort && T.zh.gregMonthsShort[month]) || '';
      const yearStr = (lang === 'km') ? KC.khmerNumber(year) : year;

      titleEl.innerHTML =
        `<span class="cal-month-col cal-month-km${lang==='km'?' is-active':''}">${escapeHtml(km)}</span>` +
        `<span class="cal-month-col cal-month-en${lang==='en'?' is-active':''}">${escapeHtml(en)}</span>` +
        `<span class="cal-month-col cal-month-zh${lang==='zh'?' is-active':''}">${escapeHtml(zh)}</span>` +
        `<span class="cal-month-col cal-month-year">${escapeHtml(String(yearStr))}</span>`;
    }

    // Lunar info — track the selected day (or today if visible, else mid-month).
    // The Sak / animal / BE switch on the civil Khmer New Year boundary (Apr 14),
    // so picking a specific reference day matters when the visible month spans
    // the boundary (e.g. April).
    const infoEl = document.getElementById('cal-lunar-info');
    if (infoEl) {
      const lastDay = new Date(year, month + 1, 0).getDate();

      let refDay;
      if (_selectedDate && _selectedDate.y === year && _selectedDate.m === month) {
        refDay = _selectedDate.d;
      } else if (year === todayY && month === todayM) {
        refDay = todayD;
      } else {
        refDay = Math.min(15, lastDay);
      }

      const refLun = KC.getKhmerDayMonthFromGregorian(new Date(year, month, refDay));
      // Show the single lunar month the reference day actually falls in, not a
      // "first - last" range. A Gregorian month usually straddles two lunar
      // months (and in a Khmer leap year, បឋមាសាឍ then ទុតិយាសាឍ), so the range
      // was always shown even though only one of them applies today.
      const kmName = KC.khmerMonthNameFromKm(refLun.km);
      const be = KC.computeBEYear(year, month + 1, refLun.km, refLun.kd);
      // Animal & Sak follow Apr 14 boundary; BE follows lunar Pisakh boundary
      const animal = KC.khmerYearAnimalFromBE(year, month + 1, refDay);
      const sak = KC.sakNameFromAD(year, month + 1, refDay);
      // Rendered as spans rather than one string so each part can carry its own
      // colour — the line was a single flat grey before.
      const beText = (lang === 'km')
        ? `ព.ស.${KC.khmerNumber(be)}`
        : `${I18n.t('bePrefix')} ${be}`;
      const sep = '<span class="lunar-sep">|</span>';
      infoEl.innerHTML =
        `<span class="lunar-month">${escapeHtml(kmName)}</span>` + sep +
        `<span class="lunar-sak">${escapeHtml(sak)}</span>` + sep +
        `<span class="lunar-animal">${escapeHtml(animal)}</span>` + sep +
        `<span class="lunar-be">${escapeHtml(beText)}</span>`;
    }

    // Build grid
    const gridEl = document.getElementById('cal-grid');
    if (!gridEl) return;

    const firstDowRaw = new Date(year, month, 1).getDay();
    const firstDow = I18n.getStartDay() === 'sun' ? firstDowRaw : (firstDowRaw + 6) % 7;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const prevMonthLast = new Date(year, month, 0).getDate();
    let html = '';

    function _cellHTML(dt, d, dataY, dataM, extra) {
      const lun = KC.getKhmerDayMonthFromGregorian(dt);
      const kdDisp = lun.kd <= 15 ? _num(lun.kd) : _num(lun.kd - 15);
      const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxingShort')) : (lang === 'km' ? KC.RK[1] : I18n.t('waningShort'));
      const waxClass = lun.kd <= 15 ? 'keit' : 'roc';
      const cn = CC.fromDate(dt);
      const cnText = cn ? cn.cellText : '';
      const cnFirst = cn && cn.day === 1 ? ' cn-first' : '';
      const holidayKind  = HL ? HL.classifyDate(dt) : null;
      const holidayClass = holidayKind === 'public'     ? ' holiday'
                         : holidayKind === 'observance' ? ' observance'
                         : '';
      const healthClass = _healthClassFor(dt);
      const sil = _silFor(lun, dt);
      return `<div class="cal-cell ${extra} ${waxClass}${holidayClass}${healthClass}${sil.cls}" data-y="${dataY}" data-m="${dataM}" data-d="${d}">
        ${sil.html}<span class="cal-gday">${d}</span>
        <span class="cal-kday">${kdDisp} ${wax}</span>
        <span class="cal-cday${cnFirst}">${cnText}</span>
      </div>`;
    }

    // ថ្ងៃសីល marker. Takes the lunar date the caller already converted —
    // KC.getKhmerDayMonthFromGregorian() walks year by year from 1900 and the
    // grid pays for it once per cell as it is.
    function _silFor(lun, dt) {
      if (!I18n.getSilDays()) return { cls: '', html: '' };
      const sil = KC.silDayFromKhmer(lun.km, lun.kd, dt.getFullYear());
      if (!sil) return { cls: '', html: '' };
      return {
        cls: sil.major ? ' sil sil-major' : ' sil',
        html: '<span class="cal-sil" aria-hidden="true"></span>'
      };
    }

    function _healthClassFor(dt) {
      if (!HT || !HT.isEnabled()) return '';
      const info = HT.getDayInfo(dt);
      switch (info.kind) {
        case 'period':            return ' health-period';
        case 'predicted-period':  return ' health-predicted';
        case 'ovulation':         return ' health-ovulation';
        case 'fertile':           return ' health-fertile';
        default:                  return '';
      }
    }

    // Previous month fill
    for (let i = firstDow - 1; i >= 0; i--) {
      const d = prevMonthLast - i;
      const pm = month - 1 < 0 ? 11 : month - 1;
      const py = month - 1 < 0 ? year - 1 : year;
      html += _cellHTML(new Date(py, pm, d), d, py, pm, 'outside');
    }

    // Current month days
    for (let d = 1; d <= lastDay; d++) {
      const dt = new Date(year, month, d);
      const dow = dt.getDay();
      const isToday = (year === todayY && month === todayM && d === todayD);
      const isSel = _selectedDate && (_selectedDate.y === year && _selectedDate.m === month && _selectedDate.d === d);
      const dayClass = dow === 0 ? 'sun' : dow === 6 ? 'sat' : '';
      const lun = KC.getKhmerDayMonthFromGregorian(dt);
      const kdDisp = lun.kd <= 15 ? _num(lun.kd) : _num(lun.kd - 15);
      const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxingShort')) : (lang === 'km' ? KC.RK[1] : I18n.t('waningShort'));
      const waxClass = lun.kd <= 15 ? 'keit' : 'roc';
      const cn = CC.fromDate(dt);
      const cnText = cn ? cn.cellText : '';
      const cnFirst = cn && cn.day === 1 ? ' cn-first' : '';
      const holidayKind  = HL ? HL.classifyDate(dt) : null;
      const holidayClass = holidayKind === 'public'     ? ' holiday'
                         : holidayKind === 'observance' ? ' observance'
                         : '';
      const healthClass = _healthClassFor(dt);
      const sil = _silFor(lun, dt);
      html += `<div class="cal-cell${isToday ? ' today' : ''}${isSel ? ' selected' : ''} ${dayClass} ${waxClass}${holidayClass}${healthClass}${sil.cls}" data-y="${year}" data-m="${month}" data-d="${d}">
        ${sil.html}<span class="cal-gday">${d}</span>
        <span class="cal-kday">${kdDisp} ${wax}</span>
        <span class="cal-cday${cnFirst}">${cnText}</span>
      </div>`;
    }

    // Next month fill
    const totalCells = firstDow + lastDay;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nm = month + 1 > 11 ? 0 : month + 1;
      const ny = month + 1 > 11 ? year + 1 : year;
      html += _cellHTML(new Date(ny, nm, d), d, ny, nm, 'outside');
    }

    gridEl.innerHTML = html;

    _renderMonthEvents(year, month);

    // Today button — only shown when we're away from the current month.
    // The button is position:fixed, so the app also gets a class that reserves
    // room for it; otherwise it floats on top of the last row of days.
    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) {
      const onCurrentMonth = (year === todayY && month === todayM);
      todayBtn.textContent = I18n.t('today');
      todayBtn.style.display = onCurrentMonth ? 'none' : 'block';
      const app = document.querySelector('.cal-app');
      if (app) app.classList.toggle('has-today-fab', !onCurrentMonth);
    }
  }

  // === Day detail panel ===
  /* ===== Place prefix =====
   * Khmer letters open with the place before the date:
   *   ខេត្តព្រះសីហនុ, ថ្ងៃទី១៧ ខែសីហា ឆ្នាំ២០២៦
   * gDatesPro() in khmer-calendar.js builds exactly this but hard-codes the
   * province in ADH[3], so the place is a saved setting instead and the row is
   * composed here from the Gregorian string the sheet already has.
   *
   * Deliberately rendered as part of _showDetail's own markup. A previous
   * attempt appended this row from the Office add-in into the element its
   * MutationObserver was watching, which fed itself endlessly and froze the
   * task pane. As part of the normal render there is no observer involved.
   */
  const PLACE_KEY = 'kh-cal-place';
  const PLACE_DEFAULT = 'ខេត្តព្រះសីហនុ';

  function _getPlace() {
    try {
      const v = localStorage.getItem(PLACE_KEY);
      return v === null ? PLACE_DEFAULT : v;
    } catch (e) { return PLACE_DEFAULT; }
  }
  function _setPlace(v) {
    try { localStorage.setItem(PLACE_KEY, v); } catch (e) {}
  }

  function _showDetail(y, m, d) {
    _selectedDate = { y, m, d };
    _renderCalendar();

    const dt = new Date(y, m, d);
    const panel = document.getElementById('cal-detail');
    const content = document.getElementById('cal-detail-content');
    if (!panel || !content) return;

    const lang = I18n.getLang();
    const khDate = KC.khmerDates(dt);
    const grDate = KC.gDates(dt);
    const lun = KC.getKhmerDayMonthFromGregorian(dt);
    const be = KC.computeBEYear(y, m + 1, lun.km, lun.kd);
    // Animal & Sak follow Apr 14 boundary; BE follows lunar Pisakh boundary
    const animal = KC.khmerYearAnimalFromBE(y, m + 1, d);
    const sak = KC.sakNameFromAD(y, m + 1, d);
    const kMonthName = KC.khmerMonthNameFromKm(lun.km);
    const kdDisp = lun.kd <= 15 ? lun.kd : lun.kd - 15;
    const dow = dt.getDay();

    const cn = CC.fromDate(dt);
    const cnLine = cn ? `农历${cn.monthName}${cn.dayName} | ${cn.stemBranch}年【${cn.animal}】` : '';

    const T = I18n.translations;
    const enWeekday = dt.toLocaleDateString('en-US', { weekday: 'long' });
    const kmWeekday = 'ថ្ងៃ' + KC.KD7[dow];
    const waxLabel = lun.kd <= 15 ? I18n.t('waxing') : I18n.t('waning');
    const isToday = new Date().toDateString() === dt.toDateString();

    // Title weekday in the UI language; the small line under the big number
    // repeats it in a second language, as on a printed tear-off calendar.
    let weekday, weekdayAlt, yearStrip, monthStrip;
    if (lang === 'km') {
      weekday = kmWeekday;
      weekdayAlt = enWeekday;
      yearStrip = `ឆ្នាំ${animal} ${sak} ព.ស. ${KC.khmerNumber(be)}`;
      monthStrip = `${T.en.gregMonths[m]} ${y}`;
    } else {
      weekday = lang === 'zh' ? '星期' + I18n.weekday(dow) : enWeekday;
      weekdayAlt = kmWeekday;
      yearStrip = `${animal} ${sak} · ${I18n.t('bePrefix')} ${be}`;
      monthStrip = `${T.km.gregMonths[m]} ${KC.khmerNumber(y)}`;
    }

    const place = _getPlace().trim();
    const shareText = [khDate, cnLine, grDate].filter(Boolean).join('\n');
    const canShare = typeof navigator.share === 'function';

    content.innerHTML = `
      <div class="dhead-strip">
        <span>${escapeHtml(yearStrip)}</span>
        <span class="dhead-strip-month">${escapeHtml(monthStrip)}</span>
      </div>
      <div class="dhead">
        <div class="dhead-col">
          <div class="dhead-label">${escapeHtml(I18n.t('lunarCal'))}</div>
          <div class="dhead-month dhead-month--lunar">${escapeHtml(kMonthName)}</div>
          <div class="dhead-num">${_num(kdDisp)}</div>
          <div class="dhead-sub">${escapeHtml(waxLabel)}</div>
        </div>
        <div class="dhead-col dhead-mid">
          ${isToday ? `<div class="dhead-today">${escapeHtml(I18n.t('today'))}</div>` : ''}
          <div class="dhead-weekday">${escapeHtml(weekday)}</div>
          <div class="dhead-big">${d}</div>
          <div class="dhead-weekday-alt${lang === 'km' ? ' dhead-weekday-alt--latin' : ''}">${escapeHtml(weekdayAlt)}</div>
        </div>
        <div class="dhead-col">
          <div class="dhead-label">${escapeHtml(I18n.t('solarCal'))}</div>
          <div class="dhead-month">${escapeHtml(I18n.gregMonth(m))}</div>
          <div class="dhead-num">${_num(d)}</div>
          <div class="dhead-sub">${_num(y)}</div>
        </div>
      </div>
      ${_renderDayEvents(dt, lang)}
      ${_sheetSection(I18n.t('dayInfo'), `
        ${_copyRow(I18n.t('lunarCal'), khDate)}
        ${cnLine ? _copyRow(I18n.t('chineseCal'), cnLine, 'detail-chinese') : ''}
        ${_copyRow(I18n.t('solarCal'), grDate)}
        ${place ? _copyRow(I18n.t('place'), place + ', ' + grDate, 'detail-place') : ''}
        <div class="dinfo-actions">
          <button type="button" class="detail-copy-btn dinfo-action" data-copy="${escapeHtml(shareText)}"
                  aria-label="${escapeHtml(I18n.t('copy'))}" title="${escapeHtml(I18n.t('copy'))}">${_ICON_COPY}</button>
          ${canShare ? `<button type="button" class="detail-share-btn dinfo-action" data-share="${escapeHtml(shareText)}"
                  aria-label="${escapeHtml(I18n.t('share'))}" title="${escapeHtml(I18n.t('share'))}">${_ICON_SHARE}</button>` : ''}
        </div>`)}
      ${_renderUpcoming(dt, lang)}
      ${_renderDailyBlock(dt, lang)}
    `;

    panel.classList.add('open');
  }

  function _hideDetail() {
    const panel = document.getElementById('cal-detail');
    if (panel) panel.classList.remove('open');
    _selectedDate = null;
    _renderCalendar();
  }

  // === Month/Year Picker ===
  function _openPicker() {
    _pickerView = 'months';
    _pickerYear = _year;
    _renderPicker();
  }

  function _closePicker() {
    _pickerView = 'closed';
    const overlay = document.getElementById('cal-picker-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function _renderPicker() {
    const overlay = document.getElementById('cal-picker-overlay');
    const panel = document.getElementById('cal-picker-panel');
    if (!overlay || !panel) return;

    const today = new Date();
    const todayY = today.getFullYear();
    const todayM = today.getMonth();
    const lang = I18n.getLang();

    if (_pickerView === 'months') {
      let cells = '';
      for (let m = 0; m < 12; m++) {
        const isCur = (m === _month && _pickerYear === _year);
        const isNow = (m === todayM && _pickerYear === todayY);
        const primary = lang === 'km' ? KC.ADM12[m] : I18n.monthShort(m);
        const secondary = lang === 'km' ? I18n.gregMonthShort(m) : KC.ADM12[m];
        cells += `<div class="pick-cell${isCur ? ' selected' : ''}${isNow ? ' today' : ''}" data-action="pick-month" data-m="${m}">`
          + `<div class="pick-cell-km">${primary}</div>`
          + `<div class="pick-cell-en">${secondary}</div>`
          + `</div>`;
      }
      const yearLabel = lang === 'km'
        ? `${_pickerYear} | ${KC.khmerNumber(_pickerYear)}`
        : `${_pickerYear} | ${KC.khmerNumber(_pickerYear)}`;
      panel.innerHTML = `
        <div class="pick-header">
          <button class="pick-nav" data-action="pick-year-prev">&#9664;</button>
          <span class="pick-year-label" data-action="show-years">${yearLabel}</span>
          <button class="pick-nav" data-action="pick-year-next">&#9654;</button>
        </div>
        <div class="pick-grid pick-grid-months">${cells}</div>
      `;
    } else if (_pickerView === 'years') {
      const base = _yearPageBase;
      let cells = '';
      for (let i = 0; i < 12; i++) {
        const y = base + i;
        const isCur = (y === _year);
        const isNow = (y === todayY);
        cells += `<div class="pick-cell${isCur ? ' selected' : ''}${isNow ? ' today' : ''}" data-action="pick-year" data-y="${y}">`
          + `<div class="pick-cell-km">${lang === 'km' ? KC.khmerNumber(y) : y}</div>`
          + `<div class="pick-cell-en">${lang === 'km' ? y : KC.khmerNumber(y)}</div>`
          + `</div>`;
      }
      panel.innerHTML = `
        <div class="pick-header">
          <button class="pick-nav" data-action="year-page-prev">&#9664;</button>
          <span class="pick-year-label" data-action="show-months" title="Back to months">${base} - ${base + 11}</span>
          <button class="pick-nav" data-action="year-page-next">&#9654;</button>
        </div>
        <div class="pick-grid pick-grid-years">${cells}</div>
      `;
    }

    overlay.classList.add('open');
  }

  function _handlePickerClick(e) {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'pick-month') {
      _month = +el.dataset.m;
      _year = _pickerYear;
      _selectedDate = null;
      _closePicker();
      _renderCalendar();
    } else if (action === 'show-years') {
      _pickerView = 'years';
      _yearPageBase = _pickerYear - 5;
      _renderPicker();
    } else if (action === 'show-months') {
      _pickerView = 'months';
      _renderPicker();
    } else if (action === 'pick-year') {
      _pickerYear = +el.dataset.y;
      _pickerView = 'months';
      _renderPicker();
    } else if (action === 'pick-year-prev') {
      _pickerYear--;
      _renderPicker();
    } else if (action === 'pick-year-next') {
      _pickerYear++;
      _renderPicker();
    } else if (action === 'year-page-prev') {
      _yearPageBase -= 12;
      _renderPicker();
    } else if (action === 'year-page-next') {
      _yearPageBase += 12;
      _renderPicker();
    }
  }

  // === Navigation ===
  function _nav(dir) {
    _month += dir;
    if (_month > 11) { _month = 0; _year++; }
    if (_month < 0) { _month = 11; _year--; }
    _selectedDate = null;
    const panel = document.getElementById('cal-detail');
    if (panel) panel.classList.remove('open');
    _renderCalendar();
  }

  function _goToday() {
    const today = new Date();
    _year = today.getFullYear();
    _month = today.getMonth();
    _selectedDate = null;
    _renderCalendar();
    _showDetail(today.getFullYear(), today.getMonth(), today.getDate());
  }

  // === Touch swipe ===
  let _touchStartX = 0;
  let _touchStartY = 0;

  function _onTouchStart(e) {
    _touchStartX = e.touches[0].clientX;
    _touchStartY = e.touches[0].clientY;
  }

  function _onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - _touchStartX;
    const dy = e.changedTouches[0].clientY - _touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) _nav(-1);
      else _nav(1);
    }
  }

  function _attachDetailSwipe(panel) {
    let startY = 0, currentY = 0, tracking = false;
    panel.addEventListener('touchstart', (e) => {
      // The sheet scrolls now; only a pull-down from the very top closes it.
      if (!panel.classList.contains('open') || panel.scrollTop > 0) return;
      startY = e.touches[0].clientY;
      currentY = startY;
      tracking = true;
    }, { passive: true });
    panel.addEventListener('touchmove', (e) => {
      if (!tracking) return;
      currentY = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', () => {
      if (!tracking) return;
      tracking = false;
      if (currentY - startY > 80) _hideDetail();
    }, { passive: true });
  }

  // === Settings Panel ===
  function _initSettings() {
    const settingsBtn  = document.getElementById('cal-settings-btn');
    const menuOverlay  = document.getElementById('cal-settings-menu-overlay');
    const overlay      = document.getElementById('cal-settings-overlay');
    const aboutOverlay = document.getElementById('cal-about-overlay');

    // Stamp the current app version into the About panel
    const versionEl = document.getElementById('settings-app-version');
    if (versionEl) versionEl.textContent = APP_VERSION;

    // Helper: close every settings-style overlay, then open one
    const _openOnly = (el) => {
      [menuOverlay, overlay, aboutOverlay].forEach(o => o && o.classList.remove('open'));
      if (el) el.classList.add('open');
    };

    // Footer gear opens the chooser menu (Settings / About)
    if (settingsBtn) settingsBtn.addEventListener('click', () => _openOnly(menuOverlay));

    // Menu entries open their own popup panel
    const openSettings = document.getElementById('open-settings-popup');
    const openAbout    = document.getElementById('open-about-popup');
    if (openSettings) openSettings.addEventListener('click', () => _openOnly(overlay));
    if (openAbout)    openAbout.addEventListener('click', () => _openOnly(aboutOverlay));

    // Close buttons + backdrop taps for each overlay.
    // Closing Settings or About steps back to the chooser menu; closing the
    // menu itself dismisses everything (back to the calendar).
    [
      ['settings-menu-close', menuOverlay, null],
      ['settings-close',      overlay,      menuOverlay],
      ['about-close',         aboutOverlay, menuOverlay],
    ].forEach(([closeId, ov, back]) => {
      const close = () => { if (back) _openOnly(back); else ov.classList.remove('open'); };
      const btn = document.getElementById(closeId);
      if (btn && ov) btn.addEventListener('click', close);
      if (ov) ov.addEventListener('click', (e) => {
        if (e.target === ov) close();
      });
    });

    // Events overlay
    const eventsBtn     = document.getElementById('cal-events-btn');
    const eventsOverlay = document.getElementById('cal-events-overlay');
    const eventsClose   = document.getElementById('events-overlay-close');
    const eventsPrev    = document.getElementById('events-year-prev');
    const eventsNext    = document.getElementById('events-year-next');
    if (eventsBtn && eventsOverlay) {
      eventsBtn.addEventListener('click', () => {
        _eventsYear = new Date().getFullYear();
        _renderEventsList();
        eventsOverlay.classList.add('open');
        _scrollEventsToToday();
      });
    }
    const eventsToday = document.getElementById('events-today');
    if (eventsToday) {
      eventsToday.addEventListener('click', () => {
        _eventsYear = new Date().getFullYear();
        _renderEventsList();
        _scrollEventsToToday();
      });
    }
    const eventsListEl = document.getElementById('events-list');
    // After a year or filter change: the current year opens at today, any
    // other year at January.
    const _resetEventsScroll = () => {
      if (_eventsYear === new Date().getFullYear()) _scrollEventsToToday();
      else if (eventsListEl) eventsListEl.scrollTop = 0;
    };
    const eventsChips = document.getElementById('events-chips');
    if (eventsChips) {
      eventsChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.ev-chip');
        if (!chip || chip.dataset.filter === _eventsFilter) return;
        _eventsFilter = chip.dataset.filter;
        _renderEventsList();
        _resetEventsScroll();
      });
    }
    // Tapping an event jumps the calendar to that day and opens its sheet
    if (eventsListEl && eventsOverlay) {
      eventsListEl.addEventListener('click', (e) => {
        const row = e.target.closest('.ev-row');
        if (!row) return;
        eventsOverlay.classList.remove('open');
        _year = +row.dataset.y;
        _month = +row.dataset.m;
        _showDetail(_year, _month, +row.dataset.d);
      });
    }
    if (eventsClose && eventsOverlay) {
      eventsClose.addEventListener('click', () => eventsOverlay.classList.remove('open'));
    }
    if (eventsOverlay) {
      eventsOverlay.addEventListener('click', (e) => {
        if (e.target === eventsOverlay) eventsOverlay.classList.remove('open');
      });
    }
    if (eventsPrev) eventsPrev.addEventListener('click', () => { _eventsYear--; _renderEventsList(); _resetEventsScroll(); });
    if (eventsNext) eventsNext.addEventListener('click', () => { _eventsYear++; _renderEventsList(); _resetEventsScroll(); });

    // Weather overlay
    const weatherBtn     = document.getElementById('cal-weather-btn');
    const weatherOverlay = document.getElementById('cal-weather-overlay');
    const weatherClose   = document.getElementById('weather-overlay-close');
    if (weatherBtn && weatherOverlay) {
      weatherBtn.addEventListener('click', () => {
        _openWeather();
      });
    }
    if (weatherClose && weatherOverlay) {
      weatherClose.addEventListener('click', () => weatherOverlay.classList.remove('open'));
    }
    if (weatherOverlay) {
      weatherOverlay.addEventListener('click', (e) => {
        if (e.target === weatherOverlay) weatherOverlay.classList.remove('open');
      });
    }
    const wxSelect = document.getElementById('weather-city-select');
    if (wxSelect) wxSelect.addEventListener('change', () => {
      if (!WX) return;
      const city = WX.findCity(wxSelect.value);
      if (city) {
        WX.setLocation({ kind: 'city', id: city.id, name: WX.cityName(city, I18n.getLang()), lat: city.lat, lon: city.lon });
        _loadWeather();
      }
    });
    const wxGpsBtn = document.getElementById('weather-gps-btn');
    if (wxGpsBtn) wxGpsBtn.addEventListener('click', _useGpsLocation);

    // Theme toggle
    const themeGroup = document.getElementById('theme-toggle');
    if (themeGroup) {
      // Set initial active
      _setActiveToggle(themeGroup, '[data-theme="' + I18n.getTheme() + '"]');
      themeGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-theme]');
        if (!btn) return;
        I18n.setTheme(btn.dataset.theme);
        _setActiveToggle(themeGroup, '[data-theme="' + btn.dataset.theme + '"]');
      });
    }

    // Language toggle
    const langGroup = document.getElementById('lang-toggle');
    if (langGroup) {
      _setActiveToggle(langGroup, '[data-lang="' + I18n.getLang() + '"]');
      langGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-lang]');
        if (!btn) return;
        I18n.setLang(btn.dataset.lang);
        _setActiveToggle(langGroup, '[data-lang="' + btn.dataset.lang + '"]');
        // Pending reminders on iOS carry finished text, so a language change
        // has to rewrite them; Android words each one as it fires and ignores
        // this.
        if (typeof Reminders !== 'undefined') Reminders.syncSchedule();
        _refreshAll();
      });
    }
    // Start day toggle
    const startGroup = document.getElementById('startday-toggle');
    const placeInput = document.getElementById('place-input');
    if (placeInput) {
      placeInput.value = _getPlace();
      placeInput.addEventListener('input', () => {
        _setPlace(placeInput.value);
        // Refresh the open sheet so the row tracks the field as it is typed.
        if (_selectedDate) _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
      });
    }

    if (startGroup) {
      _setActiveToggle(startGroup, '[data-start="' + I18n.getStartDay() + '"]');
      startGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-start]');
        if (!btn) return;
        I18n.setStartDay(btn.dataset.start);
        _setActiveToggle(startGroup, '[data-start="' + btn.dataset.start + '"]');
        _refreshAll();
      });
    }

    _initReminders();

    // ថ្ងៃសីល markers on/off
    const silGroup = document.getElementById('sil-toggle');
    if (silGroup) {
      _setActiveToggle(silGroup, '[data-sil="' + (I18n.getSilDays() ? 'on' : 'off') + '"]');
      silGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-sil]');
        if (!btn) return;
        I18n.setSilDays(btn.dataset.sil === 'on');
        _setActiveToggle(silGroup, '[data-sil="' + btn.dataset.sil + '"]');
        _refreshAll();
      });
    }
  }

  /**
   * Reminder switches and the two times.
   *
   * Nothing is scheduled from here — the native side re-reads these settings
   * when the app is next opened or backgrounded, which is why there is no
   * "apply" step. The whole block stays hidden where no native scheduler
   * exists, rather than offering switches that would do nothing.
   */
  function _initReminders() {
    const section = document.getElementById('reminders-section');
    if (!section || typeof Reminders === 'undefined') return;
    if (!Reminders.isSupported()) return;

    section.hidden = false;
    Reminders.syncToNative();

    [['notif-daily', 'daily'], ['notif-sil', 'sil'], ['notif-holiday', 'holiday']]
      .forEach(([id, which]) => {
        const box = document.getElementById(id);
        if (!box) return;
        box.checked = Reminders.isOn(which);
        box.addEventListener('change', () => Reminders.setOn(which, box.checked));
      });

    [['notif-morning-time', 'morning'], ['notif-evening-time', 'evening']]
      .forEach(([id, which]) => {
        const input = document.getElementById(id);
        if (!input) return;
        input.value = Reminders.getTime(which);
        // 'change' rather than 'input': a time field reports every partial edit,
        // and half of "07:00" is a different alarm.
        input.addEventListener('change', () => {
          Reminders.setTime(which, input.value);
          input.value = Reminders.getTime(which);
        });
      });
  }

  function _setActiveToggle(group, selector) {
    group.querySelectorAll('.settings-toggle').forEach(b => b.classList.remove('active'));
    const active = group.querySelector(selector);
    if (active) active.classList.add('active');
  }

  function _refreshAll() {
    I18n.updateStaticTexts();
    _renderWeekdays();
    _renderCalendar();
    if (_selectedDate) {
      _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
    }
  }

  // ===== Women's Health Tracker UI =====

  function _initHealth() {
    if (!HT) return;
    const toggle  = document.getElementById('health-toggle');
    const body    = document.getElementById('health-body');
    const select  = document.getElementById('health-profile-select');
    if (!toggle || !body || !select) return;

    // Footer button opens the Health overlay
    const healthBtn     = document.getElementById('cal-health-btn');
    const healthOverlay = document.getElementById('cal-health-overlay');
    const healthClose   = document.getElementById('health-overlay-close');
    if (healthBtn && healthOverlay) {
      healthBtn.addEventListener('click', () => healthOverlay.classList.add('open'));
    }
    if (healthClose && healthOverlay) {
      healthClose.addEventListener('click', () => healthOverlay.classList.remove('open'));
    }
    if (healthOverlay) {
      healthOverlay.addEventListener('click', (e) => {
        if (e.target === healthOverlay) healthOverlay.classList.remove('open');
      });
    }

    function refresh() {
      const s = HT.getSettings();
      toggle.checked = !!s.enabled;
      body.hidden = !s.enabled;
      _refreshHealthProfileSelect();
      _refreshHealthSummary();
      _refreshPeriodHistory();
    }

    toggle.addEventListener('change', () => {
      const willEnable = toggle.checked;
      HT.setSettings({ enabled: willEnable });
      // Auto-create "Me" profile on first enable so the user has somewhere to log
      if (willEnable && HT.getProfiles().length === 0) {
        const meta = HT.addProfile(I18n.t('myProfile') || 'Me');
        HT.setActiveProfile(meta.id);
      }
      refresh();
      _renderCalendar();
    });

    select.addEventListener('change', () => {
      HT.setActiveProfile(select.value);
      _refreshHealthSummary();
      _refreshPeriodHistory();
      _renderCalendar();
      if (_selectedDate) _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
    });

    document.getElementById('health-log-period-btn').addEventListener('click', () => _openLogPeriodModal(null));
    document.getElementById('health-manage-profiles-btn').addEventListener('click', _openProfilesModal);
    document.getElementById('health-log-close').addEventListener('click', _closeLogPeriodModal);
    document.getElementById('health-log-cancel').addEventListener('click', _closeLogPeriodModal);
    document.getElementById('health-log-save').addEventListener('click', _saveLogPeriod);
    document.getElementById('health-profiles-close').addEventListener('click', _closeProfilesModal);
    document.getElementById('health-add-profile-btn').addEventListener('click', _addProfilePrompt);
    const resetBtn = document.getElementById('health-reset-all-btn');
    if (resetBtn) resetBtn.addEventListener('click', _resetAllHealthData);

    // Close modals when clicking outside the panel
    ['health-log-overlay', 'health-profiles-overlay'].forEach(id => {
      const o = document.getElementById(id);
      if (o) o.addEventListener('click', (e) => { if (e.target === o) o.classList.remove('open'); });
    });

    refresh();
  }

  function _refreshHealthProfileSelect() {
    if (!HT) return;
    const select = document.getElementById('health-profile-select');
    if (!select) return;
    const s = HT.getSettings();
    const profiles = HT.getProfiles();
    select.innerHTML = profiles.map(p =>
      `<option value="${escapeHtml(p.id)}"${p.id === s.activeProfileId ? ' selected' : ''}>${escapeHtml(p.name)}</option>`
    ).join('');
    if (profiles.length === 0) {
      select.innerHTML = `<option value="">${escapeHtml(I18n.t('noProfiles') || '— no profile —')}</option>`;
    }
  }

  function _refreshHealthSummary() {
    if (!HT) return;
    const el = document.getElementById('health-summary');
    if (!el) return;
    const s = HT.getSettings();
    const profile = HT.getActiveProfile();
    if (!profile) { el.innerHTML = ''; return; }
    const cycle = HT.getEffectiveCycleLength(profile);
    const period = HT.getEffectivePeriodLength(profile);
    const periods = profile.periods || [];
    const last = periods.length ? periods[periods.length - 1].start : null;
    el.innerHTML = `
      <div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('cycleLength') || 'Cycle')}</span>
        <span class="health-summary-val">~${cycle} ${escapeHtml(I18n.t('days') || 'days')}</span>
      </div>
      <div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('periodLength') || 'Period')}</span>
        <span class="health-summary-val">~${period} ${escapeHtml(I18n.t('days') || 'days')}</span>
      </div>
      ${last ? `<div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('lastPeriod') || 'Last period')}</span>
        <span class="health-summary-val">${escapeHtml(last)}</span>
      </div>` : ''}
    `;
  }

  // When non-null, identifies the existing period (by its start date) being
  // edited. The save handler deletes the old entry first so changing the
  // start date doesn't leave a duplicate behind.
  let _editingPeriodStart = null;

  function _openLogPeriodModal(existing) {
    if (!HT) return;
    const profile = HT.getActiveProfile();
    if (!profile) {
      _toast(I18n.t('createProfileFirst') || 'Create a profile first');
      return;
    }
    _editingPeriodStart = existing ? existing.start : null;
    const startEl = document.getElementById('health-log-start');
    const endEl   = document.getElementById('health-log-end');
    if (existing) {
      if (startEl) startEl.value = existing.start;
      if (endEl)   endEl.value   = existing.end || '';
    } else {
      const today = new Date();
      if (startEl) startEl.value = HT._ymd(today);
      if (endEl)   endEl.value   = '';
    }
    const overlay = document.getElementById('health-log-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function _closeLogPeriodModal() {
    _editingPeriodStart = null;
    const overlay = document.getElementById('health-log-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function _saveLogPeriod() {
    if (!HT) return;
    const startEl = document.getElementById('health-log-start');
    const endEl   = document.getElementById('health-log-end');
    const profile = HT.getActiveProfile();
    if (!profile || !startEl || !startEl.value) return;
    // If editing and the start date changed, remove the old entry first
    if (_editingPeriodStart && _editingPeriodStart !== startEl.value) {
      HT.deletePeriod(profile.id, _editingPeriodStart);
    }
    HT.logPeriod(profile.id, startEl.value, endEl && endEl.value ? endEl.value : null);
    _closeLogPeriodModal();
    _refreshHealthSummary();
    _refreshPeriodHistory();
    _renderCalendar();
    if (_selectedDate) _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
  }

  function _refreshPeriodHistory() {
    if (!HT) return;
    const el = document.getElementById('health-period-history');
    if (!el) return;
    const profile = HT.getActiveProfile();
    if (!profile) { el.innerHTML = ''; return; }
    const periods = (profile.periods || []).slice().sort((a, b) => b.start.localeCompare(a.start));
    if (!periods.length) {
      el.innerHTML = `<div class="health-period-empty">${escapeHtml(I18n.t('noPeriodsLogged') || 'No periods logged yet.')}</div>`;
      return;
    }
    const editLabel   = I18n.t('edit')   || 'Edit';
    const deleteLabel = I18n.t('delete') || 'Delete';
    // Show last 12 entries — enough for a full year of cycles
    el.innerHTML = periods.slice(0, 12).map(p => `
      <div class="health-period-row" data-start="${escapeHtml(p.start)}" data-end="${escapeHtml(p.end || '')}">
        <span class="health-period-dot"></span>
        <span class="health-period-dates">${escapeHtml(p.start)}${p.end ? '  →  ' + escapeHtml(p.end) : ''}</span>
        <button type="button" class="health-period-action" data-action="edit"   aria-label="${escapeHtml(editLabel)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button type="button" class="health-period-action health-period-action--danger" data-action="delete" aria-label="${escapeHtml(deleteLabel)}">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>
    `).join('');
    el.querySelectorAll('.health-period-action').forEach(btn => {
      btn.addEventListener('click', _onPeriodHistoryAction);
    });
  }

  function _onPeriodHistoryAction(e) {
    if (!HT) return;
    const btn = e.currentTarget;
    const row = btn.closest('.health-period-row');
    if (!row) return;
    const start  = row.dataset.start;
    const end    = row.dataset.end || null;
    const action = btn.dataset.action;
    const profile = HT.getActiveProfile();
    if (!profile) return;

    if (action === 'edit') {
      _openLogPeriodModal({ start, end });
    } else if (action === 'delete') {
      if (window.confirm(I18n.t('confirmDeletePeriod') || 'Delete this period entry?')) {
        HT.deletePeriod(profile.id, start);
        _refreshPeriodHistory();
        _refreshHealthSummary();
        _renderCalendar();
        if (_selectedDate) _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
      }
    }
  }

  function _resetAllHealthData() {
    if (!HT) return;
    const msg = I18n.t('confirmResetAll') || 'Reset ALL women\'s health data (profiles + logs)? This cannot be undone.';
    if (!window.confirm(msg)) return;
    // Delete all profiles, then disable the feature so the user starts clean
    HT.getProfiles().forEach(p => HT.deleteProfile(p.id));
    HT.setSettings({ enabled: false, activeProfileId: null });
    // Refresh UI
    const toggle = document.getElementById('health-toggle');
    if (toggle) toggle.checked = false;
    const body = document.getElementById('health-body');
    if (body) body.hidden = true;
    _refreshHealthProfileSelect();
    _refreshHealthSummary();
    _refreshPeriodHistory();
    _renderCalendar();
    if (_selectedDate) _showDetail(_selectedDate.y, _selectedDate.m, _selectedDate.d);
  }

  function _openProfilesModal() {
    if (!HT) return;
    _refreshProfilesList();
    const overlay = document.getElementById('health-profiles-overlay');
    if (overlay) overlay.classList.add('open');
  }

  function _closeProfilesModal() {
    const overlay = document.getElementById('health-profiles-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function _refreshProfilesList() {
    if (!HT) return;
    const list = document.getElementById('health-profiles-list');
    if (!list) return;
    const profiles = HT.getProfiles();
    if (!profiles.length) {
      list.innerHTML = `<div class="health-profile-empty">${escapeHtml(I18n.t('noProfilesYet') || 'No profiles yet — add one below.')}</div>`;
      return;
    }
    const activeId = HT.getSettings().activeProfileId;
    const renameLabel = I18n.t('rename') || 'Rename';
    const deleteLabel = I18n.t('delete') || 'Delete';
    list.innerHTML = profiles.map(p => `
      <div class="health-profile-item${p.id === activeId ? ' is-active' : ''}" data-profile-id="${escapeHtml(p.id)}">
        <span class="health-profile-dot" style="background:${escapeHtml(p.color || '#ff6b9d')}"></span>
        <span class="health-profile-name">${escapeHtml(p.name)}</span>
        <button type="button" class="health-profile-action" data-action="rename">${escapeHtml(renameLabel)}</button>
        <button type="button" class="health-profile-action" data-action="delete">${escapeHtml(deleteLabel)}</button>
      </div>
    `).join('');
    list.querySelectorAll('.health-profile-action').forEach(btn => {
      btn.addEventListener('click', _onProfileAction);
    });
    list.querySelectorAll('.health-profile-item').forEach(item => {
      const id = item.dataset.profileId;
      item.addEventListener('click', (e) => {
        if (e.target.closest('.health-profile-action')) return;
        HT.setActiveProfile(id);
        _refreshHealthProfileSelect();
        _refreshHealthSummary();
        _refreshProfilesList();
        _renderCalendar();
      });
    });
  }

  function _onProfileAction(e) {
    if (!HT) return;
    const btn = e.currentTarget;
    const item = btn.closest('.health-profile-item');
    if (!item) return;
    const id = item.dataset.profileId;
    const action = btn.dataset.action;

    if (action === 'rename') {
      const current = (HT.getProfile(id) || {}).name || '';
      const name = window.prompt(I18n.t('renameProfilePrompt') || 'New name:', current);
      if (name && name.trim()) {
        HT.renameProfile(id, name.trim());
        _refreshProfilesList();
        _refreshHealthProfileSelect();
      }
    } else if (action === 'delete') {
      if (window.confirm(I18n.t('confirmDeleteProfile') || 'Delete this profile and all its data?')) {
        HT.deleteProfile(id);
        _refreshProfilesList();
        _refreshHealthProfileSelect();
        _refreshHealthSummary();
        _renderCalendar();
      }
    }
  }

  function _addProfilePrompt() {
    if (!HT) return;
    const name = window.prompt(I18n.t('newProfilePrompt') || 'Profile name:', '');
    if (name && name.trim()) {
      const meta = HT.addProfile(name.trim());
      HT.setActiveProfile(meta.id);
      _refreshProfilesList();
      _refreshHealthProfileSelect();
      _refreshHealthSummary();
      _renderCalendar();
    }
  }

  // === Init ===
  function init() {
    // Apply the saved language to every data-i18n element first — otherwise
    // users who saved language=en/zh in a previous session see Khmer fallback
    // text on first paint until they toggle language again.
    I18n.updateStaticTexts();
    _renderWeekdays();
    _renderCalendar();
    _initSettings();
    _initHealth();

    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) titleEl.addEventListener('click', _openPicker);
    // (Horizontal swipe to change month is already wired below via
    //  _onTouchStart / _onTouchEnd on the calendar grid.)

    const pickerOverlay = document.getElementById('cal-picker-overlay');
    if (pickerOverlay) {
      pickerOverlay.addEventListener('click', (e) => {
        if (e.target === pickerOverlay) { _closePicker(); return; }
        _handlePickerClick(e);
      });
    }

    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) todayBtn.addEventListener('click', _goToday);

    const todayFooter = document.getElementById('cal-today-footer');
    if (todayFooter) todayFooter.addEventListener('click', _goToday);

    // Copy the full Khmer date from the day detail sheet
    const detailContent = document.getElementById('cal-detail-content');
    if (detailContent) {
      detailContent.addEventListener('click', (e) => {
        const shareBtn = e.target.closest('.detail-share-btn');
        if (shareBtn) {
          e.stopPropagation();
          navigator.share({ text: shareBtn.dataset.share || '' }).catch(() => {});
          return;
        }
        const btn = e.target.closest('.detail-copy-btn');
        if (!btn) return;
        e.stopPropagation();
        _copyText(btn.dataset.copy || '');
      });
    }

    // Tapping an event opens that day's detail sheet
    const monthEventsBody = document.getElementById('month-events-body');
    if (monthEventsBody) {
      monthEventsBody.addEventListener('click', (e) => {
        const row = e.target.closest('.events-row');
        if (!row || row.dataset.d === undefined) return;
        _showDetail(_year, +row.dataset.m, +row.dataset.d);
      });
    }

    const grid = document.getElementById('cal-grid');
    if (grid) {
      grid.addEventListener('click', (e) => {
        const cell = e.target.closest('.cal-cell');
        if (!cell) return;
        const y = +cell.dataset.y, m = +cell.dataset.m, d = +cell.dataset.d;
        _showDetail(y, m, d);
      });
      grid.addEventListener('touchstart', _onTouchStart, { passive: true });
      grid.addEventListener('touchend', _onTouchEnd, { passive: true });
    }

    // Tap the detail-panel drag handle to dismiss
    const detail = document.getElementById('cal-detail');
    if (detail) {
      const handle = detail.querySelector('.cal-detail-handle');
      if (handle) handle.addEventListener('click', _hideDetail);
      _attachDetailSwipe(detail);
    }

    // Click outside the detail sheet closes it — except on the controls that
    // open it (a day cell, an event row, the Today buttons), or the same tap
    // would open and immediately close the sheet.
    document.addEventListener('click', (e) => {
      const d = document.getElementById('cal-detail');
      if (d && d.classList.contains('open')) {
        if (!d.contains(e.target) && !e.target.closest('.cal-cell, .events-row, .ev-row, #cal-today-footer, #cal-today-btn')) {
          _hideDetail();
        }
      }
    });
    // Detail sheet stays closed on first load — opens only when user taps a day
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { _nav, _goToday };
})();
