// ===== Cambodian Public Holidays (fixed Gregorian dates) =====
// Source: official Cambodian public holiday list.
// Names are provided in Khmer / English / Chinese for the i18n layer.

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
    { m: 4,  d: 14, km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
                    en: 'Khmer New Year',
                    zh: '柬埔寨新年' },
    { m: 4,  d: 15, km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
                    en: 'Khmer New Year',
                    zh: '柬埔寨新年' },
    { m: 4,  d: 16, km: 'បុណ្យចូលឆ្នាំប្រពៃណីខ្មែរ',
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
                    zh: '柬埔寨和平日' }
  ];

  // Index by "MM-DD" for O(1) lookup
  const _index = {};
  FIXED.forEach(h => {
    const key = h.m + '-' + h.d;
    (_index[key] = _index[key] || []).push(h);
  });

  function get(m, d) {
    return _index[m + '-' + d] || null;
  }

  function getByDate(dt) {
    return get(dt.getMonth() + 1, dt.getDate());
  }

  function nameFor(h, lang) {
    return (h && (h[lang] || h.km)) || '';
  }

  return { get, getByDate, nameFor, FIXED };
})();
