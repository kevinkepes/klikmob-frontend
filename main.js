// =============================================
// KLIK Mob — JavaScript Principal v7
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

  function openMenu() {
    navLinks.classList.add('open');
    document.body.classList.add('menu-open');
  }
  function closeMenu() {
    navLinks.classList.remove('open');
    document.body.classList.remove('menu-open');
  }

  hamburger.addEventListener('click', openMenu);
  menuClose?.addEventListener('click', closeMenu);
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
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
      setTimeout(() => history.replaceState(null, '', location.pathname), 800);
    });
  });

  // --- GALLERY CU PAGINATIE ---
  let currentCat = 'toate';
  let allItems = [];
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxImageIndex = 0;
  let currentPage = 1;
  const ITEMS_PER_PAGE = 6;

  function getCatEmoji(cat) {
    const map = { bucatarie: '🍳', dormitor: '🛏', baie: '🚿', living: '🛋', birou: '💼', exterior: '🌿' };
    return map[cat] || '🪑';
  }
  function getCatLabel(cat) {
    const map = { bucatarie: 'Bucătărie', dormitor: 'Dormitor', baie: 'Baie', living: 'Living', birou: 'Birou', exterior: 'Exterior' };
    return map[cat] || cat;
  }

  function renderPage() {
    const grid = document.getElementById('gallery-grid');
    const empty = document.getElementById('gallery-empty');
    grid.querySelectorAll('.gallery-item').forEach(el => el.remove());

    const oldPag = document.getElementById('gallery-pagination');
    if (oldPag) oldPag.remove();

    if (!allItems || allItems.length === 0) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    lightboxItems = allItems;
    const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const pageItems = allItems.slice(start, start + ITEMS_PER_PAGE);

    pageItems.forEach((item) => {
      const idx = allItems.indexOf(item);
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

    if (totalPages > 1) {
      const pag = document.createElement('div');
      pag.id = 'gallery-pagination';
      pag.className = 'gallery-pagination';
      pag.innerHTML = `
        <button class="pag-btn" id="pagPrev" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
        <span class="pag-info">${currentPage} / ${totalPages}</span>
        <button class="pag-btn" id="pagNext" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
      `;
      grid.parentNode.insertBefore(pag, grid.nextSibling);

      document.getElementById('pagPrev').addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          renderPage();
          document.getElementById('galerie').scrollIntoView({ behavior: 'smooth' });
        }
      });
      document.getElementById('pagNext').addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          renderPage();
          document.getElementById('galerie').scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  async function renderGallery(cat) {
    const items = await window.KlikAPI.fetchItems(cat === 'toate' ? null : cat);
    allItems = items || [];
    currentPage = 1;
    renderPage();
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

  function updateWatermark() {
    const imgW = lightboxImg.naturalWidth;
    const imgH = lightboxImg.naturalHeight;
    if (!imgW || !imgH) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const maxW = vw * 0.9;
    const maxH = vh * 0.85;
    const ratio = imgW / imgH;
    let rendW, rendH;
    if (ratio > maxW / maxH) { rendW = maxW; rendH = maxW / ratio; }
    else { rendH = maxH; rendW = maxH * ratio; }
    const imgLeft = (vw - rendW) / 2;
    const imgTop = (vh - rendH) / 2;
    const size = Math.min(rendW, rendH) * 0.15;
    let wm = lightbox.querySelector('.lightbox-watermark');
    if (!wm) {
      wm = document.createElement('div');
      wm.className = 'lightbox-watermark';
      lightbox.appendChild(wm);
    }
    wm.style.cssText = `position:fixed;width:${size}px;height:${size}px;left:${imgLeft + rendW - size - 12}px;top:${imgTop + rendH - size - 12}px;background:url('logo.png') center/contain no-repeat;opacity:0.22;pointer-events:none;filter:brightness(0) invert(1);z-index:10001;`;
  }

  function openLightbox(itemIdx, imgIdx) {
    lightboxIndex = itemIdx;
    lightboxImageIndex = imgIdx || 0;
    document.body.style.top = '';
    document.body.classList.remove('menu-open');
    navLinks.classList.remove('open');
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    showLightboxImage();
  }

  function showLightboxImage() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    const hasImages = item.images && item.images.length > 0;
    if (hasImages) {
      const img = item.images[lightboxImageIndex];
      lightboxImg.src = img.imageUrl;
      lightboxImg.style.display = 'block';
      lightboxImg.onload = updateWatermark;
      if (lightboxImg.complete && lightboxImg.naturalWidth > 0) setTimeout(updateWatermark, 30);
      if (lightboxDots) {
        lightboxDots.innerHTML = item.images.length > 1
          ? item.images.map((_, i) => `<span class="lb-dot ${i === lightboxImageIndex ? 'active' : ''}" data-i="${i}"></span>`).join('') : '';
        lightboxDots.querySelectorAll('.lb-dot').forEach(dot => {
          dot.addEventListener('click', () => { lightboxImageIndex = parseInt(dot.dataset.i); showLightboxImage(); });
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
    const wm = lightbox.querySelector('.lightbox-watermark');
    if (wm) wm.remove();
  }

  window.addEventListener('resize', () => { if (lightbox.classList.contains('open')) updateWatermark(); });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.getElementById('lightboxPrev').addEventListener('click', () => {
    const item = lightboxItems[lightboxIndex];
    const hasMultiple = item && item.images && item.images.length > 1;
    if (hasMultiple && lightboxImageIndex > 0) lightboxImageIndex--;
    else { lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length; lightboxImageIndex = 0; }
    showLightboxImage();
  });
  document.getElementById('lightboxNext').addEventListener('click', () => {
    const item = lightboxItems[lightboxIndex];
    const hasMultiple = item && item.images && item.images.length > 1;
    if (hasMultiple && lightboxImageIndex < item.images.length - 1) lightboxImageIndex++;
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