// =============================================
// KLIK Mob — Admin Panel v5 — cover + delete imagini
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
        <button class="btn-sm btn-edit" data-id="${item.id}" title="Editează pozele">✏️ Editează</button>
        <button class="btn-sm btn-del" data-id="${item.id}">🗑 Șterge</button>
        <span class="admin-card-date">${item.createdAt ? item.createdAt.split('T')[0] : ''}</span>
      </div>`;

    grid.appendChild(card);
  });

  grid.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
  });
  grid.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openEditImagesModal(parseInt(btn.dataset.id)));
  });
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderAdminGallery(btn.dataset.filter);
  });
});

// --- DELETE MODAL (lucrare intreaga) ---
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

// =============================================
// EDIT IMAGES MODAL — sterge poze + schimba coperta + adauga poze noi
// =============================================
let editItemData = null; // { id, images: [{id, imageUrl, isCover}] }

async function openEditImagesModal(itemId) {
  const modal = document.getElementById('editImagesModal');
  const msg = document.getElementById('editImagesMsg');
  msg.textContent = '';
  document.getElementById('editImagesGrid').innerHTML = '<p style="color:#aaa;padding:1rem;">Se încarcă pozele...</p>';
  document.getElementById('addMoreImagesInput').value = '';
  document.getElementById('addMorePreview').innerHTML = '';
  modal.classList.add('open');

  try {
    const result = await window.KlikAPI.adminFetchAll(sessionUser, sessionPass);
    const items = (result && result.items) ? result.items : [];
    const item = items.find(i => i.id === itemId);
    if (!item) { msg.textContent = '❌ Lucrarea nu a fost găsită.'; return; }

    // Clone imaginile ca sa putem modifica ordinea local (prima = coperta)
    editItemData = {
      id: item.id,
      images: (item.images || []).map((img, idx) => ({ ...img, isCover: idx === 0 }))
    };
    renderEditImagesGrid();
  } catch (e) {
    document.getElementById('editImagesGrid').innerHTML = '<p style="color:#e74c3c;padding:1rem;">Eroare la încărcare.</p>';
  }
}

function renderEditImagesGrid() {
  const grid = document.getElementById('editImagesGrid');
  grid.innerHTML = '';

  if (!editItemData || editItemData.images.length === 0) {
    grid.innerHTML = '<p style="color:#aaa;padding:1rem;text-align:center;">Nicio poză. Adaugă mai jos.</p>';
    return;
  }

  editItemData.images.forEach((img, idx) => {
    const wrap = document.createElement('div');
    wrap.className = 'edit-img-wrap' + (img.isCover ? ' is-cover' : '');
    wrap.dataset.imgId = img.id;
    wrap.innerHTML = `
      <img src="${img.imageUrl}" class="edit-img-thumb" alt="">
      ${img.isCover ? '<span class="edit-cover-badge">⭐ Copertă</span>' : '<button class="btn-set-cover" data-idx="' + idx + '">Setează copertă</button>'}
      <button class="btn-del-img" data-img-id="${img.id}" data-idx="${idx}" title="Șterge poza">✕</button>
    `;
    grid.appendChild(wrap);

    wrap.querySelector('.btn-del-img').addEventListener('click', () => confirmDeleteImage(img.id, idx));
    if (!img.isCover) {
      wrap.querySelector('.btn-set-cover').addEventListener('click', () => setCover(idx));
    }
  });
}

function setCover(idx) {
  // Muta imaginea la pozitia 0 (frontend only — la save trimitem ordinea la backend)
  if (!editItemData) return;
  const img = editItemData.images.splice(idx, 1)[0];
  editItemData.images.unshift(img);
  editItemData.images.forEach((im, i) => { im.isCover = i === 0; });
  renderEditImagesGrid();
  document.getElementById('editImagesMsg').textContent = '⭐ Coperta a fost schimbată. Apasă "Salvează" pentru a confirma.';
  document.getElementById('editImagesMsg').style.color = '#b8860b';
}

let pendingDeleteImageId = null;
let pendingDeleteImageIdx = null;
const deleteImageModal = document.getElementById('deleteImageModal');

function confirmDeleteImage(imgId, idx) {
  pendingDeleteImageId = imgId;
  pendingDeleteImageIdx = idx;
  deleteImageModal.classList.add('open');
}

document.getElementById('cancelDeleteImage')?.addEventListener('click', () => {
  deleteImageModal.classList.remove('open');
  pendingDeleteImageId = null; pendingDeleteImageIdx = null;
});

document.getElementById('confirmDeleteImage')?.addEventListener('click', async () => {
  if (pendingDeleteImageId === null) return;
  const msg = document.getElementById('editImagesMsg');
  try {
    await window.KlikAPI.adminDeleteImage(pendingDeleteImageId, sessionUser, sessionPass);
    editItemData.images.splice(pendingDeleteImageIdx, 1);
    if (editItemData.images.length > 0) editItemData.images[0].isCover = true;
    renderEditImagesGrid();
    msg.textContent = '✅ Poza a fost ștearsă.';
    msg.style.color = 'green';
  } catch (e) {
    msg.textContent = '❌ Eroare la ștergere.';
    msg.style.color = 'red';
  }
  deleteImageModal.classList.remove('open');
  pendingDeleteImageId = null; pendingDeleteImageIdx = null;
  setTimeout(() => { if (msg) msg.textContent = ''; }, 3000);
});

deleteImageModal.addEventListener('click', e => {
  if (e.target === deleteImageModal) {
    deleteImageModal.classList.remove('open');
    pendingDeleteImageId = null; pendingDeleteImageIdx = null;
  }
});

// Adauga poze noi in edit modal
let addMoreFiles = [];

document.getElementById('addMoreImagesInput')?.addEventListener('change', function () {
  addMoreFiles = Array.from(this.files);
  const preview = document.getElementById('addMorePreview');
  preview.innerHTML = '';
  addMoreFiles.forEach(file => {
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

document.getElementById('triggerAddMore')?.addEventListener('click', () => {
  document.getElementById('addMoreImagesInput').click();
});

// Salveaza: ordine coperta + poze noi
document.getElementById('saveEditImages')?.addEventListener('click', async () => {
  if (!editItemData) return;
  const msg = document.getElementById('editImagesMsg');
  const btn = document.getElementById('saveEditImages');
  btn.textContent = 'Se salvează...'; btn.disabled = true;

  try {
    // 1. Daca avem poze noi de adaugat
    if (addMoreFiles.length > 0) {
      const addResult = await window.KlikAPI.adminAddImages(editItemData.id, addMoreFiles, sessionUser, sessionPass);
      if (!addResult || !addResult.success) {
        msg.textContent = '❌ Eroare la adăugarea pozelor noi.';
        msg.style.color = 'red';
        btn.textContent = 'Salvează'; btn.disabled = false;
        return;
      }
    }

    // 2. Schimba coperta daca e necesar (trimitem ordinea imaginilor)
    if (editItemData.images.length > 0) {
      const orderedIds = editItemData.images.map(img => img.id);
      await window.KlikAPI.adminSetCover(editItemData.id, orderedIds[0], sessionUser, sessionPass);
    }

    msg.textContent = '✅ Modificările au fost salvate!';
    msg.style.color = 'green';
    addMoreFiles = [];
    document.getElementById('addMoreImagesInput').value = '';
    document.getElementById('addMorePreview').innerHTML = '';

    setTimeout(async () => {
      document.getElementById('editImagesModal').classList.remove('open');
      const f = document.querySelector('.filter-btn.active')?.dataset.filter || 'toate';
      await renderAdminGallery(f);
      window.dispatchEvent(new Event('klikmob_updated'));
    }, 1400);
  } catch (e) {
    msg.textContent = '❌ Eroare la salvare.';
    msg.style.color = 'red';
  }
  btn.textContent = 'Salvează'; btn.disabled = false;
});

document.getElementById('closeEditImages')?.addEventListener('click', () => {
  document.getElementById('editImagesModal').classList.remove('open');
  editItemData = null;
  addMoreFiles = [];
});

document.getElementById('editImagesModal')?.addEventListener('click', e => {
  if (e.target === document.getElementById('editImagesModal')) {
    document.getElementById('editImagesModal').classList.remove('open');
    editItemData = null; addMoreFiles = [];
  }
});

// =============================================
// UPLOAD FORM — cu selectare coperta
// =============================================
const dropZone = document.getElementById('dropZone');
const dropInner = document.getElementById('dropInner');
const imageInput = document.getElementById('imageInput');
let selectedFiles = [];
let coverIndex = 0; // indexul pozei selectate ca coperta

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
    coverIndex = 0;
    return;
  }

  // Asigura-te ca coverIndex e valid
  if (coverIndex >= selectedFiles.length) coverIndex = 0;

  dropInner.style.display = 'none';
  dropPreview.style.display = 'block';

  selectedFiles.forEach((file, idx) => {
    const reader = new FileReader();
    reader.onload = e => {
      const wrap = document.createElement('div');
      wrap.className = 'preview-thumb-wrap' + (idx === coverIndex ? ' is-cover' : '');
      wrap.title = idx === coverIndex ? 'Copertă' : 'Click pentru a seta ca și copertă';
      wrap.innerHTML = `
        <img src="${e.target.result}" class="preview-thumb" alt="">
        <button class="remove-thumb" data-idx="${idx}" title="Elimină">✕</button>
        ${idx === coverIndex ? '<span class="cover-label">⭐ Copertă</span>' : '<span class="set-cover-hint">Click = copertă</span>'}`;

      // Click pe imagine => seteaza coperta
      wrap.querySelector('.preview-thumb').addEventListener('click', () => {
        coverIndex = idx;
        renderPreviewStrip();
      });

      wrap.querySelector('.remove-thumb').addEventListener('click', (ev) => {
        ev.stopPropagation();
        selectedFiles.splice(idx, 1);
        if (coverIndex >= selectedFiles.length) coverIndex = 0;
        renderPreviewStrip();
      });
      strip.appendChild(wrap);
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
  coverIndex = 0;
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

  // Reordoneaza fisierele: coperta prima
  let filesToSend = [...selectedFiles];
  if (coverIndex > 0 && filesToSend.length > 0) {
    const cover = filesToSend.splice(coverIndex, 1)[0];
    filesToSend.unshift(cover);
  }

  try {
    const result = await window.KlikAPI.adminAddItem(
      { title, category, description: desc },
      filesToSend,
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