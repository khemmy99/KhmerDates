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
        'មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា',
        'កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'
      ],
      gregMonthsShort: [
        'មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា',
        'កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ'
      ],
      lunarPrefix: 'ខែ',
      bePrefix: 'ព.ស.',
      waxing: 'កើត',
      waning: 'រោច',
      waxingShort: 'កើត',
      waningShort: 'រោច',
      dayPrefix: 'ថ្ងៃទី',
      monthPrefix: 'ខែ',
      yearPrefix: 'ឆ្នាំ',
      startDay: 'ថ្ងៃចាប់ផ្តើមសប្តាហ៍',
      sunday: 'អាទិត្យ',
      monday: 'ចន្ទ',
      about: 'អំពី',
      version: 'កំណែ',
      checkUpdate: 'ពិនិត្យកំណែថ្មី',
      aboutTagline: 'ប្រតិទិនច័ន្ទគតិខ្មែរ ដំណើរការដោយគ្មានអ៊ីនធឺណេត',
      developer: 'អ្នកអភិវឌ្ឍ',
      telegram: 'តេលេក្រាម',
      phone: 'ទូរស័ព្ទ',
      website: 'គេហទំព័រ',
      facebook: 'ហ្វេសប៊ុក',
      projectSupporter: 'អ្នកគាំទ្រគម្រោង',
      supporters: 'អ្នកគាំទ្រ',
      events: 'ព្រឹត្តិការណ៍',
      eventsFooter: 'ព្រឹត្តិការណ៍',
      noEvents: 'មិនមានព្រឹត្តិការណ៍',
      contact: 'ទាក់ទង',
      privacy: 'គោលនយោបាយឯកជន',
      dailyBlock: 'ការរំលឹកប្រចាំថ្ងៃ',
      astrology: 'ហោរាសាស្ត្រ',
      salary: 'ប្រាក់ខែ',
      bills: 'វិក្កយបត្រ',
      school: 'សាលា',
      // Women's health
      healthTracking: 'ការតាមដានសុខភាពស្ត្រី',
      enableHealthTracking: 'បើកការតាមដាន',
      periodFooter: 'រដូវ',
      activeProfile: 'ប្រវត្តិសកម្ម',
      logPeriod: 'កត់ត្រារដូវ',
      manageProfiles: 'គ្រប់គ្រងប្រវត្តិ',
      startDate: 'ថ្ងៃចាប់ផ្តើម',
      endDate: 'ថ្ងៃបញ្ចប់ (ស្រេចចិត្ត)',
      cancel: 'បោះបង់',
      save: 'រក្សាទុក',
      addProfile: 'បន្ថែមប្រវត្តិ',
      rename: 'ប្តូរឈ្មោះ',
      delete: 'លុប',
      myProfile: 'ខ្ញុំ',
      noProfiles: '— មិនមានប្រវត្តិ —',
      noProfilesYet: 'មិនទាន់មានប្រវត្តិ — សូមបន្ថែមមួយខាងក្រោម។',
      createProfileFirst: 'សូមបង្កើតប្រវត្តិមួយជាមុនសិន',
      renameProfilePrompt: 'ឈ្មោះថ្មី៖',
      newProfilePrompt: 'ឈ្មោះប្រវត្តិ៖',
      confirmDeleteProfile: 'លុបប្រវត្តិនេះ និងទិន្នន័យទាំងអស់របស់វា?',
      periodHistory: 'ប្រវត្តិរដូវ',
      noPeriodsLogged: 'មិនទាន់មានកំណត់ត្រា',
      edit: 'កែ',
      confirmDeletePeriod: 'លុបកំណត់ត្រារដូវនេះ?',
      resetAllData: 'លុបទិន្នន័យទាំងអស់',
      confirmResetAll: 'លុបទិន្នន័យសុខភាពស្ត្រីទាំងអស់ (ប្រវត្តិ + កំណត់ត្រា)? មិនអាចស្តារឡើងវិញបានទេ។',
      cycleLength: 'រយៈពេលវដ្ត',
      periodLength: 'រយៈពេលរដូវ',
      lastPeriod: 'រដូវចុងក្រោយ',
      days: 'ថ្ងៃ',
      healthPrivacyNote: 'ទិន្នន័យរក្សាទុកនៅលើឧបករណ៍របស់អ្នកប៉ុណ្ណោះ មិនបញ្ជូនទៅណាមួយឡើយ។',
      // Detail panel labels
      healthPeriod: 'រដូវ',
      healthPredictedPeriod: 'រដូវដែលរំពឹង',
      healthOvulation: 'ការបញ្ចេញពងពេលត្រូវ',
      healthFertile: 'រយៈពេលអាចមានកូន',
      healthDayN: 'ថ្ងៃទី {n}',
      healthCycleDayN: 'ថ្ងៃវដ្តទី {n}',
      healthDaysToNext: '~{n} ថ្ងៃទៀតដល់រដូវបន្ទាប់'
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
      waxingShort: '↑',
      waningShort: '↓',
      dayPrefix: '',
      monthPrefix: '',
      yearPrefix: '',
      startDay: 'Week starts on',
      sunday: 'Sunday',
      monday: 'Monday',
      about: 'About',
      version: 'Version',
      checkUpdate: 'Check for updates',
      aboutTagline: 'Khmer lunar calendar — works fully offline',
      developer: 'Developer',
      telegram: 'Telegram',
      phone: 'Phone',
      website: 'Website',
      facebook: 'Facebook',
      projectSupporter: 'Project supporter',
      supporters: 'Supporters',
      events: 'Events',
      eventsFooter: 'Events',
      noEvents: 'No events',
      contact: 'Contact',
      privacy: 'Privacy Policy',
      dailyBlock: 'Daily Block',
      astrology: 'Astrology',
      salary: 'Salary',
      bills: 'Bills',
      school: 'School',
      // Women's health
      healthTracking: "Women's health",
      enableHealthTracking: 'Enable tracking',
      periodFooter: 'Period',
      activeProfile: 'Active profile',
      logPeriod: 'Log period',
      manageProfiles: 'Manage profiles',
      startDate: 'Start date',
      endDate: 'End date (optional)',
      cancel: 'Cancel',
      save: 'Save',
      addProfile: 'Add profile',
      rename: 'Rename',
      delete: 'Delete',
      myProfile: 'Me',
      noProfiles: '— no profiles —',
      noProfilesYet: 'No profiles yet — add one below.',
      createProfileFirst: 'Create a profile first',
      renameProfilePrompt: 'New name:',
      newProfilePrompt: 'Profile name:',
      confirmDeleteProfile: 'Delete this profile and all its data?',
      periodHistory: 'Period history',
      noPeriodsLogged: 'No periods logged yet.',
      edit: 'Edit',
      confirmDeletePeriod: 'Delete this period entry?',
      resetAllData: 'Reset all data',
      confirmResetAll: "Reset ALL women's health data (profiles + logs)? This cannot be undone.",
      cycleLength: 'Cycle',
      periodLength: 'Period',
      lastPeriod: 'Last period',
      days: 'days',
      healthPrivacyNote: 'Data stays on your device only — never sent anywhere.',
      // Detail panel labels
      healthPeriod: 'Period',
      healthPredictedPeriod: 'Predicted period',
      healthOvulation: 'Ovulation',
      healthFertile: 'Fertile window',
      healthDayN: 'Day {n}',
      healthCycleDayN: 'Cycle day {n}',
      healthDaysToNext: '~{n} days to next period'
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
      waxingShort: '上',
      waningShort: '下',
      dayPrefix: '',
      monthPrefix: '',
      yearPrefix: '',
      startDay: '每周开始于',
      sunday: '星期日',
      monday: '星期一',
      about: '关于',
      version: '版本',
      checkUpdate: '检查更新',
      aboutTagline: '高棉农历日历 — 完全离线使用',
      developer: '开发者',
      telegram: 'Telegram',
      phone: '电话',
      website: '网站',
      facebook: 'Facebook',
      projectSupporter: '项目支持者',
      supporters: '支持者',
      events: '事件',
      eventsFooter: '事件',
      noEvents: '暂无事件',
      contact: '联系',
      privacy: '隐私政策',
      dailyBlock: '每日提醒',
      astrology: '宜忌',
      salary: '工资',
      bills: '账单',
      school: '学校',
      // Women's health
      healthTracking: '女性健康',
      enableHealthTracking: '启用追踪',
      periodFooter: '经期',
      activeProfile: '当前用户',
      logPeriod: '记录经期',
      manageProfiles: '管理用户',
      startDate: '开始日期',
      endDate: '结束日期（可选）',
      cancel: '取消',
      save: '保存',
      addProfile: '添加用户',
      rename: '重命名',
      delete: '删除',
      myProfile: '我',
      noProfiles: '— 暂无用户 —',
      noProfilesYet: '暂无用户 — 请在下方添加。',
      createProfileFirst: '请先创建用户',
      renameProfilePrompt: '新名称：',
      newProfilePrompt: '用户名称：',
      confirmDeleteProfile: '删除此用户及其所有数据？',
      periodHistory: '经期记录',
      noPeriodsLogged: '尚未记录任何经期。',
      edit: '编辑',
      confirmDeletePeriod: '删除此条经期记录？',
      resetAllData: '重置所有数据',
      confirmResetAll: '重置所有女性健康数据（用户 + 记录）？此操作无法撤消。',
      cycleLength: '周期',
      periodLength: '经期',
      lastPeriod: '上次经期',
      days: '天',
      healthPrivacyNote: '数据仅保存在您的设备上，绝不上传。',
      // Detail panel labels
      healthPeriod: '经期',
      healthPredictedPeriod: '预测经期',
      healthOvulation: '排卵日',
      healthFertile: '易孕期',
      healthDayN: '第{n}天',
      healthCycleDayN: '周期第{n}天',
      healthDaysToNext: '距下次经期~{n}天'
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
    // Also persist to Capacitor Preferences so the native Android widget can
    // read the user's preference from SharedPreferences (key: kh-cal-startday).
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences) {
      window.Capacitor.Plugins.Preferences.set({ key: 'kh-cal-startday', value: val }).catch(() => {});
    }
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    _lang = lang;
    localStorage.setItem('kh-cal-lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }

  function _applyThemeColorMeta(theme) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f0f2f8' : '#0a0c14';
  }

  function setTheme(theme) {
    _theme = theme;
    localStorage.setItem('kh-cal-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    _applyThemeColorMeta(theme);
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

  // Apply saved theme + lang on load
  function initTheme() {
    document.documentElement.setAttribute('data-theme', _theme);
    document.documentElement.setAttribute('lang', _lang);
    _applyThemeColorMeta(_theme);
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
