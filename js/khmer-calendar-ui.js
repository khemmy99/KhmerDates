// ===== Khmer Calendar App UI =====
// Full-screen calendar with Khmer lunar dates

const KhCal = (() => {
  const KC = KhmerCalendar;
  const CC = ChineseCalendar;

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
  }

  // --- State ---
  let _month = new Date().getMonth();
  let _year = new Date().getFullYear();
  let _selectedDate = null; // {y, m, d}
  let _pickerView = 'closed'; // 'closed' | 'months' | 'years'
  let _pickerYear = new Date().getFullYear(); // year shown in picker
  let _yearPageBase = 0; // base year for year grid

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
      const animal = KC.animalFromBE(be);
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

    // Month title (tappable to open picker)
    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) {
      if (lang === 'km') {
        titleEl.innerHTML = `<span class="cal-month-khmer">${KC.ADM12[month]} ${KC.khmerNumber(year)} &#9662;</span><br>` +
          `<span class="cal-month-greg">${I18n.gregMonth(month)} ${year}</span>`;
      } else {
        titleEl.innerHTML = `<span class="cal-month-khmer">${I18n.monthName(month)} ${year} &#9662;</span><br>` +
          `<span class="cal-month-greg">${KC.ADM12[month]} ${KC.khmerNumber(year)}</span>`;
      }
    }

    // Lunar info
    const infoEl = document.getElementById('cal-lunar-info');
    if (infoEl) {
      const midLunar = KC.getKhmerDayMonthFromGregorian(new Date(year, month, 15));
      const firstDayLunar = KC.getKhmerDayMonthFromGregorian(new Date(year, month, 1));
      const lastDay = new Date(year, month + 1, 0).getDate();
      const lastDayLunar = KC.getKhmerDayMonthFromGregorian(new Date(year, month, lastDay));
      const km1 = KC.khmerMonthNameFromKm(firstDayLunar.km);
      const km2 = (lastDayLunar.km !== firstDayLunar.km) ? ' - ' + KC.khmerMonthNameFromKm(lastDayLunar.km) : '';
      const be = KC.computeBEYear(year, month + 1, midLunar.km, midLunar.kd);
      const animal = KC.animalFromBE(be);
      const sak = KC.sakFromBE(be);
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
      const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxing').charAt(0)) : (lang === 'km' ? KC.RK[1] : I18n.t('waning').charAt(0));
      const waxClass = lun.kd <= 15 ? 'keit' : 'roc';
      const cn = CC.fromDate(dt);
      const cnText = cn ? cn.cellText : '';
      const cnFirst = cn && cn.day === 1 ? ' cn-first' : '';
      return `<div class="cal-cell ${extra} ${waxClass}" data-y="${dataY}" data-m="${dataM}" data-d="${d}">
        <span class="cal-kday">${kdDisp} ${wax}</span>
        <span class="cal-gday">${d}</span>
        <span class="cal-cday${cnFirst}">${cnText}</span>
      </div>`;
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
      const wax = lun.kd <= 15 ? (lang === 'km' ? KC.RK[0] : I18n.t('waxing').charAt(0)) : (lang === 'km' ? KC.RK[1] : I18n.t('waning').charAt(0));
      const waxClass = lun.kd <= 15 ? 'keit' : 'roc';
      const cn = CC.fromDate(dt);
      const cnText = cn ? cn.cellText : '';
      const cnFirst = cn && cn.day === 1 ? ' cn-first' : '';
      html += `<div class="cal-cell${isToday ? ' today' : ''}${isSel ? ' selected' : ''} ${dayClass} ${waxClass}" data-y="${year}" data-m="${month}" data-d="${d}">
        <span class="cal-kday">${kdDisp} ${wax}</span>
        <span class="cal-gday">${d}</span>
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
    const animal = KC.animalFromBE(be);
    const sak = KC.sakFromBE(be);
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
      <div class="detail-full">${escapeHtml(khDate)}</div>
      ${cnLine ? `<div class="detail-full detail-chinese">${cnLine}</div>` : ''}
      <div class="detail-full detail-greg">${escapeHtml(grDate)}</div>
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
          <span class="pick-year-label">${base} - ${base + 11}</span>
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

  // === Settings Panel ===
  function _initSettings() {
    const settingsBtn = document.getElementById('cal-settings-btn');
    const overlay = document.getElementById('cal-settings-overlay');
    const closeBtn = document.getElementById('settings-close');

    if (settingsBtn) settingsBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.add('open');
    });

    if (closeBtn) closeBtn.addEventListener('click', () => {
      if (overlay) overlay.classList.remove('open');
    });

    if (overlay) overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('open');
    });

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
    }  }

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

  // === Init ===
  function init() {
    _renderTopBar();
    _renderWeekdays();
    _renderCalendar();
    _initSettings();

    const prevBtn = document.getElementById('cal-prev');
    const nextBtn = document.getElementById('cal-next');
    if (prevBtn) prevBtn.addEventListener('click', () => _nav(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => _nav(1));

    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) titleEl.addEventListener('click', _openPicker);

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
    }

    if (grid) {
      grid.addEventListener('touchstart', _onTouchStart, { passive: true });
      grid.addEventListener('touchend', _onTouchEnd, { passive: true });
    }

    document.addEventListener('click', (e) => {
      const detail = document.getElementById('cal-detail');
      if (detail && detail.classList.contains('open')) {
        if (!detail.contains(e.target) && !e.target.closest('.cal-cell')) {
          _hideDetail();
        }
      }
    });

    const today = new Date();
    _showDetail(today.getFullYear(), today.getMonth(), today.getDate());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return { _nav, _goToday };
})();
