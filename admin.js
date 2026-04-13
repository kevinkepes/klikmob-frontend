// =============================================
// KLIK Mob — Admin Panel v4 — imagini multiple
// =============================================

let sessionUser = null;
let sessionPass = null;

const loginBtn = document.getElementById('loginBtn');
const passwordInput = document.getElementById('passwordInput');
const loginError = document.getElementById('loginError');
const adminLogin = document.getElementById('adminLogin');
const adminPanel = document.getElementById('adminPanel');

async function tryLogin() {
  const val = passwordInput.value.trim();
  if (!val) return;
  loginBtn.textContent = 'Se verifică...';
  loginBtn.disabled = true;
  loginError.style.display = 'none';
  sessionUser = 'admin';
  sessionPass = val;
  try {
    const result = await window.KlikAPI.adminFetchAll(sessionUser, sessionPass);
    if (result === null) {
      loginError.textContent = 'Server indisponibil. Încearcă mai târziu.';
      loginError.style.display = 'block';
      sessionUser = null; sessionPass = null;
    } else {
      adminLogin.style.display = 'none';
      adminPanel.style.display = 'grid';
      passwordInput.value = '';
      await renderAdminGallery('toate');
    }
  } catch (err) {
    loginError.textContent = 'Parolă incorectă.';
    loginError.style.display = 'block';
    sessionUser = null; sessionPass = null;
  }
  loginBtn.textContent = 'Intră în panou';
  loginBtn.disabled = false;
}

loginBtn.addEventListener('click', tryLogin);
passwordInput.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
document.getElementById('logoutBtn').addEventListener('click', () => {
  adminPanel.style.display = 'none';
  adminLogin.style.display = 'flex';
  sessionUser = null; sessionPass = null;
});

// --- SIDEBAR ---
function showView(viewName) {
  document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('view-' + viewName).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');
  const titles = {
    galerie: ['Galerie lucrări', 'Gestionează lucrările afișate pe site'],
    adauga: ['Adaugă lucrare nouă', 'Încarcă fotografii pentru o lucrare nouă'],
    setari: ['Setări panou', 'Configurează panoul de administrare']
  };
  document.getElementById('viewTitle').textContent = titles[viewName][0];
  document.getElementById('viewSubtitle').textContent = titles[viewName][1];
  document.getElementById('addNewBtn').style.display = viewName === 'galerie' ? 'inline-flex' : 'none';
  if (viewName === 'adauga') resetUploadForm();
}
document.querySelectorAll('.sidebar-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => showView(btn.dataset.view));
});
window.showView = showView;

// --- GALLERY ---
function getCatLabel(cat) {
  const map = { bucatarie: 'Bucătărie', dormitor: 'Dormitor', baie: 'Baie', living: 'Living', birou: 'Birou', exterior: 'Exterior' };
  return map[cat] || cat;
}
function getCatEmoji(cat) {
  const map = { bucatarie: '🍳', dormitor: '🛏', baie: '🚿', living: '🛋', birou: '💼', exterior: '🌿' };
  return map[cat] || '🪑';
}

async function renderAdminGallery(filter) {
  const grid = document.getElementById('adminGrid');
  const empty = document.getElementById('adminEmpty');
  grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#aaa;">Se încarcă...</div>';

  let items = [];
  try {
    const result = await window.KlikAPI.adminFetchAll(sessionUser, sessionPass);
    items = (result && result.items) ? result.items : [];
  } catch (e) { items = []; }

  const filtered = filter === 'toate' ? items : items.filter(i => i.category === filter);
  grid.innerHTML = '';

  if (filtered.length === 0) { empty.style.display = 'block'; return; }
  empty.style.display = 'none';

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'admin-card';

    const hasImages = item.images && item.images.length > 0;
    let imgHTML = '';
    if (hasImages) {
      // Cloudinary URL direct - fara prefix
      const cover = item.images[0].imageUrl;
      imgHTML = `
        <div class="admin-card-img-wrap">
          <img class="admin-card-img" src="${cover}" alt="${item.title}">
          ${item.images.length > 1 ? `<span class="img-count-badge">+${item.images.length - 1} poze</span>` : ''}
        </div>`;
    } else {
      imgHTML = `<div class="admin-card-placeholder"><div>${getCatEmoji(item.category)}</div><p>${getCatLabel(item.category)}</p></div>`;
    }

    card.innerHTML = `
      ${imgHTML}
      <div class="admin-card-body">
        <div class="cat-badge">${getCatLabel(item.category)}</div>
        <h4>${item.title}</h4>
        ${item.description ? `<p>${item.description}</p>` : ''}
      </div>
      <div class="admin-card-actions">
        <button class="btn-sm btn-edit" data-id="${item.id}" title="Adaugă poze">📸 Poze</button>
        <button class="btn-sm btn-del" data-id="${item.id}">🗑 Șterge</button>
        <span class="admin-card-date">${item.createdAt ? item.createdAt.split('T')[0] : ''}</span>
      </div>`;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openAddImagesModal(parseInt(btn.dataset.id)));
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdminGallery(btn.dataset.filter);
  });
});

