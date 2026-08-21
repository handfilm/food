// ---------------------------------------------------------
// Language toggle (English / Bangla)
// Every translatable element carries data-en / data-bn
// (or data-en-html / data-bn-html for text that contains
// markup, like the hero heading's line break).
// Choice is remembered in localStorage across visits.
// ---------------------------------------------------------

(function () {
  var STORAGE_KEY = 'hh-lang';

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang === 'bn' ? 'bn' : 'en');

    var textEls = document.querySelectorAll('[data-en]');
    textEls.forEach(function (el) {
      var value = lang === 'bn' ? el.getAttribute('data-bn') : el.getAttribute('data-en');
      if (value !== null) el.textContent = value;
    });

    var htmlEls = document.querySelectorAll('[data-en-html]');
    htmlEls.forEach(function (el) {
      var value = lang === 'bn' ? el.getAttribute('data-bn-html') : el.getAttribute('data-en-html');
      if (value !== null) el.innerHTML = value;
    });

    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      var enSpan = toggleBtn.querySelector('.lang-en');
      var bnSpan = toggleBtn.querySelector('.lang-bn');
      if (enSpan && bnSpan) {
        enSpan.classList.toggle('active', lang !== 'bn');
        bnSpan.classList.toggle('active', lang === 'bn');
      }
    }

    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      /* localStorage unavailable — language just won't persist */
    }
  }

  function currentLang() {
    var saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
    return saved === 'bn' ? 'bn' : 'en';
  }

  function toggleLang() {
    var next = currentLang() === 'bn' ? 'en' : 'bn';
    applyLang(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    applyLang(currentLang());

    var toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleLang);
    }

    // Footer year
    var yearEl = document.getElementById('year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  });
})();
