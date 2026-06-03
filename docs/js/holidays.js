// ===== Cambodian Public Holidays =====
// Names are provided in Khmer / English / Chinese for the i18n layer.
//
// Two kinds of holidays:
//   FIXED   — by fixed Gregorian (month, day): independence day, new year, etc.
//   LUNAR   — by lunar (km, kd) or a span of lunar days: Pchum Ben, Visakha Bochea, etc.
//
// Lunar holidays are resolved per-date by reading the lunar date from
// KhmerCalendar.getKhmerDayMonthFromGregorian().

const KhmerHolidays = (() => {

  const FIXED = [
    { m: 1,  d: 1,  km: 'ទិវាបុណ្យចូលឆ្នាំសាកល',
                    en: "International New Year's Day",
                    zh: '元旦' },
    { m: 1,  d: 7,  km: 'ទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍',
                    en: 'Victory Day over Genocide',
                    zh: '战胜大屠杀日' },
    { m: 3,  d: 8,  km: 'ទិវានារីអន្តរជាតិ',
                    en: "International Women's Day",
                    zh: '国际妇女节' },
    { m: 4,  d: 14, id: 'khmer-new-year', dayOfFestival: 1, totalDays: 3,
                    km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
                    en: 'Khmer New Year',
                    zh: '柬埔寨新年' },
    { m: 4,  d: 15, id: 'khmer-new-year', dayOfFestival: 2, totalDays: 3,
                    km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
                    en: 'Khmer New Year',
                    zh: '柬埔寨新年' },
    { m: 4,  d: 16, id: 'khmer-new-year', dayOfFestival: 3, totalDays: 3,
                    km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
                    en: 'Khmer New Year',
                    zh: '柬埔寨新年' },
    { m: 5,  d: 1,  km: 'ទិវាពលកម្មអន្តរជាតិ',
                    en: 'International Labour Day',
                    zh: '国际劳动节' },
    { m: 5,  d: 14, km: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម ព្រះករុណា ព្រះបាទសម្តេចព្រះបរមនាថ នរោត្តម សីហមុនី',
                    en: "King Norodom Sihamoni's Birthday",
                    zh: '诺罗敦·西哈莫尼国王诞辰' },
    { m: 6,  d: 18, km: 'ព្រះរាជពិធីបុណ្យចម្រើនព្រះជន្ម សម្តេចព្រះមហាក្សត្រី នរោត្តម មុនិនាថ សីហនុ',
                    en: "Queen Mother Norodom Monineath Sihanouk's Birthday",
                    zh: '太后诺罗敦·莫尼列·西哈努克诞辰' },
    { m: 9,  d: 24, km: 'ទិវាប្រកាសរដ្ឋធម្មនុញ្ញ',
                    en: 'Constitutional Day',
                    zh: '宪法日' },
    { m: 10, d: 15, km: 'ទិវាគោរពព្រះវិញ្ញាណក្ខន្ធព្រះករុណាព្រះបាទសម្តេចព្រះនរោត្តម សីហនុ',
                    en: 'Commemoration Day of the King Father (Norodom Sihanouk)',
                    zh: '国父诺罗敦·西哈努克纪念日' },
    { m: 10, d: 29, km: 'ព្រះរាជពិធីគ្រងព្រះមហាក្សត្រ ព្រះករុណា ព្រះបាទនរោត្តម សីហមុនី',
                    en: "King Norodom Sihamoni's Coronation Day",
                    zh: '诺罗敦·西哈莫尼国王加冕日' },
    { m: 11, d: 9,  km: 'ទិវាបុណ្យឯករាជ្យជាតិ',
                    en: 'National Independence Day',
                    zh: '独立日' },
    { m: 12, d: 29, km: 'ទិវាសន្តិភាពនៅព្រះរាជាណាចក្រកម្ពុជា',
                    en: 'Peace Day in Cambodia',
                    zh: '柬埔寨和平日' },

    // --- International / cultural observance days (gold, not red) ---
    // These are NOT Cambodian public holidays — they're commemorative or
    // cultural observances. Marked with `observance: true` so the classifier
    // gives them the gold marker.
    { m: 2,  d: 14, observance: true,
                    km: 'ទិវាបុណ្យនៃសេចក្តីស្រលាញ់',
                    en: "Valentine's Day",
                    zh: '情人节' },
    { m: 5,  d: 20, observance: true,
                    km: 'ទិវាជាតិនៃការចងចាំ',
                    en: 'Day of Remembrance',
                    zh: '国家纪念日' },
    { m: 6,  d: 1,  observance: true,
                    km: 'ទិវាកុមារអន្តរជាតិ',
                    en: "International Children's Day",
                    zh: '国际儿童节' },
    { m: 10, d: 23, observance: true,
                    km: 'ទិវាកិច្ចព្រមព្រៀងសន្តិភាពទីក្រុងប៉ារីស',
                    en: "Paris Peace Agreements Day",
                    zh: '巴黎和平协定日' },
    { m: 10, d: 29, observance: true,  // (also Coronation Day public holiday)
                    km: 'ហាឡូវីន',
                    en: 'Halloween',
                    zh: '万圣节' },
    { m: 12, d: 10, observance: true,
                    km: 'ទិវាសិទ្ធិមនុស្សអន្តរជាតិ',
                    en: 'International Human Rights Day',
                    zh: '世界人权日' },
    { m: 12, d: 25, observance: true,
                    km: 'ទិវាបុណ្យណូអែល',
                    en: 'Christmas Day',
                    zh: '圣诞节' }
  ];

  // Lunar holidays — each entry matches one or more SPANS of lunar dates.
  // A span is { km, kdStart, kdEnd, dayBase } where the resulting day-of-festival
  // is (kd - kdStart + 1) + dayBase.
  //
  // ភ្ជុំបិណ្ឌ (Pchum Ben) — 16-day festival spanning the lunar month boundary:
  //   Days 1-15: ១ រោច → ១៥ រោច ខែភទ្របទ        (km=10, kd=16..30)
  //   Day 16:   ១ កើត ខែឤសុជ                     (km=11, kd=1)
  //
  // The official Cambodian public holiday is the FINAL THREE days of the
  // festival — days 14, 15, and 16 — when most of the country observes rest
  // days and the main pagoda offerings (ភ្ជុំបិណ្ឌ) take place.
  const LUNAR = [
    {
      id: 'pchum-ben',
      spans: [
        { km: 10, kdStart: 16, kdEnd: 30, dayBase: 0  },  // Days 1-15
        { km: 11, kdStart: 1,  kdEnd: 1,  dayBase: 15 }   // Day 16
      ],
      km_label: 'បុណ្យភ្ជុំបិណ្ឌ',
      en: 'Pchum Ben Festival',
      zh: '亡人节',
      totalDays: 16,
      // 1-based day-of-festival numbers that are official Cambodian public
      // holidays. The full 16-day cultural observance is shown for all days,
      // but these get the "Public holiday" badge in the detail panel.
      publicHolidayDays: [14, 15, 16]
    },
    {
      // ពិធីបុណ្យវិសាខបូជា — full moon of ខែពិសាខ (km=6, kd=15)
      // Buddhist holy day commemorating Buddha's birth, enlightenment, and
      // parinirvana on the same lunar date. Official Cambodian public holiday.
      id: 'visak-bochea',
      spans: [{ km: 6, kdStart: 15, kdEnd: 15, dayBase: 0 }],
      km_label: 'ពិធីបុណ្យវិសាខបូជា',
      en: 'Visak Bochea (Buddha Day)',
      zh: '卫塞节',
      totalDays: 1,
      publicHolidayDays: [1]
    },
    {
      // ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល — 4 រោច ខែពិសាខ (km=6, kd=19)
      // Royal Ploughing Ceremony marks the traditional start of the rice
      // planting season. Official Cambodian public holiday.
      id: 'royal-ploughing',
      spans: [{ km: 6, kdStart: 19, kdEnd: 19, dayBase: 0 }],
      km_label: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
      en: 'Royal Ploughing Ceremony',
      zh: '御耕节',
      totalDays: 1,
      publicHolidayDays: [1]
    },
    {
      // ចូលព្រះវស្សា — 1 រោច ខែឤសាឍ (km=8, kd=16)
      // Start of the 3-month Buddhist Rains Retreat (Vassa). Important
      // religious day for Khmer Buddhists, but NOT an official Cambodian
      // public holiday — observance only (shows in gold, not red).
      //
      // In Khmer leap years the Aasath month is doubled (km=80 បឋមាសាឍ +
      // km=800 ទុតិយាសាឍ), and the Vassa entry falls on 1 រោច of the SECOND
      // Aasath. Match both km=8 (regular years) and km=800 (leap years).
      id: 'vassa-entry',
      spans: [
        { km: 8,   kdStart: 16, kdEnd: 16, dayBase: 0 },
        { km: 800, kdStart: 16, kdEnd: 16, dayBase: 0 }
      ],
      km_label: 'ចូលព្រះវស្សា',
      en: 'Vassa Begins (Buddhist Lent)',
      zh: '入夏安居',
      totalDays: 1,
      publicHolidayDays: []
    },
    {
      // ចេញព្រះវស្សា — 15 កើត ខែឣស្សុជ (km=11, kd=15)
      // End of Vassa (Pavarana), marking the conclusion of the 3-month
      // Buddhist Rains Retreat. Religious observance only.
      id: 'vassa-exit',
      spans: [{ km: 11, kdStart: 15, kdEnd: 15, dayBase: 0 }],
      km_label: 'ចេញព្រះវស្សា',
      en: 'Vassa Ends (Pavarana)',
      zh: '出夏安居',
      totalDays: 1,
      publicHolidayDays: []
    },
    {
      // ពិធីបុណ្យមាឃបូជា — 15 កើត ខែមាឃ (km=3, kd=15)
      // Magha Puja: commemorates the spontaneous gathering of 1,250
      // enlightened monks before Buddha. Observance day for Khmer Buddhists,
      // not an official Cambodian public holiday.
      id: 'meak-bochea',
      spans: [{ km: 3, kdStart: 15, kdEnd: 15, dayBase: 0 }],
      km_label: 'ពិធីបុណ្យមាឃបូជា',
      en: 'Meak Bochea (Magha Puja)',
      zh: '万佛节',
      totalDays: 1,
      publicHolidayDays: []
    },
    {
      // កឋិនកាល — 1 រោច ខែឣស្សុជ (km=11, kd=16)
      // Start of the Kathina period, when monks receive new robes from the
      // lay community. Falls the day after Vassa ends. Religious observance.
      id: 'kathin',
      spans: [{ km: 11, kdStart: 16, kdEnd: 16, dayBase: 0 }],
      km_label: 'កឋិនកាល',
      en: 'Kathin (Robe Offering)',
      zh: '迦絺那衣节',
      totalDays: 1,
      publicHolidayDays: []
    },
    {
      // ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ-អកអំបុក
      // (Water Festival, Floating Lanterns, Moon Salutation, and Eating Ambok)
      // 3-day festival centered on the full moon of ខែកត្តិក (km=12):
      //   Day 1: 14 កើត ខែកត្តិក  (km=12, kd=14)  — first day
      //   Day 2: 15 កើត ខែកត្តិក  (km=12, kd=15)  — full moon, main day
      //   Day 3: 1 រោច ខែកត្តិក   (km=12, kd=16)  — third day
      // All three are official Cambodian public holidays.
      id: 'bon-om-touk',
      spans: [{ km: 12, kdStart: 14, kdEnd: 16, dayBase: 0 }],
      km_label: 'បុណ្យអុំទូក',
      en: 'Water Festival (Bon Om Touk)',
      zh: '送水节',
      totalDays: 3,
      publicHolidayDays: [1, 2, 3]
    }
  ];

  // ----- Chinese-lunar holidays (anchored to the Chinese calendar, not Khmer) --
  // These get the gold "observance" marker — they're cultural/religious days
  // for the Chinese-Khmer community, not official Cambodian public holidays.
  function _chineseFor(dt) {
    if (typeof ChineseCalendar === 'undefined') return [];
    const cn = ChineseCalendar.fromDate(dt);
    if (!cn) return [];
    const out = [];

    // Chinese New Year — 3 days starting from lunar 1/1
    if (cn.month === 1 && cn.day >= 1 && cn.day <= 3) {
      out.push({
        id: 'chinese-new-year',
        km: 'ថ្ងៃបុណ្យចូលឆ្នាំចិន',
        en: 'Chinese New Year',
        zh: '春节',
        isLunar: true,
        dayOfFestival: cn.day,
        totalDays: 3,
        observance: true
      });
    }

    // Chinese New Year's Eve — last day of lunar 12 (varies: 29 or 30)
    // Easiest robust check: if tomorrow is lunar 1/1, today is NYE.
    const tomorrow = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + 1);
    const cnTomorrow = ChineseCalendar.fromDate(tomorrow);
    if (cnTomorrow && cnTomorrow.month === 1 && cnTomorrow.day === 1) {
      out.push({
        id: 'chinese-new-year-eve',
        km: 'សែនចូលឆ្នាំចិន',
        en: "Chinese New Year's Eve",
        zh: '除夕',
        observance: true
      });
    }

    // Spirit / Hungry Ghost Festival (中元节) — lunar 7/15
    if (cn.month === 7 && cn.day === 15) {
      out.push({
        id: 'spirit-festival',
        km: 'សែនក្បាលទឹក',
        en: 'Spirit Festival (Hungry Ghost)',
        zh: '中元节',
        observance: true
      });
    }

    // Mid-Autumn Festival (中秋节) — lunar 8/15
    if (cn.month === 8 && cn.day === 15) {
      out.push({
        id: 'mid-autumn',
        km: 'បុណ្យសែនព្រះខែ',
        en: 'Mid-Autumn Festival',
        zh: '中秋节',
        observance: true
      });
    }

    return out;
  }

  // --- Indexes for fast lookup -------------------------------------------
  const _fixedIndex = {};
  FIXED.forEach(h => {
    const key = h.m + '-' + h.d;
    (_fixedIndex[key] = _fixedIndex[key] || []).push(h);
  });

  // --- Public API --------------------------------------------------------

  function _fixedFor(m, d) {
    return _fixedIndex[m + '-' + d] || null;
  }

  /**
   * Returns the LUNAR holiday(s) that match a given lunar (km, kd).
   * Includes a `dayOfFestival` so callers can render "Day N of total", and
   * a `isPublicHoliday` flag for festival days that are official rest days.
   */
  function _lunarFor(km, kd) {
    const out = [];
    for (const h of LUNAR) {
      const spans = h.spans || [{ km: h.km, kdStart: h.kdStart, kdEnd: h.kdEnd, dayBase: 0 }];
      for (const s of spans) {
        if (s.km === km && kd >= s.kdStart && kd <= s.kdEnd) {
          const dayOfFestival = (kd - s.kdStart + 1) + (s.dayBase || 0);
          const isPublic = Array.isArray(h.publicHolidayDays) && h.publicHolidayDays.indexOf(dayOfFestival) >= 0;
          out.push({
            id: h.id,
            km: h.km_label,
            en: h.en,
            zh: h.zh,
            isLunar: true,
            dayOfFestival,
            totalDays: h.totalDays || (s.kdEnd - s.kdStart + 1),
            isPublicHoliday: isPublic,
            observance: !isPublic
          });
          break;  // a given day only matches one span of the same holiday
        }
      }
    }
    return out.length ? out : null;
  }

  function get(m, d) { return _fixedFor(m, d); }

  function getByDate(dt) {
    const fixed = _fixedFor(dt.getMonth() + 1, dt.getDate()) || [];

    // Khmer-lunar holidays — only resolve if KhmerCalendar is loaded
    let lunar = [];
    if (typeof KhmerCalendar !== 'undefined') {
      const lun = KhmerCalendar.getKhmerDayMonthFromGregorian(dt);
      const found = _lunarFor(lun.km, lun.kd);
      if (found) lunar = found;
    }

    // Chinese-lunar holidays (Chinese New Year, Mid-Autumn, etc.)
    const chinese = _chineseFor(dt);

    const all = fixed.concat(lunar).concat(chinese);
    return all.length ? all : null;
  }

  function _toKhmerDigits(n) {
    if (typeof KhmerCalendar !== 'undefined' && KhmerCalendar.khmerNumber) {
      return KhmerCalendar.khmerNumber(n);
    }
    const KD = ['០','១','២','៣','៤','៥','៦','៧','៨','៩'];
    return String(n).split('').map(c => (c >= '0' && c <= '9') ? KD[+c] : c).join('');
  }

  function nameFor(h, lang) {
    if (!h) return '';
    const base = h[lang] || h.km || '';

    // Show "ថ្ងៃទី N / total" for ANY multi-day festival (fixed OR lunar) —
    // Khmer New Year 14/15/16, Bon Om Touk, Pchum Ben, CNY 3-day, etc.
    let body = base;
    if (h.dayOfFestival && h.totalDays && h.totalDays > 1) {
      const dStr = (lang === 'km') ? _toKhmerDigits(h.dayOfFestival) : String(h.dayOfFestival);
      const tStr = (lang === 'km') ? _toKhmerDigits(h.totalDays)     : String(h.totalDays);
      const dayPart = lang === 'km' ? `ថ្ងៃទី ${dStr}/${tStr}`
                    : lang === 'zh' ? `第${dStr}/${tStr}天`
                    :                  `Day ${dStr}/${tStr}`;
      body = `${base} (${dayPart})`;
    }

    // For the official public-holiday days, append "ឈប់សម្រាក" / "Public holiday"
    if (h.isPublicHoliday) {
      const badge = lang === 'km' ? ' • ឈប់សម្រាក'
                  : lang === 'zh' ? ' • 公众假日'
                  : ' • Public holiday';
      body += badge;
    }
    return body;
  }

  /**
   * Classifies a Gregorian date:
   *   'public'      — has at least one entry NOT marked `observance: true`
   *                   (any standard Cambodian public holiday)
   *   'observance'  — all entries are observance-only (Buddhist, cultural,
   *                   international, Chinese lunar — gold marker)
   *   null          — ordinary day
   *
   * Any entry — fixed-date or lunar — can be tagged `observance: true` to
   * downgrade it from the red public-holiday marker to the gold observance one.
   */
  function classifyDate(dt) {
    const all = getByDate(dt);
    if (!all || !all.length) return null;
    for (const h of all) {
      if (h.observance !== true) return 'public';
    }
    return 'observance';
  }

  return { get, getByDate, classifyDate, nameFor, FIXED, LUNAR };
})();
