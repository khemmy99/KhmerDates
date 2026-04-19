// ===== Khmer Calendar Module =====
// Converted from VBA Khmer Calendar module

const KhmerCalendar = (() => {

  // Khmer digits ០-៩
  const KDigitArr = [
    '\u17E0', '\u17E1', '\u17E2', '\u17E3', '\u17E4',
    '\u17E5', '\u17E6', '\u17E7', '\u17E8', '\u17E9'
  ];

  // រកោ / រោច
  const RK = [
    '\u1780\u17BE\u178F',  // កើត
    '\u179A\u17C4\u1785'   // រោច
  ];

  // Days of the week (Sunday=0)
  const KD7 = [
    '\u17A4\u1791\u17B7\u178F\u17D2\u1799',                         // អាទិត្យ
    '\u1785\u1793\u17D2\u1791',                                       // ចន្ទ
    '\u17A2\u1784\u17D2\u1782\u17B6\u179A',                           // អង្គារ
    '\u1796\u17BB\u1792',                                             // ពុធ
    '\u1796\u17D2\u179A\u17A0\u179F\u17D2\u1794\u178F\u17B7\u17CD',   // ព្រហស្បតិ៍
    '\u179F\u17BB\u1780\u17D2\u179A',                                 // សុក្រ
    '\u179F\u17C5\u179A\u17CD'                                        // សៅរ៍
  ];

  // Khmer lunar year animals (1-based index, array is 0-based so index 0 = animal 1)
  const KHY12 = [
    '\u1787\u17BC\u178F',                                             // ជូត
    '\u1786\u17D2\u179B\u17BC\u179C',                                 // ឆ្លូវ
    '\u1781\u17B6\u179B',                                             // ខាល
    '\u1790\u17C4\u17C7',                                             // ថោះ
    '\u179A\u17C4\u1784',                                             // រោង
    '\u1798\u17D2\u179F\u17B6\u1789\u17CB',                           // ម្សាញ់
    '\u1798\u1798\u17B8',                                             // មមី
    '\u1798\u1798\u17C2',                                             // មមែ
    '\u179C\u1780',                                                   // វក
    '\u179A\u1780\u17B6\u179A',                                       // រកា​រ
    '\u1785',                                                         // ច
    '\u1780\u17BB\u179A'                                              // កុរ
  ];

  // Sak cycle (1-based, array is 0-based)
  const Sak10 = [
    '\u17AF\u1780\u179F\u17D0\u1780',                                 // ឯកសក
    '\u1791\u17C4\u179F\u17D0\u1780',                                 // ទោសក
    '\u178F\u17D2\u179A\u17B8\u179F\u17D0\u1780',                     // ត្រីសក
    '\u1785\u178F\u17D2\u179C\u17B6\u179F\u17D0\u1780',               // ចត្វាសក
    '\u1794\u1789\u17D2\u1785\u179F\u17D0\u1780',                     // បញ្ចសក
    '\u1786\u179F\u17D0\u1780',                                       // ឆសក
    '\u179F\u1794\u17D2\u178F\u179F\u17D0\u1780',                     // សប្តសក
    '\u17A2\u178A\u17D2\u178B\u179F\u17D0\u1780',                     // អដ្ឋសក
    '\u1793\u1796\u17D2\u1792\u179F\u17D0\u1780',                     // នព្ធសក
    '\u179F\u17C6\u179A\u17B9\u1791\u17D2\u1792\u17B7\u179F\u17D0\u1780' // សំរឹទ្ធិសក
  ];

  // Khmer lunar month names (0-based, index 12=បឋមាសាដ, index 13=ទុតិយាសាដ)
  const KHM14 = [
    '\u1798\u17B7\u1782\u179F\u17B7\u179A',                           // មិគសិរ
    '\u1794\u17BB\u179F\u17D2\u179F',                                 // បុស្ស
    '\u1798\u17B6\u1783',                                             // មាឃ
    '\u1795\u179B\u17D2\u1782\u17BB\u1793',                           // ផល្គុន
    '\u1785\u17C1\u178F\u17D2\u179A',                                 // ចេត្រ
    '\u1796\u17B7\u179F\u17B6\u1781',                                 // ពិសាខ
    '\u1787\u17C1\u179F\u17D2\u178B',                                 // ជេស្ឋ
    '\u17A4\u179F\u17B6\u178D',                                       // ឤសាឍ
    '\u179F\u17D2\u179A\u17B6\u1796\u178E\u17CD',                     // ស្រាពណ៍
    '\u1797\u1791\u17D2\u179A\u1794\u1791',                           // ភទ្របទ
    '\u17A3\u179F\u17D2\u179F\u17BB\u1787',                           // ឣស្សុជ
    '\u1780\u178F\u17D2\u178F\u17B7\u1780',                           // កត្តិក
    '\u1794\u178B\u1798\u17B6\u179F\u17B6\u178D',                     // បឋមាសាឍ
    '\u1791\u17BB\u178F\u17B7\u1799\u17B6\u179F\u17B6\u178D'          // ទុតិយាសាឍ
  ];

  // Prefixes for Khmer date string
  const BEH = [
    '\u1790\u17D2\u1784\u17C3',         // ថ្ងៃ
    '\u1781\u17C2',                       // ខែ
    '\u1786\u17D2\u1793\u17B6\u17C6',    // ឆ្នាំ
    '\u1796.\u179F'                       // ព.ស
  ];

  // Gregorian month names in Khmer
  const ADM12 = [
    '\u1798\u1780\u179A\u17B6',                                       // មករា
    '\u1780\u17BB\u1798\u17D2\u1797\u17C8',                           // កុម្ភៈ
    '\u1798\u17B8\u1793\u17B6',                                       // មីនា
    '\u1798\u17C1\u179F\u17B6',                                       // មេសា
    '\u17A7\u179F\u1797\u17B6',                                       // ឧសភា
    '\u1798\u17B7\u1790\u17BB\u1793\u17B6',                           // មិថុនា
    '\u1780\u1780\u17D2\u1780\u178A\u17B6',                           // កក្កដា
    '\u179F\u17B8\u17A0\u17B6',                                       // សីហា
    '\u1780\u1789\u17D2\u1789\u17B6',                                 // កញ្ញា
    '\u178F\u17BB\u179B\u17B6',                                       // តុលា
    '\u179C\u17B7\u1785\u17D2\u1786\u17B7\u1780\u17B6',               // វិច្ឆិកា
    '\u1792\u17D2\u1793\u17BC'                                        // ធ្នូ
  ];

  // Gregorian date prefixes in Khmer
  const ADH = [
    '\u1790\u17D2\u1784\u17C3\u1791\u17B8',                                                                   // ថ្ងៃទី
    '\u1781\u17C2',                                                                                             // ​ខែ
    '\u1786\u17D2\u1793\u17B6\u17C6',                                                                          // ​ឆ្នាំ
    '\u1781\u17C1\u178F\u17D2\u178F\u1796\u17D2\u179A\u17C7\u179F\u17B8\u17A0\u1793\u17BB',                    // ​ខេត្តព្រែះសីហនុ
    ','
  ];

  // ---------- Helpers ----------

  function khmerDigit(d) {
    if (d < 0 || d > 9) return '';
    return KDigitArr[d];
  }

  function khmerNumber(n) {
    const s = String(n);
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch >= '0' && ch <= '9') {
        out += khmerDigit(parseInt(ch, 10));
      }
    }
    return out;
  }

  function khmerWeekdayNameFromAD(yr, mo, da) {
    // JavaScript: new Date(yr, mo-1, da).getDay() => 0=Sunday
    const dow = new Date(yr, mo - 1, da).getDay();
    return KD7[dow];
  }

  function khmerMonthNameFromKm(km) {
    let idx;
    if (km === 800) idx = 13;
    else if (km === 80) idx = 12;
    else idx = km - 1;
    return KHM14[idx];
  }

  function khmerYearAnimalFromBE(adYear, adMonth, adDay) {
    const mDate = new Date(adYear, adMonth - 1, adDay);
    const newYearBoundary = new Date(adYear, 3, 14); // April 14
    const BE = mDate >= newYearBoundary ? adYear + 544 : adYear + 543;
    let idx = (BE + 5) % 12;
    if (idx === 0) idx = 12;
    return KHY12[idx - 1]; // convert 1-based to 0-based
  }

  function sakNameFromAD(adYear, adMonth, adDay) {
    let BE;
    if (adMonth < 4 || (adMonth === 4 && adDay < 14)) {
      BE = adYear + 543;
    } else {
      BE = adYear + 544;
    }
    let idx = (BE - 2) % 10;
    if (idx === 0) idx = 10;
    return Sak10[idx - 1]; // convert 1-based to 0-based
  }

  function animalFromBE(be) {
    let idx = (be + 5) % 12;
    if (idx === 0) idx = 12;
    return KHY12[idx - 1];
  }

  function sakFromBE(be) {
    let idx = (be - 2) % 10;
    if (idx === 0) idx = 10;
    return Sak10[idx - 1];
  }

  // ---------- Astronomical / calendar math ----------

  function getBEYear(adYear) {
    return adYear + 544;
  }

  function getAharkun(adYear) {
    return Math.floor((getBEYear(adYear) * 292207 + 499) / 800) + 4;
  }

  function getAvoman(adYear) {
    return (11 * getAharkun(adYear) + 25) % 692;
  }

  function getBodithey(adYear) {
    return (Math.floor((11 * getAharkun(adYear) + 25) / 692) + getAharkun(adYear) + 29) % 30;
  }

  function isKhmerSolarLeap(adYear) {
    const a = (getBEYear(adYear) * 292207 + 499) % 800;
    return (800 - a <= 207) ? 1 : 0;
  }

  function getBoditheyLeap(adYear) {
    const a = getAvoman(adYear);
    const b = getBodithey(adYear);
    let boditheyLeap = (b >= 25 || b <= 5) ? 1 : 0;
    let avomanLeap = 0;

    if (isKhmerSolarLeap(adYear) === 1) {
      if (a <= 126) avomanLeap = 1;
    } else {
      if (a <= 137) {
        if (getAvoman(adYear + 1) !== 0) avomanLeap = 1;
      }
    }

    if (b === 25) {
      const nextB = getBodithey(adYear + 1);
      if (nextB === 5) boditheyLeap = 0;
    }
    if (b === 24) {
      const nextB = getBodithey(adYear + 1);
      if (nextB === 6) boditheyLeap = 1;
    }

    if (boditheyLeap === 1 && avomanLeap === 1) return 3;
    if (boditheyLeap === 1) return 1;
    if (avomanLeap === 1) return 2;
    return 0;
  }

  function getProtetinLeap(adYear) {
    const b = getBoditheyLeap(adYear);
    if (b === 3) return 1;
    if (b === 2 || b === 1) return b;
    if (getBoditheyLeap(adYear - 1) === 3) return 2;
    return 0;
  }

  function isGregorianLeap(y) {
    return (y % 400 === 0) || ((y % 4 === 0) && (y % 100 !== 0));
  }

  function numDaysInKMonth(km, protetinType) {
    const m = (km >= 80) ? 8 : km;
    let base = (m % 2 === 0) ? 30 : 29;
    if (protetinType === 1 && m === 8) base = 30;
    if (protetinType === 2 && m === 7) base = base + 1;
    return base;
  }

  function nextKMonth(km, protetinType) {
    if (protetinType === 1) {
      switch (km) {
        case 7: return 80;
        case 80: return 800;
        case 800: return 9;
        case 12: return 1;
        default: return km + 1;
      }
    }
    return km === 12 ? 1 : km + 1;
  }

  function prevKMonth(km, protetinType) {
    if (protetinType === 1) {
      switch (km) {
        case 800: return 80;
        case 80: return 7;
        case 9: return 800;
        case 1: return 12;
        default: return km - 1;
      }
    }
    return km === 1 ? 12 : km - 1;
  }

  function computeBEYear(adYear, adMonth, km, kd) {
    if (adMonth > 9 || km > 6 || (km === 6 && kd > 15)) {
      return adYear + 544;
    }
    return adYear + 543;
  }

  // ---------- Core conversion: Gregorian → Khmer lunar day/month ----------

  function getKhmerDayMonthFromGregorian(gDate) {
    const adYear = gDate.getFullYear();
    let km = 2, kd = 1;
    let y = 1900;

    while (y < adYear) {
      const gnum = isGregorianLeap(y) ? 366 : 365;
      const protetin = getProtetinLeap(y);
      let kYearLen;
      switch (protetin) {
        case 1: kYearLen = 384; break;
        case 2: kYearLen = 355; break;
        default: kYearLen = 354;
      }

      kd += gnum - kYearLen;

      while (true) {
        const maxd = numDaysInKMonth(km, protetin);
        if (kd > maxd) {
          kd -= maxd;
          km = nextKMonth(km, protetin);
        } else if (kd <= 0) {
          km = prevKMonth(km, protetin);
          kd = numDaysInKMonth(km, protetin) + kd;
        } else {
          break;
        }
      }
      y++;
    }

    // Walk forward within adYear to target date (normalize to midnight to avoid time-of-day rounding)
    const jan1 = new Date(adYear, 0, 1);
    const target = new Date(adYear, gDate.getMonth(), gDate.getDate());
    const daysToAdd = Math.round((target - jan1) / 86400000);
    const protetin = getProtetinLeap(adYear);

    for (let d = 1; d <= daysToAdd; d++) {
      kd++;
      const maxd = numDaysInKMonth(km, protetin);
      if (kd > maxd) {
        kd = 1;
        km = nextKMonth(km, protetin);
      }
    }

    return { km, kd };
  }

  // ---------- Main public functions ----------

  /**
   * Full Khmer lunar date string from a JS Date.
   * Equivalent to VBA KhmerDates(myDate)
   */
  function khmerDates(myDate) {
    if (!(myDate instanceof Date) || isNaN(myDate)) return '';
    const adYear = myDate.getFullYear();
    const adMonth = myDate.getMonth() + 1;
    const adDay = myDate.getDate();

    const { km, kd } = getKhmerDayMonthFromGregorian(myDate);
    const BE = computeBEYear(adYear, adMonth, km, kd);
    const weekday = khmerWeekdayNameFromAD(adYear, adMonth, adDay);

    let kdDisplay, wax;
    if (kd <= 15) {
      kdDisplay = kd;
      wax = RK[0]; // កើត
    } else {
      kdDisplay = kd - 15;
      wax = RK[1]; // រោច
    }

    const kMonthName = khmerMonthNameFromKm(km);
    const animal = khmerYearAnimalFromBE(adYear, adMonth, adDay);
    const sak = sakNameFromAD(adYear, adMonth, adDay);

    return BEH[0] + weekday + ' ' + khmerNumber(kdDisplay) + wax +
           ' ' + BEH[1] + kMonthName + ' ' + BEH[2] + animal +
           ' ' + sak + ' ' + BEH[3] + '.' + khmerNumber(BE);
  }

  /**
   * Khmer Gregorian date string.
   * Equivalent to VBA Gdates(gDate)
   */
  function gDates(gDate) {
    if (!(gDate instanceof Date) || isNaN(gDate)) return '';
    const adDay = gDate.getDate();
    const adMonth = gDate.getMonth() + 1;
    const adYear = gDate.getFullYear();

    return ADH[0] + khmerNumber(adDay) + ' ' + ADH[1] + ADM12[adMonth - 1] + ' ' + ADH[2] + khmerNumber(adYear);
  }

  /**
   * Khmer Gregorian date string with province prefix.
   * Equivalent to VBA Gdatespro(gDate)
   */
  function gDatesPro(gDate) {
    if (!(gDate instanceof Date) || isNaN(gDate)) return '';
    const adDay = gDate.getDate();
    const adMonth = gDate.getMonth() + 1;
    const adYear = gDate.getFullYear();

    return ADH[3] + ADH[4] + ' ' + ADH[0] + khmerNumber(adDay) + ' ' + ADH[1] + ADM12[adMonth - 1] + ' ' + ADH[2] + khmerNumber(adYear);
  }

  // Public API
  return {
    khmerDates,
    gDates,
    gDatesPro,
    khmerNumber,
    khmerDigit,
    khmerWeekdayNameFromAD,
    khmerMonthNameFromKm,
    khmerYearAnimalFromBE,
    sakNameFromAD,
    getKhmerDayMonthFromGregorian,
    // Expose arrays/helpers for calendar grid
    KD7,
    ADM12,
    RK,
    KHM14,
    BEH,
    computeBEYear,
    animalFromBE,
    sakFromBE
  };

})();
