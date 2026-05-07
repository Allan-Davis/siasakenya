// ===== MAIN APP MODULE =====
const App = (() => {
  const pages = {
    dashboard: { render: Dashboard.render, title: 'Dashboard' },
    simulator: { render: Simulator.render, title: 'Simulator' },
    search: { render: Search.render, title: 'Data Search' },
    polls: { render: Polls.render, title: 'Polls Center' },
    advisor: { render: Advisor.render, title: 'AI Advisor' }
  };

  let currentPage = 'dashboard';

  function navigate(pageId) {
    if (!pages[pageId]) return;

    // Update nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    const activeLink = document.querySelector(`.nav-link[data-page="${pageId}"]`);
    if (activeLink) activeLink.classList.add('active');

    // Hide all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    const pageEl = document.getElementById(`page-${pageId}`);
    if (pageEl) {
      pageEl.classList.add('active');
      pageEl.innerHTML = '';
      pages[pageId].render(pageEl);
      currentPage = pageId;
    }

    // Close mobile nav
    document.getElementById('navLinks').classList.remove('open');

    // Update page title
    document.title = `${pages[pageId].title} — Analyzer KE`;

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update hash
    history.pushState({page: pageId}, '', `#${pageId}`);
  }

  async function init() {
    // Nav links
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        navigate(link.dataset.page);
      });
    });

    // Mobile toggle
    const toggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    toggle.addEventListener('click', () => navLinks.classList.toggle('open'));

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
      const navbar = document.getElementById('navbar');
      navbar.style.boxShadow = window.scrollY > 10 ? '0 4px 24px rgba(0,0,0,0.5)' : 'none';
    });

    // Handle hash routing
    const hash = location.hash.replace('#', '');
    if (hash && hash.startsWith('poll-')) {
      // Poll deep link
      await navigate('polls');
    } else if (hash && pages[hash]) {
      await navigate(hash);
    } else {
      await navigate('dashboard');
    }

    // Pre-load summary data in background
    Data.loadSummary().catch(e => console.warn('Summary preload failed:', e));

    // Hide loader
    const loader = document.getElementById('loader');
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 400);
  }

  // Handle back/forward
  window.addEventListener('popstate', e => {
    if (e.state?.page) navigate(e.state.page);
  });

  return { navigate, init };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
