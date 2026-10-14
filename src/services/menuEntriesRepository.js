const KEY = 'spot-garage-menu-entries-v1';
let memory = [];
export const manilaDay = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
};
export const manilaTime = iso => new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
export function readEntries() {
  if (typeof localStorage === 'undefined') return memory;
  const value = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(value)) throw new Error('Saved entries could not be read.');
  return value;
}
export function saveEntry(item, quantity) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) throw new Error('An internet connection is required. Nothing was saved.');
  if (!Number.isSafeInteger(quantity) || quantity <= 0) throw new Error('Enter a whole quantity greater than zero.');
  if (!Number.isFinite(item.price) || item.price < 0 || !Number.isSafeInteger(Math.round(item.price * 100) * quantity)) throw new Error('The sale amount is too large or invalid.');
  const entries = readEntries();
  const savedAt = new Date().toISOString();
  const entry = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, itemId: item.id, name: item.name, category: item.category, price: item.price, quantity, total: Math.round(item.price * 100) * quantity / 100, savedAt, day: manilaDay(new Date(savedAt)) };
  const next = [entry, ...entries];
  // A failed write throws: the caller must retain the draft and show the error.
  if (typeof localStorage !== 'undefined') localStorage.setItem(KEY, JSON.stringify(next));
  memory = next;
  return next;
}
