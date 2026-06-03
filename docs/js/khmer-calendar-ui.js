// ===== Khmer Calendar App UI =====
// Full-screen calendar with Khmer lunar dates

const KhCal = (() => {
  const KC = KhmerCalendar;
  const CC = ChineseCalendar;
  const HL = (typeof KhmerHolidays !== 'undefined') ? KhmerHolidays : null;
  const DB = (typeof DailyBlock     !== 'undefined') ? DailyBlock     : null;
  const HT = (typeof HealthTracker  !== 'undefined') ? HealthTracker  : null;
  // Single source of truth for the user-facing version label.
  // Keep this in sync with manifest.json `version` and android/app/build.gradle `versionName`.
  const APP_VERSION = '1.0.4';

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  /**
   * Build a year-long list of unique holiday occurrences, grouped by month.
   * Consecutive days of the same holiday are collapsed into a date range.
   */
  function _collectYearEvents(year) {
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
    return byMonth;
  }

  function _renderEventsList() {
    if (!HL) return;
    const lang = I18n.getLang();
    const yearEl = document.getElementById('events-year');
    const yearLabelEl = document.getElementById('events-year-label');
    const listEl = document.getElementById('events-list');
    if (!listEl) return;

    if (yearEl)      yearEl.textContent      = lang === 'km' ? KC.khmerNumber(_eventsYear) : _eventsYear;
    if (yearLabelEl) yearLabelEl.textContent = lang === 'km' ? KC.khmerNumber(_eventsYear) : _eventsYear;

    // Time-relative classification — used to highlight "today" and dim "past".
    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayLabel = I18n.t('today') || 'Today';
    const daysLabel = I18n.t('days') || 'days';

    const byMonth = _collectYearEvents(_eventsYear);
    const sections = [];
    for (let m = 0; m < 12; m++) {
      const events = byMonth[m];
      if (!events.length) continue;
      const rows = events.map(ev => {
        const baseName = ev.entry[lang] || ev.entry.km || '';
        const dotCls = ev.isPublic ? 'events-dot--public' : 'events-dot--observance';
        let dateStr;
        let spanDays = 1;
        if (ev.startDay === ev.endDay && ev.startMonth === ev.endMonth) {
          dateStr = String(ev.startDay);
        } else if (ev.startMonth === ev.endMonth) {
          dateStr = ev.startDay + '–' + ev.endDay;
          spanDays = ev.endDay - ev.startDay + 1;
        } else {
          const startDt = new Date(_eventsYear, ev.startMonth, ev.startDay);
          const endDt   = new Date(_eventsYear, ev.endMonth,   ev.endDay);
          spanDays = Math.round((endDt - startDt) / 86400000) + 1;
          dateStr = ev.startDay + ' ' + I18n.gregMonthShort(ev.startMonth) +
                  ' – ' + ev.endDay + ' ' + I18n.gregMonthShort(ev.endMonth);
        }
        const daysBadge = spanDays > 1
          ? `<span class="events-days-badge">${escapeHtml((lang === 'km' ? KC.khmerNumber(spanDays) : spanDays) + ' ' + daysLabel)}</span>`
          : '';

        // Time classification relative to today
        const evStart = new Date(_eventsYear, ev.startMonth, ev.startDay).getTime();
        const evEnd   = new Date(_eventsYear, ev.endMonth,   ev.endDay  ).getTime();
        let timeCls = '';
        let todayBadge = '';
        if (todayMidnight >= evStart && todayMidnight <= evEnd) {
          timeCls = ' events-row--today';
          todayBadge = `<span class="events-today-badge">${escapeHtml(todayLabel)}</span>`;
        } else if (todayMidnight > evEnd) {
          timeCls = ' events-row--past';
        }

        return `<div class="events-row${ev.isPublic ? '' : ' events-row--observance'}${timeCls}">
          <span class="events-dot ${dotCls}"></span>
          <span class="events-date">${escapeHtml(dateStr)}</span>
          <span class="events-name">${escapeHtml(baseName)}</span>
          ${todayBadge}
          ${daysBadge}
        </div>`;
      }).join('');
      sections.push(`<div class="events-month">
        <div class="events-month-label">${escapeHtml(I18n.gregMonth(m))}</div>
        ${rows}
      </div>`);
    }

    listEl.innerHTML = sections.length
      ? sections.join('')
      : `<div class="events-empty">${escapeHtml(I18n.t('noEvents') || 'No events')}</div>`;
  }

  function _renderHolidayBlock(dt, lang) {
    if (!HL) return '';
    const list = HL.getByDate(dt);
    if (!list || !list.length) return '';
    // Use the same red/gold split as the cell markers: a block is red only
    // when at least one matching entry is a public holiday; otherwise gold.
    const kind  = HL.classifyDate(dt) || 'public';
    const modCls = kind === 'observance' ? ' detail-holiday--observance' : '';
    const items = list.map(h => `<div class="detail-holiday-item">${escapeHtml(HL.nameFor(h, lang))}</div>`).join('');
    return `<div class="detail-holiday${modCls}">${items}</div>`;
  }

  function _renderHealthBlock(dt, lang) {
    if (!HT || !HT.isEnabled()) return '';
    const info = HT.getDayInfo(dt);
    if (!info || info.kind === 'none') return '';

    const profile = HT.getActiveProfile();
    const profileName = profile ? profile.name : '';

    let icon = '', kindLabel = '', detail = '';
    switch (info.kind) {
      case 'period':
        icon = '🔴';
        kindLabel = I18n.t('healthPeriod') || 'Period';
        detail = (I18n.t('healthDayN') || 'Day {n}').replace('{n}', info.dayInPeriod);
        break;
      case 'predicted-period':
        icon = '🩸';
        kindLabel = I18n.t('healthPredictedPeriod') || 'Predicted period';
        detail = (I18n.t('healthDayN') || 'Day {n}').replace('{n}', info.dayInPeriod);
        break;
      case 'ovulation':
        icon = '🥚';
        kindLabel = I18n.t('healthOvulation') || 'Ovulation';
        detail = (I18n.t('healthCycleDayN') || 'Cycle day {n}').replace('{n}', info.dayInCycle);
        break;
      case 'fertile':
        icon = '🌱';
        kindLabel = I18n.t('healthFertile') || 'Fertile window';
        detail = (I18n.t('healthCycleDayN') || 'Cycle day {n}').replace('{n}', info.dayInCycle);
        break;
      case 'normal':
        icon = '🌸';
        kindLabel = (I18n.t('healthCycleDayN') || 'Cycle day {n}').replace('{n}', info.dayInCycle);
        if (info.daysToNextPeriod > 0) {
          detail = (I18n.t('healthDaysToNext') || '~{n} days to next period').replace('{n}', info.daysToNextPeriod);
        }
        break;
    }

    return `<div class="detail-health detail-health--${info.kind}">
      <div class="detail-health-row">
        <span class="detail-health-icon">${icon}</span>
        <span class="detail-health-kind">${escapeHtml(kindLabel)}</span>
        ${detail ? `<span class="detail-health-detail">${escapeHtml(detail)}</span>` : ''}
      </div>
      ${profileName ? `<div class="detail-health-profile">${escapeHtml(profileName)}</div>` : ''}
    </div>`;
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

  // === Render today's date in top bar ===
  function _renderTopBar() {
    const today = new Date();
    const khEl = document.getElementById('cal-today-khmer');
    const grEl = document.getElementById('cal-today-greg');
    const lang = I18n.getLang();

    if (lang === 'km') {
      if (khEl) khEl.textContent = KC.khmerDates(today);
      if (grEl) grEl.textContent = KC.gDates(today);
    } else {
      const lun = KC.getKhmerDayMonthFromGregorian(today);
      const kdDisp = lun.kd <= 15 ? lun.kd : lun.kd - 15;
      const wax = lun.kd <= 15 ? I18n.t('waxing') : I18n.t('waning');
      const kMonth = KC.khmerMonthNameFromKm(lun.km);
      const be = KC.computeBEYear(today.getFullYear(), today.getMonth() + 1, lun.km, lun.kd);
      // animal uses Apr 14 boundary, BE uses lunar Pisakh boundary
      const animal = KC.khmerYearAnimalFromBE(today.getFullYear(), today.getMonth() + 1, today.getDate());
      if (khEl) khEl.textContent = `${wax} ${kdDisp} ${kMonth} | ${animal} ${I18n.t('bePrefix')} ${be}`;
      if (grEl) grEl.textContent = `${I18n.weekday(today.getDay())}, ${today.getDate()} ${I18n.monthName(today.getMonth())} ${today.getFullYear()}`;
    }
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
      const firstDayLunar = KC.getKhmerDayMonthFromGregorian(new Date(year, month, 1));
      const lastDay = new Date(year, month + 1, 0).getDate();
      const lastDayLunar = KC.getKhmerDayMonthFromGregorian(new Date(year, month, lastDay));
      const km1 = KC.khmerMonthNameFromKm(firstDayLunar.km);
      const km2 = (lastDayLunar.km !== firstDayLunar.km) ? ' - ' + KC.khmerMonthNameFromKm(lastDayLunar.km) : '';

      let refDay;
      if (_selectedDate && _selectedDate.y === year && _selectedDate.m === month) {
        refDay = _selectedDate.d;
      } else if (year === todayY && month === todayM) {
        refDay = todayD;
      } else {
        refDay = Math.min(15, lastDay);
      }

      const refLun = KC.getKhmerDayMonthFromGregorian(new Date(year, month, refDay));
      const be = KC.computeBEYear(year, month + 1, refLun.km, refLun.kd);
      // Animal & Sak follow Apr 14 boundary; BE follows lunar Pisakh boundary
      const animal = KC.khmerYearAnimalFromBE(year, month + 1, refDay);
      const sak = KC.sakNameFromAD(year, month + 1, refDay);
      if (lang === 'km') {
        infoEl.textContent = `${km1}${km2} | ${sak} | ${animal} | ព.ស.${KC.khmerNumber(be)}`;
      } else {
        infoEl.textContent = `${km1}${km2} | ${sak} | ${animal} | ${I18n.t('bePrefix')} ${be}`;
      }
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
      return `<div class="cal-cell ${extra} ${waxClass}${holidayClass}${healthClass}" data-y="${dataY}" data-m="${dataM}" data-d="${d}">
        <span class="cal-gday">${d}</span>
        <span class="cal-kday">${kdDisp} ${wax}</span>
        <span class="cal-cday${cnFirst}">${cnText}</span>
      </div>`;
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
      html += `<div class="cal-cell${isToday ? ' today' : ''}${isSel ? ' selected' : ''} ${dayClass} ${waxClass}${holidayClass}${healthClass}" data-y="${year}" data-m="${month}" data-d="${d}">
        <span class="cal-gday">${d}</span>
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

    // Today button
    const todayBtn = document.getElementById('cal-today-btn');
    if (todayBtn) {
      todayBtn.textContent = I18n.t('today');
      todayBtn.style.display = (year === todayY && month === todayM) ? 'none' : 'block';
    }
  }

  // === Day detail panel ===
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

    let waxLabel, weekday, yearLine, gregLine, bigNum, smallNum;

    if (lang === 'km') {
      waxLabel = lun.kd <= 15 ? KC.RK[0] : KC.RK[1];
      weekday = KC.KD7[dow];
      bigNum = KC.khmerNumber(kdDisp);
      smallNum = String(d);
      yearLine = `${animal} ${sak} ព.ស.${KC.khmerNumber(be)}`;
      gregLine = `${d} ${I18n.gregMonth(m)} ${y}`;
    } else {
      waxLabel = lun.kd <= 15 ? I18n.t('waxing') : I18n.t('waning');
      weekday = I18n.weekday(dow);
      bigNum = String(kdDisp);
      smallNum = KC.khmerNumber(kdDisp);
      yearLine = `${animal} ${sak} ${I18n.t('bePrefix')} ${be}`;
      gregLine = `${d} ${I18n.gregMonth(m)} ${y}`;
    }

    content.innerHTML = `
      <div class="detail-main">
        <div class="detail-left">
          <div class="detail-kday-big">${bigNum}</div>
          <div class="detail-gday">${smallNum}</div>
        </div>
        <div class="detail-info">
          <div class="detail-khmer-date">${waxLabel} ${lang === 'km' ? 'ខែ' : ''}${kMonthName} | ${weekday}</div>
          <div class="detail-year">${yearLine}</div>
          <div class="detail-weekday">${gregLine}</div>
        </div>
      </div>
      ${_renderHolidayBlock(dt, lang)}
      ${_renderHealthBlock(dt, lang)}
      <div class="detail-full">${escapeHtml(khDate)}</div>
      ${cnLine ? `<div class="detail-full detail-chinese">${cnLine}</div>` : ''}
      <div class="detail-full detail-greg">${escapeHtml(grDate)}</div>
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
      if (!panel.classList.contains('open')) return;
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
    const settingsBtn = document.getElementById('cal-settings-btn');
    const overlay = document.getElementById('cal-settings-overlay');
    const closeBtn = document.getElementById('settings-close');

    // Stamp the current app version into the About panel
    const versionEl = document.getElementById('settings-app-version');
    if (versionEl) versionEl.textContent = APP_VERSION;

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('open');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('open');
    });

    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

    // About overlay (its own footer button — moved out of Settings)
    const aboutBtn     = document.getElementById('cal-about-btn');
    const aboutOverlay = document.getElementById('cal-about-overlay');
    const aboutClose   = document.getElementById('about-overlay-close');
    if (aboutBtn && aboutOverlay) {
      aboutBtn.addEventListener('click', () => aboutOverlay.classList.add('open'));
    }
    if (aboutClose && aboutOverlay) {
      aboutClose.addEventListener('click', () => aboutOverlay.classList.remove('open'));
    }
    if (aboutOverlay) {
      aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) aboutOverlay.classList.remove('open');
      });
    }

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
    if (eventsPrev) eventsPrev.addEventListener('click', () => { _eventsYear--; _renderEventsList(); });
    if (eventsNext) eventsNext.addEventListener('click', () => { _eventsYear++; _renderEventsList(); });

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
        _refreshAll();
      });
    }
    // Start day toggle
    const startGroup = document.getElementById('startday-toggle');
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
    _renderTopBar();
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

    // Click outside the detail sheet (but not on a calendar cell) closes it
    document.addEventListener('click', (e) => {
      const d = document.getElementById('cal-detail');
      if (d && d.classList.contains('open')) {
        if (!d.contains(e.target) && !e.target.closest('.cal-cell')) {
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
