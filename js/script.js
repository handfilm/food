// ---------------------------------------------------------
// Language toggle (English / Bangla)
// Every translatable element carries data-en / data-bn
// (or data-en-html / data-bn-html for text that contains
// markup, like the hero heading's line break).
// Choice is remembered in localStorage across visits.
// ---------------------------------------------------------

(function () {
  var STORAGE_KEY = 'hh-lang';
  var BATCH_STORAGE_KEY = 'hh-batch-stock-v2';

  var currentLightboxIndex = -1;
  var visibleGalleryCards = [];

  // Default initial configuration for today's kitchen batches
  var DEFAULT_BATCH_DATA = {
    'HH-01': { total: 10, remaining: 3, nameEn: 'Signature Almond Cheesecake', nameBn: 'সিগনেচার আমন্ড চিজকেক' },
    'HH-02': { total: 24, remaining: 7, nameEn: 'Signature Singara Chaat', nameBn: 'সিগনেচার সিঙ্গারা চাট' },
    'HH-03': { total: 16, remaining: 4, nameEn: 'Chocolate Jar Dessert', nameBn: 'চকোলেট জার ডেজার্ট' }
  };

  // Toast notification management (shared across sharing and batch reservations)
  var toastTimeout = null;
  function showToast(message, icon) {
    var toast = document.getElementById('share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'share-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    var symbol = icon || '✓';
    toast.innerHTML = '<span class="toast-icon">' + symbol + '</span><span>' + message + '</span>';
    toast.classList.add('active');

    toastTimeout = setTimeout(function () {
      toast.classList.remove('active');
    }, 3200);
  }

  function toBengaliDigits(num) {
    var bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return String(num).replace(/[0-9]/g, function (w) {
      return bnDigits[+w];
    });
  }

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

    // Update dynamic menu stock urgency & remaining items labels
    updateMenuStockDisplay(lang);

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
    initStorySharing();
    initMenuBatchStock();
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

  // ---------------------------------------------------------
  // Social Media Sharing for Food Story Sections
  // Enables sharing specific food stories to WhatsApp, Facebook,
  // X (Twitter), or copying a deep-link directly to clipboard.
  // ---------------------------------------------------------
  function initStorySharing() {
    var shareBars = document.querySelectorAll('.story-share-bar');
    if (!shareBars.length) return;

    function getStoryDetails(bar) {
      var lang = currentLang();
      var storyId = bar.getAttribute('data-story-id') || '';
      var title = (lang === 'bn' ? bar.getAttribute('data-story-title-bn') : bar.getAttribute('data-story-title-en')) || 'Hands & Head Food Story';
      var desc = (lang === 'bn' ? bar.getAttribute('data-story-desc-bn') : bar.getAttribute('data-story-desc-en')) || '';

      // Construct deep link URL
      var baseUrl = window.location.origin + window.location.pathname;
      var deepUrl = baseUrl.replace(/\/$/, '') + '#' + storyId;

      return {
        id: storyId,
        title: title,
        desc: desc,
        url: deepUrl,
        lang: lang
      };
    }

    shareBars.forEach(function (bar) {
      // WhatsApp button
      var waBtn = bar.querySelector('.share-wa');
      if (waBtn) {
        waBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var story = getStoryDetails(bar);
          var shareText = story.title + '\n' + story.desc + '\n' + story.url;
          var waUrl = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText);
          window.open(waUrl, '_blank', 'noopener,noreferrer');
        });
      }

      // Facebook button
      var fbBtn = bar.querySelector('.share-fb');
      if (fbBtn) {
        fbBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var story = getStoryDetails(bar);
          var fbUrl = 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(story.url) + '&quote=' + encodeURIComponent(story.title + ' — ' + story.desc);
          window.open(fbUrl, '_blank', 'noopener,noreferrer,width=600,height=500');
        });
      }

      // X (Twitter) button
      var xBtn = bar.querySelector('.share-x');
      if (xBtn) {
        xBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var story = getStoryDetails(bar);
          var tweetText = story.title + ' — ' + story.desc;
          var xUrl = 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(tweetText) + '&url=' + encodeURIComponent(story.url);
          window.open(xUrl, '_blank', 'noopener,noreferrer,width=600,height=450');
        });
      }

      // Copy Link button
      var copyBtn = bar.querySelector('.share-copy');
      if (copyBtn) {
        copyBtn.addEventListener('click', function (e) {
          e.preventDefault();
          var story = getStoryDetails(bar);
          var textSpan = copyBtn.querySelector('.copy-text');
          var originalEn = textSpan ? textSpan.getAttribute('data-en') : 'Copy Link';
          var originalBn = textSpan ? textSpan.getAttribute('data-bn') : 'লিংক কপি';

          function handleSuccess() {
            copyBtn.classList.add('copied');
            if (textSpan) {
              textSpan.textContent = story.lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!';
            }
            var toastMsg = story.lang === 'bn'
              ? 'গল্পের লিংক ক্লিপবোর্ডে কপি করা হয়েছে'
              : 'Story link copied to clipboard!';
            showToast(toastMsg, '✓');

            setTimeout(function () {
              copyBtn.classList.remove('copied');
              if (textSpan) {
                textSpan.textContent = story.lang === 'bn' ? originalBn : originalEn;
              }
            }, 2200);
          }

          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(story.url).then(handleSuccess).catch(function () {
              fallbackCopy(story.url, handleSuccess);
            });
          } else {
            fallbackCopy(story.url, handleSuccess);
          }
        });
      }
    });

    function fallbackCopy(text, callback) {
      var tempInput = document.createElement('input');
      tempInput.style.position = 'fixed';
      tempInput.style.opacity = '0';
      tempInput.style.pointerEvents = 'none';
      tempInput.value = text;
      document.body.appendChild(tempInput);
      tempInput.focus();
      tempInput.select();
      try {
        var successful = document.execCommand('copy');
        if (successful && typeof callback === 'function') {
          callback();
        }
      } catch (err) {
        console.warn('Unable to copy', err);
      }
      document.body.removeChild(tempInput);
    }
  }

  // ---------------------------------------------------------
  // Dynamic Menu Card Batch Stock & Urgency System
  // Creates authentic urgency for limited daily production batches
  // by calculating remaining items, updating progress meters,
  // translating numerals between EN and BN, and managing reservations.
  // ---------------------------------------------------------
  function getBatchStockState() {
    try {
      var saved = localStorage.getItem(BATCH_STORAGE_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        var todayKey = new Date().toDateString();
        if (parsed && parsed.date === todayKey && parsed.items) {
          return parsed.items;
        }
      }
    } catch (e) {
      /* ignore */
    }

    var initial = {};
    for (var code in DEFAULT_BATCH_DATA) {
      initial[code] = {
        total: DEFAULT_BATCH_DATA[code].total,
        remaining: DEFAULT_BATCH_DATA[code].remaining
      };
    }
    saveBatchStockState(initial);
    return initial;
  }

  function saveBatchStockState(items) {
    try {
      var payload = {
        date: new Date().toDateString(),
        items: items
      };
      localStorage.setItem(BATCH_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      /* ignore */
    }
  }

  function updateMenuStockDisplay(lang) {
    if (!lang) lang = currentLang();
    var stockState = getBatchStockState();
    var cards = document.querySelectorAll('.card[data-batch-code]');

    cards.forEach(function (card) {
      var batchCode = card.getAttribute('data-batch-code');
      var itemData = stockState[batchCode] || DEFAULT_BATCH_DATA[batchCode];
      if (!itemData) return;

      var total = itemData.total;
      var remaining = Math.max(0, itemData.remaining);
      var claimed = total > 0 ? Math.round(((total - remaining) / total) * 100) : 0;
      var isLow = remaining <= 4;

      // Urgency styling toggle
      card.classList.toggle('card-stock-low', isLow);

      // 1. Photo Pill Badge
      var pill = card.querySelector('.batch-stock-pill');
      var pillText = card.querySelector('.stock-pill-text');
      if (pill) {
        pill.classList.toggle('stock-low', isLow);
      }
      if (pillText) {
        var numStr = lang === 'bn' ? toBengaliDigits(remaining) : String(remaining);
        if (lang === 'bn') {
          pillText.textContent = isLow
            ? 'আজ মাত্র ' + numStr + 'টি বাকি'
            : numStr + 'টি পোরশন বাকি';
        } else {
          pillText.textContent = isLow
            ? 'Only ' + numStr + ' left today'
            : numStr + ' items left';
        }
      }

      // 2. Dynamic Batch Status Bar
      var statusBar = card.querySelector('.batch-stock-status');
      if (statusBar) {
        statusBar.classList.toggle('stock-low', isLow);
      }

      var leadText = card.querySelector('.stock-lead-text');
      if (leadText) {
        var tmpl = lang === 'bn'
          ? (leadText.getAttribute('data-bn-tmpl') || 'আজকের ব্যাচে মাত্র <strong>{remaining}টি</strong> অবশিষ্ট')
          : (leadText.getAttribute('data-en-tmpl') || 'Only <strong>{remaining} items</strong> left in today\'s batch');
        var remFormatted = lang === 'bn' ? toBengaliDigits(remaining) : String(remaining);
        leadText.innerHTML = tmpl.replace('{remaining}', remFormatted);
      }

      var claimedTag = card.querySelector('.batch-claimed-tag');
      if (claimedTag) {
        var claimedTmpl = lang === 'bn'
          ? (claimedTag.getAttribute('data-bn-tmpl') || '{claimed}% শেষ')
          : (claimedTag.getAttribute('data-en-tmpl') || '{claimed}% claimed');
        var claimedFormatted = lang === 'bn' ? toBengaliDigits(claimed) : String(claimed);
        claimedTag.textContent = claimedTmpl.replace('{claimed}', claimedFormatted);
      }

      // Progress bar fill & ARIA
      var progressTrack = card.querySelector('.batch-progress-track');
      var progressFill = card.querySelector('.batch-progress-fill');
      if (progressTrack) {
        progressTrack.setAttribute('aria-valuenow', remaining);
        progressTrack.setAttribute('aria-valuemax', total);
      }
      if (progressFill) {
        progressFill.style.width = Math.min(100, Math.max(10, claimed)) + '%';
      }

      // 3. Ticket specification row
      var ticketCap = card.querySelector('.batch-ticket-cap');
      if (ticketCap) {
        var capTmpl = lang === 'bn'
          ? (ticketCap.getAttribute('data-bn-tmpl') || '{total}টির মধ্যে {remaining}টি বাকি')
          : (ticketCap.getAttribute('data-en-tmpl') || '{remaining} of {total} left');
        var remDigit = lang === 'bn' ? toBengaliDigits(remaining) : String(remaining);
        var totDigit = lang === 'bn' ? toBengaliDigits(total) : String(total);
        ticketCap.textContent = capTmpl.replace('{remaining}', remDigit).replace('{total}', totDigit);
      }
    });
  }

  function initMenuBatchStock() {
    updateMenuStockDisplay(currentLang());

    // Connect Order Batch buttons on menu cards to reserve & decrement stock with interactive toast
    var orderBtns = document.querySelectorAll('.order-batch-btn');
    orderBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        var batchCode = btn.getAttribute('data-batch-code');
        if (!batchCode) return;

        var lang = currentLang();
        var stockState = getBatchStockState();
        if (stockState[batchCode] && stockState[batchCode].remaining > 0) {
          stockState[batchCode].remaining -= 1;
          saveBatchStockState(stockState);
          updateMenuStockDisplay(lang);

          var itemName = DEFAULT_BATCH_DATA[batchCode]
            ? (lang === 'bn' ? DEFAULT_BATCH_DATA[batchCode].nameBn : DEFAULT_BATCH_DATA[batchCode].nameEn)
            : batchCode;
          var leftNum = lang === 'bn' ? toBengaliDigits(stockState[batchCode].remaining) : String(stockState[batchCode].remaining);

          var toastMsg = lang === 'bn'
            ? itemName + ' এর জন্য বুকিং সংরক্ষিত! আজকের ব্যাচে আর ' + leftNum + 'টি বাকি।'
            : itemName + ' selected! ' + leftNum + ' units remaining in today\'s batch.';

          showToast(toastMsg, '⚡');
        }
      });
    });
  }
})();
