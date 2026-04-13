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
  // Adaugam fiecare fisier cu acelasi key "images"
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

// ADMIN — sterge o imagine specifica
async function adminDeleteImage(imageId, u, p) {
  return await apiFetch(`/admin/images/${imageId}`, {
    method: 'DELETE',
    headers: getAuthHeader(u, p)
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

function getDemoItems(category) {
  const demo = [
    { id: 1, title: 'Bucătărie modernă albă', category: 'bucatarie', description: 'Demo', imageUrl: null, images: [] },
    { id: 2, title: 'Dormitor complet stejar', category: 'dormitor', description: 'Demo', imageUrl: null, images: [] },
    { id: 3, title: 'Mobilă baie suspendată', category: 'baie', description: 'Demo', imageUrl: null, images: [] },
    { id: 4, title: 'Bibliotecă living nuc', category: 'living', description: 'Demo', imageUrl: null, images: [] },
    { id: 5, title: 'Birou home office', category: 'birou', description: 'Demo', imageUrl: null, images: [] },
  ];
  return category ? demo.filter(i => i.category === category) : demo;
}

window.KlikAPI = {
  fetchItems, adminFetchAll, adminAddItem, adminAddImages,
  adminDeleteImage, adminDeleteItem, checkBackendHealth,
  getDemoItems, API_BASE
};