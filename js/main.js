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

  var splitItems = document.querySelectorAll('.services-split-item');
  var splitFrame = document.getElementById('services-split-frame');

  if (splitItems.length && splitFrame) {
    var splitItemsArr = Array.prototype.slice.call(splitItems);

    var setSplitImage = function (src) {
      if (!src) return;
      var front = splitFrame.querySelector('img.is-front');
      var back = splitFrame.querySelectorAll('img')[0] === front
        ? splitFrame.querySelectorAll('img')[1]
        : splitFrame.querySelectorAll('img')[0];
      if (!back || (front && front.getAttribute('src') === src)) return;
      back.onload = function () {
        if (front) front.classList.remove('is-front');
        back.classList.add('is-front');
      };
      back.src = src;
    };

    var activateSplitItem = function (item) {
      splitItemsArr.forEach(function (el) {
        el.classList.toggle('is-active', el === item);
      });
      setSplitImage(item.getAttribute('data-img'));
    };

    if ('IntersectionObserver' in window) {
      var visibleSplitItems = [];
      var splitObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var idx = visibleSplitItems.indexOf(entry.target);
          if (entry.isIntersecting && idx === -1) {
            visibleSplitItems.push(entry.target);
          } else if (!entry.isIntersecting && idx !== -1) {
            visibleSplitItems.splice(idx, 1);
          }
        });
        if (!visibleSplitItems.length) return;
        var centerY = window.innerHeight / 2;
        var closest = visibleSplitItems.reduce(function (best, el) {
          var mid = el.getBoundingClientRect().top + el.offsetHeight / 2;
          var dist = Math.abs(mid - centerY);
          return (!best || dist < best.dist) ? { el: el, dist: dist } : best;
        }, null);
        activateSplitItem(closest.el);
      }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
      splitItemsArr.forEach(function (el) { splitObserver.observe(el); });
    }

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      splitItemsArr.forEach(function (el) {
        el.addEventListener('mouseenter', function () { activateSplitItem(el); });
      });
    }

    splitItemsArr.forEach(function (el) {
      el.addEventListener('focus', function () { activateSplitItem(el); });
    });
  }

})();
