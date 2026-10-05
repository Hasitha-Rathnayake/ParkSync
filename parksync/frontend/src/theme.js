const KEY = 'parksync-theme';

export function getStoredTheme() {
  try {
    const t = localStorage.getItem(KEY);
    if (t === 'light' || t === 'dark' || t === 'mixed') return t;
  } catch (_) {}
  return 'mixed';
}

export function applyTheme(theme) {
  const t = theme === 'light' || theme === 'dark' || theme === 'mixed' ? theme : 'mixed';
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem(KEY, t); } catch (_) {}
  return t;
}
