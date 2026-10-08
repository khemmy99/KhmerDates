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

  // Names from other cultures: [name in its own script, Latin spelling,
  // Khmer pronunciation, meaning (km), meaning (en)]. European names have no
  // separate script, so the Latin spelling is the name.
  const WORLD_NAMES = {
    zh: {
      B: [
        ['浩然', 'Hàorán', 'ហាវរ៉ាន', 'ចិត្តធំទូលាយ', 'broad-minded'],
        ['俊杰', 'Jùnjié', 'ជួនជៀ', 'មនុស្សឆ្នើម', 'outstanding talent'],
        ['志明', 'Zhìmíng', 'ជឺមីង', 'មហិច្ឆតាភ្លឺស្វាង', 'bright ambition'],
        ['文博', 'Wénbó', 'វឹនបួ', 'ចំណេះដឹងទូលំទូលាយ', 'learned'],
        ['天佑', 'Tiānyòu', 'ធានយ៉ូវ', 'ទេវតាថែរក្សា', 'blessed by heaven'],
        ['家豪', 'Jiāháo', 'ជាហាវ', 'មោទនភាពគ្រួសារ', 'pride of the family'],
        ['子轩', 'Zǐxuān', 'ជឺស៊ាន', 'ថ្លៃថ្នូរ', 'noble'],
        ['明辉', 'Mínghuī', 'មីងហួយ', 'ពន្លឺភ្លឺស្វាង', 'bright radiance'],
        ['强', 'Qiáng', 'ឈាង', 'រឹងមាំ', 'strong'],
        ['龙', 'Lóng', 'ឡុង', 'នាគ', 'dragon'],
        ['伟', 'Wěi', 'វៃ', 'អស្ចារ្យ', 'great']
      ],
      G: [
        ['美玲', 'Měilíng', 'ម៉ីលីង', 'ស្អាត និងឆ្លាត', 'beautiful and clever'],
        ['欣怡', 'Xīnyí', 'ស៊ីនយី', 'រីករាយ', 'joyful'],
        ['婷婷', 'Tíngtíng', 'ធីងធីង', 'ស្រស់ស្អាតទន់ភ្លន់', 'graceful'],
        ['雅琪', 'Yǎqí', 'យ៉ាឈី', 'ថ្លៃថ្នូរដូចត្បូង', 'elegant jade'],
        ['丽华', 'Lìhuá', 'លីហ្វា', 'ស្រស់ស្អាតរុងរឿង', 'beautiful and splendid'],
        ['秀英', 'Xiùyīng', 'ស៊ីវយីង', 'ផ្កាដ៏ស្រស់', 'elegant flower'],
        ['静', 'Jìng', 'ជីង', 'ស្ងប់ស្ងាត់', 'calm'],
        ['慧', 'Huì', 'ហួយ', 'ឆ្លាតវៃ', 'wise'],
        ['雪', 'Xuě', 'ស៊្វេ', 'ព្រិល', 'snow'],
        ['梦琪', 'Mèngqí', 'ម៉ឹងឈី', 'សុបិនដូចត្បូង', 'dreamlike jade'],
        ['诗涵', 'Shīhán', 'ស៊ឺហាន', 'កំណាព្យ និងសុភាព', 'poetic grace']
      ]
    },
    ja: {
      B: [
        ['蓮', 'Ren', 'រ៉េន', 'ផ្កាឈូក', 'lotus'],
        ['陽翔', 'Haruto', 'ហារូតូ', 'ព្រះអាទិត្យ និងការហោះហើរ', 'sun, soaring'],
        ['大和', 'Yamato', 'យ៉ាម៉ាតូ', 'សុខដុមរមនាធំ', 'great harmony'],
        ['湊', 'Minato', 'មីណាតូ', 'កំពង់ផែ', 'harbour'],
        ['悠真', 'Yūma', 'យូម៉ា', 'ស្ងប់ និងពិត', 'calm and true'],
        ['翔', 'Shō', 'សូ', 'ហោះហើរ', 'to soar'],
        ['大輝', 'Daiki', 'ដាអ៊ីគី', 'ភ្លឺចែងចាំង', 'great radiance'],
        ['健太', 'Kenta', 'កេនតា', 'មាំមួន', 'healthy and strong'],
        ['拓海', 'Takumi', 'តាគូមី', 'បើកផ្លូវសមុទ្រ', 'open sea'],
        ['樹', 'Itsuki', 'អ៊ីត្សឹគី', 'ដើមឈើ', 'tree']
      ],
      G: [
        ['陽葵', 'Himari', 'ហ៊ីម៉ារី', 'ផ្កាឈូករ័ត្ន', 'sunflower'],
        ['さくら', 'Sakura', 'សាគូរ៉ា', 'ផ្កាសាគូរ៉ា', 'cherry blossom'],
        ['結衣', 'Yui', 'យូអ៊ី', 'ចំណង', 'bond'],
        ['美咲', 'Misaki', 'មីសាគី', 'ផ្កាស្អាតរីក', 'beautiful bloom'],
        ['愛', 'Ai', 'អៃ', 'សេចក្ដីស្រឡាញ់', 'love'],
        ['花', 'Hana', 'ហាណា', 'ផ្កា', 'flower'],
        ['結愛', 'Yua', 'យូអា', 'ចំណងស្នេហា', 'bond of love'],
        ['凛', 'Rin', 'រីន', 'ថ្លៃថ្នូរ', 'dignified'],
        ['芽依', 'Mei', 'ម៉េ', 'ពន្លកថ្មី', 'new sprout'],
        ['美月', 'Mizuki', 'មីហ្សូគី', 'ព្រះចន្ទដ៏ស្រស់', 'beautiful moon'],
        ['優奈', 'Yuna', 'យូណា', 'ទន់ភ្លន់', 'gentle']
      ]
    },
    ko: {
      B: [
        ['민준', 'Min-jun', 'មីនជុន', 'ឆ្លាត និងមានទេពកោសល្យ', 'clever and talented'],
        ['서준', 'Seo-jun', 'សូជុន', 'សំណាងល្អ និងទេពកោសល្យ', 'auspicious and talented'],
        ['지훈', 'Ji-hun', 'ជីហ៊ុន', 'ប្រាជ្ញា និងគុណធម៌', 'wisdom and merit'],
        ['준호', 'Jun-ho', 'ជុនហូ', 'ឆ្នើម និងអស្ចារ្យ', 'talented and great'],
        ['현우', 'Hyun-woo', 'ហ្យុនអ៊ូ', 'ឆ្លាត និងជួយការពារ', 'wise protector'],
        ['성민', 'Seong-min', 'សុងមីន', 'សម្រេចបាន និងឆ្លាត', 'accomplished and clever']
      ],
      G: [
        ['서연', 'Seo-yeon', 'សូយ៉ន', 'សំណាងល្អ និងទន់ភ្លន់', 'auspicious and graceful'],
        ['하은', 'Ha-eun', 'ហាអឺន', 'ព្រះគុណ', 'grace'],
        ['지민', 'Ji-min', 'ជីមីន', 'ប្រាជ្ញា និងរហ័ស', 'wise and quick'],
        ['수아', 'Su-a', 'ស៊ូអា', 'ឆ្នើម និងស្រស់ស្អាត', 'excellent and elegant'],
        ['민지', 'Min-ji', 'មីនជី', 'ឆ្លាត និងមានប្រាជ្ញា', 'clever and wise'],
        ['유나', 'Yu-na', 'យូណា', 'ទន់ភ្លន់', 'gentle']
      ]
    },
    eu: {
      B: [
        ['Alexander', '', 'អាឡិចសាន់ឌ័រ', 'អ្នកការពារប្រជាជន', 'defender of the people'],
        ['Leo', '', 'លេអូ', 'តោ', 'lion'],
        ['Noah', '', 'ណូអា', 'សេចក្ដីស្ងប់', 'rest, comfort'],
        ['Lucas', '', 'លូកាស', 'ពន្លឺ', 'light'],
        ['Daniel', '', 'ដានីយ៉ែល', 'ព្រះជាអ្នកវិនិច្ឆ័យ', 'God is my judge'],
        ['Oliver', '', 'អូលីវើ', 'ដើមអូលីវ', 'olive tree'],
        ['Ethan', '', 'អ៊ីថាន', 'រឹងមាំ', 'strong, firm'],
        ['William', '', 'វីលៀម', 'អ្នកការពារម៉ឺងម៉ាត់', 'resolute protector'],
        ['Henry', '', 'ហិនរី', 'អ្នកគ្រប់គ្រងផ្ទះ', 'ruler of the home'],
        ['Louis', '', 'លូអ៊ី', 'អ្នកចម្បាំងល្បីល្បាញ', 'famous warrior'],
        ['Arthur', '', 'អាធើ', 'ខ្លាឃ្មុំ', 'bear'],
        ['Thomas', '', 'តូម៉ាស', 'កូនភ្លោះ', 'twin']
      ],
      G: [
        ['Sophia', '', 'សូហ្វៀ', 'ប្រាជ្ញា', 'wisdom'],
        ['Emma', '', 'អិមម៉ា', 'ទាំងមូល សកល', 'whole, universal'],
        ['Olivia', '', 'អូលីវៀ', 'ដើមអូលីវ', 'olive tree'],
        ['Isabella', '', 'អ៊ីសាបេឡា', 'សច្ចាចំពោះព្រះ', 'pledged to God'],
        ['Mia', '', 'មីយ៉ា', 'ជាទីស្រឡាញ់', 'beloved'],
        ['Grace', '', 'ហ្គ្រេស', 'ព្រះគុណ', 'grace'],
        ['Lily', '', 'លីលី', 'ផ្កាលីលី', 'lily'],
        ['Chloe', '', 'ក្លូអេ', 'រីកស្រស់', 'blooming'],
        ['Charlotte', '', 'សាឡត', 'សេរីភាព', 'free'],
        ['Clara', '', 'ក្លារ៉ា', 'ភ្លឺថ្លា', 'bright, clear'],
        ['Elena', '', 'អេលេណា', 'ពន្លឺ', 'shining light'],
        ['Anna', '', 'អាណា', 'ព្រះគុណ', 'grace'],
        ['Rose', '', 'រ៉ូស', 'ផ្កាកុលាប', 'rose']
      ]
    }
  };

  const ORIGINS = ['km', 'zh', 'ja', 'ko', 'eu'];

  /**
   * Names for an origin and gender as objects:
   *   { name, latin, sound, km, en }
   * Khmer entries have no separate pronunciation; European names are already
   * in Latin script, so `latin` stays empty for them.
   */
  function names(origin, gender) {
    if (origin === 'km') {
      return NAMES[gender].map(n => ({ name: n[0], latin: n[1], sound: '', km: n[2], en: n[3] }));
    }
    const set = WORLD_NAMES[origin];
    return set ? set[gender].map(n => ({ name: n[0], latin: n[1], sound: n[2], km: n[3], en: n[4] })) : [];
  }

  return { CHART, MIN_AGE, MAX_AGE, NAMES, WORLD_NAMES, ORIGINS, names, predict, planMonths };
})();