// --- DELETE MODAL ---
let pendingDeleteId = null;
const deleteModal = document.getElementById('deleteModal');

function openDeleteModal(id) { pendingDeleteId = id; deleteModal.classList.add('open'); }

document.getElementById('cancelDelete').addEventListener('click', () => {
  deleteModal.classList.remove('open'); pendingDeleteId = null;
});
document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (pendingDeleteId !== null) {
    try { await window.KlikAPI.adminDeleteItem(pendingDeleteId, sessionUser, sessionPass); } catch (e) { }
    deleteModal.classList.remove('open'); pendingDeleteId = null;
    const f = document.querySelector('.filter-btn.active')?.dataset.filter || 'toate';
    await renderAdminGallery(f);
    window.dispatchEvent(new Event('klikmob_updated'));
  }
});
deleteModal.addEventListener('click', e => {
  if (e.target === deleteModal) { deleteModal.classList.remove('open'); pendingDeleteId = null; }
});

// --- ADD IMAGES MODAL ---
function openAddImagesModal(itemId) {
  const modal = document.getElementById('addImagesModal');
  modal.dataset.itemId = itemId;
  document.getElementById('addImagesInput').value = '';
  document.getElementById('addImagesPreview').innerHTML = '';
  document.getElementById('addImagesMsg').textContent = '';
  modal.classList.add('open');
}

document.getElementById('closeAddImages')?.addEventListener('click', () => {
  document.getElementById('addImagesModal').classList.remove('open');
});

document.getElementById('addImagesInput')?.addEventListener('change', function () {
  const preview = document.getElementById('addImagesPreview');
  preview.innerHTML = '';
  Array.from(this.files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.className = 'add-img-thumb';
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  });
});

document.getElementById('saveAddImages')?.addEventListener('click', async () => {
  const modal = document.getElementById('addImagesModal');
  const itemId = parseInt(modal.dataset.itemId);
  const input = document.getElementById('addImagesInput');
  const msg = document.getElementById('addImagesMsg');

  if (!input.files.length) { msg.textContent = '⚠️ Selectează cel puțin o imagine.'; return; }

  const btn = document.getElementById('saveAddImages');
  btn.textContent = 'Se salvează...'; btn.disabled = true;

  try {
    const result = await window.KlikAPI.adminAddImages(itemId, Array.from(input.files), sessionUser, sessionPass);
    if (result && result.success) {
      msg.style.color = 'green';
      msg.textContent = '✅ Imaginile au fost adăugate!';
      setTimeout(async () => {
        modal.classList.remove('open');
        const f = document.querySelector('.filter-btn.active')?.dataset.filter || 'toate';
        await renderAdminGallery(f);
        window.dispatchEvent(new Event('klikmob_updated'));
      }, 1200);
    } else {
      msg.style.color = 'red';
      msg.textContent = '❌ ' + (result?.message || 'Eroare');
    }
  } catch (e) {
    msg.style.color = 'red';
    msg.textContent = '❌ Eroare la server.';
  }
  btn.textContent = 'Salvează imaginile'; btn.disabled = false;
});

// --- UPLOAD FORM ---
const dropZone = document.getElementById('dropZone');
const dropInner = document.getElementById('dropInner');
const imageInput = document.getElementById('imageInput');
let selectedFiles = [];

document.getElementById('selectImageBtn').addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', e => {
  addFiles(Array.from(e.target.files));
});

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault(); dropZone.classList.remove('dragover');
  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
  addFiles(files);
});

function addFiles(newFiles) {
  newFiles.forEach(file => {
    if (file.size > 15 * 1024 * 1024) { showSaveError(`${file.name} e prea mare (max 15MB).`); return; }
    selectedFiles.push(file);
  });
  renderPreviewStrip();
}

