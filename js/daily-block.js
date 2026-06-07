// ===== Daily Block =====
// Practical reminders + light astrology shown in the day-detail panel.
// All data is intentionally simple and easy to customize — edit the tables
// below to change the reminders.

const DailyBlock = (() => {

  // ----- Astrology (one positive + one cautionary per weekday) -----
  // dow: 0=Sun .. 6=Sat
  const ASTRO_BY_WEEKDAY = [
    /* Sun */ { good: { km: 'ល្អសម្រាប់សូត្រធម៌ និងបុណ្យ',         en: 'Good day for prayer and merit',          zh: '宜祈福、积福' },
                bad:  { km: 'គួរចៀសវាងធ្វើដំណើរឆ្ងាយ',           en: 'Avoid long-distance travel',              zh: '忌远行' } },
    /* Mon */ { good: { km: 'ល្អសម្រាប់ការសិក្សា',                  en: 'Good day for study',                     zh: '宜学习' },
                bad:  { km: 'គួរចៀសវាងចុះកិច្ចសន្យាសំខាន់ៗ',      en: 'Avoid signing important contracts',      zh: '忌签合同' } },
    /* Tue */ { good: { km: 'ល្អសម្រាប់ចាប់ផ្តើមការងារថ្មី',         en: 'Good day to start new work',             zh: '宜开工' },
                bad:  { km: 'គួរចៀសវាងជម្លោះ',                     en: 'Avoid disputes and arguments',           zh: '忌争执' } },
    /* Wed */ { good: { km: 'ល្អសម្រាប់ការប្រជុំ និងពិភាក្សា',       en: 'Good day for meetings',                  zh: '宜会议' },
                bad:  { km: 'គួរចៀសវាងធ្វើដំណើរផ្លូវឆ្ងាយ',         en: 'Avoid long journeys',                    zh: '忌远行' } },
    /* Thu */ { good: { km: 'ល្អសម្រាប់ការធ្វើបុណ្យ',                en: 'Good day for ceremonies',                zh: '宜祭祀' },
                bad:  { km: 'គួរចៀសវាងចាប់ផ្តើមអ្វីថ្មី',           en: 'Avoid starting new ventures',            zh: '忌动土' } },
    /* Fri */ { good: { km: 'ល្អសម្រាប់ការធ្វើដំណើរ',                en: 'Good day for travel',                    zh: '宜出行' },
                bad:  { km: 'គួរចៀសវាងពិធីរៀបការ',                en: 'Avoid wedding ceremonies',               zh: '忌嫁娶' } },
    /* Sat */ { good: { km: 'ល្អសម្រាប់ការសម្រាក',                 en: 'Good day for rest and family',           zh: '宜休息、聚会' },
                bad:  { km: 'គួរចៀសវាងការសម្រេចចិត្តធំៗ',          en: 'Avoid big decisions',                    zh: '忌重大决定' } }
  ];

  // ----- Recurring reminders -----
  // Each rule has a `match(dt)` returning bool and a translated label.
  const RULES = [
    {
      kind: 'salary',
      icon: '💵',
      match: dt => dt.getDate() === 25,
      label: { km: 'ថ្ងៃបើកប្រាក់ខែ (២៥)',         en: 'Salary day (25th)',                 zh: '发薪日（25号）' }
    },
    {
      kind: 'salary',
      icon: '💵',
      match: dt => {
        const last = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
        return dt.getDate() === last;
      },
      label: { km: 'ការរំលឹកបើកប្រាក់ខែចុងខែ',     en: 'End-of-month payday',               zh: '月末发薪日' }
    },
    {
      kind: 'bills',
      icon: '📋',
      match: dt => dt.getDate() === 5,
      label: { km: 'វិក្កយបត្រអគ្គិសនី',              en: 'Electricity bill due today',         zh: '电费今日到期' }
    },
    {
      kind: 'bills',
      icon: '💧',
      match: dt => dt.getDate() === 10,
      label: { km: 'វិក្កយបត្រទឹក',                    en: 'Water bill due today',               zh: '水费今日到期' }
    },
    {
      kind: 'school',
      icon: '📚',
      // First Monday of academic-quarter months: Jan / Apr / Jul / Oct
      match: dt => {
        const academicMonths = [0, 3, 6, 9];
        if (!academicMonths.includes(dt.getMonth())) return false;
        if (dt.getDay() !== 1) return false; // Monday only
        return dt.getDate() <= 7;            // first Monday of month
      },
      label: { km: 'ចាប់ផ្តើមសប្តាហ៍ប្រឡង',           en: 'School exam week starts',            zh: '学校考试周开始' }
    }
  ];

  function _astrologyFor(dt, lang) {
    const a = ASTRO_BY_WEEKDAY[dt.getDay()];
    return [
      { icon: '✅', text: a.good[lang] || a.good.en, kind: 'astro-good' },
      { icon: '⚠️', text: a.bad[lang]  || a.bad.en,  kind: 'astro-bad'  }
    ];
  }

  function _recurringFor(dt, lang) {
    const items = [];
    for (const rule of RULES) {
      if (rule.match(dt)) {
        items.push({
          icon: rule.icon,
          text: rule.label[lang] || rule.label.en,
          kind: rule.kind
        });
      }
    }
    return items;
  }

  /**
   * Returns `{ astrology, salary, bills, school }` — each an array of
   * `{ icon, text, kind }` objects. Empty array means no items for that group.
   */
  function getForDate(dt, lang) {
    const astrology = _astrologyFor(dt, lang || 'km');
    const recurring = _recurringFor(dt, lang || 'km');
    return {
      astrology,
      salary: recurring.filter(r => r.kind === 'salary'),
      bills:  recurring.filter(r => r.kind === 'bills'),
      school: recurring.filter(r => r.kind === 'school')
    };
  }

  return { getForDate };
})();
