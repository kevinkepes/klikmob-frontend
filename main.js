// =============================================
// KLIK Mob — JavaScript Principal v5
// =============================================

document.addEventListener('DOMContentLoaded', async () => {

  // --- NAVBAR ---
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  });

  // --- HAMBURGER + CLOSE ---
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  const menuClose = document.getElementById('menuClose');
  let scrollY = 0;

  function openMenu() {
    scrollY = window.scrollY;
    navLinks.classList.add('open');
    document.body.classList.add('menu-open');
    document.body.style.top = `-${scrollY}px`;
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    document.body.classList.remove('menu-open');
    document.body.style.top = '';
    window.scrollTo(0, scrollY);
  }

  hamburger.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));

  // Previne scroll pe touch in interiorul meniului
  navLinks.addEventListener('touchmove', e => {
    if (navLinks.classList.contains('open')) e.preventDefault();
  }, { passive: false });

  // --- FIX URL ---
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.getAttribute('href');
      const el = document.querySelector(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  // --- GALLERY ---
  let currentCat = 'toate';
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxImageIndex = 0;

  function getCatEmoji(cat) {
    const map = { bucatarie: '🍳', dormitor: '🛏', baie: '🚿', living: '🛋', birou: '💼', exterior: '🌿' };
    return map[cat] || '🪑';
  }
  function getCatLabel(cat) {
    const map = { bucatarie: 'Bucătărie', dormitor: 'Dormitor', baie: 'Baie', living: 'Living', birou: 'Birou', exterior: 'Exterior' };
    return map[cat] || cat;
  }

  async function renderGallery(cat) {
    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('gallery-empty');
    grid.querySelectorAll('.gallery-item').forEach(el => el.remove());
    empty.style.display = 'none';

    const items = await window.KlikAPI.fetchItems(cat === 'toate' ? null : cat);
    lightboxItems = items || [];

    if (!items || items.length === 0) { empty.style.display = 'block'; return; }

    items.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.dataset.idx = idx;

      const hasImages = item.images && item.images.length > 0;
      const coverUrl = hasImages ? item.images[0].imageUrl : null;

      if (coverUrl) {
        div.innerHTML = `
          <img src="${coverUrl}" alt="${item.title}" loading="lazy">
          <div class="watermark-logo"><img src="logo.png" alt="" aria-hidden="true"></div>
          ${item.images.length > 1 ? `<div class="gallery-img-count">📷 ${item.images.length}</div>` : ''}
          <div class="item-overlay">
            <h4>${item.title}</h4>
            <span>${getCatLabel(item.category)}</span>
          </div>`;
      } else {
        div.innerHTML = `
          <div class="gallery-placeholder">
            <div>${getCatEmoji(item.category)}</div>
            <p>${item.title}</p>
          </div>
          <div class="item-overlay">
            <h4>${item.title}</h4>
            <span>${getCatLabel(item.category)}</span>
          </div>`;
      }

      div.addEventListener('click', () => openLightbox(idx, 0));
      grid.insertBefore(div, empty);
    });
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCat = btn.dataset.cat;
      renderGallery(currentCat);
    });
  });

  await renderGallery('toate');

  // --- LIGHTBOX ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxDots = document.getElementById('lightboxDots');

  function positionWatermark() {
    const rect = lightboxImg.getBoundingClientRect();
    if (rect.width === 0) return;
    let wm = document.querySelector('.lightbox-watermark');
    if (!wm) {
      wm = document.createElement('div');
      wm.className = 'lightbox-watermark';
      document.body.appendChild(wm);
    }
    const size = Math.min(rect.width, rect.height) * 0.15;
    wm.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size}px;
      left: ${rect.right - size - 12}px;
      top: ${rect.bottom - size - 12}px;
      background: url('logo.png') center/contain no-repeat;
      opacity: 0.22;
      pointer-events: none;
      filter: brightness(0) invert(1);
      z-index: 10001;
    `;
  }

  function openLightbox(itemIdx, imgIdx) {
    lightboxIndex = itemIdx;
    lightboxImageIndex = imgIdx || 0;
    showLightboxImage();
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function showLightboxImage() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    const hasImages = item.images && item.images.length > 0;
    if (hasImages) {
      const img = item.images[lightboxImageIndex];
      // Fix: sterge src mai intai ca sa forteze onload si pe imagini din cache
      lightboxImg.src = '';
      lightboxImg.style.display = 'block';
      lightboxImg.onload = positionWatermark;
      lightboxImg.src = img.imageUrl;
      // Fallback daca e din cache si onload nu se mai declanseaza
      if (lightboxImg.complete && lightboxImg.naturalWidth > 0) {
        setTimeout(positionWatermark, 50);
      }
      if (lightboxDots) {
        lightboxDots.innerHTML = item.images.length > 1
          ? item.images.map((_, i) =>
            `<span class="lb-dot ${i === lightboxImageIndex ? 'active' : ''}" data-i="${i}"></span>`
          ).join('') : '';
        lightboxDots.querySelectorAll('.lb-dot').forEach(dot => {
          dot.addEventListener('click', () => {
            lightboxImageIndex = parseInt(dot.dataset.i);
            showLightboxImage();
          });
        });
      }
    } else {
      lightboxImg.style.display = 'none';
      if (lightboxDots) lightboxDots.innerHTML = '';
    }
    lightboxCaption.textContent = item.title + (item.description ? ' — ' + item.description : '');
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    const wm = document.querySelector('.lightbox-watermark');
    if (wm) wm.remove();
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    const item = lightboxItems[lightboxIndex];
    const hasMultiple = item && item.images && item.images.length > 1;
    if (hasMultiple && lightboxImageIndex > 0) { lightboxImageIndex--; }
    else { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; lightboxImageIndex = 0; }
    showLightboxImage();
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    const item = lightboxItems[lightboxIndex];
    const hasMultiple = item && item.images && item.images.length > 1;
    if (hasMultiple && lightboxImageIndex < item.images.length - 1) { lightboxImageIndex++; }
    else { lightboxIndex = (lightboxIndex + 1) % lightboxItems.length; lightboxImageIndex = 0; }
    showLightboxImage();
  });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') document.getElementById('lightboxPrev').click();
    if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
  });

  // --- COUNTERS ---
  const counters = document.querySelectorAll('.stat-num');
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      if (el.dataset.animated) return;
      el.dataset.animated = 'true';
      const target = parseInt(el.dataset.target);
      let current = 0;
      const step = target / 60;
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = Math.floor(current);
        if (current >= target) { el.textContent = target; clearInterval(timer); }
      }, 25);
      counterObs.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  counters.forEach(c => counterObs.observe(c));

  // --- SCROLL REVEAL ---
  const revealEls = document.querySelectorAll('.serviciu-card, .contact-item');
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    revealObs.observe(el);
  });

  window.addEventListener('klikmob_updated', () => renderGallery(currentCat));
});