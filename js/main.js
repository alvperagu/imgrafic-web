(function () {
  var toggle = document.getElementById('nav-toggle');
  var mobileNav = document.getElementById('mobile-nav');
  var siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    var setHeaderHeight = function () {
      document.documentElement.style.setProperty('--header-h', siteHeader.offsetHeight + 'px');
    };
    setHeaderHeight();
    window.addEventListener('resize', setHeaderHeight);
  }

  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      mobileNav.classList.toggle('open', !open);
      toggle.setAttribute('aria-label', open ? 'Abrir menú' : 'Cerrar menú');
    });

    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Abrir menú');
        mobileNav.classList.remove('open');
      });
    });
  }

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  }

  var aboutSection = document.querySelector('.about');
  var aboutViewport = document.querySelector('.about-carousel-viewport');
  var aboutTrack = document.getElementById('about-carousel-track');

  if (aboutSection && aboutViewport && aboutTrack) {
    var maxX = 0;
    var targetX = 0;
    var currentX = 0;
    var animating = false;
    var lerpFactor = reduceMotion ? 1 : 0.09;

    function measureAbout() {
      maxX = Math.max(0, aboutTrack.scrollWidth - aboutViewport.clientWidth);
    }

    function computeTargetAbout() {
      var rect = aboutSection.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      // Progress runs over the section's full scroll span (its own height
      // plus one viewport), so the slide plays out gradually across the
      // whole time the section is on screen rather than snapping through
      // in the height of just the photo strip.
      var progress = (vh - rect.top) / (vh + rect.height);
      progress = Math.min(1, Math.max(0, progress));
      targetX = progress * maxX;
    }

    function tickAbout() {
      currentX += (targetX - currentX) * lerpFactor;
      if (Math.abs(targetX - currentX) < 0.3) currentX = targetX;
      aboutTrack.style.transform = 'translateX(' + (-currentX) + 'px)';
      if (currentX !== targetX) {
        requestAnimationFrame(tickAbout);
      } else {
        animating = false;
      }
    }

    function onAboutScroll() {
      computeTargetAbout();
      if (!animating) {
        animating = true;
        requestAnimationFrame(tickAbout);
      }
    }

    measureAbout();
    computeTargetAbout();
    currentX = targetX;
    aboutTrack.style.transform = 'translateX(' + (-currentX) + 'px)';

    window.addEventListener('scroll', onAboutScroll, { passive: true });
    window.addEventListener('resize', function () {
      measureAbout();
      onAboutScroll();
    });
  }

  var stackDeck = document.querySelector('.stack-deck');
  if (stackDeck && window.matchMedia('(hover: none), (pointer: coarse)').matches) {
    stackDeck.addEventListener('click', function () {
      stackDeck.classList.toggle('is-fanned');
    });
  }

  var reviewsTrack = document.getElementById('reviews-track');
  var reviewsViewport = document.getElementById('reviews-viewport');
  var reviewsDots = document.getElementById('reviews-dots');

  if (reviewsTrack && reviewsViewport && reviewsDots) {
    var reviewCards = Array.prototype.slice.call(reviewsTrack.children);
    var reviewsPrev = document.getElementById('reviews-prev');
    var reviewsNext = document.getElementById('reviews-next');
    var reviewIndex = 0;
    var visibleCount = 1;
    var maxIndex = 0;
    var autoplayId = null;
    var userTookOver = false;

    function visibleForWidth() {
      if (window.innerWidth >= 1000) return 3;
      if (window.innerWidth >= 640) return 2;
      return 1;
    }

    function slide() {
      var gap = parseFloat(getComputedStyle(reviewsTrack).columnGap) || 0;
      var step = reviewCards[0].getBoundingClientRect().width + gap;
      reviewsTrack.style.transform = 'translateX(' + (-reviewIndex * step) + 'px)';
    }

    function renderDots() {
      reviewsDots.textContent = '';
      for (var i = 0; i <= maxIndex; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'reviews-dot' + (i === reviewIndex ? ' is-active' : '');
        dot.setAttribute('aria-label', 'Ir a la reseña ' + (i + 1));
        dot.addEventListener('click', (function (target) {
          return function () { stopAutoplay(); goTo(target); };
        })(i));
        reviewsDots.appendChild(dot);
      }
    }

    function syncDots() {
      Array.prototype.forEach.call(reviewsDots.children, function (dot, i) {
        dot.classList.toggle('is-active', i === reviewIndex);
      });
    }

    function goTo(i) {
      reviewIndex = i < 0 ? maxIndex : (i > maxIndex ? 0 : i);
      slide();
      syncDots();
    }

    function layout() {
      var next = visibleForWidth();
      var nextMax = Math.max(0, reviewCards.length - next);
      if (next === visibleCount && nextMax === maxIndex) {
        slide();
        return;
      }
      visibleCount = next;
      maxIndex = nextMax;
      reviewsTrack.style.setProperty('--reviews-visible', visibleCount);
      if (reviewIndex > maxIndex) reviewIndex = maxIndex;
      renderDots();
      slide();
    }

    function pauseAutoplay() {
      if (autoplayId === null) return;
      clearInterval(autoplayId);
      autoplayId = null;
    }

    function startAutoplay() {
      if (reduceMotion || userTookOver || autoplayId !== null) return;
      autoplayId = setInterval(function () { goTo(reviewIndex + 1); }, 5000);
    }

    // Once the reader drives the carousel themselves, stop moving it under them.
    function stopAutoplay() {
      userTookOver = true;
      pauseAutoplay();
    }

    reviewsPrev.addEventListener('click', function () { stopAutoplay(); goTo(reviewIndex - 1); });
    reviewsNext.addEventListener('click', function () { stopAutoplay(); goTo(reviewIndex + 1); });

    var swipeStartX = null;
    reviewsViewport.addEventListener('pointerdown', function (e) { swipeStartX = e.clientX; });
    reviewsViewport.addEventListener('pointerup', function (e) {
      if (swipeStartX === null) return;
      var dx = e.clientX - swipeStartX;
      swipeStartX = null;
      if (Math.abs(dx) < 45) return;
      stopAutoplay();
      goTo(reviewIndex + (dx < 0 ? 1 : -1));
    });
    reviewsViewport.addEventListener('pointercancel', function () { swipeStartX = null; });
    reviewsViewport.addEventListener('pointerleave', function () { swipeStartX = null; });

    var reviewsCarousel = reviewsTrack.closest('.reviews-carousel');
    reviewsCarousel.addEventListener('pointerenter', pauseAutoplay);
    reviewsCarousel.addEventListener('pointerleave', startAutoplay);
    reviewsCarousel.addEventListener('focusin', pauseAutoplay);
    reviewsCarousel.addEventListener('focusout', startAutoplay);

    layout();
    window.addEventListener('resize', layout);
    startAutoplay();
  }

})();
