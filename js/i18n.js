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
      weekdaysShort: ['\u17A2\u17B6','\u1785','\u17A2\u1784','\u1796\u17BB','\u1796\u17D2\u179A','\u179F\u17BB','\u179F\u17C5'],
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
      place: 'ទីកន្លែង',
      sunday: 'អាទិត្យ',
      monday: 'ចន្ទ',
      about: 'អំពី',
      more: 'ច្រើនទៀត',
      version: 'កំណែ',
      checkUpdate: 'ពិនិត្យកំណែថ្មី',
      aboutTagline: 'ប្រតិទិនច័ន្ទគតិខ្មែរ ដំណើរការដោយគ្មានអ៊ីនធឺណេត',
      developer: 'អ្នកអភិវឌ្ឍ',
      telegram: 'តេលេក្រាម',
      phone: 'ទូរស័ព្ទ',
      website: 'គេហទំព័រ',
      facebook: 'ហ្វេសប៊ុក',
      projectSupporter: 'អ្នកគ្រប់គ្រងគម្រោង',
      supporters: 'អ្នកគាំទ្រ',
      projectTeam: 'ក្រុមការងារគម្រោង',
      // Credits. Khmer script for the Khmer UI, romanised for en/zh.
      devName: 'ខែម មី',
      pmName: 'យុត ខេមរា',
      supporter1: 'សៅ សាណាត',
      supporter2: 'យុត និមល់',
      supporter3: 'ខែម ចន្នី',
      supporter4: 'ឈឿន ម៉ាណែត',
      events: 'ព្រឹត្តិការណ៍',
      eventsFooter: 'ព្រឹត្តិការណ៍',
      noEvents: 'មិនមានព្រឹត្តិការណ៍',
      filterAll: 'ទាំងអស់',
      filterPublic: 'ថ្ងៃឈប់',
      filterObservance: 'ថ្ងៃសំខាន់',
      publicHoliday: 'ថ្ងៃឈប់សម្រាក',
      observanceDay: 'ថ្ងៃសំខាន់',
      dayOfN: 'ថ្ងៃទី {n}/{t}',
      copy: 'ចម្លង',
      copied: 'បានចម្លង',
      copyFailed: 'ចម្លងមិនបាន',
      lunarCal: 'ចន្ទគតិ',
      solarCal: 'សុរិយគតិ',
      chineseCal: 'ចន្ទគតិចិន',
      dayInfo: 'ព័ត៌មានថ្ងៃ',
      upNext: 'បន្ទាប់',
      inNDays: 'នៅសល់ {n} ថ្ងៃទៀត',
      tomorrow: 'ថ្ងៃស្អែក',
      share: 'ចែករំលែក',
      weather: 'អាកាសធាតុ',
      weatherFooter: 'អាកាសធាតុ',
      useMyLocation: 'ប្រើទីតាំងរបស់ខ្ញុំ',
      myLocation: 'ទីតាំងរបស់ខ្ញុំ',
      loading: 'កំពុងផ្ទុក…',
      gpsRequesting: 'កំពុងស្នើទីតាំង…',
      gpsDenied: 'មិនអាចទទួលទីតាំង។ សូមជ្រើសរើសទីក្រុង។',
      gpsOff: 'ទីតាំងត្រូវបានបិទ។ សូមបើកទីតាំងក្នុងការកំណត់ឧបករណ៍។',
      gpsNoPermission: 'មិនបានអនុញ្ញាតទីតាំង។ សូមអនុញ្ញាតក្នុងការកំណត់កម្មវិធី។',
      gpsTimeout: 'រកទីតាំងមិនទាន់ពេល។ សូមចុចម្តងទៀត។',
      weatherError: 'មិនអាចទាញយកទិន្នន័យអាកាសធាតុ។ សូមពិនិត្យការតភ្ជាប់។',
      hourly: 'ម៉ោងបន្ទាប់',
      daily: '៧ ថ្ងៃខាងមុខ',
      wxNow: 'ឥឡូវ',
      wxToday: 'ថ្ងៃនេះ',
      wxFeels: 'មានអារម្មណ៍',
      wxHumidity: 'សំណើម',
      wxWind: 'ខ្យល់',
      weatherCredit: 'ទិន្នន័យដោយ Open-Meteo',
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
      pickStartHint: 'ចុចថ្ងៃដំបូងនៃរដូវ',
      pickEndHint: 'ចុចថ្ងៃចុងក្រោយ ឬរក្សាទុក បើនៅមិនទាន់ចប់',
      ongoing: 'កំពុងមាន',
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
      nextPeriod: 'រដូវបន្ទាប់ (ប៉ាន់ស្មាន)',
      days: 'ថ្ងៃ',
      healthPrivacyNote: 'ទិន្នន័យរក្សាទុកនៅលើឧបករណ៍របស់អ្នកប៉ុណ្ណោះ មិនបញ្ជូនទៅណាមួយឡើយ។',
      // Detail panel labels
      healthPeriod: 'រដូវ',
      healthPredictedPeriod: 'រដូវដែលរំពឹង',
      healthOvulation: 'ការបញ្ចេញពងពេលត្រូវ',
      healthFertile: 'រយៈពេលអាចមានកូន',
      healthDayN: 'ថ្ងៃទី {n}',
      healthCycleDayN: 'ថ្ងៃវដ្តទី {n}',
      healthDaysToNext: '~{n} ថ្ងៃទៀតដល់រដូវបន្ទាប់',
      // ថ្ងៃសីល — Buddhist observance days
      silDay: 'ថ្ងៃសីល',
      silFull: 'ថ្ងៃពេញបូណ៌មី',
      silNew: 'ថ្ងៃដាច់ខែ',
      silQuarter: 'ថ្ងៃសីលតូច',
      showSilDays: 'បង្ហាញថ្ងៃសីល',
      dayDigits: 'លេខថ្ងៃ',
      on: 'បើក',
      off: 'បិទ',
      // ការជូនដំណឹង — daily reminders
      reminders: 'ការជូនដំណឹង',
      notifDaily: 'ថ្ងៃនេះ រាល់ព្រឹក',
      notifMorningTime: 'ម៉ោងព្រឹក',
      notifSil: 'ថ្ងៃសីល (ល្ងាចមុន)',
      notifHoliday: 'ថ្ងៃបុណ្យ (ល្ងាចមុន)',
      notifEveningTime: 'ម៉ោងល្ងាច',
      notifHint: 'បើមិនទទួលបានការជូនដំណឹង សូមអនុញ្ញាតវានៅក្នុងការកំណត់ទូរស័ព្ទ។'
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
      weekdaysShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
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
      place: 'Place',
      sunday: 'Sunday',
      monday: 'Monday',
      about: 'About',
      more: 'More',
      version: 'Version',
      checkUpdate: 'Check for updates',
      aboutTagline: 'Khmer lunar calendar — works fully offline',
      developer: 'Developer',
      telegram: 'Telegram',
      phone: 'Phone',
      website: 'Website',
      facebook: 'Facebook',
      projectSupporter: 'Project Manager',
      supporters: 'Supporters',
      projectTeam: 'Project Team',
      devName: 'Khem My',
      pmName: 'Yuth Khemara',
      supporter1: 'Sao Sanath',
      supporter2: 'Yuth Nimorl',
      supporter3: 'Khem Channy',
      supporter4: 'Chhoeurn Maneth',
      events: 'Events',
      eventsFooter: 'Events',
      noEvents: 'No events',
      filterAll: 'All',
      filterPublic: 'Days off',
      filterObservance: 'Observances',
      publicHoliday: 'Public holiday',
      observanceDay: 'Observance',
      dayOfN: 'Day {n} of {t}',
      copy: 'Copy',
      copied: 'Copied',
      copyFailed: 'Copy failed',
      lunarCal: 'Lunar',
      solarCal: 'Solar',
      chineseCal: 'Chinese lunar',
      dayInfo: 'Day info',
      upNext: 'Coming up',
      inNDays: 'in {n} days',
      tomorrow: 'Tomorrow',
      share: 'Share',
      weather: 'Weather',
      weatherFooter: 'Weather',
      useMyLocation: 'Use my location',
      myLocation: 'My location',
      loading: 'Loading…',
      gpsRequesting: 'Requesting location…',
      gpsDenied: 'Location unavailable. Pick a city above.',
      gpsOff: 'Location is switched off. Turn it on in your device settings.',
      gpsNoPermission: 'Location permission denied. Allow it in app settings.',
      gpsTimeout: 'Could not get a fix in time. Tap to try again.',
      weatherError: 'Could not load weather. Check your connection.',
      hourly: 'Hourly',
      daily: '7-day forecast',
      wxNow: 'Now',
      wxToday: 'Today',
      wxFeels: 'Feels',
      wxHumidity: 'Humidity',
      wxWind: 'Wind',
      weatherCredit: 'Data by Open-Meteo',
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
      pickStartHint: 'Tap the first day of the period',
      pickEndHint: 'Tap the last day, or save now if it is still going',
      ongoing: 'ongoing',
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
      nextPeriod: 'Next period (est.)',
      days: 'days',
      healthPrivacyNote: 'Data stays on your device only — never sent anywhere.',
      // Detail panel labels
      healthPeriod: 'Period',
      healthPredictedPeriod: 'Predicted period',
      healthOvulation: 'Ovulation',
      healthFertile: 'Fertile window',
      healthDayN: 'Day {n}',
      healthCycleDayN: 'Cycle day {n}',
      healthDaysToNext: '~{n} days to next period',
      // ថ្ងៃសីល — Buddhist observance days
      silDay: 'Buddhist holy day',
      silFull: 'Full moon',
      silNew: 'New moon',
      silQuarter: 'Half moon',
      showSilDays: 'Show holy days',
      dayDigits: 'Day numbers',
      on: 'On',
      off: 'Off',
      // Daily reminders
      reminders: 'Reminders',
      notifDaily: 'Today, every morning',
      notifMorningTime: 'Morning time',
      notifSil: 'Holy day (evening before)',
      notifHoliday: 'Holidays (evening before)',
      notifEveningTime: 'Evening time',
      notifHint: 'If nothing arrives, allow notifications for this app in your device settings.'
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
      weekdaysShort: ['周日','周一','周二','周三','周四','周五','周六'],
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
      place: '地点',
      sunday: '星期日',
      monday: '星期一',
      about: '关于',
      more: '更多',
      version: '版本',
      checkUpdate: '检查更新',
      aboutTagline: '高棉农历日历 — 完全离线使用',
      developer: '开发者',
      telegram: 'Telegram',
      phone: '电话',
      website: '网站',
      facebook: 'Facebook',
      projectSupporter: '项目经理',
      supporters: '支持者',
      projectTeam: '项目团队',
      devName: 'Khem My',
      pmName: 'Yuth Khemara',
      supporter1: 'Sao Sanath',
      supporter2: 'Yuth Nimorl',
      supporter3: 'Khem Channy',
      supporter4: 'Chhoeurn Maneth',
      events: '事件',
      eventsFooter: '事件',
      noEvents: '暂无事件',
      filterAll: '全部',
      filterPublic: '假日',
      filterObservance: '纪念日',
      publicHoliday: '公众假日',
      observanceDay: '纪念日',
      dayOfN: '第{n}/{t}天',
      copy: '复制',
      copied: '已复制',
      copyFailed: '复制失败',
      lunarCal: '高棉阴历',
      solarCal: '公历',
      chineseCal: '农历',
      dayInfo: '日期信息',
      upNext: '即将到来',
      inNDays: '还有{n}天',
      tomorrow: '明天',
      share: '分享',
      weather: '天气',
      weatherFooter: '天气',
      useMyLocation: '使用我的位置',
      myLocation: '我的位置',
      loading: '加载中…',
      gpsRequesting: '正在获取位置…',
      gpsDenied: '无法获取位置，请选择城市。',
      gpsOff: '定位已关闭，请在系统设置中开启。',
      gpsNoPermission: '定位权限被拒绝，请在应用设置中允许。',
      gpsTimeout: '定位超时，请再试一次。',
      weatherError: '无法加载天气，请检查网络。',
      hourly: '逐小时',
      daily: '未来7天',
      wxNow: '现在',
      wxToday: '今天',
      wxFeels: '体感',
      wxHumidity: '湿度',
      wxWind: '风速',
      weatherCredit: '数据来自 Open-Meteo',
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
      pickStartHint: '点选经期第一天',
      pickEndHint: '点选最后一天，若仍在进行可直接保存',
      ongoing: '进行中',
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
      nextPeriod: '下次经期（预计）',
      days: '天',
      healthPrivacyNote: '数据仅保存在您的设备上，绝不上传。',
      // Detail panel labels
      healthPeriod: '经期',
      healthPredictedPeriod: '预测经期',
      healthOvulation: '排卵日',
      healthFertile: '易孕期',
      healthDayN: '第{n}天',
      healthCycleDayN: '周期第{n}天',
      healthDaysToNext: '距下次经期~{n}天',
      // ថ្ងៃសីល — Buddhist observance days
      silDay: '佛教斋日',
      silFull: '满月',
      silNew: '新月',
      silQuarter: '弦月',
      showSilDays: '显示斋日',
      dayDigits: '日期数字',
      on: '开',
      off: '关',
      // 每日提醒
      reminders: '提醒',
      notifDaily: '每天早晨提醒今天',
      notifMorningTime: '早晨时间',
      notifSil: '斋日（前一晚）',
      notifHoliday: '节日（前一晚）',
      notifEveningTime: '晚上时间',
      notifHint: '若收不到提醒，请在设备设置中允许本应用发送通知。'
    }
  };

  let _lang = localStorage.getItem('kh-cal-lang') || 'km';
  let _theme = localStorage.getItem('kh-cal-theme') || 'dark';
  let _startDay = localStorage.getItem('kh-cal-startday') || 'mon';
  // ថ្ងៃសីល markers in the month grid. On by default — the Buddhist observance
  // days are the reason most people reach for a Khmer lunar calendar at all.
  let _silDays = localStorage.getItem('kh-cal-sildays') !== 'off';
  // Digits for the Gregorian day number in the grid and day sheet:
  // 'latin' (1 2 3, the default) or 'khmer' (១ ២ ៣).
  let _dayDigits = localStorage.getItem('kh-cal-daydigits') === 'khmer' ? 'khmer' : 'latin';

  function getLang() { return _lang; }
  function getTheme() { return _theme; }
  function getStartDay() { return _startDay; }
  function getSilDays() { return _silDays; }
  function getDayDigits() { return _dayDigits; }

  function setSilDays(on) {
    _silDays = !!on;
    localStorage.setItem('kh-cal-sildays', _silDays ? 'on' : 'off');
  }

  function setDayDigits(v) {
    _dayDigits = v === 'khmer' ? 'khmer' : 'latin';
    localStorage.setItem('kh-cal-daydigits', _dayDigits);
  }

  // The Android widgets and the reminder scheduler are native code and cannot
  // read localStorage, so anything they need is mirrored into Capacitor
  // Preferences — which lands in the CapacitorStorage shared-preferences file
  // they read by key. A no-op on the web build.
  function mirrorToNative(key, value) {
    const prefs = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Preferences;
    if (prefs) prefs.set({ key, value }).catch(() => {});
  }

  function setStartDay(val) {
    _startDay = val;
    localStorage.setItem('kh-cal-startday', val);
    mirrorToNative('kh-cal-startday', val);
  }

  function setLang(lang) {
    if (!translations[lang]) return;
    _lang = lang;
    localStorage.setItem('kh-cal-lang', lang);
    // The reminders are worded natively, so they need the language too.
    mirrorToNative('kh-cal-lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }

  // The app's theme is chosen in-app and does not follow the system, so every
  // theme-color meta has to be rewritten. querySelector would return only the
  // first, and any left carrying a prefers-color-scheme media query would still
  // win whenever the system happened to match it — which is how a dark app on a
  // light phone ended up with a light strip behind the status bar.
  function _applyThemeColorMeta(theme) {
    const colour = theme === 'light' ? '#f0f2f8' : '#0a0c14';
    document.querySelectorAll('meta[name="theme-color"]').forEach(meta => {
      meta.content = colour;
      meta.removeAttribute('media');
    });
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

  /**
   * Pushes the settings the native side reads across to Preferences.
   *
   * An install that predates the mirror has them only in localStorage, so the
   * scheduler and the widgets would read their defaults forever. Called again
   * from the UI's startup because the Capacitor bridge is not guaranteed to be
   * ready while this file is still being parsed.
   */
  function syncToNative() {
    mirrorToNative('kh-cal-lang', _lang);
    mirrorToNative('kh-cal-startday', _startDay);
  }

  syncToNative();

  return { getLang, getTheme, getStartDay, getSilDays, getDayDigits, setLang, setTheme, setStartDay, setSilDays, setDayDigits, mirrorToNative, syncToNative, t, weekday, monthName, monthShort, gregMonth, gregMonthShort, updateStaticTexts, translations };
})();
