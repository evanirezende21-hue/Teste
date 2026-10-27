export function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function readFromStorage(key, fallback = null) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function setItem(key, value) {
  localStorage.setItem(key, String(value));
}

export function getItem(key, fallback = null) {
  return localStorage.getItem(key) ?? fallback;
}

export function removeItem(key) {
  localStorage.removeItem(key);
}
