/* Display preference only: movie records and backup keys are unchanged. */
(() => {
  'use strict';
  const key = 'cinelva-theme-v1';
  const sourceHref = document.currentScript?.src ? new URL('../credits.html#data-status', document.currentScript.src).href : 'credits.html#data-status';
  const globalSearchHref = document.currentScript?.src ? new URL('cinelva-global-search.js?v=20261025-people', document.currentScript.src).href : '';
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  let select;
  const valid = value => value === 'light' || value === 'dark' ? value : 'system';
  try { preference = valid(localStorage.getItem(key)); } catch (_) { /* Private browsing. */ }
  function apply() {
    const theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    if (select) select.value = preference;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'dark' ? '#0a0c0f' : '#f8f6f1';
  }
  apply();
  media.addEventListener('change', apply);
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = valid(event.newValue);
    apply();
  });
  function mount() {
    if (globalSearchHref && document.querySelector('.gSearchForm')) {
      const searchScript = document.createElement('script');searchScript.src = globalSearchHref;searchScript.async = false;document.head.appendChild(searchScript);
    }
    const host = document.querySelector('.gDrawer') || document.querySelector('main');
    if (!host) return;
    const sourceLink = document.createElement('a');
    sourceLink.className = 'cinelvaSourcesLink'; sourceLink.href = sourceHref; sourceLink.textContent = '情報源と収録日時';
    host.append(sourceLink);
    const label = document.createElement('label');
    label.className = 'cinelvaTheme';
    label.innerHTML = '<span>表示テーマ</span><select aria-label="表示テーマ"><option value="system">端末に合わせる</option><option value="light">ライト</option><option value="dark">ダーク</option></select>';
    host.append(label);
    select = label.querySelector('select');
    select.value = preference;
    apply(); // The theme-color meta tag may appear after this head script.
    select.addEventListener('change', () => {
      preference = valid(select.value);
      try {
        if (preference === 'system') localStorage.removeItem(key);
        else localStorage.setItem(key, preference);
      } catch (_) { /* The current page still honors the choice. */ }
      apply();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
