// ---------------------------------------------------------
// Language toggle (English / Bangla)
// Every translatable element carries data-en / data-bn
// (or data-en-html / data-bn-html for text that contains
// markup, like the hero heading's line break).
// Choice is remembered in localStorage across visits.
// ---------------------------------------------------------

(function () {
  var STORAGE_KEY = 'hh-lang';

  var currentLightboxIndex = -1;
  var visibleGalleryCards = [];

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

    // Refresh lightbox text if open
    if (currentLightboxIndex >= 0 && visibleGalleryCards[currentLightboxIndex]) {
      renderLightboxCard(visibleGalleryCards[currentLightboxIndex], lang);
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

    initScrollReveal();
    initTilt();
    initSmoothScroll();
    initGallery();
  });

  // ---------------------------------------------------------
  // Intersection Observer for scroll-triggered fade-in animation
  // Observes all '.reveal' sections as the user scrolls down the
  // page and triggers a smooth 'fade-in' / 'is-visible' transition.
  // ---------------------------------------------------------
  function initScrollReveal() {
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    var prefersReducedMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
      var observerOptions = {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.12
      };

      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, observerOptions);

      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      // Immediate reveal fallback for reduced motion or unsupported browsers
      revealEls.forEach(function (el) {
        el.classList.add('fade-in');
        el.classList.add('is-visible');
      });
    }
  }

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
    var targets = document.querySelectorAll('.card, .fish-story, .chingri-card, .order-card, .gallery-card');
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

  // ---------------------------------------------------------
  // Batch Photo Gallery & High-Res Masonry Lightbox
  // ---------------------------------------------------------
  function renderLightboxCard(cardEl, lang) {
    if (!cardEl) return;
    lang = lang || currentLang();

    var imgSrc = cardEl.getAttribute('data-img') || '';
    var badge = lang === 'bn' ? cardEl.getAttribute('data-badge-bn') : cardEl.getAttribute('data-badge-en');
    var title = lang === 'bn' ? cardEl.getAttribute('data-title-bn') : cardEl.getAttribute('data-title-en');
    var desc = lang === 'bn' ? cardEl.getAttribute('data-desc-bn') : cardEl.getAttribute('data-desc-en');

    var s1k = lang === 'bn' ? cardEl.getAttribute('data-spec1-k-bn') : cardEl.getAttribute('data-spec1-k-en');
    var s1v = lang === 'bn' ? cardEl.getAttribute('data-spec1-v-bn') : cardEl.getAttribute('data-spec1-v-en');
    var s2k = lang === 'bn' ? cardEl.getAttribute('data-spec2-k-bn') : cardEl.getAttribute('data-spec2-k-en');
    var s2v = lang === 'bn' ? cardEl.getAttribute('data-spec2-v-bn') : cardEl.getAttribute('data-spec2-v-en');
    var s3k = lang === 'bn' ? cardEl.getAttribute('data-spec3-k-bn') : cardEl.getAttribute('data-spec3-k-en');
    var s3v = lang === 'bn' ? cardEl.getAttribute('data-spec3-v-bn') : cardEl.getAttribute('data-spec3-v-en');

    var imgEl = document.getElementById('lightbox-img');
    var badgeEl = document.getElementById('lightbox-badge');
    var titleEl = document.getElementById('lightbox-title');
    var descEl = document.getElementById('lightbox-desc');
    var counterEl = document.getElementById('lightbox-counter');

    var s1kEl = document.getElementById('spec1-label');
    var s1vEl = document.getElementById('spec1-val');
    var s2kEl = document.getElementById('spec2-label');
    var s2vEl = document.getElementById('spec2-val');
    var s3kEl = document.getElementById('spec3-label');
    var s3vEl = document.getElementById('spec3-val');

    if (imgEl && imgSrc) {
      imgEl.src = imgSrc;
      imgEl.alt = title || 'Batch visual';
    }
    if (badgeEl) badgeEl.textContent = badge || '';
    if (titleEl) titleEl.textContent = title || '';
    if (descEl) descEl.textContent = desc || '';

    if (s1kEl && s1vEl) { s1kEl.textContent = s1k || ''; s1vEl.textContent = s1v || ''; }
    if (s2kEl && s2vEl) { s2kEl.textContent = s2k || ''; s2vEl.textContent = s2v || ''; }
    if (s3kEl && s3vEl) { s3kEl.textContent = s3k || ''; s3vEl.textContent = s3v || ''; }

    if (counterEl && visibleGalleryCards.length > 0) {
      var currentNum = currentLightboxIndex + 1;
      var totalNum = visibleGalleryCards.length;
      if (lang === 'bn') {
        var toBn = function (n) { return String(n).replace(/[0-9]/g, function (d) { return '০১২৩৪৫৬৭৮৯'[d]; }); };
        counterEl.textContent = toBn(currentNum) + ' / ' + toBn(totalNum);
      } else {
        counterEl.textContent = currentNum + ' / ' + totalNum;
      }
    }
  }

  function initGallery() {
    var gallerySection = document.getElementById('gallery');
    if (!gallerySection) return;

    var filterBtns = gallerySection.querySelectorAll('.filter-btn');
    var allCards = Array.prototype.slice.call(gallerySection.querySelectorAll('.gallery-card'));
    var lightbox = document.getElementById('gallery-lightbox');
    var closeBtn = document.getElementById('lightbox-close');
    var prevBtn = document.getElementById('lightbox-prev');
    var nextBtn = document.getElementById('lightbox-next');

    // Update visible card array
    function updateVisibleCards(filterValue) {
      visibleGalleryCards = [];
      allCards.forEach(function (card) {
        var cat = card.getAttribute('data-category');
        var match = (filterValue === 'all' || cat === filterValue);
        if (match) {
          card.style.display = '';
          visibleGalleryCards.push(card);
        } else {
          card.style.display = 'none';
        }
      });
    }

    // Initialize visible list
    updateVisibleCards('all');

    // Filtering handler
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var filterVal = btn.getAttribute('data-filter') || 'all';
        updateVisibleCards(filterVal);
      });
    });

    // Lightbox Controls
    function openLightbox(index) {
      if (!lightbox || !visibleGalleryCards.length) return;
      if (index < 0) index = 0;
      if (index >= visibleGalleryCards.length) index = visibleGalleryCards.length - 1;

      currentLightboxIndex = index;
      renderLightboxCard(visibleGalleryCards[currentLightboxIndex], currentLang());

      lightbox.classList.add('active');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      if (closeBtn) closeBtn.focus();
    }

    function closeLightbox() {
      if (!lightbox) return;
      lightbox.classList.remove('active');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      currentLightboxIndex = -1;
    }

    function showPrev() {
      if (!visibleGalleryCards.length) return;
      var newIndex = currentLightboxIndex - 1;
      if (newIndex < 0) newIndex = visibleGalleryCards.length - 1;
      openLightbox(newIndex);
    }

    function showNext() {
      if (!visibleGalleryCards.length) return;
      var newIndex = currentLightboxIndex + 1;
      if (newIndex >= visibleGalleryCards.length) newIndex = 0;
      openLightbox(newIndex);
    }

    // Attach click listeners to cards
    allCards.forEach(function (card) {
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', 'View high quality batch photograph');

      card.addEventListener('click', function () {
        var idx = visibleGalleryCards.indexOf(card);
        if (idx !== -1) {
          openLightbox(idx);
        }
      });

      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          var idx = visibleGalleryCards.indexOf(card);
          if (idx !== -1) {
            openLightbox(idx);
          }
        }
      });
    });

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', showPrev);
    if (nextBtn) nextBtn.addEventListener('click', showNext);

    if (lightbox) {
      lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });
    }

    // Keyboard support
    document.addEventListener('keydown', function (e) {
      if (!lightbox || !lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        showPrev();
      } else if (e.key === 'ArrowRight') {
        showNext();
      }
    });
  }
})();
