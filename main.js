// =============================================
// KLIK Mob — JavaScript Principal v7
// =============================================

document.addEventListener('DOMContentLoaded', async () => {

  // --- BLOCHEAZA DOUBLE-TAP ZOOM (Chrome Android) ---
  let lastTouchEnd = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouchEnd < 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

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
    const map = { bucatarie: '🍳', dormitor: '🛏', baie: '🚿', living: '🛋', birou: '💼', exterior: '🏢' };
    return map[cat] || '🪑';
  }
  function getCatLabel(cat) {
    const map = { bucatarie: 'Bucătărie', dormitor: 'Dormitor', baie: 'Baie', living: 'Living', birou: 'Birou', exterior: 'Altele' };
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

  // Preincarca cover-urile tuturor lucrarilor din pagina curenta
  setTimeout(() => {
    allItems.slice(0, ITEMS_PER_PAGE).forEach(item => {
      if (item.images && item.images.length > 0) {
        const img = new Image();
        img.src = item.images[0].imageUrl;
      }
    });
  }, 500);

  // --- LIGHTBOX ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxDots = document.getElementById('lightboxDots');

  // Preincarca imaginile adiacente (urmatoarea + precedenta) in background
  function preloadAdjacentImages() {
    const item = lightboxItems[lightboxIndex];
    if (!item || !item.images || item.images.length === 0) return;

    const urls = [];

    // Poza urmatoare din aceeasi lucrare
    if (lightboxImageIndex + 1 < item.images.length) {
      urls.push(item.images[lightboxImageIndex + 1].imageUrl);
    }
    // Poza precedenta din aceeasi lucrare
    if (lightboxImageIndex - 1 >= 0) {
      urls.push(item.images[lightboxImageIndex - 1].imageUrl);
    }
    // Prima poza din lucrarea urmatoare
    const nextItem = lightboxItems[(lightboxIndex + 1) % lightboxItems.length];
    if (nextItem && nextItem.images && nextItem.images.length > 0) {
      urls.push(nextItem.images[0].imageUrl);
    }
    // Prima poza din lucrarea precedenta
    const prevItem = lightboxItems[(lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length];
    if (prevItem && prevItem.images && prevItem.images.length > 0) {
      urls.push(prevItem.images[0].imageUrl);
    }

    urls.forEach(url => { const img = new Image(); img.src = url; });
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
      const imgData = item.images[lightboxImageIndex];
      const newImg = new Image();
      newImg.onload = () => {
        lightboxImg.src = newImg.src;
        lightboxImg.style.display = 'block';
      };
      newImg.src = imgData.imageUrl;
      // Daca e deja in cache, onload nu se mai declanseaza — fallback
      if (newImg.complete && newImg.naturalWidth > 0) {
        lightboxImg.src = newImg.src;
        lightboxImg.style.display = 'block';
      }

      if (lightboxDots) {
        lightboxDots.innerHTML = item.images.length > 1
          ? item.images.map((_, i) =>
            `<span class="lb-dot ${i === lightboxImageIndex ? 'active' : ''}" data-i="${i}"></span>`
          ).join('')
          : '';
        lightboxDots.querySelectorAll('.lb-dot').forEach(dot => {
          dot.addEventListener('click', e => {
            e.stopPropagation();
            lightboxImageIndex = parseInt(dot.dataset.i);
            showLightboxImage();
          });
        });
      }
    } else {
      lightboxImg.src = '';
      lightboxImg.style.display = 'none';
      if (lightboxDots) lightboxDots.innerHTML = '';
    }

    lightboxCaption.textContent = item.title + (item.description ? ' — ' + item.description : '');
    setTimeout(preloadAdjacentImages, 50);
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function lightboxPrevImage() {
    if (lightboxImageIndex > 0) { lightboxImageIndex--; showLightboxImage(); }
  }

  function lightboxNextImage() {
    const item = lightboxItems[lightboxIndex];
    const hasMultiple = item && item.images && item.images.length > 1;
    if (hasMultiple && lightboxImageIndex < item.images.length - 1) { lightboxImageIndex++; showLightboxImage(); }
  }

  function lightboxPrevProject() {
    lightboxIndex = (lightboxIndex - 1 + lightboxItems.length) % lightboxItems.length;
    lightboxImageIndex = 0;
    showLightboxImage();
  }

  function lightboxNextProject() {
    lightboxIndex = (lightboxIndex + 1) % lightboxItems.length;
    lightboxImageIndex = 0;
    showLightboxImage();
  }

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.getElementById('lightboxPrev').addEventListener('click', lightboxPrevImage);
  document.getElementById('lightboxNext').addEventListener('click', lightboxNextImage);
  document.getElementById('lightboxPrevProject').addEventListener('click', lightboxPrevProject);
  document.getElementById('lightboxNextProject').addEventListener('click', lightboxNextProject);
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') lightboxPrevImage();
    if (e.key === 'ArrowRight') lightboxNextImage();
  });

  // --- SWIPE PE MOBILE ---
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  lightbox.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }, { passive: true });

  lightbox.addEventListener('touchmove', e => {
    touchMoved = true;
  }, { passive: true });

  lightbox.addEventListener('touchend', e => {
    if (!touchMoved) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) lightboxNextImage();
    else lightboxPrevImage();
  }, { passive: true });

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