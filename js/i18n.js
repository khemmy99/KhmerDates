// ===== Internationalization (i18n) =====
const I18n = (() => {
  const translations = {
    km: {
      settings: 'ការកំណត់',
      theme: 'រូបរាង',
      dark: 'ងងឹត',
      light: 'ភ្លឺ',
      language: 'ភាសា',
      today: 'ថ្ងៃនេះ',
      install: 'ដំឡើង',
      installMsg: '📲 ដំឡើង ប្រតិទិនខ្មែរ',
      months: [
        'មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា',
        'កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'
      ],
      monthsShort: [
        'មក','កុម','មីន','មេស','ឧស','មិថ',
        'កក','សីហ','កញ','តុល','វិច','ធ្នូ'
      ],
      weekdays: [
        '\u17A4\u1791\u17B7\u178F\u17D2\u1799',
        '\u1785\u1793\u17D2\u1791',
        '\u17A2\u1784\u17D2\u1782\u17B6\u179A',
        '\u1796\u17BB\u1792',
        '\u1796\u17D2\u179A\u17A0\u179F\u17D2\u1794\u178F\u17B7\u17CD',
        '\u179F\u17BB\u1780\u17D2\u179A',
        '\u179F\u17C5\u179A\u17CD'
      ],
      gregMonths: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      gregMonthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      lunarPrefix: 'ខែ',
      bePrefix: 'ព.ស.',
      waxing: 'កើត',
      waning: 'រោច',
      dayPrefix: 'ថ្ងៃទី',
      monthPrefix: 'ខែ',
      yearPrefix: 'ឆ្នាំ',
      startDay: 'ថ្ងៃចាប់ផ្តើមសប្តាហ៍',
      sunday: 'អាទិត្យ',
      monday: 'ចន្ទ'
    },
    en: {
      settings: 'Settings',
      theme: 'Theme',
      dark: 'Dark',
      light: 'Light',
      language: 'Language',
      today: 'Today',
      install: 'Install',
      installMsg: '📲 Install Khmer Calendar',
      months: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      monthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      weekdays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
      gregMonths: [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
      ],
      gregMonthsShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
      lunarPrefix: '',
      bePrefix: 'B.E.',
      waxing: 'Waxing',
      waning: 'Waning',
      dayPrefix: '',
      monthPrefix: '',
      yearPrefix: '',
      startDay: 'Week starts on',
      sunday: 'Sunday',
      monday: 'Monday'
    },
    zh: {
      settings: '设置',
      theme: '主题',
      dark: '深色',
      light: '浅色',
      language: '语言',
      today: '今天',
      install: '安装',
      installMsg: '📲 安装高棉日历',
      months: [
        '一月','二月','三月','四月','五月','六月',
        '七月','八月','九月','十月','十一月','十二月'
      ],
      monthsShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      weekdays: ['日','一','二','三','四','五','六'],
      gregMonths: [
        '一月','二月','三月','四月','五月','六月',
        '七月','八月','九月','十月','十一月','十二月'
      ],
      gregMonthsShort: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
      lunarPrefix: '',
      bePrefix: '佛历',
      waxing: '上弦',
      waning: '下弦',
      dayPrefix: '',
      monthPrefix: '',
      yearPrefix: '',
      startDay: '每周开始于',
      sunday: '星期日',
      monday: '星期一'
    }
  };

  let _lang = localStorage.getItem('kh-cal-lang') || 'km';
  let _theme = localStorage.getItem('kh-cal-theme') || 'dark';
  let _startDay = localStorage.getItem('kh-cal-startday') || 'mon';

  function getLang() { return _lang; }
  function getTheme() { return _theme; }
  function getStartDay() { return _startDay; }

  function setStartDay(val) {
    _startDay = val;
    localStorage.setItem('kh-cal-startday', val);
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    _lang = lang;
    localStorage.setItem('kh-cal-lang', lang);
  }

  function setTheme(theme) {
    _theme = theme;
    localStorage.setItem('kh-cal-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f0f2f8' : '#0a0c14';
  }

  function t(key) {
    const dict = translations[_lang] || translations.km;
    return dict[key] !== undefined ? dict[key] : key;
  }

  function weekday(dow) {
    const dict = translations[_lang] || translations.km;
    return dict.weekdays[dow];
  }

  function monthName(idx) {
    const dict = translations[_lang] || translations.km;
    return dict.months[idx];
  }

  function monthShort(idx) {
    const dict = translations[_lang] || translations.km;
    return dict.monthsShort[idx];
  }

  function gregMonth(idx) {
    const dict = translations[_lang] || translations.km;
    return dict.gregMonths[idx];
  }

  function gregMonthShort(idx) {
    const dict = translations[_lang] || translations.km;
    return dict.gregMonthsShort[idx];
  }

  // Apply saved theme on load
  function initTheme() {
    document.documentElement.setAttribute('data-theme', _theme);
  }

  // Update data-i18n elements
  function updateStaticTexts() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = t(key);
      if (val) el.textContent = val;
    });
  }

  initTheme();

  return { getLang, getTheme, getStartDay, setLang, setTheme, setStartDay, t, weekday, monthName, monthShort, gregMonth, gregMonthShort, updateStaticTexts, translations };
})();
