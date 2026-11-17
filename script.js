/* =========================================================
   Wedding Invitation — script.js
   석주 ♥ 혜준 (2027.08.21) · Cinema concept
   Vanilla JS only.
   ========================================================= */
(function () {
  'use strict';

  // ---------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------
  const KAKAO_JS_KEY    = '1bba4e659f27bfe21428069607505228'; // 카카오 JavaScript 키 (앱: 석주♡혜준)
  const SITE_URL        = 'https://sj-hj-wedding.github.io/';
  const SHARE_TITLE     = '석주 ෆ 혜준 27. 08. 21 토요일 18:00 에스가든웨딩동탄';
  const SHARE_DESC      = '2027-08-21 토요일 오후 6시\n저희 두 사람의 결혼식에 초대합니다.';
  const SHARE_IMAGE     = SITE_URL + 'images/og-thumbnail.jpg'; // 카톡 카드 사진 (가로 1200 × 세로 800 권장)
  const SHARE_IMAGE_W   = 1200;
  const SHARE_IMAGE_H   = 800;
  const VENUE_NAME      = '에스가든웨딩 동탄점';
  const VENUE_ADDR      = '경기 화성시 동탄영천로 150'; // 지도 위치를 찾을 때 쓰는 주소 (도로명까지만)
  const WEDDING_AT      = new Date(2027, 7, 21, 18, 0, 0); // 2027-08-21 18:00 (월은 0부터)
  const GALLERY_COUNT   = 12;  // images/gallery/01.jpg ~ 12.jpg

  // ---------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isReduced = () => reducedMotion.matches;
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const haptic = (n) => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };
  const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');

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
  // 2. Cover: 스포트라이트 오프닝
  // ---------------------------------------------------------
  function setupCover() {
    const cover = $('#cover');
    if (!cover) return;
    requestAnimationFrame(() => requestAnimationFrame(() => cover.classList.add('is-loaded')));
  }

  // ---------------------------------------------------------
  // 3. Scroll reveal
  // ---------------------------------------------------------
  function setupReveal() {
    // 요소의 윗부분이 화면 아래에서 offset(기본 120px)만큼 올라오면 나타나고,
    // 다시 위로 스크롤해 그 지점 아래로 내려가면 숨었다가 다음에 또 재생됨
    const items = $$('[data-aos]').map(el => ({ el, offset: parseInt(el.dataset.aosOffset, 10) || 120, top: 0 }));
    items.forEach(({ el }) => {
      if (el.dataset.aosDelay)    el.style.transitionDelay = el.dataset.aosDelay + 'ms';
      if (el.dataset.aosDuration) el.style.transitionDuration = el.dataset.aosDuration + 'ms';
    });
    if (isReduced()) {
      items.forEach(({ el }) => el.classList.add('is-visible'));
      return;
    }
    // transform 의 영향을 받지 않는 문서상 위치
    const topOf = (el) => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };
    const measure = () => { items.forEach(it => { it.top = topOf(it.el); }); };
    const update = () => {
      const line = window.scrollY + window.innerHeight;
      items.forEach(it => it.el.classList.toggle('is-visible', line - it.offset > it.top));
    };
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { ticking = false; update(); });
    };
    const refresh = () => { measure(); update(); };
    refresh();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', refresh);
    window.addEventListener('load', refresh);
    if ('ResizeObserver' in window) new ResizeObserver(refresh).observe($('#card') || document.body);
  }

  // ---------------------------------------------------------
  // 4. Film strips (흘러가는 필름)
  // ---------------------------------------------------------
  function setupFilm() {
    $$('.film[data-film]').forEach(film => {
      const ids = film.dataset.film.split(',').map(s => s.trim()).filter(Boolean);
      if (!ids.length) return;
      const frames = ids.map(id =>
        `<span class="film-frame"><span class="photo"><img src="images/gallery/${id}.jpg" alt="" loading="lazy"></span></span>`
      ).join('');
      // 같은 묶음을 두 번 이어 붙여 끊김 없이 반복
      const track = document.createElement('div');
      track.className = 'film-track';
      track.innerHTML = frames + frames;
      film.appendChild(track);
      $$('img', track).forEach(watchPhoto);
    });
  }

  // ---------------------------------------------------------
  // 5. Countdown
  // ---------------------------------------------------------
  function setupCountdown() {
    const elD = $('#cd-d'), elH = $('#cd-h'), elM = $('#cd-m'), elS = $('#cd-s');
    const elText = $('#cd-text');
    if (!elD || !elH || !elM || !elS) return;

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const targetDay = startOfDay(WEDDING_AT);

    function tick() {
      const now = new Date();
      const total = Math.max(0, Math.floor((WEDDING_AT.getTime() - now.getTime()) / 1000));
      elD.textContent = pad2(Math.floor(total / 86400));
      elH.textContent = pad2(Math.floor((total % 86400) / 3600));
      elM.textContent = pad2(Math.floor((total % 3600) / 60));
      elS.textContent = pad2(total % 60);

      if (elText) {
        const dayDiff = Math.round((targetDay - startOfDay(now)) / 86400000);
        const html = dayDiff > 0 ? ` 의 결혼식이 <b>${dayDiff}</b>일 남았습니다.`
                   : dayDiff === 0 ? ' 의 결혼식 날입니다!'
                   : ` 의 결혼식이 <b>${-dayDiff}</b>일 지났습니다.`;
        if (elText.dataset.v !== String(dayDiff)) { elText.innerHTML = html; elText.dataset.v = String(dayDiff); }
      }
    }
    tick();
    setTimeout(() => { tick(); setInterval(tick, 1000); }, 1000 - (Date.now() % 1000));
  }

  // ---------------------------------------------------------
  // 6. Ticket flip
  // ---------------------------------------------------------
  function setupTicket() {
    const ticket = $('#ticket');
    if (!ticket) return;
    ticket.addEventListener('click', () => {
      ticket.classList.add('is-touched');
      const flipped = ticket.classList.toggle('is-flipped');
      ticket.setAttribute('aria-pressed', String(flipped));
      haptic(8);
    });
  }

  // ---------------------------------------------------------
  // 7. Gallery reel (필름 슬라이더: 무한 반복 + 자동 넘김)
  // ---------------------------------------------------------
  const SLIDE_W = 220;
  function setupGallery() {
    const reel = $('#reel');
    if (!reel) return;
    const N = GALLERY_COUNT;
    const AUTO_DELAY = 2000;   // 멈춰 있는 시간
    const AUTO_SPEED = 2000;   // 다음 사진으로 미끄러지는 시간
    const DRAG_SPEED = 500;    // 손을 뗐을 때 자리 잡는 시간

    const slide = (i) =>
      `<button type="button" class="reel-slide" data-index="${i}" data-no="${i + 1}" aria-label="사진 ${i + 1} 크게 보기">` +
      `<span class="photo" data-label="${i + 1}"><img src="images/gallery/${pad2(i + 1)}.jpg" alt="갤러리 사진 ${i + 1}" loading="lazy" draggable="false"></span>` +
      `</button>`;
    let html = '';
    for (let copy = 0; copy < 3; copy++) for (let i = 0; i < N; i++) html += slide(i);
    const track = document.createElement('div');
    track.className = 'reel-track';
    track.innerHTML = html;
    reel.innerHTML = '';
    reel.appendChild(track);
    $$('img', track).forEach(watchPhoto);

    const centerOffset = () => (reel.clientWidth - SLIDE_W) / 2;
    const xOf = (i) => centerOffset() - i * SLIDE_W;
    let index = N;          // 가운데 묶음의 첫 사진
    let curX = 0;
    let timer = null;
    let inView = false;
    let dragging = false;

    function place(x, ms) {
      curX = x;
      track.style.transition = ms ? `transform ${ms}ms ease` : 'none';
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }
    // 양 끝 묶음으로 넘어가면 가운데 묶음의 같은 자리로 순간 이동 (눈에 띄지 않음)
    function normalize() {
      if (index >= 2 * N) index -= N;
      else if (index < N) index += N;
      place(xOf(index), 0);
    }
    function goTo(i, ms) {
      index = i;
      place(xOf(index), isReduced() ? 0 : ms);
      if (isReduced()) normalize();
    }
    function lightboxOpen() { const lb = $('#lightbox'); return lb && !lb.hidden; }
    function schedule() {
      clearTimeout(timer);
      if (isReduced()) return;
      timer = setTimeout(() => {
        if (!inView || dragging || document.hidden || lightboxOpen()) { schedule(); return; }
        goTo(index + 1, AUTO_SPEED);
      }, AUTO_DELAY);
    }
    track.addEventListener('transitionend', (e) => {
      if (e.target !== track || e.propertyName !== 'transform') return;
      normalize();
      schedule();
    });

    place(xOf(index), 0);
    window.addEventListener('resize', () => place(xOf(index), 0));

    // 화면에 들어오면 자동 넘김 시작
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        inView = entries[0].isIntersecting;
        if (inView) schedule();
      }, { threshold: 0.2 }).observe(reel);
    } else { inView = true; schedule(); }

    // 손으로 넘기기 (가로로 끌 때만 — 세로 스크롤은 그대로)
    let startX = 0, startY = 0, baseX = 0, moved = false, pid = null, lockDir = '';
    const currentX = () => {
      const m = getComputedStyle(track).transform;
      if (!m || m === 'none') return curX;
      const v = m.match(/matrix\(([^)]+)\)/);
      return v ? parseFloat(v[1].split(',')[4]) : curX;
    };
    reel.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pid = e.pointerId;
      startX = e.clientX; startY = e.clientY;
      baseX = currentX();
      moved = false; lockDir = '';
      clearTimeout(timer);
    });
    reel.addEventListener('pointermove', (e) => {
      if (pid === null || e.pointerId !== pid) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!lockDir) {
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        lockDir = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (lockDir === 'x') {
          dragging = true; moved = true;
          try { reel.setPointerCapture(pid); } catch (err) {}
        }
      }
      if (lockDir !== 'x') return;
      place(baseX + dx, 0);
    });
    const endDrag = (e) => {
      if (pid === null || (e && e.pointerId !== pid)) return;
      pid = null;
      if (dragging) {
        dragging = false;
        // 가장 가까운 사진으로 (살짝만 끌어도 한 장은 넘어가게)
        const dx = curX - baseX;
        let target = Math.round((centerOffset() - curX) / SLIDE_W);
        if (target === index && Math.abs(dx) > 40) target += dx < 0 ? 1 : -1;
        goTo(target, DRAG_SPEED);
        if (isReduced()) schedule();
      } else {
        // 끌지 않았으면 멈춘 자리에서 이어서 진행
        const nearest = Math.round((centerOffset() - currentX()) / SLIDE_W);
        if (Math.abs(xOf(nearest) - currentX()) > 1) goTo(Math.max(nearest, index), DRAG_SPEED);
        else schedule();
      }
    };
    reel.addEventListener('pointerup', endDrag);
    reel.addEventListener('pointercancel', endDrag);

    // 클릭 → 크게 보기 (끌었을 때는 열지 않음)
    reel.addEventListener('click', (e) => {
      if (moved) { moved = false; e.preventDefault(); return; }
      const btn = e.target.closest('.reel-slide');
      if (!btn) return;
      openLightbox(parseInt(btn.dataset.index, 10));
    });
  }

  // ---------------------------------------------------------
  // 8. Lightbox: prev/next + swipe + pinch zoom + double-tap
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

    const N = GALLERY_COUNT;
    const srcOf = (i) => `images/gallery/${pad2(i + 1)}.jpg`;
    let idx = 0;
    let scale = 1, originX = 0, originY = 0;
    let lastDist = 0, lastTap = 0;
    let panStart = null, swipeStartX = null, swipeDX = 0;
    let prevFocus = null;
    let introTimer = null;

    const setTransform = () => { img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`; };
    const reset = () => { scale = 1; originX = 0; originY = 0; img.style.transform = ''; };

    function render() {
      img.src = srcOf(idx);
      img.alt = `갤러리 사진 ${idx + 1}`;
      if (count) count.textContent = `${idx + 1} / ${N}`;
      reset();
    }
    function go(delta) {
      idx = (idx + delta + N) % N;
      render();
      haptic(8);
    }
    function open(i) {
      idx = clamp(i, 0, N - 1);
      render();
      haptic(8);
      lb.hidden = false;
      // 열릴 때 영사기가 잠깐 돌고 사진이 나타남
      lb.classList.remove('is-intro');
      void lb.offsetWidth;
      lb.classList.add('is-intro');
      clearTimeout(introTimer);
      introTimer = setTimeout(() => lb.classList.remove('is-intro'), 1350);
      requestAnimationFrame(() => lb.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      prevFocus = document.activeElement;
      close.focus();
    }
    function closeFn() {
      lb.classList.remove('is-open');
      clearTimeout(introTimer);
      setTimeout(() => {
        lb.hidden = true;
        lb.classList.remove('is-intro');
        reset();
        document.body.style.overflow = '';
        if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
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
  // 9. Tabs (계좌: 신랑 측 / 신부 측)
  // ---------------------------------------------------------
  function setupTabs() {
    $$('.tabs').forEach(tabs => {
      const btns = $$('.tab-btn', tabs);
      const panels = $$('.tab-panel', tabs);
      btns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          btns.forEach((b, j) => {
            b.classList.toggle('is-active', i === j);
            b.setAttribute('aria-selected', String(i === j));
          });
          panels.forEach((p, j) => {
            p.classList.toggle('is-active', i === j);
            p.hidden = i !== j;
          });
        });
      });
    });
  }

  // ---------------------------------------------------------
  // 10. Copy (주소 / 계좌번호) + toast
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
  // 11. Music button (스크롤을 내리면 숨고, 올리면 다시 나타남)
  // ---------------------------------------------------------
  function setupMusic() {
    const wrap = $('#audio-wrap');
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
        showToast('음원 파일을 찾을 수 없어요 (audio 폴더)');
      }
    });

    if (wrap) {
      let lastY = window.scrollY;
      window.addEventListener('scroll', () => {
        const y = window.scrollY;
        wrap.classList.toggle('is-hidden', y > lastY && y > 80);
        wrap.classList.toggle('is-scrolled', y > 0);
        lastY = y;
      }, { passive: true });
    }
  }

  // ---------------------------------------------------------
  // 12. Top button
  // ---------------------------------------------------------
  function setupTop() {
    const btn = $('#top-btn');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.hidden = window.scrollY <= window.innerHeight;
    }, { passive: true });
    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: isReduced() ? 'auto' : 'smooth' });
    });
  }

  // ---------------------------------------------------------
  // 13. Share (카카오톡 / 링크 복사)
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
              imageWidth: SHARE_IMAGE_W,
              imageHeight: SHARE_IMAGE_H,
              link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL }
            },
            buttons: [{ title: '자세히 보기', link: { mobileWebUrl: SITE_URL, webUrl: SITE_URL } }]
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
  // 14. 카카오맵 (실패하면 그림 지도 그대로 유지)
  //     카카오 디벨로퍼스 > 내 앱 > 카카오맵 사용 설정이 켜져 있어야 함
  // ---------------------------------------------------------
  function setupMap() {
    const box = $('.map');
    const canvas = $('#map-canvas');
    if (!box || !canvas || !KAKAO_JS_KEY) return;

    const s = document.createElement('script');
    s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false&libraries=services`;
    s.onload = () => {
      if (!window.kakao || !window.kakao.maps) return;
      kakao.maps.load(() => {
        new kakao.maps.services.Geocoder().addressSearch(VENUE_ADDR, (res, status) => {
          if (status !== kakao.maps.services.Status.OK || !res.length) return;
          const pos = new kakao.maps.LatLng(res[0].y, res[0].x);
          box.classList.add('is-live');
          const map = new kakao.maps.Map(canvas, { center: pos, level: 4 });
          // 스크롤하다 지도가 손가락을 잡아먹지 않도록 고정
          map.setDraggable(false);
          map.setZoomable(false);

          const link = `https://map.kakao.com/link/map/${encodeURIComponent(VENUE_NAME)},${res[0].y},${res[0].x}`;
          const openMap = () => window.open(link, '_blank', 'noopener');

          // 필름 모양 마커 + 이름표
          const overlay = document.createElement('div');
          overlay.className = 'map-overlay';
          const label = document.createElement('div');
          label.className = 'map-label';
          label.textContent = VENUE_NAME;
          const marker = document.createElement('span');
          marker.className = 'map-marker';
          overlay.append(label, marker);
          overlay.addEventListener('click', openMap);
          new kakao.maps.CustomOverlay({ map, position: pos, content: overlay, yAnchor: 1 });

          // 지도를 누르면 카카오맵에서 크게 보기
          kakao.maps.event.addListener(map, 'click', openMap);
        });
      });
    };
    document.head.appendChild(s);
  }

  // ---------------------------------------------------------
  // INIT
  // ---------------------------------------------------------
  function init() {
    setupPhotos();
    setupCover();
    setupFilm();
    setupCountdown();
    setupTicket();
    setupGallery();
    setupLightbox();
    setupTabs();
    setupReveal();
    setupCopy();
    setupMusic();
    setupTop();
    setupShare();
    setupMap();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
