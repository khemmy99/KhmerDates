// ===== ផ្សំផ្គុំកូនប្រុសស្រី — Chinese gender chart (清宫生男生女表) =====
// Folk tradition, not medicine: the chart reads a boy or a girl from the
// mother's Chinese lunar age (虚岁) and the Chinese lunar month of conception.
//
// Table checked against two independent text copies
// (chinesegendercalendar.org, yourchineseastrology.com); a widely shared image
// copy disagrees only at age 31 / month 11, where both text copies say girl.

const BabyGender = (() => {
  // One string per lunar age 18..45; character i = lunar month i+1
  const CHART = {
    18: 'GBGBBBBBBBBB', 19: 'BGBGGBBBBBGG', 20: 'GBGBBBBBBGBB',
    21: 'BGGGGGGGGGGG', 22: 'GBBGBGGBGGGG', 23: 'BBGBBGBGBBBG',
    24: 'BGBBGBBGGGGG', 25: 'GBBGGBGBBBBB', 26: 'BGBGGBGBGGGG',
    27: 'GBGBGGBBBBGB', 28: 'BGBGGGBBBBGG', 29: 'GBGGBBBBBGGG',
    30: 'BGGGGGGGGGBB', 31: 'BGBGGGGGGGGB', 32: 'BGBGGGGGGGGB',
    33: 'GBGBGGGBGGGB', 34: 'BGBGGGGGGGBB', 35: 'BBGBGGGBGGBB',
    36: 'GBBGBGGGBBBB', 37: 'BGBBGBGBGBGB', 38: 'GBGBBGBGBGBG',
    39: 'BGBBBGGBGBGG', 40: 'GBGBGBBGBGBG', 41: 'BGBGBGBBGBGB',
    42: 'GBGBGBGBBGBG', 43: 'BGBGBGBGBBBB', 44: 'BBGBBBGBGBGG',
    45: 'GBBGGGBGBGBB'
  };
  const MIN_AGE = 18, MAX_AGE = 45;

  /**
   * Prediction for a conception date.
   *   birth, conception: Date objects
   * Returns { age, month, isLeap, gender: 'B' | 'G' | null }
   * gender is null when the lunar age falls outside 18..45.
   * Lunar age (虚岁) = Chinese lunar year of conception - lunar year of birth + 1.
   * A leap month counts as the month it repeats, as the chart is usually read.
   */
  function predict(birth, conception) {
    const b = ChineseCalendar.fromDate(birth);
    const c = ChineseCalendar.fromDate(conception);
    const age = c.year - b.year + 1;
    const row = CHART[age];
    return { age, month: c.month, isLeap: c.isLeap, gender: row ? row[c.month - 1] : null };
  }

  /**
   * The next `count` Chinese lunar months from `from`, each with its
   * Gregorian start/end dates and the prediction for that month.
   */
  function planMonths(birth, from, count) {
    const out = [];
    let cur = null;
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    for (let i = 0; i < 31 * (count + 1) && out.length <= count; i++) {
      const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const c = ChineseCalendar.fromDate(d);
      const key = c.year + '-' + c.month + (c.isLeap ? 'L' : '');
      if (!cur || cur.key !== key) {
        cur = { key, year: c.year, month: c.month, isLeap: c.isLeap, start: d, end: d, monthName: c.monthName };
        out.push(cur);
      } else {
        cur.end = d;
      }
    }
    return out.slice(0, count).map(m => Object.assign(m, predict(birth, m.start)));
  }

  // Common Khmer names: [Khmer, Latin spelling, meaning (km), meaning (en)]
  const NAMES = {
    B: [
      ['ដារ៉ា', 'Dara', 'ផ្កាយ', 'star'],
      ['សុវណ្ណ', 'Sovann', 'មាស', 'gold'],
      ['វិចិត្រ', 'Vichet', 'ស្រស់ស្អាតប្លែក', 'wonderful'],
      ['វិសាល', 'Visal', 'ធំទូលាយ', 'vast'],
      ['បញ្ញា', 'Panha', 'ប្រាជ្ញា', 'wisdom'],
      ['សម្បត្តិ', 'Sambath', 'ទ្រព្យសម្បត្តិ', 'wealth'],
      ['វិបុល', 'Vibol', 'បរិបូណ៌', 'abundant'],
      ['កុសល', 'Kosal', 'អំពើល្អ', 'good deeds'],
      ['ពិសិដ្ឋ', 'Piseth', 'ពិសេសខ្ពង់ខ្ពស់', 'sacred, special'],
      ['រិទ្ធី', 'Rithy', 'ឫទ្ធានុភាព', 'power'],
      ['ចំរើន', 'Chamroeun', 'ការរីកចម្រើន', 'prosperity'],
      ['វុទ្ធី', 'Vuthy', 'ការលូតលាស់', 'growth'],
      ['បូរ៉ា', 'Bora', 'ប្រសើរ', 'excellent'],
      ['វីរៈ', 'Vireak', 'ក្លាហាន', 'brave'],
      ['ឧត្តម', 'Udom', 'ខ្ពង់ខ្ពស់បំផុត', 'supreme'],
      ['អរុណ', 'Arun', 'ពេលអរុណរះ', 'dawn'],
      ['សុរិយា', 'Soriya', 'ព្រះអាទិត្យ', 'sun'],
      ['រតនៈ', 'Ratanak', 'កែវមណី', 'gem'],
      ['សុខា', 'Sokha', 'សេចក្ដីសុខ', 'happiness'],
      ['វឌ្ឍនា', 'Vathana', 'ការចម្រើន', 'progress'],
      ['សុធា', 'Sothea', 'ទឹកអម្រឹត', 'nectar'],
      ['ពេជ្រ', 'Pich', 'ត្បូងពេជ្រ', 'diamond'],
      ['សុវត្ថិ', 'Sovath', 'សុវត្ថិភាព', 'well-being'],
      ['សីហា', 'Seyha', 'តោ', 'lion'],
      ['វិទូ', 'Vitou', 'អ្នកប្រាជ្ញ', 'scholar'],
      ['ភក្ដី', 'Pheakdey', 'ភក្ដីភាព', 'loyalty'],
      ['មុនី', 'Mony', 'អ្នកប្រាជ្ញ', 'sage'],
      ['សុផល', 'Sophal', 'ផលល្អ', 'good fortune'],
      ['សំណាង', 'Samnang', 'សំណាងល្អ', 'luck']
    ],
    G: [
      ['បុប្ផា', 'Bopha', 'ផ្កា', 'flower'],
      ['សោភា', 'Sophea', 'សម្រស់', 'beauty'],
      ['ធីតា', 'Thida', 'បុត្រី', 'daughter'],
      ['ចរិយា', 'Charya', 'ចរិតល្អ', 'good conduct'],
      ['រតនា', 'Ratana', 'កែវ', 'gem'],
      ['លក្ខិណា', 'Leakena', 'លក្ខណៈល្អ', 'fine qualities'],
      ['សុជាតា', 'Socheata', 'កើតក្នុងត្រកូលល្អ', 'well-born'],
      ['រស្មី', 'Raksmey', 'ពន្លឺ', 'ray of light'],
      ['មាលា', 'Mealea', 'កម្រងផ្កា', 'garland'],
      ['កុលាប', 'Kolab', 'ផ្កាកុលាប', 'rose'],
      ['សុគន្ធា', 'Sokunthea', 'ក្លិនក្រអូប', 'fragrant'],
      ['នារី', 'Neary', 'ស្ត្រី', 'woman'],
      ['ទេវី', 'Tevy', 'ទេពធីតា', 'goddess'],
      ['អប្សរា', 'Apsara', 'ទេពអប្សរា', 'celestial dancer'],
      ['ច័ន្ទរស្មី', 'Chanraksmey', 'រស្មីព្រះចន្ទ', 'moonlight'],
      ['ស្រីពេជ្រ', 'Sreypich', 'ត្បូងពេជ្រ', 'diamond'],
      ['វណ្ណា', 'Vanna', 'សម្បុរល្អ', 'fair complexion'],
      ['កញ្ញា', 'Kanha', 'នារីក្រមុំ', 'maiden'],
      ['សុភាព', 'Sopheap', 'សុភាពរាបសា', 'gentle'],
      ['មរកត', 'Morokot', 'ត្បូងមរកត', 'emerald'],
      ['សុវណ្ណារី', 'Sovannary', 'នារីដូចមាស', 'golden lady'],
      ['ចិន្តា', 'Chenda', 'គំនិត', 'thought'],
      ['ផល្លា', 'Phalla', 'ផលផ្កា', 'blossom and fruit'],
      ['កល្យាណ', 'Kalyan', 'ល្អថ្លៃថ្នូរ', 'virtuous'],
      ['រចនា', 'Rachana', 'ស្នាដៃ', 'creation']
    ]
  };

  return { CHART, MIN_AGE, MAX_AGE, NAMES, predict, planMonths };
})();
