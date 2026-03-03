// ===== JAG MOVIES APP.JS =====

// ---- STATE ----
let currentPage = 'home';
let heroMovies = [];
let heroIndex = 0;
let heroTimer = null;
let currentModal = null; // { type: 'movie'|'tv', id, data }
let currentSeason = 1;
let moviesPage = 1;
let seriesPage = 1;
let moviesFilter = 0; // genre id, 0 = all
let seriesData = [];
let moviesData = [];

// ---- STORAGE UTILS ----
const LS = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
};

function getContinueWatching() { return LS.get('jag_continue') || {}; }
function saveContinueWatching(data) { LS.set('jag_continue', data); }
function getProgress(type, id, ep) {
  const cw = getContinueWatching();
  const key = `${type}_${id}`;
  if (!cw[key]) return 0;
  if (type === 'tv' && ep) return cw[key].episodes?.[ep]?.progress || 0;
  return cw[key].progress || 0;
}

// ---- PASSWORD ----
function checkPass() {
  const val = document.getElementById('gateInput').value;
  const err = document.getElementById('gateError');
  if (val === CONFIG.PASSWORD) {
    document.getElementById('gate').style.animation = 'gateOut 0.5s ease forwards';
    setTimeout(() => {
      document.getElementById('gate').classList.add('hidden');
      document.getElementById('app').classList.remove('hidden');
      initApp();
    }, 450);
  } else {
    err.textContent = 'Incorrect password.';
    document.getElementById('gateInput').style.borderColor = '#e07070';
    setTimeout(() => { err.textContent = ''; document.getElementById('gateInput').style.borderColor = ''; }, 2000);
  }
}

document.getElementById('gateInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') checkPass();
});

// Add gate out animation
const gateStyle = document.createElement('style');
gateStyle.textContent = '@keyframes gateOut { to { opacity:0; transform:scale(1.03); } }';
document.head.appendChild(gateStyle);

// ---- INIT ----
async function initApp() {
  setupNav();
  setupScroll();
  setupFadeIn();
  await loadHomePage();
  renderContinueWatching();
}

// ---- NAV ----
function setupNav() {
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('scrolled', window.scrollY > 40);
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.page);
    });
  });
  document.querySelectorAll('.row-see-all').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      if (a.dataset.page) navigateTo(a.dataset.page);
    });
  });
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.page === page));

  const heroSection = document.querySelector('.hero');
  const mainContent = document.querySelector('.main-content');
  const pages = ['genresPage', 'moviesPage', 'seriesPage', 'searchPage'];

  pages.forEach(p => document.getElementById(p)?.classList.add('hidden'));

  if (page === 'home') {
    heroSection.style.display = '';
    mainContent.style.display = '';
  } else {
    heroSection.style.display = 'none';
    mainContent.style.display = 'none';
    const el = document.getElementById(page + 'Page');
    if (el) {
      el.classList.remove('hidden');
      if (page === 'genres') loadGenresPage();
      if (page === 'movies') loadMoviesPage();
      if (page === 'series') loadSeriesPage();
    }
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---- TMDB FETCH ----
async function tmdb(path, params = {}) {
  const url = new URL(CONFIG.TMDB_BASE + path);
  url.searchParams.set('api_key', CONFIG.TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error('TMDB error: ' + res.status);
  return res.json();
}

// ---- LOAD HOME ----
async function loadHomePage() {
  try {
    const [trending, topRated, action, comedy, horror, scifi, series] = await Promise.all([
      tmdb('/trending/movie/week'),
      tmdb('/movie/top_rated'),
      tmdb('/discover/movie', { with_genres: 28 }),
      tmdb('/discover/movie', { with_genres: 35 }),
      tmdb('/discover/movie', { with_genres: 27 }),
      tmdb('/discover/movie', { with_genres: 878 }),
      tmdb('/trending/tv/week'),
    ]);

    heroMovies = trending.results.slice(0, 6);
    renderHero();

    renderRow('trendingRow', trending.results.slice(0, 18), 'movie');
    renderRow('topRatedRow', topRated.results.slice(0, 18), 'movie');
    renderRow('actionRow', action.results.slice(0, 18), 'movie');
    renderRow('comedyRow', comedy.results.slice(0, 18), 'movie');
    renderRow('horrorRow', horror.results.slice(0, 18), 'movie');
    renderRow('scifiRow', scifi.results.slice(0, 18), 'movie');
    renderRow('seriesRow', series.results.slice(0, 18), 'tv');
  } catch (err) {
    console.error('Failed to load home:', err);
    showToast('API error — check your TMDB key in config.js');
  }
}

// ---- HERO ----
function renderHero() {
  if (!heroMovies.length) return;
  const indicators = document.getElementById('heroIndicators');
  indicators.innerHTML = heroMovies.map((_, i) =>
    `<div class="hero-dot${i===0?' active':''}" onclick="setHero(${i})"></div>`
  ).join('');
  setHero(0);
  startHeroTimer();
}

function setHero(idx) {
  heroIndex = idx;
  const m = heroMovies[idx];
  if (!m) return;

  document.getElementById('heroBg').style.backgroundImage =
    m.backdrop_path ? `url(${CONFIG.TMDB_IMG}/original${m.backdrop_path})` : '';

  document.getElementById('heroTitle').textContent = m.title || m.name || '';
  document.getElementById('heroDesc').textContent = m.overview || '';

  const year = (m.release_date || m.first_air_date || '').slice(0, 4);
  document.getElementById('heroMeta').innerHTML =
    `<span class="rating">★ ${m.vote_average?.toFixed(1)}</span>
     <span>${year}</span>
     <span>${m.original_language?.toUpperCase()}</span>`;

  document.querySelectorAll('.hero-dot').forEach((d, i) =>
    d.classList.toggle('active', i === idx));

  document.getElementById('heroPlayBtn').dataset.id = m.id;
  document.getElementById('heroPlayBtn').dataset.type = 'movie';
  document.getElementById('heroInfoBtn').dataset.id = m.id;
  document.getElementById('heroInfoBtn').dataset.type = 'movie';
}

function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHero((heroIndex + 1) % heroMovies.length), 7000);
}

