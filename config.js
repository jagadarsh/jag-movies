// ══════════════════════════════════════════════════════════════
//  JAG MOVIES — config.js
//  Edit the values below before deploying
// ══════════════════════════════════════════════════════════════

const CFG = {
  // ─── REQUIRED ─────────────────────────────────────────────
  // Get a free v3 API key at https://www.themoviedb.org/settings/api
  TMDB_KEY: 'YOUR_TMDB_API_KEY_HERE',

  // Site password gate
  PASSWORD: 'minceraftsmp',

  // ─── ENDPOINTS (do not change) ────────────────────────────
  TMDB_API:  'https://api.themoviedb.org/3',
  TMDB_IMG:  'https://image.tmdb.org/t/p',

  // Vidking embed format:
  //   Movie: https://www.vidking.net/embed/movie/{tmdb_id}
  //   TV:    https://www.vidking.net/embed/tv/{tmdb_id}/{season}/{episode}
  EMBED_BASE: 'https://www.vidking.net/embed',
};

// TMDB genre id → name
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  53:'Thriller', 10752:'War', 37:'Western',
};

// Genre tiles on the browse page (id, name, bg colour)
const GENRE_LIST = [
  { id:28,  name:'Action',      color:'#3d0a0a' },
  { id:35,  name:'Comedy',      color:'#3d2800' },
  { id:27,  name:'Horror',      color:'#0d0d1f' },
  { id:878, name:'Sci-Fi',      color:'#071828' },
  { id:18,  name:'Drama',       color:'#0a1e30' },
  { id:10749,name:'Romance',    color:'#3d0a1e' },
  { id:53,  name:'Thriller',    color:'#141a0a' },
  { id:12,  name:'Adventure',   color:'#0a200a' },
  { id:80,  name:'Crime',       color:'#0e0e0e' },
  { id:14,  name:'Fantasy',     color:'#1e0a2e' },
  { id:9648,name:'Mystery',     color:'#14140a' },
  { id:37,  name:'Western',     color:'#281800' },
  { id:10752,name:'War',        color:'#141414' },
  { id:99,  name:'Documentary', color:'#001414' },
  { id:36,  name:'History',     color:'#1e1000' },
  { id:16,  name:'Animation',   color:'#071a07' },
];
