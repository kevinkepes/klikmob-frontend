// =============================================
// KLIK Mob — Comunicare cu Backendulul Java
// =============================================

const API_BASE = 'https://klikmob-backend.onrender.com/api';

async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE + endpoint, {
      headers: { 'Accept': 'application/json', ...options.headers },
      ...options
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Eroare HTTP: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error.name === 'TypeError' || error.message.includes('Failed') || error.message.includes('fetch')) {
      console.warn('Backend indisponibil');
      return null;
    }
    throw error;
  }
}

function getAuthHeader(u, p) {
  return { 'Authorization': `Basic ${btoa(`${u}:${p}`)}` };
}

// PUBLIC
async function fetchItems(category = null) {
  const endpoint = category ? `/items?cat=${encodeURIComponent(category)}` : '/items';
  const data = await apiFetch(endpoint);
  return data === null ? getDemoItems(category) : data;
}

// ADMIN — citeste toate
async function adminFetchAll(u, p) {
  return await apiFetch('/admin/items', { headers: getAuthHeader(u, p) });
}

// ADMIN — adauga lucrare cu MULTIPLE imagini
async function adminAddItem(itemData, imageFiles, u, p) {
  const formData = new FormData();
  formData.append('title', itemData.title);
  formData.append('category', itemData.category);
  if (itemData.description) formData.append('description', itemData.description);
  if (imageFiles && imageFiles.length > 0) {
    imageFiles.forEach(file => formData.append('images', file));
  }
  return await apiFetch('/admin/items', {
    method: 'POST',
    headers: getAuthHeader(u, p),
    body: formData
  });
}

// ADMIN — adauga imagini noi la o lucrare existenta
async function adminAddImages(itemId, imageFiles, u, p) {
  const formData = new FormData();
  imageFiles.forEach(file => formData.append('images', file));
  return await apiFetch(`/admin/items/${itemId}/images`, {
    method: 'POST',
    headers: getAuthHeader(u, p),
    body: formData
  });
}

// ADMIN — seteaza coperta (trimite imageId ca poza principala)
async function adminSetCover(itemId, imageId, u, p) {
  return await apiFetch(`/admin/items/${itemId}/cover`, {
    method: 'PUT',
    headers: { ...getAuthHeader(u, p), 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageId })
  });
}

// ADMIN — sterge o imagine specifica
async function adminDeleteImage(imageId, u, p) {
  return await apiFetch(`/admin/images/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(u, p)
  });
}

// ADMIN — actualizeaza titlu, categorie, descriere
async function adminUpdateItem(itemId, data, u, p) {
  const formData = new FormData();
  if (data.title) formData.append('title', data.title);
  if (data.category) formData.append('category', data.category);
  if (data.description !== undefined) formData.append('description', data.description);
  return await apiFetch(`/admin/items/${itemId}`, {
    method: 'PUT',
    headers: getAuthHeader(u, p),
    body: formData
  });
}

// ADMIN — sterge o lucrare intreaga
async function adminDeleteItem(id, u, p) {
  return await apiFetch(`/admin/items/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(u, p)
  });
}

async function checkBackendHealth() {
  const data = await apiFetch('/health');
  return data !== null;
}

function makePlaceholderSvg(n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#111"/><text x="400" y="300" font-family="sans-serif" font-size="80" font-weight="bold" fill="#333" text-anchor="middle" dominant-baseline="middle">${n}</text></svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

function makeDemoImages(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    imageUrl: makePlaceholderSvg(i + 1),
    sortOrder: i
  }));
}

function getDemoItems(category) {
  const demo = [
    { id: 1, title: 'Bucătărie modernă albă', category: 'bucatarie', description: 'Demo', images: makeDemoImages(4) },
    { id: 2, title: 'Dormitor complet stejar', category: 'dormitor', description: 'Demo', images: makeDemoImages(3) },
    { id: 3, title: 'Mobilă baie suspendată', category: 'baie', description: 'Demo', images: makeDemoImages(4) },
    { id: 4, title: 'Bibliotecă living nuc', category: 'living', description: 'Demo', images: makeDemoImages(2) },
    { id: 5, title: 'Birou home office', category: 'birou', description: 'Demo', images: makeDemoImages(3) },
    { id: 6, title: 'Mobilă exterior terasă', category: 'exterior', description: 'Demo', images: makeDemoImages(2) },
  ];
  return category ? demo.filter(i => i.category === category) : demo;
}

window.KlikAPI = {
  fetchItems, adminFetchAll, adminAddItem, adminAddImages,
  adminSetCover, adminDeleteImage, adminUpdateItem, adminDeleteItem,
  checkBackendHealth, getDemoItems, API_BASE
};