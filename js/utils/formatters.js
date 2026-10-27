export function formatPrice(value) {
  return `R$ ${Number(value || 0).toFixed(2).replace('.', ',')}`;
}

export function formatDistance(value) {
  return `${Number(value || 0).toFixed(1)} km`;
}

export function normalizePlate(plate) {
  return String(plate || '').replace(/[^a-zA-Z0-9]/g, '');
}

export function isValidPhone(phone) {
  return String(phone || '').trim().length > 4;
}