function playHero() {
  const btn = document.getElementById('heroPlayBtn');
  openPlayer('movie', btn.dataset.id, heroMovies[heroIndex]?.title || '');
}

function infoHero() {
  const btn = document.getElementById('heroInfoBtn');
  openDetailModal('movie', btn.dataset.id);
}

// ---- RENDER ROW ----
function renderRow(rowId, items, type) {
  const row = document.getElementById(rowId);
  if (!row) return;
  row.innerHTML = items.map(item => createCard(item, type)).join('');
}

function createCard(item, type) {
  const poster = item.poster_path ? `${CONFIG.TMDB_IMG}/w342${item.poster_path}` : '';
  const title = item.title || item.name || '';
  const rating = item.vote_average?.toFixed(1) || '';
  const cw = getContinueWatching();
  const key = `${type}_${item.id}`;
  const progress = cw[key]?.progress || 0;

  return `
    <div class="card" onclick="openDetailModal('${type}',${item.id})">
      <div class="card-img-wrap">
        ${poster
          ? `<img class="card-img" src="${poster}" alt="${escHtml(title)}" loading="lazy" />`
          : `<div class="card-img skeleton"></div>`
        }
        <div class="card-overlay">
          <div class="card-play-btn" onclick="event.stopPropagation();openPlayer('${type}',${item.id},'${escHtml(title).replace(/'/g,'\\'')}')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
          <div class="card-title">${escHtml(title)}</div>
          ${rating ? `<div class="card-rating">★ ${rating}</div>` : ''}
        </div>
      </div>
      <div class="card-info">
        <div class="card-name">${escHtml(title)}</div>
        ${progress > 0 ? `
          <div class="card-progress"><div class="card-progress-fill" style="width:${progress}%"></div></div>
        ` : ''}
      </div>
    </div>
  `;
}