function renderPreviewStrip() {
  const strip = document.getElementById('previewStrip');
  const dropPreview = document.getElementById('dropPreview');
  if (!strip) return;
  strip.innerHTML = '';

  if (selectedFiles.length === 0) {
    dropPreview.style.display = 'none';
    dropInner.style.display = 'block';
    return;
  }

  dropInner.style.display = 'none';
  dropPreview.style.display = 'block';

  selectedFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement('div');
      wrap.className = 'preview-thumb-wrap';
      wrap.innerHTML = `
        <img src="${e.target.result}" class="preview-thumb" alt="">
        <button class="remove-thumb" data-idx="${idx}">✕</button>
        ${idx === 0 ? '<span class="cover-label">Copertă</span>' : ''}`;
      strip.appendChild(wrap);
      wrap.querySelector('.remove-thumb').addEventListener('click', () => {
        selectedFiles.splice(idx, 1);
        renderPreviewStrip();
      });
    };
    reader.readAsDataURL(file);
  });

  const addMore = document.createElement('div');
  addMore.className = 'preview-add-more';
  addMore.innerHTML = '<span>+ Adaugă</span>';
  addMore.addEventListener('click', () => imageInput.click());
  strip.appendChild(addMore);
}

function resetUploadForm() {
  selectedFiles = [];
  renderPreviewStrip();
  document.getElementById('itemTitle').value = '';
  document.getElementById('itemCategory').value = '';
  document.getElementById('itemDesc').value = '';
  document.getElementById('saveSuccess').style.display = 'none';
  document.getElementById('saveError').style.display = 'none';
}

function showSaveError(msg) {
  const el = document.getElementById('saveError');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

document.getElementById('saveItemBtn').addEventListener('click', async () => {
  const title = document.getElementById('itemTitle').value.trim();
  const category = document.getElementById('itemCategory').value;
  const desc = document.getElementById('itemDesc').value.trim();

  if (!title) { showSaveError('Te rugăm să introduci un titlu.'); return; }
  if (!category) { showSaveError('Te rugăm să selectezi categoria.'); return; }

  const saveBtn = document.getElementById('saveItemBtn');
  saveBtn.textContent = 'Se salvează...'; saveBtn.disabled = true;

  try {
    const result = await window.KlikAPI.adminAddItem(
      { title, category, description: desc },
      selectedFiles,
      sessionUser, sessionPass
    );
    if (result && result.success) {
      document.getElementById('saveSuccess').style.display = 'block';
      setTimeout(async () => {
        document.getElementById('saveSuccess').style.display = 'none';
        showView('galerie');
        document.querySelector('.filter-btn[data-filter="toate"]').click();
        window.dispatchEvent(new Event('klikmob_updated'));
      }, 1800);
    } else {
      showSaveError(result?.message || 'Eroare la salvare.');
    }
  } catch (e) {
    showSaveError('Nu s-a putut conecta la server.');
  }
  saveBtn.textContent = '✓ Salvează pe site'; saveBtn.disabled = false;
});

// --- SETĂRI ---
document.getElementById('changePassBtn').addEventListener('click', () => {
  const msg = document.getElementById('passMsg');
  msg.textContent = 'ℹ️ Parola se schimbă din Railway → Variables → KLIKMOB_ADMIN_PASSWORD';
  msg.className = 'setting-msg ok';
  setTimeout(() => msg.textContent = '', 6000);
});

document.getElementById('resetDataBtn').addEventListener('click', async () => {
  if (confirm('Ești sigur? Toate lucrările vor fi șterse permanent!')) {
    const msg = document.getElementById('resetMsg');
    msg.textContent = '⏳ Se procesează...';
    try {
      const result = await window.KlikAPI.adminFetchAll(sessionUser, sessionPass);
      if (result && result.items) {
        for (const item of result.items) {
          await window.KlikAPI.adminDeleteItem(item.id, sessionUser, sessionPass);
        }
      }
      msg.textContent = '✅ Galeria a fost ștearsă.';
      msg.className = 'setting-msg ok';
      window.dispatchEvent(new Event('klikmob_updated'));
    } catch (e) {
      msg.textContent = '❌ Eroare.';
      msg.className = 'setting-msg err';
    }
    setTimeout(() => msg.textContent = '', 4000);
  }
});