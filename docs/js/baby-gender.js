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
      ['សំណាង', 'Samnang', 'សំណាងល្អ', 'luck'],
      ['ធនា', 'Thona', 'ទ្រព្យ', 'wealth'],
      ['ទេវា', 'Tevea', 'ទេវតា', 'angel'],
      ['អាទិត្យ', 'Atith', 'ព្រះអាទិត្យ', 'sun'],
      ['អនុរក្ស', 'Anurak', 'អ្នកថែរក្សា', 'protector'],
      ['កែវ', 'Keo', 'កែវមណី', 'gem'],
      ['គីរី', 'Kiri', 'ភ្នំ', 'mountain'],
      ['ជ័យ', 'Chey', 'ជ័យជម្នះ', 'victory'],
      ['ចាន់ដារ៉ា', 'Chandara', 'ព្រះចន្ទ និងផ្កាយ', 'moon and star'],
      ['ដាវុធ', 'Davuth', 'ខ្លាំងពូកែ', 'strong'],
      ['ណារិទ្ធ', 'Narith', 'អំណាច', 'power'],
      ['ថាវរៈ', 'Thavarak', 'ស្ថិតស្ថេរ', 'lasting']
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
      ['រចនា', 'Rachana', 'ស្នាដៃ', 'creation'],
      ['ណារី', 'Nary', 'ស្ត្រី', 'woman'],
      ['តារា', 'Dara', 'ផ្កាយ', 'star'],
      ['អមរា', 'Amara', 'អមតៈ', 'immortal'],
      ['ឧសា', 'Usa', 'ពេលព្រលឹម', 'dawn'],
      ['ណាលីន', 'Nalin', 'ផ្កាឈូក', 'lotus']
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
        ['伟', 'Wěi', 'វៃ', 'អស្ចារ្យ', 'great'],
        ['安然', 'Ānrán', 'អានរ៉ាន', 'សុខសាន្ត', 'peaceful'],
        ['恩泽', 'Ēnzé', 'អឹនជឺ', 'ព្រះគុណ និងសេចក្ដីសប្បុរស', 'grace and kindness'],
        ['国强', 'Guóqiáng', 'គួឈាង', 'ប្រទេសរឹងមាំ', 'strong nation'],
        ['凯', 'Kǎi', 'ខៃ', 'ជ័យជម្នះ', 'triumph'],
        ['东', 'Dōng', 'ដុង', 'ទិសខាងកើត', 'east'],
        ['大伟', 'Dàwěi', 'ដាវៃ', 'អស្ចារ្យ', 'great'],
        ['德华', 'Déhuá', 'ដឺហ្វា', 'គុណធម៌ និងរុងរឿង', 'virtue and splendour'],
        ['博文', 'Bówén', 'បួវឹន', 'ចំណេះដឹងទូលំទូលាយ', 'learned'],
        ['鹏', 'Péng', 'ផឹង', 'សត្វស្លាបដ៏ធំ', 'great bird'],
        ['天宇', 'Tiānyǔ', 'ធានយី', 'ចក្រវាល', 'universe'],
        ['泰', 'Tài', 'ថៃ', 'សុខសាន្ត និងធំ', 'peaceful, great']
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
        ['诗涵', 'Shīhán', 'ស៊ឺហាន', 'កំណាព្យ និងសុភាព', 'poetic grace'],
        ['爱琳', 'Àilín', 'អៃលីន', 'ស្នេហា និងត្បូង', 'love and jade'],
        ['安琪', 'Ānqí', 'អានឈី', 'ទេវតា', 'angel'],
        ['可欣', 'Kěxīn', 'ខឺស៊ីន', 'រីករាយ', 'joyful'],
        ['桂芳', 'Guìfāng', 'គួយហ្វាង', 'ក្លិនផ្កាក្រអូប', 'osmanthus fragrance'],
        ['佳怡', 'Jiāyí', 'ជាយី', 'ស្រស់ស្អាត និងរីករាយ', 'lovely and joyful'],
        ['嘉欣', 'Jiāxīn', 'ជាស៊ីន', 'រីករាយ', 'happy'],
        ['丹', 'Dān', 'ដាន', 'ពណ៌ក្រហម', 'red'],
        ['娜', 'Nà', 'ណា', 'ស្រស់ស្អាត', 'graceful'],
        ['黛玉', 'Dàiyù', 'ដៃយី', 'ត្បូងដ៏មានតម្លៃ', 'precious jade'],
        ['甜', 'Tián', 'ធាន', 'ផ្អែម', 'sweet'],
        ['天娇', 'Tiānjiāo', 'ធានជាវ', 'ជាទីស្រឡាញ់ពីស្ថានសួគ៌', 'heaven\'s darling']
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
        ['樹', 'Itsuki', 'អ៊ីត្សឹគី', 'ដើមឈើ', 'tree'],
        ['明', 'Akira', 'អាគីរ៉ា', 'ភ្លឺ', 'bright'],
        ['朝日', 'Asahi', 'អាសាហ៊ី', 'ព្រះអាទិត្យរះ', 'morning sun'],
        ['海斗', 'Kaito', 'កៃតូ', 'សមុទ្រ និងផ្កាយ', 'sea and stars'],
        ['光輝', 'Kōki', 'កូគី', 'ពន្លឺចែងចាំង', 'radiance'],
        ['純', 'Jun', 'ជុន', 'បរិសុទ្ធ', 'pure'],
        ['仁', 'Jin', 'ជីន', 'មេត្តា', 'benevolence'],
        ['力', 'Chikara', 'ឈីការ៉ា', 'កម្លាំង', 'strength'],
        ['直樹', 'Naoki', 'ណាអូគី', 'ដើមឈើត្រង់', 'honest tree'],
        ['大輔', 'Daisuke', 'ដាអ៊ីសឹកេ', 'អ្នកជួយដ៏ធំ', 'great helper'],
        ['誠', 'Makoto', 'ម៉ាកូតូ', 'ស្មោះត្រង់', 'sincerity'],
        ['正人', 'Masato', 'ម៉ាសាតូ', 'មនុស្សទៀងត្រង់', 'upright person'],
        ['大河', 'Taiga', 'តៃហ្គា', 'ទន្លេធំ', 'great river'],
        ['翼', 'Tsubasa', 'ត្សឹបាសា', 'ស្លាប', 'wings']
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
        ['優奈', 'Yuna', 'យូណា', 'ទន់ភ្លន់', 'gentle'],
        ['恵美', 'Emi', 'អេមី', 'ពរ និងសម្រស់', 'blessed beauty'],
        ['愛莉', 'Airi', 'អៃរី', 'ស្នេហា និងផ្កាម្លិះ', 'love and jasmine'],
        ['佳奈', 'Kana', 'កាណា', 'ស្រស់ស្អាត', 'lovely'],
        ['香織', 'Kaori', 'កាអូរី', 'ក្លិនក្រអូប', 'fragrance'],
        ['楓', 'Kaede', 'កាអេដេ', 'ដើមម៉េផល', 'maple'],
        ['千佳', 'Chika', 'ឈីកា', 'ល្អរាប់ពាន់', 'a thousand blessings'],
        ['千代', 'Chiyo', 'ឈីយ៉ូ', 'មួយពាន់ជំនាន់', 'a thousand generations'],
        ['純子', 'Junko', 'ជុនកូ', 'កូនបរិសុទ្ធ', 'pure child'],
        ['菜々', 'Nana', 'ណាណា', 'បៃតងស្រស់', 'fresh greens'],
        ['夏希', 'Natsuki', 'ណាត្សឹគី', 'ក្ដីសង្ឃឹមរដូវក្ដៅ', 'summer hope'],
        ['七海', 'Nanami', 'ណាណាមី', 'សមុទ្រទាំងប្រាំពីរ', 'seven seas'],
        ['紬', 'Tsumugi', 'ត្សឹមូហ្គី', 'សូត្រ', 'silk'],
        ['智子', 'Tomoko', 'តូម៉ូកូ', 'កូនឆ្លាត', 'wise child'],
        ['環', 'Tamaki', 'តាម៉ាគី', 'កងដៃ', 'bracelet']
      ]
    },
    ko: {
      B: [
        ['민준', 'Min-jun', 'មីនជុន', 'ឆ្លាត និងមានទេពកោសល្យ', 'clever and talented'],
        ['서준', 'Seo-jun', 'សូជុន', 'សំណាងល្អ និងទេពកោសល្យ', 'auspicious and talented'],
        ['지훈', 'Ji-hun', 'ជីហ៊ុន', 'ប្រាជ្ញា និងគុណធម៌', 'wisdom and merit'],
        ['준호', 'Jun-ho', 'ជុនហូ', 'ឆ្នើម និងអស្ចារ្យ', 'talented and great'],
        ['현우', 'Hyun-woo', 'ហ្យុនអ៊ូ', 'ឆ្លាត និងជួយការពារ', 'wise protector'],
        ['성민', 'Seong-min', 'សុងមីន', 'សម្រេចបាន និងឆ្លាត', 'accomplished and clever'],
        ['은우', 'Eun-woo', 'អឺនអ៊ូ', 'ព្រះគុណ និងជំនួយ', 'grace and help'],
        ['인호', 'In-ho', 'អ៊ីនហូ', 'មេត្តា និងអស្ចារ្យ', 'kind and great'],
        ['건우', 'Geon-woo', 'កុនអ៊ូ', 'រឹងមាំ និងជួយគេ', 'firm and helpful'],
        ['강민', 'Kang-min', 'កាំងមីន', 'រឹងមាំ និងឆ្លាត', 'strong and clever'],
        ['동현', 'Dong-hyun', 'ដុងហ្យុន', 'ទិសខាងកើត និងប្រាជ្ញា', 'east and wisdom'],
        ['도현', 'Do-hyun', 'ដូហ្យុន', 'ផ្លូវ និងប្រាជ្ញា', 'way and wisdom'],
        ['예준', 'Ye-jun', 'យេជុន', 'សិល្បៈ និងទេពកោសល្យ', 'artistic and talented'],
        ['윤호', 'Yoon-ho', 'យុនហូ', 'ភ្លឺ និងអស្ចារ្យ', 'bright and great'],
        ['민호', 'Min-ho', 'មីនហូ', 'ឆ្លាត និងអស្ចារ្យ', 'clever and great'],
        ['보검', 'Bo-geom', 'បូកុម', 'ដាវដ៏មានតម្លៃ', 'treasured sword'],
        ['태양', 'Tae-yang', 'តែយ៉ាង', 'ព្រះអាទិត្យ', 'sun'],
        ['태민', 'Tae-min', 'តែមីន', 'អស្ចារ្យ និងឆ្លាត', 'great and clever']
      ],
      G: [
        ['서연', 'Seo-yeon', 'សូយ៉ន', 'សំណាងល្អ និងទន់ភ្លន់', 'auspicious and graceful'],
        ['하은', 'Ha-eun', 'ហាអឺន', 'ព្រះគុណ', 'grace'],
        ['지민', 'Ji-min', 'ជីមីន', 'ប្រាជ្ញា និងរហ័ស', 'wise and quick'],
        ['수아', 'Su-a', 'ស៊ូអា', 'ឆ្នើម និងស្រស់ស្អាត', 'excellent and elegant'],
        ['민지', 'Min-ji', 'មីនជី', 'ឆ្លាត និងមានប្រាជ្ញា', 'clever and wise'],
        ['유나', 'Yu-na', 'យូណា', 'ទន់ភ្លន់', 'gentle'],
        ['은지', 'Eun-ji', 'អឺនជី', 'ព្រះគុណ និងប្រាជ្ញា', 'grace and wisdom'],
        ['아름', 'A-reum', 'អារឹម', 'សម្រស់', 'beauty'],
        ['가은', 'Ga-eun', 'កាអឺន', 'ស្រស់ស្អាត និងសប្បុរស', 'beautiful and kind'],
        ['고은', 'Go-eun', 'កូអឺន', 'ស្អាត និងទន់ភ្លន់', 'lovely and gentle'],
        ['지우', 'Ji-woo', 'ជីអ៊ូ', 'ប្រាជ្ញា និងជំនួយ', 'wisdom and help'],
        ['채원', 'Chae-won', 'ឆែវ៉ុន', 'សួនច្បារពណ៌ស្រស់', 'colourful garden'],
        ['나연', 'Na-yeon', 'ណាយ៉ន', 'ស្រស់ស្អាត', 'graceful'],
        ['다은', 'Da-eun', 'ដាអឺន', 'ព្រះគុណច្រើន', 'much grace'],
        ['다인', 'Da-in', 'ដាអ៊ីន', 'មេត្តាច្រើន', 'much kindness'],
        ['예진', 'Ye-jin', 'យេជីន', 'ទេពកោសល្យ និងត្បូង', 'talent and treasure'],
        ['유진', 'Yu-jin', 'យូជីន', 'ត្បូងដ៏មានតម្លៃ', 'precious'],
        ['민서', 'Min-seo', 'មីនសូ', 'ឆ្លាត និងសំណាងល្អ', 'clever and auspicious'],
        ['보라', 'Bo-ra', 'បូរ៉ា', 'ពណ៌ស្វាយ', 'purple'],
        ['태희', 'Tae-hee', 'តែហ៊ី', 'អស្ចារ្យ និងរីករាយ', 'great and joyful'],
        ['태연', 'Tae-yeon', 'តែយ៉ន', 'ស្រស់ស្អាតអស្ចារ្យ', 'wonderfully beautiful']
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
        ['Thomas', '', 'តូម៉ាស', 'កូនភ្លោះ', 'twin'],
        ['Gabriel', '', 'កាព្រីយ៉ែល', 'ព្រះជាកម្លាំងខ្ញុំ', 'God is my strength'],
        ['Caleb', '', 'ខាលែប', 'ស្មោះត្រង់', 'faithful'],
        ['Kevin', '', 'កេវិន', 'សុភាព ទន់ភ្លន់', 'gentle'],
        ['John', '', 'ចន', 'ព្រះមានព្រះគុណ', 'God is gracious'],
        ['Julian', '', 'ជូលៀន', 'វ័យក្មេង', 'youthful'],
        ['Jack', '', 'ជែក', 'ព្រះមានព្រះគុណ', 'God is gracious'],
        ['David', '', 'ដាវីដ', 'ជាទីស្រឡាញ់', 'beloved'],
        ['Benjamin', '', 'បេនយ៉ាមីន', 'កូនប្រុសស្ដាំដៃ', 'son of the right hand'],
        ['Max', '', 'ម៉ាក់ស៍', 'ធំបំផុត', 'greatest'],
        ['Paul', '', 'ប៉ូល', 'សុភាពរាបសា', 'humble'],
        ['Theo', '', 'ធីអូ', 'អំណោយពីព្រះ', 'gift of God'],
        ['Tobias', '', 'តូប៊ីយ៉ាស', 'ព្រះល្អ', 'God is good'],
        ['Samuel', '', 'សាំយូអែល', 'ព្រះទ្រង់ស្ដាប់', 'God has heard'],
        ['Sebastian', '', 'សេបាស្ទាន', 'គួរគោរព', 'venerable']
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
        ['Rose', '', 'រ៉ូស', 'ផ្កាកុលាប', 'rose'],
        ['Julia', '', 'ជូលៀ', 'វ័យក្មេង', 'youthful'],
        ['Jasmine', '', 'ជាស្មីន', 'ផ្កាម្លិះ', 'jasmine'],
        ['Joy', '', 'ជយ', 'សេចក្ដីរីករាយ', 'joy'],
        ['Natalie', '', 'ណាតាលី', 'កើតថ្ងៃបុណ្យណូអែល', 'born at Christmas'],
        ['Nora', '', 'ណូរ៉ា', 'ពន្លឺ', 'light'],
        ['Diana', '', 'ដាយអាណា', 'ទេពធីតា', 'divine'],
        ['Maria', '', 'ម៉ារីយ៉ា', 'ជាទីស្រឡាញ់', 'beloved'],
        ['Bella', '', 'បេឡា', 'ស្រស់ស្អាត', 'beautiful'],
        ['Tessa', '', 'តេសា', 'អ្នកប្រមូលផល', 'harvester'],
        ['Tiana', '', 'ធីអាណា', 'ព្រះនាង', 'princess'],
        ['Thea', '', 'ធីអា', 'ទេពធីតា', 'goddess']
      ]
    }
  };

  const ORIGINS = ['km', 'zh', 'ja', 'ko', 'eu'];

  // ក្បួនដាក់ឈ្មោះតាមថ្ងៃកំណើត: the letters a name should start with for each
  // birth weekday (0 = Sunday). Wednesday has a separate night group.
  // Same table in Koh Santepheap and two Sabay articles.
  const SUNDAY_INITIALS = /^[អ-ឳ]/; // អ and the independent vowels អា ឥ ឧ ឯ ឱ …
  const DAY_LETTERS = {
    0: ['អ', 'អា', 'ឥ', 'ឧ', 'ឯ', 'ឱ'],
    1: ['ក', 'ខ', 'គ', 'ឃ', 'ង'],
    2: ['ច', 'ឆ', 'ជ', 'ឈ', 'ញ'],
    3: ['ដ', 'ឋ', 'ឌ', 'ឍ', 'ណ'],
    wedNight: ['យ', 'រ', 'ល', 'វ'],
    4: ['ប', 'ផ', 'ព', 'ភ', 'ម'],
    5: ['ស', 'ហ', 'ឡ'],
    6: ['ត', 'ថ', 'ទ', 'ធ', 'ន']
  };

  /** Letter group for a birth date; `night` only matters on a Wednesday. */
  function lettersFor(date, night) {
    const dow = date.getDay();
    const key = dow === 3 && night ? 'wedNight' : dow;
    return { dow, key, letters: DAY_LETTERS[key] };
  }

  /** Does a name (or its Khmer pronunciation) start with one of the group's letters? */
  function suits(khmerText, group) {
    const first = (khmerText || '').trim();
    if (!first) return false;
    if (group.key === 0) return SUNDAY_INITIALS.test(first);
    return group.letters.includes(first[0]);
  }

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

  return { CHART, MIN_AGE, MAX_AGE, NAMES, WORLD_NAMES, ORIGINS, DAY_LETTERS, names, lettersFor, suits, predict, planMonths };
})();