// ---- CONTINUE WATCHING ----
function renderContinueWatching() {
  const cw = getContinueWatching();
  const items = Object.entries(cw).filter(([, v]) => v.progress > 0 && v.progress < 98);
  const section = document.getElementById('continueSection');
  const row = document.getElementById('continueRow');
  if (!items.length) { section.style.display = 'none'; return; }
  section.style.display = '';
  row.innerHTML = items.map(([key, v]) => {
    const [type, id] = key.split('_');
    const poster = v.poster ? `<img class="card-img" src="${CONFIG.TMDB_IMG}/w342${v.poster}" alt="" loading="lazy">` : `<div class="card-img skeleton"></div>`;
    return `
      <div class="card" onclick="openDetailModal('${type}','${id}')">
        <div class="card-img-wrap">
          ${poster}
          <div class="card-overlay">
            <div class="card-play-btn" onclick="event.stopPropagation();openPlayer('${type}','${id}','${escHtml(v.title||'').replace(/'/g,'\\'')}')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            </div>
            <div class="card-title">${escHtml(v.title||'')}</div>
          </div>
        </div>
        <div class="card-info">
          <div class="card-name">${escHtml(v.title||'')}</div>
          <div class="card-progress"><div class="card-progress-fill" style="width:${v.progress}%"></div></div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- DETAIL MODAL ----
async function openDetailModal(type, id) {
  const modal = document.getElementById('detailModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Reset
  document.getElementById('seasonsSection').classList.add('hidden');
  document.getElementById('castSection').innerHTML = '<h3 class="section-label">Cast</h3><div class="cast-row" id="castRow"><div class="skeleton" style="height:70px;width:70px;border-radius:50%"></div></div>';
  document.getElementById('modalTitle').textContent = 'Loading...';
  document.getElementById('modalOverview').textContent = '';
  document.getElementById('modalGenres').innerHTML = '';
  document.getElementById('modalBackdrop').src = '';

  try {
    const [details, credits] = await Promise.all([
      tmdb(`/${type}/${id}`, { append_to_response: 'images' }),
      tmdb(`/${type}/${id}/credits`),
    ]);

    currentModal = { type, id, data: details };

    const title = details.title || details.name || '';
    const year = (details.release_date || details.first_air_date || '').slice(0, 4);
    const runtime = details.runtime ? `${details.runtime}m` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]}m/ep` : '');

    // backdrop
    if (details.backdrop_path) {
      document.getElementById('modalBackdrop').src = `${CONFIG.TMDB_IMG}/w1280${details.backdrop_path}`;
    }

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalYear').textContent = year;
    document.getElementById('modalRuntime').textContent = runtime;
    document.getElementById('modalRating').textContent = `★ ${details.vote_average?.toFixed(1)}`;
    document.getElementById('modalOverview').textContent = details.overview || '';

    // genres
    document.getElementById('modalGenres').innerHTML = (details.genres || [])
      .map(g => `<span class="genre-tag">${g.name}</span>`).join('');

    // play button
    document.getElementById('modalPlayBtn').onclick = () => openPlayer(type, id, title);

    // watchlist
    const wl = LS.get('jag_watchlist') || [];
    document.getElementById('modalWatchlistBtn').textContent = wl.includes(String(id)) ? '✓ In Watchlist' : '+ Watchlist';

    // cast
    const cast = (credits.cast || []).slice(0, 16);
    document.getElementById('castRow').innerHTML = cast.map(person => {
      const photo = person.profile_path ? `${CONFIG.TMDB_IMG}/w185${person.profile_path}` : '';
      return `
        <div class="cast-card" onclick="window.open('https://www.imdb.com/find?q=${encodeURIComponent(person.name)}','_blank')">
          <img class="cast-photo" src="${photo}" alt="${escHtml(person.name)}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 70 70%22><rect width=%2270%22 height=%2270%22 fill=%22%2318181e%22/><text x=%2235%22 y=%2242%22 font-size=%2228%22 text-anchor=%22middle%22 fill=%22%234a4855%22>👤</text></svg>'">
          <div class="cast-name">${escHtml(person.name)}</div>
        </div>
      `;
    }).join('');

    // seasons (TV)
    if (type === 'tv' && details.seasons?.length) {
      document.getElementById('seasonsSection').classList.remove('hidden');
      const validSeasons = details.seasons.filter(s => s.season_number > 0);
      currentSeason = validSeasons[0]?.season_number || 1;

      document.getElementById('seasonsTabs').innerHTML = validSeasons.map(s =>
        `<button class="season-tab${s.season_number===currentSeason?' active':''}" onclick="loadSeason(${s.season_number})">${s.name || 'Season '+s.season_number}</button>`
      ).join('');

      loadSeason(currentSeason, id);
    }

  } catch (err) {
    console.error('Detail error:', err);
    showToast('Failed to load details');
  }
}

