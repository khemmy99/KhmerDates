/* ===== Office Add-in mode =====
 *
 * Loaded only when the page is opened with ?office=1, which is the URL the
 * add-in manifest points at. A normal browser or the Capacitor apps never load
 * this file, so nothing here can affect them.
 *
 * The calendar itself is untouched. The day-detail sheet already renders each
 * reading in a .detail-full-row carrying the plain text in data-copy for its
 * copy button, so this adds a second button to those rows that writes the same
 * text into the document instead of the clipboard.
 */
(function () {
  'use strict';

  var LABEL = { km: 'បញ្ចូល', en: 'Insert', zh: '插入' };
  var OK    = { km: 'បានបញ្ចូល', en: 'Inserted', zh: '已插入' };
  /* PowerPoint only accepts text when a text box is actually in edit mode, and
     Excel refuses when the selection is not a single writable range. Office
     reports both the same way, so the message names the likely cause. */
  var FAIL  = {
    km: 'មិនអាចបញ្ចូលបានទេ — សូមចុចលើកន្លែងសរសេរជាមុនសិន',
    en: 'Could not insert — click where the text should go first',
    zh: '无法插入 — 请先点击要插入的位置'
  };

  function lang() {
    try { return (window.I18n && I18n.getLang()) || 'en'; } catch (e) { return 'en'; }
  }
  function say(map) { return map[lang()] || map.en; }

  /* The app's own toast is private to its module, so this uses its own. */
  function flash(text, bad) {
    var el = document.getElementById('office-flash');
    if (!el) {
      el = document.createElement('div');
      el.id = 'office-flash';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.className = bad ? 'bad show' : 'show';
    clearTimeout(flash._t);
    flash._t = setTimeout(function () { el.className = ''; }, 2600);
  }

  function insert(text) {
    if (!window.Office || !Office.context || !Office.context.document) return;
    Office.context.document.setSelectedDataAsync(
      text,
      { coercionType: Office.CoercionType.Text },
      function (result) {
        var failed = result.status === Office.AsyncResultStatus.Failed;
        flash(failed ? say(FAIL) : say(OK), failed);
      }
    );
  }

  /* Add an insert button to any detail row that does not have one yet. The
     sheet is re-rendered on every day tap, so this runs from an observer
     rather than once at startup. */
  function decorate() {
    var rows = document.querySelectorAll('#cal-detail-content .detail-full-row');
    Array.prototype.forEach.call(rows, function (row) {
      if (row.querySelector('.office-insert-btn')) return;
      var src = row.querySelector('[data-copy]');
      if (!src) return;
      var text = src.getAttribute('data-copy');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'office-insert-btn';
      btn.title = say(LABEL);
      btn.setAttribute('aria-label', say(LABEL));
      btn.innerHTML =
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        insert(text);
      });
      row.appendChild(btn);
    });
  }

  if (!window.Office || !Office.onReady) return;

  /*
   * Ask Office to reopen this pane by itself the next time the document is
   * opened, so the calendar is simply there rather than something to go and
   * find on the ribbon every time.
   *
   * This is per document, not per app: Office stores the flag inside the file,
   * and there is no equivalent that fires on application start for Word, Excel
   * or PowerPoint. So it takes effect from the next open of any document where
   * the calendar has been used and saved. It also only works because the
   * manifest's TaskpaneId is exactly Office.AutoShowTaskpaneWithDocument.
   */
  function autoOpenWithDocument() {
    try {
      var settings = Office.context && Office.context.document && Office.context.document.settings;
      if (!settings) return;
      if (settings.get('Office.AutoShowTaskpaneWithDocument') === true) return;
      settings.set('Office.AutoShowTaskpaneWithDocument', true);
      // Saving can fail harmlessly — a read-only or unsaved document, say — so
      // the callback deliberately does nothing rather than alarming the user.
      settings.saveAsync(function () {});
    } catch (e) { /* never let this stop the calendar rendering */ }
  }

  Office.onReady(function (info) {
    var host = (info && info.host ? String(info.host) : 'office').toLowerCase();
    document.body.classList.add('office-addin', 'office-host-' + host);
    autoOpenWithDocument();

    var target = document.getElementById('cal-detail-content');
    if (target && window.MutationObserver) {
      new MutationObserver(decorate).observe(target, { childList: true, subtree: true });
    }
    decorate();
  });
})();
