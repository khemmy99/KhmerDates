// ===== Chinese Lunar Calendar =====
// Converts Gregorian dates to Chinese lunar calendar dates
// Data covers 1900-2100

const ChineseCalendar = (() => {
  // Lunar year data: 1900-2100
  // Encoding per entry:
  //   bit 16:     leap month has 30 days (1) or 29 days (0)
  //   bits 4-15:  normal month lengths, bit15=month1 ... bit4=month12, (1=30d, 0=29d)
  //   bits 0-3:   leap month number (0 = no leap)
  const L = [
    0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
    0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
    0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
    0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
    0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
    0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
    0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
    0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
    0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
    0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x05ac0,0x0ab60,0x096d5,0x092e0,
    0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
    0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
    0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
    0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
    0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
    0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
    0x092e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
    0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
    0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
    0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a4d0,0x0d150,0x0f252,
    0x0d520
  ];

  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const ANIMALS = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const MONTH_NAMES = ['正月','二月','三月','四月','五月','六月',
                       '七月','八月','九月','十月','十一月','腊月'];
  const DAY_NAMES = [
    '初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
    '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
    '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'
  ];

  function _monthDays(y, m) {
    return (L[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  function _leapMonth(y) {
    return L[y - 1900] & 0xf;
  }

  function _leapDays(y) {
    return _leapMonth(y) ? ((L[y - 1900] & 0x10000) ? 30 : 29) : 0;
  }

  function _yearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (L[y - 1900] & i) ? 1 : 0;
    }
    return sum + _leapDays(y);
  }

  // Convert Gregorian date to Chinese lunar date
  // sM: 1-12 (January=1)
  function solarToLunar(sY, sM, sD) {
    if (sY < 1900 || sY > 2100) return null;

    // Days from base: Jan 31, 1900 = Lunar 1900/1/1
    const base = new Date(1900, 0, 31);
    const target = new Date(sY, sM - 1, sD);
    let offset = Math.round((target - base) / 86400000);
    if (offset < 0) return null;

    // Find lunar year
    let lY;
    for (lY = 1900; lY < 2101; lY++) {
      const yd = _yearDays(lY);
      if (offset < yd) break;
      offset -= yd;
    }

    // Build physical month list for this year
    const leap = _leapMonth(lY);
    const months = [];
    for (let m = 1; m <= 12; m++) {
      months.push({ m: m, days: _monthDays(lY, m), leap: false });
      if (m === leap) {
        months.push({ m: m, days: _leapDays(lY), leap: true });
      }
    }

    // Find month
    let lM = 1, isLeap = false;
    for (const mi of months) {
      if (offset < mi.days) {
        lM = mi.m;
        isLeap = mi.leap;
        break;
      }
      offset -= mi.days;
    }

    const lD = offset + 1;
    const stemIdx = (lY - 4) % 10;
    const branchIdx = (lY - 4) % 12;

    return {
      year: lY,
      month: lM,
      day: lD,
      isLeap: isLeap,
      monthName: (isLeap ? '闰' : '') + MONTH_NAMES[lM - 1],
      dayName: DAY_NAMES[lD - 1] || '三十',
      stemBranch: STEMS[stemIdx] + BRANCHES[branchIdx],
      animal: ANIMALS[branchIdx],
      // Short display: show month name on 1st, day name otherwise
      cellText: lD === 1 ? ((isLeap ? '闰' : '') + MONTH_NAMES[lM - 1]) : DAY_NAMES[lD - 1]
    };
  }

  // Convert from JS Date object
  function fromDate(dt) {
    return solarToLunar(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
  }

  return { solarToLunar, fromDate, ANIMALS, STEMS, BRANCHES, MONTH_NAMES, DAY_NAMES };
})();
