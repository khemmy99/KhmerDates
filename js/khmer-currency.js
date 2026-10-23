/* ===== Khmer currency in words =====
 *
 * Written in ES5 on purpose. Office 2019 and 2016 host task panes in IE11,
 * which cannot parse let, const, arrow functions or shorthand properties; a
 * single one of them here would stop the whole file loading and take the រៀល
 * and ដុល្លារ ribbon buttons with it. The calendar pane needs a modern engine
 * and does not run there, but these two commands do, so this file must stay ES5.
 *
 * Same reading as KhmerCurrency / DollarsCurrency in the KCalendar Excel and
 * Word add-ins (KhmerCurrencyText.bas), so an amount reads the same everywhere:
 *
 *   1500               មួយពាន់ ប្រាំរយរៀលគត់
 *   1500.5             មួយពាន់ ប្រាំរយរៀល និងហាសិបសេន
 *   2500000000         ពីរប៊ីលាន ប្រាំរយលានរៀលគត់
 *   1500000000000      មួយទ្រីលាន ប្រាំរយប៊ីលានរៀលគត់
 *   0                  សូន្យរៀលគត់
 *   -5                 ដកប្រាំរៀលគត់
 *
 * Groups of three digits with the scale words ពាន់ លាន ប៊ីលាន ទ្រីលាន; cents
 * are rounded half up and read as សេន for both currencies. Accepts numbers or
 * text such as "1,500", "$12.50", "1500៛" or Khmer digits. Anything else, a
 * blank, or 10^15 and above returns '' (the ribbon buttons then do nothing).
 */
var KhmerCurrency = (function () {
  'use strict';

  var DIGIT = ['', 'មួយ', 'ពីរ', 'បី', 'បួន', 'ប្រាំ',
               'ប្រាំមួយ', 'ប្រាំពីរ', 'ប្រាំបី', 'ប្រាំបួន'];
  var TENS  = ['', 'ដប់', 'ម្ភៃ', 'សាមសិប', 'សែសិប', 'ហាសិប',
               'ហុកសិប', 'ចិតសិប', 'ប៉ែតសិប', 'កៅសិប'];
  var SCALE = ['', 'ពាន់', 'លាន', 'ប៊ីលាន', 'ទ្រីលាន'];

  var HUNDRED = 'រយ';
  var ZERO    = 'សូន្យ';
  var MINUS   = 'ដក';
  var RIEL    = 'រៀល';
  var DOLLAR  = 'ដុល្លារ';
  var CENT    = 'សេន';
  var EXACT   = 'គត់';
  var AND     = 'និង';

  /** 1..999 */
  function below1000(n) {
    var s = '';
    if (n >= 100) { s = DIGIT[Math.floor(n / 100)] + HUNDRED; n = n % 100; }
    if (n >= 10)  { s += TENS[Math.floor(n / 10)]; n = n % 10; }
    if (n > 0)    { s += DIGIT[n]; }
    return s;
  }

  /** Whole part as a digit string (no leading zeros needed), grouped by thousand. */
  function integerWords(digits) {
    digits = digits.replace(/^0+/, '');
    if (digits === '') return ZERO;
    var parts = [], i = 0, end, group;
    for (end = digits.length; end > 0; end -= 3, i++) {
      group = parseInt(digits.slice(Math.max(0, end - 3), end), 10);
      if (group > 0) parts.unshift(below1000(group) + SCALE[i]);
    }
    return parts.join(' ');
  }

  /**
   * Amount -> { negative, whole: digit string, cents: 0..99 } or null.
   * Text is cleaned the same way as the add-ins: Khmer digits become 0-9;
   * spaces, commas, $ and ៛ are ignored; the decimal point is always ".".
   */
  function parse(value) {
    var t, i, ch, code, clean = '', sign = '';
    if (value === null || value === undefined || typeof value === 'boolean') return null;
    if (typeof value === 'number') {
      if (!isFinite(value)) return null;
      t = value.toFixed(3);                 // no exponent below 1e21
    } else {
      t = String(value);
    }

    for (i = 0; i < t.length; i++) {
      ch = t.charAt(i);
      code = t.charCodeAt(i);
      if (code >= 0x17E0 && code <= 0x17E9) {
        clean += String.fromCharCode(code - 0x17E0 + 48);
      } else if ((ch >= '0' && ch <= '9') || ch === '.') {
        clean += ch;
      } else if (ch === '-') {
        if (clean !== '' || sign !== '') return null;
        sign = '-';
      } else if (ch === ' ' || ch === ' ' || ch === ',' || ch === '$' || ch === '៛' ||
                 ch === '\t' || ch === '\r' || ch === '\n') {
        // ignored
      } else {
        return null;
      }
    }

    var dot = clean.indexOf('.');
    var whole = dot < 0 ? clean : clean.slice(0, dot);
    var frac  = dot < 0 ? '' : clean.slice(dot + 1);
    if (frac.indexOf('.') >= 0) return null;
    if (whole === '' && frac === '') return null;
    whole = whole.replace(/^0+/, '') || '0';
    if (whole.length > 15) return null;

    // Cents, rounded half up on the third decimal
    frac = (frac + '000').slice(0, 3);
    var cents = parseInt(frac.slice(0, 2), 10);
    if (parseInt(frac.charAt(2), 10) >= 5) cents++;
    if (cents === 100) {
      cents = 0;
      whole = addOne(whole);
      if (whole.length > 15) return null;
    }

    return { negative: sign === '-' && (whole !== '0' || cents > 0), whole: whole, cents: cents };
  }

  /** "999" -> "1000" on a digit string (whole parts can exceed 2^53). */
  function addOne(digits) {
    var out = '', carry = 1, i, d;
    for (i = digits.length - 1; i >= 0; i--) {
      d = parseInt(digits.charAt(i), 10) + carry;
      carry = d === 10 ? 1 : 0;
      out = (d % 10) + out;
    }
    return carry ? '1' + out : out;
  }

  function inWords(value, unit) {
    if (typeof value === 'string' && value.replace(/\s+/g, '') === '') return '';
    var p = parse(value);
    if (!p) return '';
    var s = integerWords(p.whole) + unit;
    s += p.cents === 0 ? EXACT : ' ' + AND + below1000(p.cents) + CENT;
    return (p.negative ? MINUS : '') + s;
  }

  function riel(value)   { return inWords(value, RIEL); }
  function dollar(value) { return inWords(value, DOLLAR); }

  return { riel: riel, dollar: dollar };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = KhmerCurrency;
