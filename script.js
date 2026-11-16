/* =========================================================
   Wedding Invitation — script.js
   채석주 ♥ 김혜준 (2027.08.21)
   Vanilla JS only.
   ========================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // SETTINGS — 실제 운영 시 아래 값을 채워주세요.
  // ---------------------------------------------------------
  const KAKAO_JS_KEY    = ''; // placeholder: 카카오 JavaScript 키 (https://developers.kakao.com/)
  const SHARE_TITLE     = '8월 21일 채석주 ♥ 김혜준 결혼합니다';
  const SHARE_DESC      = '2027년 8월 21일 토요일 오후 6시\n에스가든웨딩 동탄점';
  const SHARE_IMAGE     = location.origin + location.pathname.replace(/\/[^/]*$/, '/') + 'images/og-thumbnail.png';
  const WEDDING_DATE    = { y: 2027, m: 8, d: 21 };
  const GALLERY_COUNT   = 12;  // images/gallery/01.jpg ~ 12.jpg
  const GALLERY_VISIBLE = 9;   // 처음에 보이는 개수 (나머지는 '더 보기')

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reducedMotion.matches;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const haptic = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };
  const pad2 = (n) => String(n).padStart(2, '0');

  // ---------------------------------------------------------
  // 1. Photo slots: 사진 파일이 없으면 <img>를 지워 자리표시를 보여줌
  // ---------------------------------------------------------
  function watchPhoto(img) {
    const drop = () => img.remove();
    if (img.complete && img.naturalWidth === 0 && img.getAttribute('src')) drop();
    else img.addEventListener('error', drop, { once: true });
  }
  function setupPhotos() {
    $$('.photo img').forEach(watchPhoto);
  }

  // ---------------------------------------------------------
  // 2. Scroll fade-up
  // ---------------------------------------------------------
  function setupReveal() {
    const targets = $$('[data-aos]');
    if (isReduced() || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    targets.forEach(el => io.observe(el));
  }

  // ---------------------------------------------------------
  // 3. Calendar + D-day
  // ---------------------------------------------------------
  function setupCalendar() {
    const { y, m, d } = WEDDING_DATE;
    const tbody = $('.cal tbody');
    if (tbody) {
      const first = new Date(y, m - 1, 1).getDay();
      const last  = new Date(y, m, 0).getDate();
      let html = '<tr>';
      for (let i = 0; i < first; i++) html += '<td></td>';
      for (let day = 1; day <= last; day++) {
        html += `<td${day === d ? ' class="target"' : ''}><span>${day}</span></td>`;
        if ((first + day) % 7 === 0 && day !== last) html += '</tr><tr>';
      }
      tbody.innerHTML = html + '</tr>';
    }

    const el = $('#dday');
    if (el) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const diff = Math.round((new Date(y, m - 1, d) - today) / 86400000);
      el.textContent = diff > 0 ? `D-${diff}` : diff === 0 ? 'D-Day' : `D+${-diff}`;
    }
  }

  // ---------------------------------------------------------
  // 4. Gallery grid + 더 보기
  // ---------------------------------------------------------
  function setupGallery() {
    const grid = $('#gallery-grid');
    const more = $('#gallery-more');
    if (!grid) return;

    let html = '';
    for (let i = 1; i <= GALLERY_COUNT; i++) {
      const hidden = i > GALLERY_VISIBLE ? ' class="is-hidden"' : '';
      html += `<li${hidden}><button type="button" aria-label="사진 ${i} 크게 보기">` +
              `<div class="photo" data-label="${i}"><img src="images/gallery/${pad2(i)}.jpg" alt="갤러리 사진 ${i}" loading="lazy"></div>` +
              `</button></li>`;
    }
    grid.innerHTML = html;
    $$('img', grid).forEach(watchPhoto);

    $$('button', grid).forEach((btn, i) => {
      btn.addEventListener('click', () => openLightbox(i));
    });

    if (more) {
      if (GALLERY_COUNT <= GALLERY_VISIBLE) more.hidden = true;
      more.addEventListener('click', () => {
        $$('li.is-hidden', grid).forEach(li => li.classList.remove('is-hidden'));
        more.hidden = true;
      });
    }
  }

  // ---------------------------------------------------------
  // 5. Lightbox: prev/next + swipe + pinch zoom + double-tap
  // ---------------------------------------------------------
  let lightboxAPI = null;
  function setupLightbox() {
    const lb    = $('#lightbox');
    const img   = $('#lightbox-img');
    const close = $('#lightbox-close');
    const prev  = $('#lightbox-prev');
    const next  = $('#lightbox-next');
    const count = $('#lightbox-count');
    if (!lb || !img || !close) return;

    let sources = [];
    let idx = 0;
    let scale = 1, originX = 0, originY = 0;
    let lastDist = 0, lastTap = 0;
    let panStart = null, swipeStartX = null, swipeDX = 0;
    let prevFocus = null;

    const setTransform = () => { img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`; };
    const reset = () => { scale = 1; originX = 0; originY = 0; img.style.transform = ''; };

    function render() {
      img.src = sources[idx].src;
      img.alt = sources[idx].alt || '';
      if (count) count.textContent = `${idx + 1} / ${sources.length}`;
      reset();
    }
    function go(delta) {
      if (sources.length < 2) return;
      idx = (idx + delta + sources.length) % sources.length;
      render();
      haptic(8);
    }
    function open(i) {
      // 실제로 존재하는 사진만 넘겨봄
      const all = $$('#gallery-grid li');
      const clickedImg = $('img', all[i]);
      if (!clickedImg) return;
      sources = all.map(li => $('img', li)).filter(Boolean);
      idx = sources.indexOf(clickedImg);
      render();
      haptic(8);
      lb.hidden = false;
      requestAnimationFrame(() => lb.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      prevFocus = document.activeElement;
      close.focus();
    }
    function closeFn() {
      lb.classList.remove('is-open');
      setTimeout(() => {
        lb.hidden = true;
        reset();
        document.body.style.overflow = '';
        if (prevFocus && prevFocus.focus) prevFocus.focus();
      }, isReduced() ? 0 : 220);
    }

    close.addEventListener('click', closeFn);
    prev?.addEventListener('click', (e) => { e.stopPropagation(); go(-1); });
    next?.addEventListener('click', (e) => { e.stopPropagation(); go(1); });
    lb.addEventListener('click', (e) => { if (e.target === lb) closeFn(); });
    document.addEventListener('keydown', (e) => {
      if (lb.hidden) return;
      if (e.key === 'Escape')     closeFn();
      if (e.key === 'ArrowLeft')  go(-1);
      if (e.key === 'ArrowRight') go(1);
    });

    img.addEventListener('touchstart', (e) => {
      lb.classList.add('is-zooming');
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        lastDist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        swipeStartX = null;
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) {
          scale = scale > 1.05 ? 1 : 2.4;
          originX = 0; originY = 0;
          lb.classList.remove('is-zooming');
          setTransform();
          swipeStartX = null;
        } else if (scale > 1) {
          panStart = { x: e.touches[0].clientX - originX, y: e.touches[0].clientY - originY };
        } else {
          swipeStartX = e.touches[0].clientX;
          swipeDX = 0;
        }
        lastTap = now;
      }
    }, { passive: true });

    img.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        const [a, b] = e.touches;
        const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
        if (lastDist > 0) { scale = clamp(scale * (dist / lastDist), 1, 3); setTransform(); }
        lastDist = dist;
      } else if (e.touches.length === 1 && panStart && scale > 1) {
        originX = e.touches[0].clientX - panStart.x;
        originY = e.touches[0].clientY - panStart.y;
        setTransform();
      } else if (e.touches.length === 1 && swipeStartX !== null) {
        swipeDX = e.touches[0].clientX - swipeStartX;
        img.style.transform = `translateX(${swipeDX}px)`;
        img.style.opacity = String(1 - Math.min(Math.abs(swipeDX) / 400, 0.5));
      }
    }, { passive: true });

    img.addEventListener('touchend', (e) => {
      if (e.touches.length !== 0) return;
      lb.classList.remove('is-zooming');
      img.style.opacity = '';
      if (swipeStartX !== null) {
        if (swipeDX > 50) go(-1);
        else if (swipeDX < -50) go(1);
        else reset();
        swipeStartX = null;
        swipeDX = 0;
      }
      lastDist = 0;
      panStart = null;
      if (scale < 1.05) reset();
    });

    lightboxAPI = { open };
  }
  function openLightbox(i) { if (lightboxAPI) lightboxAPI.open(i); }

  // ---------------------------------------------------------
  // 6. Copy (주소 / 계좌번호) + toast
  // ---------------------------------------------------------
  async function copyText(txt) {
    try {
      await navigator.clipboard.writeText(txt);
      return true;
    } catch (e) {
      try {
        const ta = document.createElement('textarea');
        ta.value = txt;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
      } catch (e2) { return false; }
    }
  }

  function setupCopy() {
    $('#copy-addr')?.addEventListener('click', async (e) => {
      const ok = await copyText(e.currentTarget.dataset.copy || '');
      if (ok) haptic(15);
      showToast(ok ? '주소가 복사되었습니다' : '복사에 실패했습니다');
    });
    $$('.copy-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ok = await copyText(btn.dataset.copy || '');
        if (ok) haptic(15);
        showToast(ok ? '계좌번호가 복사되었습니다' : '복사에 실패했습니다');
      });
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-visible'));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      t.classList.remove('is-visible');
      setTimeout(() => { t.hidden = true; }, 320);
    }, 1700);
  }

  // ---------------------------------------------------------
  // 7. Music toggle
  // ---------------------------------------------------------
  function setupMusic() {
    const btn = $('#music-toggle');
    const audio = $('#bgm');
    if (!btn || !audio) return;
    audio.volume = 0;

    function fadeVolume(target, dur) {
      const start = audio.volume;
      const t0 = performance.now();
      function tick(now) {
        const t = clamp((now - t0) / dur, 0, 1);
        audio.volume = start + (target - start) * t;
        if (t < 1) requestAnimationFrame(tick);
        else if (target === 0) audio.pause();
      }
      requestAnimationFrame(tick);
    }

    btn.addEventListener('click', async () => {
      haptic(10);
      try {
        if (audio.paused) {
          await audio.play();
          btn.setAttribute('aria-pressed', 'true');
          fadeVolume(0.4, 1500);
        } else {
          fadeVolume(0, 600);
          btn.setAttribute('aria-pressed', 'false');
        }
      } catch (e) {
        showToast('음원 파일을 찾을 수 없어요 (audio/bgm.mp3)');
      }
    });
  }

  // ---------------------------------------------------------
  // 8. Share (카카오톡 / 링크 복사)
  // ---------------------------------------------------------
  function setupShare() {
    $('#share-link')?.addEventListener('click', async () => {
      const ok = await copyText(location.href);
      if (ok) haptic(15);
      showToast(ok ? '청첩장 링크가 복사되었습니다' : '복사에 실패했습니다');
    });

    $('#share-kakao')?.addEventListener('click', async () => {
      haptic(15);
      if (window.Kakao && KAKAO_JS_KEY) {
        try {
          if (!window.Kakao.isInitialized()) window.Kakao.init(KAKAO_JS_KEY);
          window.Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
              title: SHARE_TITLE,
              description: SHARE_DESC,
              imageUrl: SHARE_IMAGE,
              link: { mobileWebUrl: location.href, webUrl: location.href }
            },
            buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: location.href, webUrl: location.href } }]
          });
          return;
        } catch (e) { /* fallthrough */ }
      }
      if (navigator.share) {
        navigator.share({ title: SHARE_TITLE, text: SHARE_DESC, url: location.href }).catch(() => {});
        return;
      }
      const ok = await copyText(location.href);
      showToast(ok ? '청첩장 링크가 복사되었습니다' : '복사에 실패했습니다');
    });
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------
  function init() {
    setupPhotos();
    setupCalendar();
    setupGallery();
    setupLightbox();
    setupReveal();
    setupCopy();
    setupMusic();
    setupShare();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
