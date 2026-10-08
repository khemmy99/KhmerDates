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
  const APP_VERSION = '1.5.6';

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

    // Collapse consecutive same-id rows into spans. A festival whose last
    // days are a public holiday (Pchum Ben) splits where that starts, so
    // the rest days get their own row and filter as days off.
    const collapsed = [];
    for (const r of rows) {
      const prev = collapsed[collapsed.length - 1];
      const sameRun = prev && prev.id === r.id && prev.isPublic === r.isPublic;
      if (sameRun && r.month === prev.endMonth) {
        // check day continuity (within same month)
        const prevDate = new Date(year, prev.endMonth, prev.endDay);
        const thisDate = new Date(year, r.month, r.day);
        const oneDay = (thisDate - prevDate) / 86400000;
        if (oneDay === 1) { prev.endDay = r.day; prev.endMonth = r.month; continue; }
      }
      // Or continuity across month boundary (e.g. Pchum Ben spans Sep→Oct)
      if (sameRun) {
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

    // Everything that touches this month, including a festival that began
    // the month before (Pchum Ben runs Sep -> Oct)
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    _monthFilter = _renderChipRow(document.getElementById('month-events-chips'), _monthFilter);
    const rows = _collectEventRows(year, lang).filter(r => r.start <= last && r.end >= first)
      .concat(_periodRowsFor(year, month))
      .filter(r => _matchFilter(r, _monthFilter))
      .sort((a, b) => a.start - b.start);

    // The extra "today" row repeats a festival already counted
    const count = rows.filter(r => !r.isTodayRow).length;
    if (countEl) countEl.textContent = count ? _num(count) : '';

    if (!rows.length) {
      bodyEl.innerHTML = `<div class="month-events-empty">${escapeHtml(I18n.t('noEvents'))}</div>`;
      return;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    bodyEl.innerHTML = _eventRowsHtml(rows, today, lang, month);
  }

  // ----- ផ្សំផ្គុំកូនប្រុសស្រី (inside the health panel) -----
  const BG = (typeof BabyGender !== 'undefined') ? BabyGender : null;
  const MOTHER_BIRTH_KEY = 'kh-cal-mother-birth';
  let _babyCheck = null; // conception date being checked (YYYY-MM-DD)
  let _babyNameGender = null; // 'B' | 'G' — follows the prediction until picked
  let _babyNameQuery = '';
  const BABY_FAVS_KEY = 'kh-cal-baby-favs';
  const BABY_ORIGIN_KEY = 'kh-cal-baby-origin';
  const CHILD_BIRTH_KEY = 'kh-cal-child-birth';
  const CHILD_NIGHT_KEY = 'kh-cal-child-night';
  let _babyMatchDay = true;
  const _lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } };
  const _lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };

  /** The child's birth-day letter group, or null when no birth date is set. */
  function _childGroup() {
    const b = _lsGet(CHILD_BIRTH_KEY, '');
    if (!b || !BG) return null;
    return BG.lettersFor(_parseYmd(b), _lsGet(CHILD_NIGHT_KEY, '0') === '1');
  }
  const _ORIGIN_KEYS = { km: 'originKm', zh: 'originZh', ja: 'originJa', ko: 'originKo', eu: 'originEu' };
  let _babyNameOrigin = (() => { try { return localStorage.getItem(BABY_ORIGIN_KEY) || 'km'; } catch (e) { return 'km'; } })();
  // Favourites are stored as "origin:name"; a bare name is from the Khmer list
  const _favKey = n => _babyNameOrigin + ':' + n;
  function _getBabyFavs() { try { return JSON.parse(localStorage.getItem(BABY_FAVS_KEY) || '[]'); } catch (e) { return []; } }
  function _setBabyFavs(a) { try { localStorage.setItem(BABY_FAVS_KEY, JSON.stringify(a)); } catch (e) { /* private mode */ } }

  /** Name cards for the chosen origin and gender, favourites first, filtered by the search box. */
  function _renderBabyNames() {
    const el = document.getElementById('baby-names-list');
    if (!el || !BG) return;
    const lang = I18n.getLang();
    const favs = _getBabyFavs().map(f => (f.includes(':') ? f : 'km:' + f));
    const isFav = n => favs.includes(_favKey(n.name));
    const q = _babyNameQuery.trim().toLowerCase();
    const group = _childGroup();
    const suits = n => group && BG.suits(_babyNameOrigin === 'km' ? n.name : n.sound, group);
    const list = BG.names(_babyNameOrigin, _babyNameGender || 'B')
      .filter(n => !q || [n.name, n.latin, n.sound, n.km, n.en].some(x => x && x.toLowerCase().includes(q)))
      .filter(n => !group || !_babyMatchDay || suits(n))
      .sort((a, b) => isFav(b) - isFav(a));
    document.querySelectorAll('.baby-name-tab').forEach(t => t.classList.toggle('is-active', t.dataset.g === (_babyNameGender || 'B')));
    document.querySelectorAll('.baby-origin').forEach(t => t.classList.toggle('is-active', t.dataset.origin === _babyNameOrigin));
    el.innerHTML = list.length ? list.map(n => {
      const fav = isFav(n);
      // Second line: how to read it — Latin spelling, plus the Khmer
      // pronunciation in the Khmer UI
      const read = [n.latin, lang === 'km' ? n.sound : ''].filter(Boolean).join(' · ');
      return `<button type="button" class="baby-name${fav ? ' is-fav' : ''}${suits(n) ? ' is-suited' : ''}" data-name="${escapeHtml(n.name)}" aria-pressed="${fav}">
        <span class="baby-name-km">${escapeHtml(n.name)}</span>
        ${read ? `<span class="baby-name-latin">${escapeHtml(read)}</span>` : ''}
        <span class="baby-name-mean">${escapeHtml(lang === 'km' ? n.km : n.en)}</span>
        <span class="baby-name-star" aria-hidden="true">${fav ? '★' : '☆'}</span>
      </button>`;
    }).join('') : `<div class="baby-empty">${escapeHtml(I18n.t(group && _babyMatchDay && !q ? 'noMatchLetters' : 'babyNoMatch'))}</div>`;
  }

  const _ymdOf = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const _parseYmd = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); };
  function _getMotherBirth() { try { return localStorage.getItem(MOTHER_BIRTH_KEY) || ''; } catch (e) { return ''; } }
  function _setMotherBirth(v) { try { localStorage.setItem(MOTHER_BIRTH_KEY, v); } catch (e) { /* private mode */ } }

  // ----- Date picker: one calendar for every date field in the baby tab -----
  const _ICON_CAL_SM = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/></svg>';
  let _dp = null; // { y, m, sel, mode: 'days'|'months'|'years', base, min, max, onPick }

  /** A button showing the date (or a prompt); opens the picker. */
  function _dateField(id, ymd) {
    return `<button type="button" class="dp-field${ymd ? '' : ' is-empty'}" data-date="${id}">
      <span>${escapeHtml(ymd ? _fmtYmd(ymd, true) : I18n.t('pickDate'))}</span>${_ICON_CAL_SM}
    </button>`;
  }

  /**
   * Parse a typed date: day/month/year in Khmer or Latin digits, any
   * separator (/ - . space), or eight digits run together (ddmmyyyy).
   * A two-digit year means 19xx from 50 up, else 20xx.
   * Returns 'YYYY-MM-DD', or '' when it is not a real date.
   */
  function _parseTypedDate(text) {
    const latin = String(text).replace(/[០-៩]/g, c => String(c.charCodeAt(0) - 0x17E0));
    let parts = latin.split(/[^0-9]+/).filter(Boolean);
    if (parts.length === 1 && parts[0].length === 8) parts = [parts[0].slice(0, 2), parts[0].slice(2, 4), parts[0].slice(4)];
    if (parts.length !== 3) return '';
    const d = +parts[0], m = +parts[1];
    let y = +parts[2];
    if (parts[2].length <= 2) y += y >= 50 ? 1900 : 2000;
    if (parts[2].length === 3 || m < 1 || m > 12 || d < 1) return '';
    const dt = new Date(y, m - 1, d);
    return dt.getMonth() === m - 1 && dt.getDate() === d ? _ymdOf(dt) : '';
  }

  /** dd/mm/yyyy in the UI's digits, for the type-in box. */
  function _typedText(ymd) {
    if (!ymd) return '';
    const [y, m, d] = ymd.split('-');
    const t = `${d}/${m}/${y}`;
    return I18n.getLang() === 'km' ? t.replace(/[0-9]/g, n => KC.khmerNumber(+n)) : t;
  }

  function _openDatePick(opts) {
    const start = opts.value ? _parseYmd(opts.value) : (opts.initial || new Date());
    _dp = { y: start.getFullYear(), m: start.getMonth(), sel: opts.value || '', mode: 'days',
            base: start.getFullYear() - 5, min: opts.min, max: opts.max, onPick: opts.onPick };
    const panel = document.getElementById('date-pick-panel');
    panel.innerHTML = `<div class="dp-type">
        <input type="text" id="dp-input" inputmode="numeric" autocomplete="off" spellcheck="false"
               placeholder="${escapeHtml(I18n.t('dpTypeHint'))}" value="${escapeHtml(_typedText(_dp.sel))}" aria-label="${escapeHtml(I18n.t('dpTypeHint'))}">
        <button type="button" class="dp-ok" data-dp="ok">${escapeHtml(I18n.t('dpOk'))}</button>
      </div>
      <div class="dp-msg" id="dp-msg" aria-live="polite"></div>
      <div id="dp-body"></div>`;
    _renderDatePick();
    document.getElementById('date-pick-overlay').classList.add('open');
  }

  /** Typing moves the calendar to the date; returns the date or ''. */
  function _onDateTyped(confirm) {
    if (!_dp) return '';
    const input = document.getElementById('dp-input');
    const msg = document.getElementById('dp-msg');
    const raw = input ? input.value.trim() : '';
    const ymd = _parseTypedDate(raw);
    let err = '';
    if (raw && !ymd) err = confirm || raw.replace(/[^0-9\u17E0-\u17E9]/g, '').length >= 6 ? I18n.t('dpInvalid') : '';
    else if (ymd && (_parseYmd(ymd) < _dp.min || _parseYmd(ymd) > _dp.max)) err = I18n.t('dpOutOfRange');
    if (msg) msg.textContent = err;
    if (input) input.classList.toggle('is-bad', !!err);
    if (ymd && !err) {
      const d = _parseYmd(ymd);
      _dp.y = d.getFullYear(); _dp.m = d.getMonth(); _dp.sel = ymd; _dp.mode = 'days';
      _renderDatePick();
      return ymd;
    }
    return '';
  }

  function _closeDatePick() {
    const ov = document.getElementById('date-pick-overlay');
    if (ov) ov.classList.remove('open');
    _dp = null;
  }

  function _renderDatePick() {
    const el = document.getElementById('dp-body');
    if (!el || !_dp) return;
    const lang = I18n.getLang();
    const minY = _dp.min.getFullYear(), maxY = _dp.max.getFullYear();
    const chev = d => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
    const head = (title, prevOk, nextOk) => `<div class="dp-head">
        <button type="button" class="hl-nav" data-dp="prev"${prevOk ? '' : ' disabled'} aria-label="Previous">${chev('M15 18l-6-6 6-6')}</button>
        <button type="button" class="dp-title" data-dp="title">${escapeHtml(title)}${_dp.mode === 'days' ? chev('m6 9 6 6 6-6') : ''}</button>
        <button type="button" class="hl-nav" data-dp="next"${nextOk ? '' : ' disabled'} aria-label="Next">${chev('M9 18l6-6-6-6')}</button>
      </div>`;
    let body = '', title = '', prevOk = true, nextOk = true;

    if (_dp.mode === 'years') {
      title = `${_num(_dp.base)} – ${_num(_dp.base + 11)}`;
      prevOk = _dp.base > minY; nextOk = _dp.base + 11 < maxY;
      for (let y = _dp.base; y < _dp.base + 12; y++) {
        const off = y < minY || y > maxY;
        body += `<button type="button" class="dp-cell${y === _dp.y ? ' is-sel' : ''}${off ? ' is-off' : ''}" data-dp-year="${y}"${off ? ' disabled' : ''}>${_num(y)}</button>`;
      }
      body = `<div class="dp-grid3">${body}</div>`;
    } else if (_dp.mode === 'months') {
      title = _num(_dp.y);
      prevOk = _dp.y > minY; nextOk = _dp.y < maxY;
      for (let m = 0; m < 12; m++) {
        const off = new Date(_dp.y, m + 1, 0) < _dp.min || new Date(_dp.y, m, 1) > _dp.max;
        body += `<button type="button" class="dp-cell${m === _dp.m ? ' is-sel' : ''}${off ? ' is-off' : ''}" data-dp-month="${m}"${off ? ' disabled' : ''}>${escapeHtml(lang === 'km' ? I18n.gregMonth(m) : I18n.gregMonthShort(m))}</button>`;
      }
      body = `<div class="dp-grid3">${body}</div>`;
    } else {
      title = lang === 'zh' ? `${_dp.y}年${_dp.m + 1}月` : `${I18n.gregMonth(_dp.m)} ${_num(_dp.y)}`;
      prevOk = new Date(_dp.y, _dp.m, 1) > _dp.min;
      nextOk = new Date(_dp.y, _dp.m + 1, 1) <= _dp.max;
      const T = I18n.translations[lang] || I18n.translations.km;
      const order = I18n.getStartDay() === 'sun' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
      const todayYmd = _ymdOf(new Date());
      body = order.map(d => `<span class="dp-wd${d === 0 ? ' is-sun' : ''}">${escapeHtml(T.weekdaysShort[d])}</span>`).join('');
      body += '<span></span>'.repeat((new Date(_dp.y, _dp.m, 1).getDay() - order[0] + 7) % 7);
      for (let d = 1, n = new Date(_dp.y, _dp.m + 1, 0).getDate(); d <= n; d++) {
        const dt = new Date(_dp.y, _dp.m, d), ymd = _ymdOf(dt);
        const off = dt < _dp.min || dt > _dp.max;
        const cls = ['dp-day', ymd === _dp.sel ? 'is-sel' : '', ymd === todayYmd ? 'is-today' : '', off ? 'is-off' : '', dt.getDay() === 0 ? 'is-sun' : ''].filter(Boolean).join(' ');
        body += `<button type="button" class="${cls}" data-dp-day="${ymd}"${off ? ' disabled' : ''}><span>${_num(d)}</span></button>`;
      }
      body = `<div class="dp-days">${body}</div>`;
    }
    el.innerHTML = head(title, prevOk, nextOk) + body +
      `<div class="dp-foot"><button type="button" class="cal-modal-btn" data-dp="cancel">${escapeHtml(I18n.t('cancel'))}</button></div>`;
    // Language may have changed while open: keep the type-in row's words current
    const input = document.getElementById('dp-input');
    if (input) input.placeholder = I18n.t('dpTypeHint');
    const ok = document.querySelector('.dp-ok');
    if (ok) ok.textContent = I18n.t('dpOk');
  }

  function _onDatePickClick(e) {
    if (!_dp) return;
    const t = e.target.closest('[data-dp], [data-dp-day], [data-dp-month], [data-dp-year]');
    if (!t || t.disabled) return;
    if (t.dataset.dpDay) { const cb = _dp.onPick, v = t.dataset.dpDay; _closeDatePick(); cb(v); return; }
    if (t.dataset.dpMonth) { _dp.m = +t.dataset.dpMonth; _dp.mode = 'days'; return _renderDatePick(); }
    if (t.dataset.dpYear) { _dp.y = +t.dataset.dpYear; _dp.mode = 'months'; return _renderDatePick(); }
    const act = t.dataset.dp;
    if (act === 'cancel') return _closeDatePick();
    if (act === 'ok') {
      const v = _onDateTyped(true) || (!document.getElementById('dp-input').value.trim() && _dp.sel);
      if (v) { const cb = _dp.onPick; _closeDatePick(); cb(v); }
      return;
    }
    if (act === 'title') {
      _dp.mode = _dp.mode === 'days' ? 'years' : 'days';
      _dp.base = _dp.y - 5;
      return _renderDatePick();
    }
    const dir = act === 'next' ? 1 : -1;
    if (_dp.mode === 'years') _dp.base += 12 * dir;
    else if (_dp.mode === 'months') _dp.y += dir;
    else { const d = new Date(_dp.y, _dp.m + dir, 1); _dp.y = d.getFullYear(); _dp.m = d.getMonth(); }
    _renderDatePick();
  }

  const _ICON_MALE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10" cy="14" r="6"/><path d="M14.5 9.5 20 4M15 4h5v5"/></svg>';
  const _ICON_FEMALE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"/><path d="M12 15v7M8.5 18.5h7"/></svg>';
  const _babyPill = g => g === 'B'
    ? `<span class="baby-pill baby-pill--boy">${_ICON_MALE}${escapeHtml(I18n.t('babyBoy'))}</span>`
    : `<span class="baby-pill baby-pill--girl">${_ICON_FEMALE}${escapeHtml(I18n.t('babyGirl'))}</span>`;

  function _renderBaby() {
    const el = document.getElementById('health-baby');
    if (!el || !BG) return;
    const now = new Date();
    const birth = _getMotherBirth();
    if (!_babyCheck) _babyCheck = _ymdOf(now);
    const fill = (k, o) => Object.keys(o).reduce((t, x) => t.replace('{' + x + '}', o[x]), I18n.t(k));

    let result = `<div class="baby-empty">${escapeHtml(I18n.t('babyNeedBirth'))}</div>`;
    let plan = '';
    if (birth) {
      const r = BG.predict(_parseYmd(birth), _parseYmd(_babyCheck));
      if (!_babyNameGender && r.gender) _babyNameGender = r.gender;
      result = r.gender
        ? `<div class="baby-result">${_babyPill(r.gender)}
             <div class="baby-meta">${escapeHtml(fill('babyAgeMonth', { age: _num(r.age), month: _num(r.month) }))}</div></div>`
        : `<div class="baby-empty">${escapeHtml(I18n.t('babyOutOfChart'))} · ${escapeHtml(fill('babyAgeMonth', { age: _num(r.age), month: _num(r.month) }))}</div>`;

      // Next 12 lunar months, with the tracker's fertile days when it is on
      const tracking = HT && HT.isEnabled() && HT.getActiveProfile();
      const fmt = d => `${_num(d.getDate())} ${I18n.getLang() === 'km' ? I18n.gregMonth(d.getMonth()) : I18n.gregMonthShort(d.getMonth())}`;
      plan = BG.planMonths(_parseYmd(birth), now, 12).map(m => {
        let fertile = '';
        if (tracking) {
          let fs = null, fe = null;
          for (let d = new Date(m.start); d <= m.end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
            const k = HT.getDayInfo(d).kind;
            if (k === 'fertile' || k === 'ovulation') { fs = fs || d; fe = d; }
          }
          if (fs) fertile = `<span class="baby-fertile">${_ICON_BABY} ${fmt(fs)}–${fmt(fe)}</span>`;
        }
        return `<div class="baby-row${m.gender ? ' baby-row--' + (m.gender === 'B' ? 'boy' : 'girl') : ''}">
          <span class="baby-m">${escapeHtml(fill('babyLunarMonth', { n: _num(m.month) }))}${m.isLeap ? '*' : ''}<small>${escapeHtml(m.monthName)}</small></span>
          <span class="baby-range">${fmt(m.start)} – ${fmt(m.end)}${fertile}</span>
          ${m.gender ? _babyPill(m.gender) : '<span class="baby-pill">—</span>'}
        </div>`;
      }).join('');
    }

    el.innerHTML = `
      <div class="settings-section">
        <div class="baby-title">${escapeHtml(I18n.t('babyTitle'))}</div>
        <div class="baby-intro">${escapeHtml(I18n.t('babyIntro'))}</div>
      </div>
      <div class="settings-section">
        <div class="settings-label">${escapeHtml(I18n.t('motherBirth'))}</div>
        ${_dateField('birth', birth)}
      </div>
      <div class="settings-section">
        <div class="settings-label">${escapeHtml(I18n.t('conceptionDate'))}</div>
        ${_dateField('check', _babyCheck)}
        ${result}
      </div>
      <div class="settings-section">
        <div class="settings-label">${escapeHtml(I18n.t('babyNames'))}</div>
        ${(() => {
          const birthChild = _lsGet(CHILD_BIRTH_KEY, '');
          const g = _childGroup();
          const dayName = g ? (I18n.getLang() === 'km' ? 'ថ្ងៃ' + KC.KD7[g.dow]
            : I18n.getLang() === 'zh' ? '星期' + I18n.weekday(g.dow)
            : new Date(2026, 9, 11 + g.dow).toLocaleDateString('en-US', { weekday: 'long' })) : '';
          const letters = g ? (g.key === 0 ? g.letters.join(' ') + ' …' : g.letters.join(' ')) : '';
          return `<div class="baby-sub">${escapeHtml(I18n.t('childBirth'))}</div>
            ${_dateField('child', birthChild)}
            ${g && g.dow === 3 ? `<label class="baby-check"><input type="checkbox" id="baby-wed-night"${g.key === 'wedNight' ? ' checked' : ''}> ${escapeHtml(I18n.t('wedNight'))}</label>` : ''}
            ${g ? `<div class="baby-letters"><span>${escapeHtml(I18n.t('dayLetters').replace('{day}', dayName))}</span><b>${escapeHtml(letters)}</b></div>
              <label class="baby-check"><input type="checkbox" id="baby-match-day"${_babyMatchDay ? ' checked' : ''}> ${escapeHtml(I18n.t('matchBirthday'))}</label>`
              : `<div class="baby-hint">${escapeHtml(I18n.t('childBirthHint'))}</div>`}`;
        })()}
        <div class="baby-origins">${BG.ORIGINS.map(o => `<button type="button" class="baby-origin" data-origin="${o}">${escapeHtml(I18n.t(_ORIGIN_KEYS[o]))}</button>`).join('')}</div>
        <div class="baby-name-tabs">
          <button type="button" class="baby-name-tab baby-name-tab--boy" data-g="B">${_ICON_MALE}${escapeHtml(I18n.t('babyBoy'))}</button>
          <button type="button" class="baby-name-tab baby-name-tab--girl" data-g="G">${_ICON_FEMALE}${escapeHtml(I18n.t('babyGirl'))}</button>
        </div>
        <input type="search" class="baby-name-search" id="baby-name-search" placeholder="${escapeHtml(I18n.t('babySearch'))}" value="${escapeHtml(_babyNameQuery)}" autocomplete="off" spellcheck="false">
        <div class="baby-hint">${escapeHtml(I18n.t('babyNamesHint'))}</div>
        <div class="baby-names" id="baby-names-list"></div>
      </div>
      ${plan ? `<div class="settings-section">
        <div class="settings-label">${escapeHtml(I18n.t('babyPlan'))}</div>
        <div class="baby-hint">${escapeHtml(I18n.t('babyPlanHint'))}</div>
        <div class="baby-plan">${plan}</div>
      </div>` : ''}
      <div class="settings-section"><div class="health-privacy-note">${escapeHtml(I18n.t('babyNote'))}</div></div>`;
    _renderBabyNames();
  }

  function _setHealthTab(tab) {
    document.querySelectorAll('.health-tab').forEach(b => {
      const on = b.dataset.healthTab === tab;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-selected', String(on));
    });
    document.querySelectorAll('.health-tab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.healthPanel === tab));
    if (tab === 'baby') _renderBaby();
  }

  // ----- Events page -----
  const _ICON_GRID  = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/></svg>';

  let _eventsFilter = 'all'; // 'all' | 'public' | 'observance' | 'sil' | 'cycle'
  let _monthFilter = 'all';  // same values, for the card under the grid

  const _CYCLE_KINDS = ['period', 'predicted', 'fertile', 'ovulation'];
  const _matchFilter = (r, f) => f === 'all' || (f === 'cycle' ? _CYCLE_KINDS.includes(r.kind) : r.kind === f);

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
          const range = ev.endMonth === ev.startMonth
            ? `${_num(ev.startDay)}–${_num(ev.endDay)}`
            : `${_num(ev.startDay)} ${I18n.gregMonthShort(ev.startMonth)} – ${_num(ev.endDay)} ${I18n.gregMonthShort(ev.endMonth)}`;
          sub += ` · ${range} (${_num(span)} ${I18n.t('days')})`;
        }
        rows.push({ start, end, kind: ev.isPublic ? 'public' : 'observance',
                    name: ev.entry[lang] || ev.entry.km || '', sub, key: ev.id });
      }
    }

    // A festival that began before today and is still running also gets a
    // row on today's date ("day 11/16"), so the list shows at a glance that
    // today is part of it. The original row then drops its Today marker.
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (today.getFullYear() === year) {
      const todays = HL.getByDate(today) || [];
      for (const r of rows.slice()) {
        if (!(r.start <= today && r.end >= today && r.end > r.start)) continue;
        const h = todays.find(x => (x.id || (x.km + '|' + x.en)) === r.key);
        const n = h && h.dayOfFestival ? h.dayOfFestival : Math.round((today - r.start) / 86400000) + 1;
        const t = h && h.totalDays ? h.totalDays : Math.round((r.end - r.start) / 86400000) + 1;
        const dayPart = I18n.t('dayOfN').replace('{n}', _num(n)).replace('{t}', _num(t));
        // Starting today: its own row is already on today, so it just gains
        // the day count
        if (r.start.getTime() === today.getTime()) { r.sub += ' · ' + dayPart; continue; }
        rows.push({ start: today, end: today, kind: r.kind, name: r.name,
                    sub: I18n.t(r.kind === 'public' ? 'publicHoliday' : 'observanceDay') + ' · ' + dayPart,
                    isTodayRow: true });
        r.hasTodayRow = true;
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

  const _ICON_DROP = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.7c3.5 4.3 6 7.6 6 10.8a6 6 0 0 1-12 0c0-3.2 2.5-6.5 6-10.8z"/></svg>';
  const _ICON_BABY = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12h.01"/><path d="M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/></svg>';
  const _ICON_OVUM = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>';
  const _EVENT_ICONS = () => ({ public: _ICON_DAYOFF, observance: _ICON_FLAG, sil: _ICON_SIL,
                                period: _ICON_DROP, predicted: _ICON_DROP,
                                fertile: _ICON_BABY, ovulation: _ICON_OVUM });

  /**
   * Cycle-tracker rows for the month card: one per logged period and one per
   * predicted period that touches the month. Runs are found day by day from
   * HT.getDayInfo, scanning ten days either side so a run crossing the month
   * edge keeps its real start, end and length.
   */
  function _periodRowsFor(year, month) {
    return _cycleRows(new Date(year, month, 1), new Date(year, month + 1, 0));
  }

  /**
   * Cycle-tracker rows touching [from, to]: logged and predicted periods, the
   * fertile window and the ovulation day. Runs come from HT.getDayInfo,
   * scanned ten days past each end so a run crossing the edge keeps its real
   * dates. A run under way today carries "day n/t": on its own row when it
   * starts today, otherwise on an extra row on today's date.
   */
  function _cycleRows(from, to) {
    if (!HT || !HT.isEnabled() || !HT.getActiveProfile()) return [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    // Ovulation sits inside the fertile window, so it counts toward the
    // window's run and also gets a row of its own
    const runKind = k => k === 'period' ? 'period' : k === 'predicted-period' ? 'predicted'
                       : (k === 'fertile' || k === 'ovulation') ? 'fertile' : null;
    const runs = [];
    let run = null;
    const stop = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 10);
    for (let d = new Date(from.getFullYear(), from.getMonth(), from.getDate() - 10); d <= stop;
         d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
      const k = HT.getDayInfo(d).kind;
      if (k === 'ovulation') runs.push({ kind: 'ovulation', start: d, end: d });
      const kind = runKind(k);
      if (run && kind === run.kind) { run.end = d; continue; }
      if (run) runs.push(run);
      run = kind ? { kind, start: d, end: d } : null;
    }
    if (run) runs.push(run);

    const NAME = { period: 'healthPeriod', predicted: 'healthPredictedPeriod',
                   fertile: 'healthFertile', ovulation: 'healthOvulation' };
    const out = [];
    for (const r of runs) {
      if (r.end < from || r.start > to) continue;
      const span = Math.round((r.end - r.start) / 86400000) + 1;
      let sub = '';
      if (span > 1) {
        const range = r.start.getMonth() === r.end.getMonth()
          ? `${_num(r.start.getDate())}–${_num(r.end.getDate())}`
          : `${_num(r.start.getDate())} ${I18n.gregMonthShort(r.start.getMonth())} – ${_num(r.end.getDate())} ${I18n.gregMonthShort(r.end.getMonth())}`;
        sub = `${range} (${_num(span)} ${I18n.t('days')})`;
      }
      // A period (logged or predicted) or fertile window gets one row per day, "day 1/6" to
      // "day 6/6", so every day of it reads in the list; the first also
      // gives the range. Repeats are flagged so the card's count stays one.
      if (span > 1 && (r.kind === 'period' || r.kind === 'predicted' || r.kind === 'fertile')) {
        for (let n = 1; n <= span; n++) {
          const day = new Date(r.start.getFullYear(), r.start.getMonth(), r.start.getDate() + n - 1);
          if (day < from || day > to) continue;
          const dayPart = I18n.t('dayOfN').replace('{n}', _num(n)).replace('{t}', _num(span));
          out.push({ start: day, end: day, kind: r.kind, name: I18n.t(NAME[r.kind]),
                     sub: n === 1 ? `${dayPart} · ${sub}` : dayPart, isTodayRow: n > 1 });
        }
        continue;
      }
      const row = { start: r.start, end: r.end, kind: r.kind, name: I18n.t(NAME[r.kind]), sub };
      out.push(row);
      if (span > 1 && r.start <= today && r.end >= today) {
        const n = Math.round((today - r.start) / 86400000) + 1;
        const dayPart = I18n.t('dayOfN').replace('{n}', _num(n)).replace('{t}', _num(span));
        if (n === 1) {
          row.sub += ' · ' + dayPart;
        } else if (today >= from && today <= to) {
          out.push({ start: today, end: today, kind: r.kind, name: row.name, isTodayRow: true, sub: dayPart });
          row.hasTodayRow = true;
        }
      }
    }
    return out;
  }

  /**
   * One event row. The small label over the day number is the weekday, or
   * the month when the event started outside refMonth (so "២៧" under the
   * October card reads as 27 September, not 27 October).
   */
  /** Render rows in order; a row on the same date as the one before it is a
   *  continuation: its date is hidden and the Today badge shown once. */
  function _eventRowsHtml(rows, today, lang, refMonth) {
    return rows.map((r, i) => _eventRowHtml(r, today, lang, refMonth,
      i > 0 && rows[i - 1].start.getTime() === r.start.getTime())).join('');
  }

  function _eventRowHtml(r, today, lang, refMonth, sameDay) {
    const dow = r.start.getDay();
    const label = r.start.getMonth() !== refMonth
      ? I18n.gregMonthShort(r.start.getMonth())
      : lang === 'km' ? KC.KD7[dow] : lang === 'zh' ? '周' + I18n.weekday(dow) : I18n.weekday(dow);
    const isToday = !r.hasTodayRow && today >= r.start && today <= r.end;
    const timeCls = (isToday ? ' ev-row--today' : r.end < today ? ' ev-row--past' : '') +
                    (sameDay ? ' ev-row--cont' : '');
    return `<div class="ev-row ev-row--${r.kind}${timeCls}" data-y="${r.start.getFullYear()}" data-m="${r.start.getMonth()}" data-d="${r.start.getDate()}">
      <div class="ev-date">
        <span class="ev-wd">${escapeHtml(label)}</span>
        <span class="ev-day">${_num(r.start.getDate())}</span>
      </div>
      <span class="ev-icon">${_EVENT_ICONS()[r.kind]}</span>
      <div class="ev-body">
        <div class="ev-name">${escapeHtml(r.name)}</div>
        <div class="ev-sub">${escapeHtml(r.sub)}</div>
      </div>
      ${isToday && !sameDay ? `<span class="ev-today-badge">${escapeHtml(I18n.t('today'))}</span>` : ''}
    </div>`;
  }

  /** Fill a chip row and return the filter, reset to 'all' if its chip is gone. */
  function _renderChipRow(el, current) {
    if (!el) return current;
    const chips = [
      ['all', 'filterAll', _ICON_GRID],
      ['public', 'filterPublic', _ICON_DAYOFF],
      ['observance', 'chipObservance', _ICON_FLAG],
    ];
    if (I18n.getSilDays()) chips.push(['sil', 'chipSil', _ICON_SIL]);
    if (HT && HT.isEnabled() && HT.getActiveProfile()) chips.push(['cycle', 'healthPeriod', _ICON_DROP]);
    if (!chips.some(c => c[0] === current)) current = 'all';
    el.classList.toggle('ev-chips--five', chips.length > 4);
    el.innerHTML = chips.map(([id, key, icon]) =>
      `<button type="button" class="ev-chip ev-chip--${id}${id === current ? ' is-active' : ''}" data-filter="${id}">
        <span class="ev-chip-icon">${icon}</span>${escapeHtml(I18n.t(key))}
      </button>`).join('');
    return current;
  }

  function _renderEventChips() {
    _eventsFilter = _renderChipRow(document.getElementById('events-chips'), _eventsFilter);
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

    const cycle = _cycleRows(new Date(_eventsYear, 0, 1), new Date(_eventsYear, 11, 31))
      .filter(r => r.start.getFullYear() === _eventsYear);  // grouped by start month below
    const rows = _collectEventRows(_eventsYear, lang).concat(cycle)
      .sort((a, b) => a.start - b.start)
      .filter(r => _matchFilter(r, _eventsFilter));

    const sections = [];
    for (let m = 0; m < 12; m++) {
      const inMonth = rows.filter(r => r.start.getMonth() === m);
      if (!inMonth.length) continue;

      // Lunar month(s) the Gregorian month spans, as on the grid header
      const lastDay = new Date(_eventsYear, m + 1, 0).getDate();
      const km1 = KC.getKhmerDayMonthFromGregorian(new Date(_eventsYear, m, 1)).km;
      const km2 = KC.getKhmerDayMonthFromGregorian(new Date(_eventsYear, m, lastDay)).km;
      const lunarMonths = KC.khmerMonthNameFromKm(km1) + (km2 !== km1 ? ' · ' + KC.khmerMonthNameFromKm(km2) : '');

      const items = _eventRowsHtml(inMonth, today, lang, m);

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

  /** Scroll the events page to today's row, or else the next upcoming one. */
  function _scrollEventsToToday() {
    const listEl = document.getElementById('events-list');
    if (!listEl) return;
    const next = listEl.querySelector('.ev-row--today') || listEl.querySelector('.ev-row:not(.ev-row--past)');
    if (!next) { listEl.scrollTop = 0; return; }
    const head = next.parentElement.querySelector('.ev-month-head');
    // Land on the month header when the row opens its month; otherwise keep
    // the row just below the sticky header.
    listEl.scrollTop = next.previousElementSibling === head
      ? next.parentElement.offsetTop
      : next.offsetTop - (head ? head.offsetHeight : 0);
  }

  // ----- Day sheet sections -----
  // One line-icon set for holidays (calendar + heart), observances (flag) and
  // ថ្ងៃសីល (lotus). Shared by the day sheet and the events page; CSS sizes them.
  const _SVG_OPEN = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  const _ICON_DAYOFF = _SVG_OPEN + '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M8 2.5v4M16 2.5v4M3 9.5h18"/><path fill="currentColor" stroke-width="1.2" d="M12 18.6l-2.5-2.4a1.55 1.55 0 0 1 2.5-1.85 1.55 1.55 0 0 1 2.5 1.85z"/></svg>';
  const _ICON_FLAG = _SVG_OPEN + '<path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.33 2q2 0 3.07-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.53"/></svg>';
  const _ICON_SIL = _SVG_OPEN + '<path d="M12 21c-2.3-1.4-4-4-4-7.3 0-3.1 1.7-6 4-8.2 2.3 2.2 4 5.1 4 8.2 0 3.3-1.7 5.9-4 7.3z"/><path d="M12 21c-4.3 0-8.3-2.4-9.7-6.8 2.1-.7 4.3-.7 6.2.1"/><path d="M12 21c4.3 0 8.3-2.4 9.7-6.8-2.1-.7-4.3-.7-6.2.1"/><path d="M8.4 10.1C7 9 5.6 8.6 4.4 8.6c0 1.6.4 3.1 1.2 4.6"/><path d="M15.6 10.1C17 9 18.4 8.6 19.6 8.6c0 1.6-.4 3.1-1.2 4.6"/></svg>';

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
      const obs = h.observance === true;
      rows.push(_sheetRow(obs ? 'gold' : 'red', obs ? _ICON_FLAG : _ICON_DAYOFF, escapeHtml(HL.nameFor(h, lang))));
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
        const obs = h.observance === true;
        found.push(_sheetRow(obs ? 'gold' : 'red', obs ? _ICON_FLAG : _ICON_DAYOFF,
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

  // Calendar view: 'month' (grid + events card), 'full' (grid fills the
  // screen, event names in the cells), 'week' (7-day list), 'year' (12 months)
  const VIEWS = ['month', 'full', 'week', 'year'];
  const VIEW_KEY = 'kh-cal-view';
  let _view = (() => {
    try { const v = localStorage.getItem(VIEW_KEY); return VIEWS.includes(v) ? v : 'month'; }
    catch (e) { return 'month'; }
  })();
  let _lastMonthView = _view === 'full' ? 'full' : 'month'; // where a year-view tap lands
  let _weekAnchor = null; // a Date inside the week on screen; null = derive

  // === Number display: Khmer digits for km, normal for en/zh ===
  function _num(n) {
    return I18n.getLang() === 'km' ? KC.khmerNumber(n) : String(n);
  }

  // Gregorian day number in the grid and day sheet — follows its own
  // setting (1 2 3 / ១ ២ ៣), independent of the UI language
  function _gday(n) {
    return I18n.getDayDigits() === 'khmer' ? KC.khmerNumber(n) : String(n);
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

  // ===== Views =====
  const _VIEW_ICONS = {
    month: '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    full:  '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M3 9h18M3 15h18M9 9v12M15 9v12"/>',
    week:  '<rect x="3" y="4.5" width="18" height="16.5" rx="2.5"/><path d="M3 9.5h18M7 13.5h10M7 17h10"/>',
    year:  '<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>'
  };
  const _VIEW_KEYS = { month: 'viewMonth', full: 'viewFull', week: 'viewWeek', year: 'viewYear' };
  const _viewSvg = (v, size) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${_VIEW_ICONS[v]}</svg>`;

  function _setView(v) {
    if (!VIEWS.includes(v)) return;
    _view = v;
    if (v === 'month' || v === 'full') _lastMonthView = v;
    if (v === 'week') { _weekAnchor = null; const w = document.getElementById('cal-week'); if (w) delete w.dataset.week; }
    try { localStorage.setItem(VIEW_KEY, v); } catch (e) { /* private mode */ }
    _closeViewMenu();
    _renderCalendar();
  }

  function _renderViewButton() {
    const btn = document.getElementById('cal-view-btn');
    if (btn) {
      btn.innerHTML = _viewSvg(_view, 16) +
        `<span>${escapeHtml(I18n.t(_VIEW_KEYS[_view]))}</span>` +
        '<svg class="cal-view-chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>';
      btn.setAttribute('aria-label', I18n.t('viewLabel'));
    }
    const app = document.querySelector('.cal-app');
    if (app) VIEWS.forEach(v => app.classList.toggle('view-' + v, v === _view));
  }

  function _openViewMenu() {
    const btn = document.getElementById('cal-view-btn');
    const menu = document.getElementById('cal-view-menu');
    if (!btn || !menu) return;
    menu.innerHTML = VIEWS.map(v => `<button type="button" class="cal-view-item${v === _view ? ' is-active' : ''}" data-view="${v}" role="menuitemradio" aria-checked="${v === _view}">
        ${_viewSvg(v, 18)}<span>${escapeHtml(I18n.t(_VIEW_KEYS[v]))}</span>
        <svg class="cal-view-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
      </button>`).join('');
    const r = btn.getBoundingClientRect();
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.right = Math.round(document.documentElement.clientWidth - r.right) + 'px';
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
  }

  function _closeViewMenu() {
    const menu = document.getElementById('cal-view-menu');
    const btn = document.getElementById('cal-view-btn');
    if (menu) menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function _weekStartOf(d) {
    const first = I18n.getStartDay() === 'sun' ? 0 : 1;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() - first + 7) % 7));
  }

  function _weekdayName(dow) {
    const lang = I18n.getLang();
    return lang === 'km' ? KC.KD7[dow] : lang === 'zh' ? '周' + I18n.weekday(dow) : I18n.weekday(dow);
  }

  /** Each item a day carries in the week list: holidays, ថ្ងៃសីល, cycle day. */
  function _dayItems(dt, lun, lang) {
    const out = [];
    ((HL && HL.getByDate(dt)) || []).forEach(h => out.push({
      kind: h.observance === true ? 'observance' : 'public', text: HL.nameFor(h, lang)
    }));
    if (I18n.getSilDays()) {
      const sil = KC.silDayFromKhmer(lun.km, lun.kd, dt.getFullYear());
      if (sil) out.push({ kind: 'sil', text: _silLabel(sil) });
    }
    if (HT && HT.isEnabled() && HT.getActiveProfile()) {
      const info = HT.getDayInfo(dt);
      const dayN = n => ' · ' + (I18n.t('healthDayN') || 'Day {n}').replace('{n}', _num(n));
      if (info.kind === 'period') out.push({ kind: 'period', text: I18n.t('healthPeriod') + dayN(info.dayInPeriod) });
      else if (info.kind === 'predicted-period') out.push({ kind: 'predicted', text: I18n.t('healthPredictedPeriod') + dayN(info.dayInPeriod) });
      else if (info.kind === 'ovulation') out.push({ kind: 'ovulation', text: I18n.t('healthOvulation') });
      else if (info.kind === 'fertile') out.push({ kind: 'fertile', text: I18n.t('healthFertile') });
    }
    return out;
  }

  function _renderWeek() {
    const el = document.getElementById('cal-week');
    if (!el) return;
    const lang = I18n.getLang();
    const start = _weekStartOf(_weekAnchor);
    const todayStr = new Date().toDateString();
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const dow = d.getDay();
      const lun = KC.getKhmerDayMonthFromGregorian(d);
      const kd = lun.kd <= 15 ? lun.kd : lun.kd - 15;
      const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxing')) : (lang === 'km' ? KC.RK[1] : I18n.t('waning'));
      const lunar = lang === 'km'
        ? `${KC.khmerNumber(kd)} ${wax} ខែ${KC.khmerMonthNameFromKm(lun.km)}`
        : `${wax} ${kd} · ${KC.khmerMonthNameFromKm(lun.km)}`;
      const cn = CC.fromDate(d);
      const items = _dayItems(d, lun, lang);
      const icons = _EVENT_ICONS();
      const isSel = _selectedDate && _selectedDate.y === d.getFullYear() && _selectedDate.m === d.getMonth() && _selectedDate.d === d.getDate();
      const cls = ['wk-day',
        d.toDateString() === todayStr ? 'is-today' : '',
        isSel ? 'is-selected' : '',
        dow === 0 ? 'is-sun' : dow === 6 ? 'is-sat' : '',
        items.some(x => x.kind === 'public') ? 'is-holiday' : ''].filter(Boolean).join(' ');
      html += `<button type="button" class="${cls}" data-y="${d.getFullYear()}" data-m="${d.getMonth()}" data-d="${d.getDate()}">
        <span class="wk-date"><span class="wk-wd">${escapeHtml(_weekdayName(dow))}</span><span class="wk-num">${_gday(d.getDate())}</span></span>
        <span class="wk-main">
          <span class="wk-lunar">${escapeHtml(lunar)}${cn ? ` <span class="wk-cn">${escapeHtml(cn.cellText)}</span>` : ''}</span>
          ${items.map(x => `<span class="wk-ev ev-row--${x.kind}"><span class="wk-ic">${icons[x.kind]}</span><span class="wk-ev-text">${escapeHtml(x.text)}</span></span>`).join('')}
        </span>
      </button>`;
    }
    el.innerHTML = html;
    // A new week opens at today's row (or the top); re-renders of the same
    // week, e.g. after tapping a day, keep the scroll position
    const key = start.toDateString();
    if (el.dataset.week !== key) {
      el.dataset.week = key;
      const t = el.querySelector('.wk-day.is-today');
      el.scrollTop = t ? Math.max(0, t.offsetTop - el.offsetTop - 8) : 0;
    }
  }

  function _renderYear() {
    const el = document.getElementById('cal-year');
    if (!el) return;
    const lang = I18n.getLang();
    const T = I18n.translations[lang] || I18n.translations.km;
    const order = I18n.getStartDay() === 'sun' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];
    const now = new Date();
    const wd = order.map(d => `<span class="yr-wd${d === 0 ? ' is-sun' : ''}">${escapeHtml(T.weekdaysShort[d])}</span>`).join('');
    let html = '';
    for (let m = 0; m < 12; m++) {
      const lead = (new Date(_year, m, 1).getDay() - order[0] + 7) % 7;
      const days = new Date(_year, m + 1, 0).getDate();
      let cells = '<span></span>'.repeat(lead);
      for (let d = 1; d <= days; d++) {
        const dt = new Date(_year, m, d);
        const kind = HL ? HL.classifyDate(dt) : null;
        const cls = ['yr-d',
          kind === 'public' ? 'is-hol' : kind === 'observance' ? 'is-obs' : '',
          dt.getDay() === 0 ? 'is-sun' : '',
          dt.toDateString() === now.toDateString() ? 'is-today' : ''].filter(Boolean).join(' ');
        cells += `<span class="${cls}">${_gday(d)}</span>`;
      }
      const isCur = _year === now.getFullYear() && m === now.getMonth();
      html += `<button type="button" class="yr-month${isCur ? ' is-current' : ''}" data-m="${m}">
        <span class="yr-name">${escapeHtml(I18n.gregMonth(m))}</span>
        <span class="yr-grid">${wd}${cells}</span>
      </button>`;
    }
    el.innerHTML = html;
    el.classList.toggle('cal-year--km-digits', I18n.getDayDigits() === 'khmer');
  }

  /**
   * Full-month view: week rows of day cells with event bars laid over them.
   * A multi-day event is one bar across the days it covers (split at the
   * week edge); bars stack in lanes, and a "+n" note marks days with more
   * than fit. ថ្ងៃសីល and ovulation are small marks beside the day number.
   */
  const _FULL_LANES = 2; // thin strips at the foot of each square tile

  function _fullSegments(from, to, lang) {
    const segs = [];
    const years = new Set([from.getFullYear(), to.getFullYear()]);
    years.forEach(y => _collectEventRows(y, lang).forEach(r => {
      if (r.isTodayRow || r.kind === 'sil' || r.end < from || r.start > to) return;
      segs.push({ kind: r.kind, name: r.name, start: r.start, end: r.end });
    }));
    // Cycle runs straight from the tracker
    if (HT && HT.isEnabled() && HT.getActiveProfile()) {
      const runOf = k => k === 'period' ? 'period' : k === 'predicted-period' ? 'predicted'
                       : (k === 'fertile' || k === 'ovulation') ? 'fertile' : null;
      const NAME = { period: 'healthPeriod', predicted: 'healthPredictedPeriod', fertile: 'healthFertile' };
      let run = null;
      for (let d = new Date(from); d <= to; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
        const kind = runOf(HT.getDayInfo(d).kind);
        if (run && kind === run.kind) { run.end = d; continue; }
        if (run) segs.push(run);
        run = kind ? { kind, name: I18n.t(NAME[kind]), start: d, end: d } : null;
      }
      if (run) segs.push(run);
    }
    return segs;
  }

  function _renderFull() {
    const el = document.getElementById('cal-full');
    if (!el) return;
    const lang = I18n.getLang();
    const year = _year, month = _month;
    const order0 = I18n.getStartDay() === 'sun' ? 0 : 1;
    const lead = (new Date(year, month, 1).getDay() - order0 + 7) % 7;
    const first = new Date(year, month, 1 - lead);
    const days = new Date(year, month + 1, 0).getDate();
    const weeks = Math.ceil((lead + days) / 7);
    const last = new Date(first.getFullYear(), first.getMonth(), first.getDate() + weeks * 7 - 1);
    const segs = _fullSegments(first, last, lang);
    const todayStr = new Date().toDateString();
    const dayIdx = d => Math.round((d - first) / 86400000);

    let html = '';
    for (let w = 0; w < weeks; w++) {
      const w0 = w * 7, w1 = w0 + 6;
      // Segments clipped to this week, longest first, packed into lanes
      const parts = segs.map(sg => ({ sg, a: Math.max(dayIdx(sg.start), w0), b: Math.min(dayIdx(sg.end), w1) }))
        .filter(p => p.a <= p.b)
        .sort((x, y) => (x.a - y.a) || ((y.b - y.a) - (x.b - x.a)));
      const lanes = [];
      const hidden = new Array(7).fill(0);
      parts.forEach(p => {
        let lane = lanes.findIndex(end => end < p.a);
        if (lane === -1) { lane = lanes.length; lanes.push(-1); }
        lanes[lane] = p.b;
        p.lane = lane;
        if (lane >= _FULL_LANES) for (let i = p.a; i <= p.b; i++) hidden[i - w0]++;
      });

      let cells = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(first.getFullYear(), first.getMonth(), first.getDate() + w0 + i);
        const lun = KC.getKhmerDayMonthFromGregorian(d);
        const kd = lun.kd <= 15 ? lun.kd : lun.kd - 15;
        const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxingShort')) : (lang === 'km' ? KC.RK[1] : I18n.t('waningShort'));
        const dow = d.getDay();
        const kind = HL ? HL.classifyDate(d) : null;
        const sil = I18n.getSilDays() && KC.silDayFromKhmer(lun.km, lun.kd, d.getFullYear());
        const ovu = HT && HT.isEnabled() && HT.getActiveProfile() && HT.getDayInfo(d).kind === 'ovulation';
        const isSel = _selectedDate && _selectedDate.y === d.getFullYear() && _selectedDate.m === d.getMonth() && _selectedDate.d === d.getDate();
        const cls = ['fm-day',
          d.getMonth() !== month ? 'is-out' : '',
          d.toDateString() === todayStr ? 'is-today' : '',
          isSel ? 'is-selected' : '',
          dow === 0 || kind === 'public' ? 'is-red' : dow === 6 ? 'is-blue' : ''].filter(Boolean).join(' ');
        const marks = (sil ? `<i class="fm-mark fm-mark--sil${sil.major ? '' : ' is-minor'}"></i>` : '') +
                      (ovu ? '<i class="fm-mark fm-mark--ovu"></i>' : '');
        cells += `<button type="button" class="${cls}" data-y="${d.getFullYear()}" data-m="${d.getMonth()}" data-d="${d.getDate()}">
          <span class="fm-num">${_gday(d.getDate())}</span>
          <span class="fm-lunar">${_num(kd)} ${escapeHtml(wax)}</span>
          ${marks ? `<span class="fm-marks">${marks}</span>` : ''}
          ${hidden[i] ? `<span class="fm-more">+${_num(hidden[i])}</span>` : ''}
        </button>`;
      }
      const bars = parts.filter(p => p.lane < _FULL_LANES).map(p => {
        const cut = (dayIdx(p.sg.start) < p.a ? ' cut-l' : '') + (dayIdx(p.sg.end) > p.b ? ' cut-r' : '');
        return `<span class="fm-bar fm-bar--${p.sg.kind}${cut}" style="grid-column:${p.a - w0 + 1} / span ${p.b - p.a + 1};grid-row:${p.lane + 1}">${escapeHtml(p.sg.name)}</span>`;
      }).join('');
      html += `<div class="fm-week"><div class="fm-days">${cells}</div><div class="fm-bars">${bars}</div></div>`;
    }
    el.innerHTML = html;
  }

  // === Render main calendar grid ===
  function _renderCalendar() {
    _renderViewButton();
    let weekStart = null;
    if (_view === 'week') {
      if (!_weekAnchor) {
        const t = new Date();
        _weekAnchor = _selectedDate ? new Date(_selectedDate.y, _selectedDate.m, _selectedDate.d)
                    : (t.getFullYear() === _year && t.getMonth() === _month) ? t
                    : new Date(_year, _month, 1);
      }
      weekStart = _weekStartOf(_weekAnchor);
      _year = weekStart.getFullYear();
      _month = weekStart.getMonth();
    }
    const year = _year, month = _month;
    const today = new Date();
    const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();
    const lang = I18n.getLang();

    // Month title: month + year in the UI language, large, with the other two
    // calendars' month names on a small line under it.
    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) {
      const T = I18n.translations || {};
      const kmName = (T.km && T.km.gregMonths && T.km.gregMonths[month]) || '';
      const enName = (T.en && T.en.gregMonths && T.en.gregMonths[month]) || '';
      const zhName = (T.zh && T.zh.gregMonthsShort && T.zh.gregMonthsShort[month]) || '';
      let main, sub;
      if (lang === 'en')      { main = `${enName} ${year}`;  sub = `${kmName} · ${zhName}`; }
      else if (lang === 'zh') { main = `${year}年${zhName}`; sub = `${kmName} · ${enName}`; }
      else                    { main = `${kmName} ${KC.khmerNumber(year)}`; sub = `${enName} · ${zhName}`; }
      if (_view === 'year') {
        main = lang === 'km' ? `ឆ្នាំ ${KC.khmerNumber(year)}` : lang === 'zh' ? `${year}年` : String(year);
        sub  = lang === 'km' ? String(year) : `ឆ្នាំ ${KC.khmerNumber(year)}`;
      } else if (weekStart) {
        const end = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
        const mName = (mm) => lang === 'km' ? I18n.gregMonth(mm) : I18n.gregMonthShort(mm);
        sub = end.getMonth() === weekStart.getMonth()
          ? `${_num(weekStart.getDate())}–${_num(end.getDate())} ${mName(end.getMonth())}`
          : `${_num(weekStart.getDate())} ${mName(weekStart.getMonth())} – ${_num(end.getDate())} ${mName(end.getMonth())}`;
      }
      titleEl.innerHTML =
        `<span class="cal-title-main">${escapeHtml(main)}` +
        `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>` +
        `<span class="cal-title-sub">${escapeHtml(sub)}</span>`;
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
      const sep = '<span class="lunar-sep">·</span>';
      infoEl.innerHTML =
        '<svg class="lunar-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a6.5 6.5 0 0 0 11 11z"/></svg>' +
        `<span class="lunar-month">${escapeHtml(kmName)}</span>` + sep +
        `<span class="lunar-sak">${escapeHtml(sak)}</span>` + sep +
        `<span class="lunar-animal">${escapeHtml(animal)}</span>` + sep +
        `<span class="lunar-be">${escapeHtml(beText)}</span>`;
    }

    // Build grid
    const gridEl = document.getElementById('cal-grid');
    if (!gridEl) return;
    // Khmer digits run wider; the grid steps their size down to clear the
    // corner marks (see .cal-grid--km-digits)
    gridEl.classList.toggle('cal-grid--km-digits', I18n.getDayDigits() === 'khmer');

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
        ${sil.html}<span class="cal-gday">${_gday(d)}</span>
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
        ${sil.html}<span class="cal-gday">${_gday(d)}</span>
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
    if (_view === 'full') _renderFull();
    if (_view === 'week') _renderWeek();
    if (_view === 'year') _renderYear();

    _renderMonthEvents(year, month);

    // Today button — only shown when we're away from the current month.
    // The button is position:fixed, so the app also gets a class that reserves
    // room for it; otherwise it floats on top of the last row of days.
    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) {
      const onCurrentMonth = _view === 'year' ? year === todayY
        : _view === 'week' ? (today >= weekStart && today < new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 7))
        : (year === todayY && month === todayM);
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

  /**
   * Open the day sheet. opts.overEvents lifts it above the events page (which
   * stays open underneath) instead of sitting over the calendar.
   */
  function _showDetail(y, m, d, opts) {
    _selectedDate = { y, m, d };
    _renderCalendar();

    const dt = new Date(y, m, d);
    const panel = document.getElementById('cal-detail');
    const content = document.getElementById('cal-detail-content');
    if (!panel || !content) return;
    panel.classList.toggle('cal-detail--over-events', !!(opts && opts.overEvents));

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
          <div class="dhead-big">${_gday(d)}</div>
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
        // Second line names the month in another script: English under Khmer,
        // Khmer under English/Chinese (it used to repeat the Khmer name)
        const secondary = lang === 'km' ? I18n.translations.en.gregMonthsShort[m] : KC.ADM12[m];
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
      _weekAnchor = null;
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
    if (_view === 'week') {
      const a = _weekAnchor || new Date(_year, _month, 1);
      _weekAnchor = new Date(a.getFullYear(), a.getMonth(), a.getDate() + 7 * dir);
    } else if (_view === 'year') {
      _year += dir;
    } else {
      _month += dir;
      if (_month > 11) { _month = 0; _year++; }
      if (_month < 0) { _month = 11; _year--; }
    }
    _selectedDate = null;
    const panel = document.getElementById('cal-detail');
    if (panel) panel.classList.remove('open');
    _renderCalendar();
  }

  function _goToday() {
    const today = new Date();
    _year = today.getFullYear();
    _month = today.getMonth();
    _weekAnchor = today;
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
    const monthChips = document.getElementById('month-events-chips');
    if (monthChips) {
      monthChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.ev-chip');
        if (!chip || chip.dataset.filter === _monthFilter) return;
        _monthFilter = chip.dataset.filter;
        _renderMonthEvents(_year, _month);
        const body = document.getElementById('month-events-body');
        if (body) body.scrollTop = 0;
      });
    }
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
    // Tapping an event opens its day sheet on top of the events page, so
    // closing the sheet lands back on the list where the user left it
    if (eventsListEl) {
      eventsListEl.addEventListener('click', (e) => {
        const row = e.target.closest('.ev-row');
        if (!row) return;
        _showDetail(+row.dataset.y, +row.dataset.m, +row.dataset.d, { overEvents: true });
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

    // Day-number digits (1 2 3 / ១ ២ ៣)
    const digitsGroup = document.getElementById('digits-toggle');
    if (digitsGroup) {
      _setActiveToggle(digitsGroup, '[data-digits="' + I18n.getDayDigits() + '"]');
      digitsGroup.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-digits]');
        if (!btn) return;
        I18n.setDayDigits(btn.dataset.digits);
        _setActiveToggle(digitsGroup, '[data-digits="' + btn.dataset.digits + '"]');
        _refreshAll();
      });
    }

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
    _closeViewMenu();
    _renderWeekdays();
    _renderCalendar();
    // Panels that build their text in JS follow the language change too
    if (HT) { _refreshHealthSummary(); _refreshPeriodHistory(); }
    if (document.querySelector('.health-tab.is-active[data-health-tab="baby"]')) _renderBaby();
    const evOverlay = document.getElementById('cal-events-overlay');
    if (evOverlay && evOverlay.classList.contains('open')) _renderEventsList();
    if (_dp) _renderDatePick();
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
      healthBtn.addEventListener('click', () => {
        // Repaint the active tab, so dates and labels follow the current
        // language and today's date
        const babyOn = document.querySelector('.health-tab.is-active[data-health-tab="baby"]');
        if (babyOn) _renderBaby();
        healthOverlay.classList.add('open');
      });
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
    document.getElementById('health-log-cal').addEventListener('click', _onLogCalClick);
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
    const next = last ? HT.predictNextPeriods(profile.id, 1)[0] : null;
    el.innerHTML = `
      <div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('cycleLength') || 'Cycle')}</span>
        <span class="health-summary-val">~${_num(cycle)} ${escapeHtml(I18n.t('days') || 'days')}</span>
      </div>
      <div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('periodLength') || 'Period')}</span>
        <span class="health-summary-val">~${_num(period)} ${escapeHtml(I18n.t('days') || 'days')}</span>
      </div>
      ${last ? `<div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('lastPeriod') || 'Last period')}</span>
        <span class="health-summary-val">${escapeHtml(_fmtYmd(last, true))}</span>
      </div>` : ''}
      ${next ? `<div class="health-summary-row">
        <span class="health-summary-label">${escapeHtml(I18n.t('nextPeriod'))}</span>
        <span class="health-summary-val">${escapeHtml(_fmtYmd(next, true))}</span>
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
    const start = existing ? existing.start : HT._ymd(new Date());
    const [vy, vm] = start.split('-').map(Number);
    _logPick = { start, end: existing ? (existing.end || null) : null, viewY: vy, viewM: vm - 1 };
    _renderLogCal();
    const overlay = document.getElementById('health-log-overlay');
    if (overlay) overlay.classList.add('open');
  }

  // ----- Period range picker (inside the log modal) -----
  let _logPick = null; // { start, end, viewY, viewM } — dates as YYYY-MM-DD

  /** "៧ តុលា" (or "៧ តុលា ២០២៦" with withYear) in the UI language. */
  function _fmtYmd(ymd, withYear) {
    const [y, m, d] = ymd.split('-').map(Number);
    const lang = I18n.getLang();
    if (lang === 'zh') return (withYear ? y + '年' : '') + (m) + '月' + d + '日';
    const month = lang === 'km' ? I18n.gregMonth(m - 1) : I18n.gregMonthShort(m - 1);
    return `${_num(d)} ${month}${withYear ? ' ' + _num(y) : ''}`;
  }

  function _daysBetween(a, b) {
    const [ay, am, ad] = a.split('-').map(Number);
    const [by, bm, bd] = b.split('-').map(Number);
    return Math.round((new Date(by, bm - 1, bd) - new Date(ay, am - 1, ad)) / 86400000);
  }

  function _renderLogCal() {
    const calEl = document.getElementById('health-log-cal');
    const sumEl = document.getElementById('health-log-summary');
    if (!calEl || !_logPick) return;
    const { start, end, viewY, viewM } = _logPick;
    const startEl = document.getElementById('health-log-start');
    const endEl   = document.getElementById('health-log-end');
    if (startEl) startEl.value = start || '';
    if (endEl)   endEl.value   = end || '';

    const todayYmd = HT._ymd(new Date());
    const lang = I18n.getLang();
    const T = I18n.translations[lang] || I18n.translations.km;
    const order = I18n.getStartDay() === 'sun' ? [0, 1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 0];

    // Other logged periods, shown as a small dot for context
    const profile = HT.getActiveProfile();
    const others = ((profile && profile.periods) || []).filter(p => p.start !== _editingPeriodStart);
    const inOther = ymd => others.some(p => ymd >= p.start && ymd <= (p.end || p.start));

    const first = new Date(viewY, viewM, 1);
    const lead = (first.getDay() - order[0] + 7) % 7;
    const days = new Date(viewY, viewM + 1, 0).getDate();
    let cells = order.map(dw => `<div class="hl-wd">${escapeHtml(T.weekdaysShort[dw])}</div>`).join('');
    for (let i = 0; i < lead; i++) cells += '<div></div>';
    for (let d = 1; d <= days; d++) {
      const ymd = HT._ymd(new Date(viewY, viewM, d));
      const cls = ['hl-day'];
      if (ymd > todayYmd) cls.push('hl-day--disabled');
      if (ymd === todayYmd) cls.push('hl-day--today');
      if (inOther(ymd)) cls.push('hl-day--logged');
      if (start && ymd === start) cls.push('hl-day--start');
      if (end && ymd === end) cls.push('hl-day--end');
      if (start && end && ymd > start && ymd < end) cls.push('hl-day--in');
      if (start && ymd === start && (!end || end === start)) cls.push('hl-day--single');
      cells += `<button type="button" class="${cls.join(' ')}" data-ymd="${ymd}"><span>${_num(d)}</span></button>`;
    }
    const canNext = new Date(viewY, viewM + 1, 1) <= new Date();
    calEl.innerHTML = `
      <div class="hl-cal-head">
        <button type="button" class="hl-nav" data-nav="-1" aria-label="Previous month">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <span class="hl-cal-title">${escapeHtml(I18n.gregMonth(viewM))} ${_num(viewY)}</span>
        <button type="button" class="hl-nav" data-nav="1" aria-label="Next month"${canNext ? '' : ' disabled'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>
      <div class="hl-grid">${cells}</div>`;

    if (sumEl) {
      let range = '', hint;
      if (!start) {
        hint = I18n.t('pickStartHint');
      } else if (!end) {
        range = `${_fmtYmd(start)} → …`;
        hint = I18n.t('pickEndHint');
      } else {
        range = `${_fmtYmd(start)} → ${_fmtYmd(end)} · ${_num(_daysBetween(start, end) + 1)} ${I18n.t('days')}`;
        hint = '';
      }
      sumEl.innerHTML = (range ? `<div class="hl-range">${escapeHtml(range)}</div>` : '') +
                        (hint ? `<div class="hl-hint">${escapeHtml(hint)}</div>` : '');
    }
  }

  function _onLogCalClick(e) {
    if (!_logPick) return;
    const nav = e.target.closest('[data-nav]');
    if (nav) {
      const d = new Date(_logPick.viewY, _logPick.viewM + Number(nav.dataset.nav), 1);
      _logPick.viewY = d.getFullYear();
      _logPick.viewM = d.getMonth();
      _renderLogCal();
      return;
    }
    const day = e.target.closest('.hl-day');
    if (!day || day.classList.contains('hl-day--disabled')) return;
    const ymd = day.dataset.ymd;
    const p = _logPick;
    // First tap (or a tap after a full range) starts over; a later day ends
    // the range; an earlier day moves the start.
    if (!p.start || p.end) { p.start = ymd; p.end = null; }
    else if (ymd < p.start) { p.start = ymd; }
    else if (ymd > p.start) { p.end = ymd; }
    _renderLogCal();
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
        <span class="health-period-dates">${escapeHtml(_fmtYmd(p.start, true))} → ${escapeHtml(p.end ? _fmtYmd(p.end) : I18n.t('ongoing'))}${p.end ? `<span class="health-period-len">${escapeHtml(_num(_daysBetween(p.start, p.end) + 1) + ' ' + I18n.t('days'))}</span>` : ''}</span>
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

    const dpOverlay = document.getElementById('date-pick-overlay');
    if (dpOverlay) {
      dpOverlay.addEventListener('input', (e) => { if (e.target.id === 'dp-input') _onDateTyped(false); });
      dpOverlay.addEventListener('keydown', (e) => {
        if (e.target.id !== 'dp-input' || e.key !== 'Enter') return;
        e.preventDefault();
        const v = _onDateTyped(true);
        if (v) { const cb = _dp.onPick; _closeDatePick(); cb(v); }
      });
      dpOverlay.addEventListener('click', (e) => {
        if (e.target === dpOverlay) { _closeDatePick(); return; }
        _onDatePickClick(e);
      });
    }

    // Health panel: period / boy-or-girl tabs
    document.querySelectorAll('.health-tab').forEach(b =>
      b.addEventListener('click', () => _setHealthTab(b.dataset.healthTab)));
    const babyEl = document.getElementById('health-baby');
    if (babyEl) {
      babyEl.addEventListener('click', (e) => {
        const field = e.target.closest('.dp-field');
        if (field) {
          const now = new Date();
          const y = now.getFullYear();
          const which = field.dataset.date;
          const ranges = {
            birth: [new Date(1940, 0, 1), new Date(y - 10, 11, 31), new Date(y - 28, 0, 1)],
            check: [new Date(y - 2, 0, 1), new Date(y + 3, 11, 31), now],
            child: [new Date(y - 18, 0, 1), new Date(y + 2, 11, 31), now]
          }[which];
          const current = which === 'birth' ? _getMotherBirth() : which === 'child' ? _lsGet(CHILD_BIRTH_KEY, '') : _babyCheck;
          _openDatePick({ value: current, min: ranges[0], max: ranges[1], initial: ranges[2], onPick: (v) => {
            if (which === 'birth') _setMotherBirth(v);
            else if (which === 'child') _lsSet(CHILD_BIRTH_KEY, v);
            else _babyCheck = v;
            _renderBaby();
          } });
          return;
        }
        const origin = e.target.closest('.baby-origin');
        if (origin) {
          _babyNameOrigin = origin.dataset.origin;
          try { localStorage.setItem(BABY_ORIGIN_KEY, _babyNameOrigin); } catch (err) { /* private mode */ }
          _renderBabyNames();
          return;
        }
        const tab = e.target.closest('.baby-name-tab');
        if (tab) { _babyNameGender = tab.dataset.g; _renderBabyNames(); return; }
        const card = e.target.closest('.baby-name');
        if (card) {
          const favs = _getBabyFavs().map(f => (f.includes(':') ? f : 'km:' + f));
          const key = _favKey(card.dataset.name);
          const i = favs.indexOf(key);
          if (i >= 0) favs.splice(i, 1); else favs.push(key);
          _setBabyFavs(favs);
          _renderBabyNames();
        }
      });
      babyEl.addEventListener('input', (e) => {
        if (e.target.id !== 'baby-name-search') return;
        _babyNameQuery = e.target.value;
        _renderBabyNames();
      });
      babyEl.addEventListener('change', (e) => {
        if (e.target.id === 'baby-wed-night') { _lsSet(CHILD_NIGHT_KEY, e.target.checked ? '1' : '0'); _renderBaby(); return; }
        if (e.target.id === 'baby-match-day') { _babyMatchDay = e.target.checked; _renderBabyNames(); return; }
      });
    }

    // View switch
    const viewBtn = document.getElementById('cal-view-btn');
    const viewMenu = document.getElementById('cal-view-menu');
    if (viewBtn && viewMenu) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (viewMenu.hidden) _openViewMenu(); else _closeViewMenu();
      });
      viewMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const item = e.target.closest('[data-view]');
        if (item) _setView(item.dataset.view);
      });
      document.addEventListener('click', () => { if (!viewMenu.hidden) _closeViewMenu(); });
      window.addEventListener('resize', _closeViewMenu);
    }
    const fullEl = document.getElementById('cal-full');
    if (fullEl) {
      fullEl.addEventListener('click', (e) => {
        const day = e.target.closest('.fm-day');
        if (day) _showDetail(+day.dataset.y, +day.dataset.m, +day.dataset.d);
      });
      fullEl.addEventListener('touchstart', _onTouchStart, { passive: true });
      fullEl.addEventListener('touchend', _onTouchEnd, { passive: true });
    }
    const weekEl = document.getElementById('cal-week');
    if (weekEl) {
      weekEl.addEventListener('click', (e) => {
        const day = e.target.closest('.wk-day');
        if (day) _showDetail(+day.dataset.y, +day.dataset.m, +day.dataset.d);
      });
      weekEl.addEventListener('touchstart', _onTouchStart, { passive: true });
      weekEl.addEventListener('touchend', _onTouchEnd, { passive: true });
    }
    const yearEl = document.getElementById('cal-year');
    if (yearEl) {
      yearEl.addEventListener('click', (e) => {
        const m = e.target.closest('.yr-month');
        if (!m) return;
        _month = +m.dataset.m;
        _setView(_lastMonthView);
      });
      yearEl.addEventListener('touchstart', _onTouchStart, { passive: true });
      yearEl.addEventListener('touchend', _onTouchEnd, { passive: true });
    }

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
        const row = e.target.closest('.ev-row');
        if (!row) return;
        _showDetail(+row.dataset.y, +row.dataset.m, +row.dataset.d);
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
        if (!d.contains(e.target) && !e.target.closest('.cal-cell, .ev-row, .wk-day, .fm-day, #cal-today-footer, #cal-today-btn')) {
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
