document.addEventListener('DOMContentLoaded', () => {
  const tabs = [...document.querySelectorAll('.pill-tabs a[href^="#"]')];
  const pages = [...document.querySelectorAll('.dashboard-page[data-page]')];

  function activate(targetId, updateHistory = false) {
    const target = document.getElementById(targetId);
    const page = target?.closest('.dashboard-page');
    if (!page) return;

    pages.forEach(item => {
      item.hidden = item !== page;
    });
    tabs.forEach(tab => {
      const active = tab.hash === `#${targetId}`;
      tab.classList.toggle('active', active);
      if (active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });

    if (updateHistory) {
      history.pushState(null, '', `${location.pathname}${location.search}#${targetId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', event => {
      event.preventDefault();
      activate(tab.hash.slice(1), true);
    });
  });

  window.addEventListener('popstate', () => activate(location.hash.slice(1) || 'summary'));
  activate(location.hash.slice(1) || 'summary');
});
