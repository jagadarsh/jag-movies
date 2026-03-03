// ══════════════════════════════════════════════════════════════
//  JAG MOVIES — app.js
// ══════════════════════════════════════════════════════════════

/* ── STORAGE HELPERS ──────────────────────────────────────── */
const store = {
  get: k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const getCW  = ()        => store.get('jag_cw')  || {};
const getWL  = ()        => store.get('jag_wl')  || [];
const saveCW = d         => store.set('jag_cw', d);
const saveWL = d         => store.set('jag_wl', d);

/* ── STATE ────────────────────────────────────────────────── */
let heroMovies  = [];
let heroIdx     = 0;
let heroTimer   = null;
let activeModal = null;   // { type, id, data }
let activeSeason = 1;
let movPage     = 1;
let serPage     = 1;
let movGenre    = 0;
let moviesInitialized = false;
let seriesInitialized = false;
let genresInitialized = false;

/* ══ PASSWORD GATE ════════════════════════════════════════════ */
function initGate() {
  const input = document.getElementById('gateInput');
  const btn   = document.getElementById('gateBtn');
  const field = document.getElementById('gateField');
  const err   = document.getElementById('gateErr');

  const attempt = () => {
    if (input.value === CFG.PASSWORD) {
      document.getElementById('gate').style.animation = 'gateOut .45s ease forwards';
      setTimeout(() => {
        document.getElementById('gate').classList.add('hidden');
        startApp();
      }, 420);
    } else {
      err.textContent = 'Incorrect password.';
      field.style.animation = 'shake .38s ease';
      input.value = '';
      setTimeout(() => {
        field.style.animation = '';
        err.textContent = '';
      }, 2400);
    }
  };

  btn.addEventListener('click', attempt);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
}

/* ══ APP BOOTSTRAP ════════════════════════════════════════════ */
async function startApp() {
  document.getElementById('app').classList.remove('hidden');
  setupNav();
  setupScrollFade();
  setupFadeInObserver();
  await loadHome();
  renderContinueWatching();
}

/* ── NAV ────────────────────────────────────────────────────── */
function setupNav() {
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('solid', scrollY > 44);
  }, { passive: true });

  document.querySelectorAll('[data-nav]').forEach(el =>
    el.addEventListener('click', () => navTo(el.dataset.nav)));
}

