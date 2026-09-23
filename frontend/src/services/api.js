/**
 * API Service for communicating with MBMC Asset Backend
 */

const API_BASE = '/api';

export async function fetchItems(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '') {
      query.append(key, val);
    }
  });

  const res = await fetch(`${API_BASE}/items?${query.toString()}`);
  if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
  return await res.json();
}

export async function fetchItemByCode(code) {
  const res = await fetch(`${API_BASE}/items/code/${encodeURIComponent(code)}`);
  if (!res.ok) throw new Error(`Asset ${code} not found`);
  return await res.json();
}

export async function fetchItemByModel(modelNumber) {
  const res = await fetch(`${API_BASE}/items/model/${encodeURIComponent(modelNumber)}`);
  if (!res.ok) throw new Error(`Model ${modelNumber} not found`);
  return await res.json();
}

export async function lookupItem(query) {
  const res = await fetch(`${API_BASE}/items/lookup/${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`No item found for "${query}"`);
  return await res.json();
}

export async function updateItem(id, payload) {
  const res = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to update asset: ${res.status}`);
  return await res.json();
}

export async function createItem(payload) {
  const res = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Failed to create asset: ${res.status}`);
  return await res.json();
}

export async function fetchStatsOverview() {
  const res = await fetch(`${API_BASE}/stats/overview`);
  if (!res.ok) throw new Error(`Failed to fetch stats overview`);
  return await res.json();
}

export async function fetchStatsByBuilding() {
  const res = await fetch(`${API_BASE}/stats/by-building`);
  if (!res.ok) throw new Error(`Failed to fetch building stats`);
  return await res.json();
}

export async function fetchStatsByDepartment() {
  const res = await fetch(`${API_BASE}/stats/by-department`);
  if (!res.ok) throw new Error(`Failed to fetch department stats`);
  return await res.json();
}

export async function fetchDepartments() {
  const res = await fetch(`${API_BASE}/items/departments`);
  if (!res.ok) throw new Error(`Failed to fetch departments`);
  return await res.json();
}

export async function fetchBuildings() {
  const res = await fetch(`${API_BASE}/items/buildings`);
  if (!res.ok) throw new Error(`Failed to fetch buildings`);
  return await res.json();
}