async function loadSeason(seasonNum, tvId) {
  tvId = tvId || currentModal?.id;
  currentSeason = seasonNum;

  document.querySelectorAll('.season-tab').forEach(t => {
    t.classList.toggle('active', parseInt(t.textContent.replace(/\D/g,'')) === seasonNum ||
      t.onclick.toString().includes(`(${seasonNum})`));
  });

  const list = document.getElementById('episodesList');
  list.innerHTML = '<div class="skeleton" style="height:80px;border-radius:6px;margin-bottom:8px"></div>'.repeat(4);

  try {
    const data = await tmdb(`/tv/${tvId}/season/${seasonNum}`);
    const cw = getContinueWatching();
    const key = `tv_${tvId}`;

    list.innerHTML = (data.episodes || []).map(ep => {
      const thumb = ep.still_path ? `${CONFIG.TMDB_IMG}/w300${ep.still_path}` : '';
      const epKey = `s${seasonNum}e${ep.episode_number}`;
      const progress = cw[key]?.episodes?.[epKey]?.progress || 0;
      return `
        <div class="episode-item" onclick="openPlayer('tv',${tvId},'${escHtml(currentModal?.data?.name||'').replace(/'/g,'\\'')}',${seasonNum},${ep.episode_number})">
          <div class="ep-num">E${ep.episode_number}</div>
          ${thumb ? `<img class="ep-thumb" src="${thumb}" alt="" loading="lazy">` : `<div class="ep-thumb skeleton"></div>`}
          <div class="ep-info">
            <div class="ep-title">${escHtml(ep.name||'Episode '+ep.episode_number)}</div>
            <div class="ep-desc">${escHtml(ep.overview||'')}</div>
            ${progress > 0 ? `<div class="ep-progress"><div class="ep-progress-fill" style="width:${progress}%"></div></div>` : ''}
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    list.innerHTML = '<p style="color:var(--text-dim);padding:1rem">Failed to load episodes.</p>';
  }
}

function toggleWatchlist() {
  if (!currentModal) return;
  const wl = LS.get('jag_watchlist') || [];
  const id = String(currentModal.id);
  const idx = wl.indexOf(id);
  if (idx === -1) {
    wl.push(id);
    document.getElementById('modalWatchlistBtn').textContent = '✓ In Watchlist';
    showToast('Added to Watchlist');
  } else {
    wl.splice(idx, 1);
    document.getElementById('modalWatchlistBtn').textContent = '+ Watchlist';
    showToast('Removed from Watchlist');
  }
  LS.set('jag_watchlist', wl);
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
  document.body.style.overflow = '';
  currentModal = null;
}

// ---- PLAYER ----
function openPlayer(type, id, title, season, episode) {
  // Save progress tracking data
  const cw = getContinueWatching();
  const key = `${type}_${id}`;
  if (!cw[key]) cw[key] = { title, progress: 0, poster: currentModal?.data?.poster_path || '' };
  if (type === 'tv' && season && episode) {
    if (!cw[key].episodes) cw[key].episodes = {};
    const epKey = `s${season}e${episode}`;
    if (!cw[key].episodes[epKey]) cw[key].episodes[epKey] = { progress: 5 };
    cw[key].currentEp = epKey;
    cw[key].progress = 5;
  } else {
    cw[key].progress = Math.max(cw[key].progress, 5);
  }
  saveContinueWatching(cw);

  // Build embed URL
  let embedUrl = '';
  if (type === 'movie') {
    embedUrl = `${CONFIG.VIDKING_BASE}/embed/movie/${id}`;
  } else {
    const s = season || 1;
    const e = episode || 1;
    embedUrl = `${CONFIG.VIDKING_BASE}/embed/tv/${id}/${s}/${e}`;
  }

  const displayTitle = type === 'tv' && season
    ? `${title} — S${season} E${episode}`
    : title;

  document.getElementById('playerTitle').textContent = displayTitle;
  document.getElementById('playerFrame').src = embedUrl;
  document.getElementById('playerModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  closeModal();

  // Simulate progress update
  setTimeout(() => {
    const cw2 = getContinueWatching();
    if (cw2[key]) {
      cw2[key].progress = Math.min(cw2[key].progress + 30, 95);
      if (type === 'tv' && season && episode && cw2[key].episodes) {
        const ek = `s${season}e${episode}`;
        if (cw2[key].episodes[ek]) cw2[key].episodes[ek].progress = Math.min(70, 95);
      }
    }
    saveContinueWatching(cw2);
    renderContinueWatching();
  }, 3000);
}

function closePlayer() {
  document.getElementById('playerModal').classList.add('hidden');
  document.getElementById('playerFrame').src = '';
  document.body.style.overflow = '';
  renderContinueWatching();
}

// ---- SEARCH ----
async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) return;
  navigateTo('search');
  document.getElementById('searchQuery').textContent = `"${q}"`;
  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '<div class="skeleton" style="height:240px;border-radius:6px"></div>'.repeat(8);

  try {
    const data = await tmdb('/search/multi', { query: q });
    const results = data.results.filter(r => r.media_type !== 'person' && (r.poster_path || r.backdrop_path));
    grid.innerHTML = results.map(item =>
      createCard(item, item.media_type === 'tv' ? 'tv' : 'movie')
    ).join('');
  } catch {
    grid.innerHTML = '<p style="color:var(--text-dim)">Search failed.</p>';
  }
}

document.getElementById('searchInput')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') doSearch();
});

// ---- GENRES PAGE ----
const GENRE_LIST = [
  { id: 28, name: 'Action' }, { id: 35, name: 'Comedy' }, { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' }, { id: 18, name: 'Drama' }, { id: 10749, name: 'Romance' },
  { id: 53, name: 'Thriller' }, { id: 12, name: 'Adventure' }, { id: 16, name: 'Animation' },
  { id: 80, name: 'Crime' }, { id: 14, name: 'Fantasy' }, { id: 9648, name: 'Mystery' },
  { id: 10752, name: 'War' }, { id: 37, name: 'Western' }, { id: 36, name: 'History' },
  { id: 99, name: 'Documentary' }
];

async function loadGenresPage() {
  const grid = document.getElementById('genresGrid');
  if (grid.children.length) return;

  const colors = ['#8B0000','#1a472a','#0d3b6e','#6b2e82','#7a4100','#003d3d','#4a1942','#0a3d62'];
  grid.innerHTML = GENRE_LIST.map((g, i) => `
    <div class="genre-card" onclick="browseGenre(${g.id},'${g.name}')" style="background:${colors[i%colors.length]}22;border-color:${colors[i%colors.length]}44">
      <div class="genre-card-bg" style="background-color:${colors[i%colors.length]}"></div>
      <div class="genre-card-name">${g.name}</div>
    </div>
  `).join('');
}

async function browseGenre(genreId, genreName) {
  navigateTo('movies');
  document.querySelector('#moviesPage .page-header h1').textContent = genreName;
  moviesFilter = genreId;
  moviesPage = 1;
  moviesData = [];
  await loadMoviesPage(true);
}

// ---- MOVIES PAGE ----
async function loadMoviesPage(reset = false) {
  if (reset) moviesData = [];
  const grid = document.getElementById('moviesGrid');
  if (reset) grid.innerHTML = '';

  const params = { page: moviesPage };
  if (moviesFilter) params.with_genres = moviesFilter;
  const endpoint = moviesFilter ? '/discover/movie' : '/movie/popular';

  try {
    const data = await tmdb(endpoint, params);
    moviesData.push(...data.results);
    if (reset) grid.innerHTML = '';
    grid.innerHTML += data.results.map(m => createCard(m, 'movie')).join('');
    moviesPage++;
  } catch { showToast('Failed to load movies'); }
}

async function loadMoreMovies() {
  await loadMoviesPage();
}

// ---- SERIES PAGE ----
async function loadSeriesPage() {
  const grid = document.getElementById('seriesGrid');
  if (grid.children.length) return;
  try {
    const data = await tmdb('/tv/popular', { page: seriesPage });
    grid.innerHTML = data.results.map(s => createCard(s, 'tv')).join('');
    seriesPage++;
  } catch { showToast('Failed to load series'); }
}

async function loadMoreSeries() {
  try {
    const data = await tmdb('/tv/popular', { page: seriesPage });
    document.getElementById('seriesGrid').innerHTML += data.results.map(s => createCard(s, 'tv')).join('');
    seriesPage++;
  } catch {}
}

// ---- FADE IN ON SCROLL ----
function setupFadeIn() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ---- NAV SCROLL ----
function setupScroll() {
  let lastY = 0;
  window.addEventListener('scroll', () => {
    lastY = window.scrollY;
  }, { passive: true });
}

// ---- TOAST ----
function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

// ---- UTILS ----
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- KEYBOARD ----
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!document.getElementById('playerModal').classList.contains('hidden')) closePlayer();
    else if (!document.getElementById('detailModal').classList.contains('hidden')) closeModal();
  }
});