function navTo(page) {
  const views = ['homeView', 'moviesView', 'seriesView', 'genresView', 'searchView'];
  views.forEach(v => document.getElementById(v)?.classList.add('hidden'));

  document.querySelectorAll('[data-nav]').forEach(l =>
    l.classList.toggle('active', l.dataset.nav === page));

  document.getElementById('mainNav').classList.toggle('solid', page !== 'home');

  if (page === 'home') {
    document.getElementById('homeView').classList.remove('hidden');
  } else if (page === 'movies') {
    document.getElementById('moviesView').classList.remove('hidden');
    if (!moviesInitialized) { moviesInitialized = true; initMoviesPage(); }
  } else if (page === 'series') {
    document.getElementById('seriesView').classList.remove('hidden');
    if (!seriesInitialized) { seriesInitialized = true; initSeriesPage(); }
  } else if (page === 'genres') {
    document.getElementById('genresView').classList.remove('hidden');
    if (!genresInitialized) { genresInitialized = true; renderGenres(); }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ── TMDB FETCH ─────────────────────────────────────────────── */
async function tmdb(path, params = {}) {
  const url = new URL(CFG.TMDB_API + path);
  url.searchParams.set('api_key', CFG.TMDB_KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`);
  return res.json();
}

/* ══ HOME PAGE ════════════════════════════════════════════════ */
async function loadHome() {
  try {
    const [trending, topRated, action, comedy, horror, scifi, series] = await Promise.all([
      tmdb('/trending/movie/week'),
      tmdb('/movie/top_rated'),
      tmdb('/discover/movie', { with_genres: 28, sort_by: 'popularity.desc' }),
      tmdb('/discover/movie', { with_genres: 35, sort_by: 'popularity.desc' }),
      tmdb('/discover/movie', { with_genres: 27, sort_by: 'popularity.desc' }),
      tmdb('/discover/movie', { with_genres: 878, sort_by: 'popularity.desc' }),
      tmdb('/trending/tv/week'),
    ]);

    heroMovies = trending.results.slice(0, 7).filter(m => m.backdrop_path);
    buildHero();

    renderRow('rowTrending',  trending.results,  'movie');
    renderRow('rowTopRated',  topRated.results,  'movie');
    renderRow('rowAction',    action.results,    'movie');
    renderRow('rowComedy',    comedy.results,    'movie');
    renderRow('rowHorror',    horror.results,    'movie');
    renderRow('rowScifi',     scifi.results,     'movie');
    renderRow('rowSeries',    series.results,    'tv');

  } catch (e) {
    console.error('[loadHome]', e);
    toast('Failed to load — check your TMDB API key in js/config.js');
  }
}

/* ── HERO ────────────────────────────────────────────────────── */
function buildHero() {
  if (!heroMovies.length) return;
  const dots = document.getElementById('heroDots');
  dots.innerHTML = heroMovies.map((_, i) =>
    `<div class="hero-dot${i === 0 ? ' active' : ''}" data-idx="${i}"></div>`
  ).join('');
  dots.querySelectorAll('.hero-dot').forEach(d =>
    d.addEventListener('click', () => { setHero(+d.dataset.idx); resetTimer(); })
  );
  setHero(0);
  resetTimer();
}

function setHero(idx) {
  heroIdx = idx;
  const m = heroMovies[idx];
  if (!m) return;

  document.getElementById('heroBg').style.backgroundImage =
    `url(${CFG.TMDB_IMG}/original${m.backdrop_path})`;

  document.getElementById('heroTitle').textContent = m.title || m.name || '';
  document.getElementById('heroOverview').textContent = m.overview || '';

  const year = (m.release_date || m.first_air_date || '').slice(0, 4);
  document.getElementById('heroMeta').innerHTML = `
    <span class="star">★ ${(m.vote_average || 0).toFixed(1)}</span>
    <span class="dot"></span>
    <span>${year}</span>
    <span class="dot"></span>
    <span>${(m.original_language || '').toUpperCase()}</span>`;

  document.getElementById('heroBtnPlay').onclick = () => openPlayer('movie', m.id, m.title || m.name);
  document.getElementById('heroBtnInfo').onclick = () => openDetail('movie', m.id);

  document.querySelectorAll('.hero-dot').forEach((d, i) =>
    d.classList.toggle('active', i === idx));
}

function resetTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHero((heroIdx + 1) % heroMovies.length), 7500);
}

/* ── ROW RENDER ─────────────────────────────────────────────── */
function renderRow(rowId, items, type) {
  const el = document.getElementById(rowId);
  if (!el) return;
  el.innerHTML = items
    .filter(i => i.poster_path)
    .slice(0, 20)
    .map(i => cardHTML(i, type))
    .join('');
}

function cardHTML(item, type) {
  const title  = esc(item.title || item.name || '');
  const poster = item.poster_path ? `${CFG.TMDB_IMG}/w342${item.poster_path}` : '';
  const score  = (item.vote_average || 0).toFixed(1);
  const cw     = getCW();
  const prog   = cw[`${type}_${item.id}`]?.progress || 0;

  return `
  <div class="card" onclick="openDetail('${type}',${item.id})">
    <div class="card-poster">
      ${poster
        ? `<img src="${poster}" alt="${title}" loading="lazy">`
        : `<div class="skel" style="width:100%;height:100%"></div>`}
      <div class="card-overlay">
        <div class="card-play-btn"
          onclick="event.stopPropagation();openPlayer('${type}',${item.id},'${title.replace(/'/g,"\\'")}')">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
        </div>
        <div class="card-overlay-title">${title}</div>
        <div class="card-overlay-score">★ ${score}</div>
      </div>
    </div>
    <div class="card-meta">
      <div class="card-title">${title}</div>
      ${prog > 0 ? `<div class="card-progress"><div class="card-progress-fill" style="width:${prog}%"></div></div>` : ''}
    </div>
  </div>`;
}

/* ── CONTINUE WATCHING ──────────────────────────────────────── */
function renderContinueWatching() {
  const cw = getCW();
  const active = Object.entries(cw).filter(([, v]) => v.progress > 2 && v.progress < 97);
  const section = document.getElementById('continueSection');
  const track   = document.getElementById('continueTrack');

  if (!active.length) { section.style.display = 'none'; return; }
  section.style.display = '';

  track.innerHTML = active.map(([key, v]) => {
    const [type, id] = key.split('_');
    const poster = v.poster ? `${CFG.TMDB_IMG}/w342${v.poster}` : '';
    const t = esc(v.title || '');
    return `
    <div class="card" onclick="openDetail('${type}','${id}')">
      <div class="card-poster">
        ${poster ? `<img src="${poster}" alt="${t}" loading="lazy">` : `<div class="skel" style="width:100%;height:100%"></div>`}
        <div class="card-overlay">
          <div class="card-play-btn"
            onclick="event.stopPropagation();openPlayer('${type}','${id}','${t.replace(/'/g,"\\'")}')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
          </div>
          <div class="card-overlay-title">${t}</div>
        </div>
      </div>
      <div class="card-meta">
        <div class="card-title">${t}</div>
        <div class="card-progress"><div class="card-progress-fill" style="width:${v.progress}%"></div></div>
      </div>
    </div>`;
  }).join('');
}

/* ══ DETAIL MODAL ═════════════════════════════════════════════ */
async function openDetail(type, id) {
  const modal = document.getElementById('detailModal');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // reset state
  activeModal  = null;
  activeSeason = 1;
  document.getElementById('mTitle').textContent = 'Loading…';
  document.getElementById('mOverview').textContent = '';
  document.getElementById('mPills').innerHTML    = '';
  document.getElementById('mGenres').innerHTML   = '';
  document.getElementById('mBackdrop').src       = '';
  document.getElementById('mCastRow').innerHTML  = skeletonCircles(6);
  document.getElementById('mInfoGrid').innerHTML = '';
  document.getElementById('mRecsRow').innerHTML  = '';
  document.getElementById('mSeasonsSection').classList.add('hidden');

  try {
    const [details, credits, videos, similar] = await Promise.all([
      tmdb(`/${type}/${id}`, { append_to_response: 'external_ids' }),
      tmdb(`/${type}/${id}/credits`),
      tmdb(`/${type}/${id}/videos`),
      tmdb(`/${type}/${id}/similar`),
    ]);

    activeModal = { type, id, data: details };

    const title   = details.title || details.name || '';
    const year    = (details.release_date || details.first_air_date || '').slice(0, 4);
    const runtime = details.runtime
      ? `${details.runtime} min`
      : details.episode_run_time?.[0]
        ? `${details.episode_run_time[0]} min/ep`
        : '';
    const imdbId  = details.external_ids?.imdb_id || details.imdb_id || null;

    /* backdrop */
    if (details.backdrop_path)
      document.getElementById('mBackdrop').src = `${CFG.TMDB_IMG}/w1280${details.backdrop_path}`;

    document.getElementById('mTitle').textContent = title;

    /* pills */
    document.getElementById('mPills').innerHTML = [
      year     ? `<span class="m-pill">${year}</span>`                           : '',
      runtime  ? `<span class="m-pill">${runtime}</span>`                        : '',
      details.vote_average
               ? `<span class="m-pill gold">★ ${details.vote_average.toFixed(1)}/10</span>` : '',
      imdbId   ? `<a class="m-pill" href="https://www.imdb.com/title/${imdbId}" target="_blank"
                     style="cursor:pointer;text-decoration:none;">IMDb ↗</a>` : '',
    ].join('');

    document.getElementById('mOverview').textContent = details.overview || '';

    /* genres */
    document.getElementById('mGenres').innerHTML = (details.genres || [])
      .map(g => `<span class="g-tag">${g.name}</span>`).join('');

    /* play / watchlist buttons */
    document.getElementById('mBtnPlay').onclick = () => openPlayer(type, id, title);
    const wl = getWL();
    document.getElementById('mBtnWL').textContent = wl.includes(String(id)) ? '✓ Watchlist' : '+ Watchlist';

    /* info grid */
    const director = (credits.crew || []).find(c => c.job === 'Director')?.name || '';
    const creator  = (details.created_by || []).map(c => c.name).join(', ') || '';
    const status   = details.status || '';
    document.getElementById('mInfoGrid').innerHTML = [
      director ? infoItem('Director', director) : '',
      creator  ? infoItem('Created by', creator) : '',
      details.original_language ? infoItem('Language', details.original_language.toUpperCase()) : '',
      status   ? infoItem('Status', status) : '',
      details.number_of_seasons ? infoItem('Seasons', details.number_of_seasons) : '',
      details.budget > 0 ? infoItem('Budget', '$' + details.budget.toLocaleString()) : '',
    ].join('');

    /* cast */
    const cast = (credits.cast || []).slice(0, 16);
    document.getElementById('mCastRow').innerHTML = cast.length ? cast.map(p => {
      const photo = p.profile_path ? `${CFG.TMDB_IMG}/w185${p.profile_path}` : '';
      const imdbQ = encodeURIComponent(p.name);
      return `
        <div class="cast-person" onclick="window.open('https://www.imdb.com/find?q=${imdbQ}','_blank')">
          <img class="cast-photo" src="${photo}" alt="${esc(p.name)}" loading="lazy"
            onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 68 68%22><rect width=%2268%22 height=%2268%22 fill=%22%231c1c1c%22/><text x=%2234%22 y=%2243%22 font-size=%2228%22 text-anchor=%22middle%22 fill=%22%234a4845%22>👤</text></svg>'"/>
          <div class="cast-name">${esc(p.name)}</div>
          <div class="cast-role">${esc(p.character || '')}</div>
        </div>`;
    }).join('') : '<p style="color:var(--text-muted);font-size:.82rem">No cast data.</p>';

    /* seasons for TV */
    if (type === 'tv' && details.seasons?.length) {
      const validSeasons = details.seasons.filter(s => s.season_number > 0);
      if (validSeasons.length) {
        document.getElementById('mSeasonsSection').classList.remove('hidden');
        activeSeason = validSeasons[0].season_number;
        const tabs = document.getElementById('mSeasonTabs');
        tabs.innerHTML = validSeasons.map(s =>
          `<button class="season-tab${s.season_number === activeSeason ? ' active' : ''}"
            data-season="${s.season_number}"
            onclick="switchSeason(${s.season_number},${id})">
            ${s.name || 'Season ' + s.season_number}
          </button>`
        ).join('');
        loadSeason(activeSeason, id);
      }
    }

    /* recommendations */
    const recs = (similar.results || []).filter(r => r.backdrop_path).slice(0, 14);
    document.getElementById('mRecsRow').innerHTML = recs.map(r =>
      `<div class="rec-card" onclick="openDetail('${type}',${r.id})">
         <img src="${CFG.TMDB_IMG}/w300${r.backdrop_path}" alt="${esc(r.title || r.name || '')}" loading="lazy">
         <div class="rec-title">${esc(r.title || r.name || '')}</div>
       </div>`
    ).join('');

  } catch (e) {
    console.error('[openDetail]', e);
    toast('Failed to load details');
  }
}

function infoItem(label, value) {
  return `<div class="info-item">
    <div class="info-label">${label}</div>
    <div class="info-value">${esc(String(value))}</div>
  </div>`;
}

function skeletonCircles(n) {
  return Array(n).fill(
    `<div style="flex:0 0 68px;text-align:center">
      <div class="skel" style="width:68px;height:68px;border-radius:50%;margin:0 auto 7px"></div>
      <div class="skel" style="height:10px;border-radius:4px;margin:0 4px"></div>
    </div>`
  ).join('');
}

/* ── SEASONS ─────────────────────────────────────────────────── */
async function switchSeason(n, tvId) {
  activeSeason = n;
  document.querySelectorAll('.season-tab').forEach(t =>
    t.classList.toggle('active', +t.dataset.season === n));
  loadSeason(n, tvId);
}

async function loadSeason(n, tvId) {
  tvId = tvId || activeModal?.id;
  const list = document.getElementById('mEpisodesList');
  list.innerHTML = '<div class="skel" style="height:76px;border-radius:8px;margin-bottom:8px"></div>'.repeat(4);

  try {
    const data = await tmdb(`/tv/${tvId}/season/${n}`);
    const cw   = getCW();
    const key  = `tv_${tvId}`;

    list.innerHTML = (data.episodes || []).map(ep => {
      const epKey  = `s${n}e${ep.episode_number}`;
      const prog   = cw[key]?.episodes?.[epKey]?.progress || 0;
      const thumb  = ep.still_path ? `${CFG.TMDB_IMG}/w300${ep.still_path}` : '';
      const rt     = ep.runtime ? `${ep.runtime} min` : '';
      const rating = ep.vote_average ? `★ ${ep.vote_average.toFixed(1)}` : '';
      const tvName = esc(activeModal?.data?.name || '');

      return `
      <div class="episode-row"
        onclick="openPlayer('tv',${tvId},'${tvName.replace(/'/g,"\\'")}',${n},${ep.episode_number})">
        <div class="ep-num">E${ep.episode_number}</div>
        ${thumb
          ? `<img class="ep-thumb" src="${thumb}" alt="" loading="lazy">`
          : `<div class="ep-thumb skel"></div>`}
        <div class="ep-details">
          <div class="ep-title">${esc(ep.name || 'Episode ' + ep.episode_number)}</div>
          <div class="ep-runtime">${[rt, rating].filter(Boolean).join(' · ')}</div>
          <div class="ep-desc">${esc(ep.overview || '')}</div>
          ${prog > 0 ? `<div class="ep-bar"><div class="ep-bar-fill" style="width:${prog}%"></div></div>` : ''}
        </div>
      </div>`;
    }).join('');

  } catch {
    document.getElementById('mEpisodesList').innerHTML =
      '<p style="color:var(--text-muted);padding:12px;font-size:.84rem">Could not load episodes.</p>';
  }
}

/* ── WATCHLIST ───────────────────────────────────────────────── */
function toggleWatchlist() {
  if (!activeModal) return;
  const wl  = getWL();
  const id  = String(activeModal.id);
  const idx = wl.indexOf(id);
  if (idx === -1) {
    wl.push(id);
    document.getElementById('mBtnWL').textContent = '✓ Watchlist';
    toast('Added to watchlist');
  } else {
    wl.splice(idx, 1);
    document.getElementById('mBtnWL').textContent = '+ Watchlist';
    toast('Removed from watchlist');
  }
  saveWL(wl);
}

function closeDetail() {
  document.getElementById('detailModal').classList.add('hidden');
  document.body.style.overflow = '';
  activeModal = null;
}

/* ══ PLAYER ═══════════════════════════════════════════════════ */
function openPlayer(type, id, title, season, ep) {
  // track progress
  const cw  = getCW();
  const key = `${type}_${id}`;
  if (!cw[key]) cw[key] = { title, progress: 0, poster: activeModal?.data?.poster_path || '' };
  cw[key].title  = title;
  cw[key].progress = Math.max(cw[key].progress, 5);
  if (type === 'tv' && season && ep) {
    cw[key].episodes = cw[key].episodes || {};
    const ek = `s${season}e${ep}`;
    cw[key].episodes[ek] = cw[key].episodes[ek] || { progress: 5 };
    cw[key].currentEp = ek;
  }
  saveCW(cw);

  // build embed URL
  const src = type === 'movie'
    ? `${CFG.EMBED_BASE}/movie/${id}`
    : `${CFG.EMBED_BASE}/tv/${id}/${season || 1}/${ep || 1}`;

  const label = (type === 'tv' && season)
    ? `${title}  ·  Season ${season}, Episode ${ep}`
    : title;

  document.getElementById('playerLabel').textContent = label;
  document.getElementById('playerFrame').src = src;
  document.getElementById('playerModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  closeDetail();

  // bump progress after a few seconds (simulate watching)
  setTimeout(() => {
    const cw2 = getCW();
    if (cw2[key]) {
      cw2[key].progress = Math.min((cw2[key].progress || 5) + 30, 93);
      if (type === 'tv' && season && ep) {
        const ek = `s${season}e${ep}`;
        if (cw2[key].episodes?.[ek])
          cw2[key].episodes[ek].progress = Math.min(cw2[key].episodes[ek].progress + 40, 93);
      }
    }
    saveCW(cw2);
    renderContinueWatching();
  }, 5000);
}

function closePlayer() {
  document.getElementById('playerModal').classList.add('hidden');
  document.getElementById('playerFrame').src = '';
  document.body.style.overflow = '';
  renderContinueWatching();
}

/* ══ SEARCH ═══════════════════════════════════════════════════ */
function setupSearch() {
  const input = document.getElementById('navSearch');
  const btn   = document.getElementById('navSearchBtn');
  const go = async () => {
    const q = input.value.trim();
    if (!q) return;
    // hide all
    ['homeView','moviesView','seriesView','genresView']
      .forEach(v => document.getElementById(v)?.classList.add('hidden'));
    document.getElementById('searchView').classList.remove('hidden');
    document.getElementById('searchQuery').textContent = `"${q}"`;

    const grid = document.getElementById('searchGrid');
    grid.innerHTML = skeletonCards(12);

    try {
      const data = await tmdb('/search/multi', { query: q, language: 'en-US' });
      const results = data.results.filter(r => r.media_type !== 'person' && r.poster_path);
      grid.innerHTML = results.length
        ? results.map(i => cardHTML(i, i.media_type === 'tv' ? 'tv' : 'movie')).join('')
        : '<p style="color:var(--text-sub);padding:40px 0">No results found.</p>';
    } catch {
      grid.innerHTML = '<p style="color:var(--text-muted)">Search failed.</p>';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  btn.addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

function skeletonCards(n) {
  return Array(n).fill(
    `<div class="skel" style="aspect-ratio:2/3;border-radius:8px"></div>`
  ).join('');
}

/* ══ MOVIES PAGE ══════════════════════════════════════════════ */
async function initMoviesPage() {
  // genre filter pills
  const filters = document.getElementById('movieFilterPills');
  filters.innerHTML = [{ id: 0, name: 'All' }, ...GENRE_LIST].map(g =>
    `<button class="pill${g.id === 0 ? ' active' : ''}" data-gid="${g.id}">${g.name}</button>`
  ).join('');
  filters.querySelectorAll('.pill').forEach(p =>
    p.addEventListener('click', () => {
      filters.querySelectorAll('.pill').forEach(x => x.classList.remove('active'));
      p.classList.add('active');
      movGenre = +p.dataset.gid;
      movPage  = 1;
      document.getElementById('moviesGrid').innerHTML = '';
      document.getElementById('moviesPageTitle').textContent = movGenre
        ? GENRE_LIST.find(g => g.id === movGenre)?.name || 'Movies'
        : 'Movies';
      loadMoviesBatch();
    })
  );
  loadMoviesBatch();
}

async function loadMoviesBatch() {
  const grid = document.getElementById('moviesGrid');
  if (movPage === 1) grid.innerHTML = skeletonCards(20);
  const ep     = movGenre ? '/discover/movie' : '/movie/popular';
  const params = { page: movPage };
  if (movGenre) params.with_genres = movGenre;
  try {
    const data = await tmdb(ep, params);
    if (movPage === 1) grid.innerHTML = '';
    grid.innerHTML += data.results.filter(i => i.poster_path).map(i => cardHTML(i, 'movie')).join('');
    movPage++;
  } catch { toast('Failed to load movies'); }
}
function loadMoreMovies() { loadMoviesBatch(); }

/* ══ SERIES PAGE ══════════════════════════════════════════════ */
async function initSeriesPage() {
  const grid = document.getElementById('seriesGrid');
  grid.innerHTML = skeletonCards(20);
  try {
    const data = await tmdb('/tv/popular', { page: 1 });
    grid.innerHTML = data.results.filter(i => i.poster_path).map(i => cardHTML(i, 'tv')).join('');
    serPage = 2;
  } catch { toast('Failed to load series'); }
}
async function loadMoreSeries() {
  try {
    const data = await tmdb('/tv/popular', { page: serPage++ });
    document.getElementById('seriesGrid').innerHTML +=
      data.results.filter(i => i.poster_path).map(i => cardHTML(i, 'tv')).join('');
  } catch {}
}

/* ══ GENRES PAGE ══════════════════════════════════════════════ */
function renderGenres() {
  const grid = document.getElementById('genresGrid');
  grid.innerHTML = GENRE_LIST.map(g => `
    <div class="genre-tile" style="background:${g.color}" onclick="browseGenre(${g.id},'${g.name}')">
      <div class="genre-tile-label">${g.name}</div>
    </div>`
  ).join('');
}

function browseGenre(id, name) {
  movGenre = id;
  movPage  = 1;
  moviesInitialized = false;
  document.getElementById('moviesPageTitle').textContent = name;
  navTo('movies');
  // reset pills when page loads
  setTimeout(() => {
    document.querySelectorAll('#movieFilterPills .pill').forEach(p => {
      p.classList.toggle('active', +p.dataset.gid === id);
    });
  }, 50);
}

/* ── SCROLL / OBSERVER ──────────────────────────────────────── */
function setupScrollFade() {
  window.addEventListener('scroll', () => {
    document.getElementById('mainNav').classList.toggle('solid', scrollY > 44);
  }, { passive: true });
}

function setupFadeInObserver() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
  );
  document.querySelectorAll('.fade-in').forEach(el => obs.observe(el));
}

/* ── KEYBOARD ────────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (!document.getElementById('playerModal').classList.contains('hidden')) closePlayer();
    else if (!document.getElementById('detailModal').classList.contains('hidden')) closeDetail();
  }
});

/* ── TOAST ───────────────────────────────────────────────────── */
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ── UTILS ───────────────────────────────────────────────────── */
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ── BOOT ────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initGate();
  setupSearch();
});
