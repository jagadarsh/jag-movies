# JAG Movies

A cinematic, dark-themed movie streaming site with gold accents.

## Setup

### 1. Get a TMDB API Key
1. Go to [themoviedb.org](https://www.themoviedb.org/)
2. Create a free account → Settings → API → Request API Key
3. Copy your **API Key (v3 auth)**

### 2. Configure
Open `js/config.js` and replace:
```js
TMDB_KEY: 'YOUR_TMDB_API_KEY_HERE',
```

### 3. Deploy to Cloudflare Pages
1. Push this folder to a GitHub repo
2. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
3. Connect your repo, set build as **static** (no build command needed)
4. Deploy!

## Features
- 🔐 Password gate (`minceraftsmp`)
- 🎬 Hero banner with auto-rotation (trending movies)
- 📺 Rows: Trending, Top Rated, Action, Comedy, Horror, Sci-Fi, Series
- ⏯️ Continue Watching with progress bars (saved to localStorage)
- 🎭 Genre browser
- 📄 Detail modal: description, cast, IMDb links, genres, ratings
- 📺 TV Season/Episode browser with per-episode progress
- 🔍 Search via TMDB
- 🎬 Vidking.net embed player
- ✨ Cinematic hover zoom, gold glow, grain texture, scroll animations

## File Structure
```
/
├── index.html          # Main app
├── css/
│   └── main.css        # All styles
├── js/
│   ├── config.js       # TMDB key + settings
│   └── app.js          # All app logic
├── _headers            # Cloudflare security headers
└── _redirects          # Cloudflare SPA routing
```

## Customization
- Change password in `js/config.js` → `PASSWORD`
- Change accent color in `css/main.css` → `--gold: #c9a84c`
- Add/remove genre rows in `js/app.js` → `loadHomePage()`
