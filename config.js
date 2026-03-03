// ===== JAG MOVIES CONFIG =====
// Replace with your TMDB API key
const CONFIG = {
  TMDB_KEY: 'YOUR_TMDB_API_KEY_HERE',
  TMDB_BASE: 'https://api.themoviedb.org/3',
  TMDB_IMG: 'https://image.tmdb.org/t/p',
  VIDKING_BASE: 'https://vidking.net',
  PASSWORD: 'minceraftsmp',
};

// Genre ID map from TMDB
const GENRE_MAP = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
  80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
  14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
  9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
  53: 'Thriller', 10752: 'War', 37: 'Western'
};

// Genre colors for genre cards
const GENRE_COLORS = {
  28: '#c0392b', 12: '#27ae60', 16: '#8e44ad', 35: '#f39c12',
  80: '#2c3e50', 18: '#2980b9', 27: '#922b21', 878: '#1a5276',
  53: '#6e2f0a', 10749: '#c0392b', 14: '#7d3c98', 16: '#1abc9c'
};
