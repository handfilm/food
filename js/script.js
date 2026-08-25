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

    // ---------------------------------------------------------
    // Scroll reveal for "The Food of Bengal" editorial section.
    // Progressive enhancement only — .reveal elements are fully
    // visible with no JS or with prefers-reduced-motion set.
    // ---------------------------------------------------------
    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var revealEls = document.querySelectorAll('.reveal');
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
      );
      revealEls.forEach(function (el) { observer.observe(el); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) {
        el.classList.add('is-visible');
      });
    }

    initTilt();
    initSmoothScroll();
  });

  // ---------------------------------------------------------
  // Smooth navigation anchor links
  // Ensures all anchor links (navigation, CTA buttons, logo)
  // scroll gracefully to their respective sections with
  // dynamic sticky header offset compensation.
  // ---------------------------------------------------------
  function initSmoothScroll() {
    var navLinks = document.querySelectorAll('a[href^="#"]');
    var header = document.querySelector('header');

    function getHeaderOffset() {
      if (!header) return 80;
      var rect = header.getBoundingClientRect();
      var styles = window.getComputedStyle(header);
      var marginTop = parseFloat(styles.marginTop) || 0;
      return rect.height + marginTop + 12;
    }

    navLinks.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (!href || href === '#') return;

        var targetId = href.substring(1);
        if (targetId === 'top') {
          e.preventDefault();
          var prefersReducedMotion = window.matchMedia &&
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion ? 'auto' : 'smooth'
          });
          if (history.pushState) {
            history.pushState(null, null, '#top');
          }
          return;
        }

        var targetEl = document.getElementById(targetId) || document.querySelector(href);
        if (!targetEl) return;

        e.preventDefault();
        var prefersReducedMotion = window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var headerOffset = getHeaderOffset();
        var elementPosition = targetEl.getBoundingClientRect().top;
        var offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: prefersReducedMotion ? 'auto' : 'smooth'
        });

        if (history.pushState) {
          history.pushState(null, null, href);
        }
      });
    });
  }

  // ---------------------------------------------------------
  // Subtle pointer-reactive 3D tilt + colour sheen.
  // Adds `.tilt-3d` to the existing card surfaces and drives the
  // --mx / --my / --rx / --ry custom properties on pointermove.
  // Pure enhancement: no markup, layout or colours are changed,
  // and it quietly no-ops under reduced motion or on touch.
  // ---------------------------------------------------------
  function initTilt() {
    var targets = document.querySelectorAll('.card, .fish-story, .chingri-card, .order-card');
    if (!targets.length) return;

    targets.forEach(function (el) { el.classList.add('tilt-3d', 'ambient'); });

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (prefersReducedMotion || !canHover) return;

    var MAX_TILT_X = 6;   // degrees — kept small so it reads as "subtle"
    var MAX_TILT_Y = 8;

    targets.forEach(function (el) {
      var raf = null;

      function onMove(e) {
        var rect = el.getBoundingClientRect();
        var x = (e.clientX - rect.left) / rect.width;
        var y = (e.clientY - rect.top) / rect.height;
        x = Math.min(1, Math.max(0, x));
        y = Math.min(1, Math.max(0, y));

        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          el.style.setProperty('--rx', ((0.5 - y) * MAX_TILT_X).toFixed(2) + 'deg');
          el.style.setProperty('--ry', ((x - 0.5) * MAX_TILT_Y).toFixed(2) + 'deg');
          el.classList.add('is-tilting');
        });
      }

      function onLeave() {
        if (raf) cancelAnimationFrame(raf);
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
        el.style.setProperty('--mx', '50%');
        el.style.setProperty('--my', '50%');
      }

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
      el.addEventListener('pointercancel', onLeave);
    });
  }
})();
