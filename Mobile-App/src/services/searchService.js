import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { StorefrontAPI } from './api';

const RECENT_SEARCHES_KEY = 'kuiklo_recent_searches_v2';
let memoryRecentSearches = ['Milk', 'Banana', 'Tomato', 'Eggs', 'Potato'];

export const SYNONYM_DICTIONARY = {
  rice: {
    canonical: 'Rice',
    keywords: ['rice', 'chawal', 'chaawal', 'chaval', 'chawool', 'chawol', 'चावल', 'basmati', 'pulao', 'biryani rice', 'kolam', 'sona masoori', 'brown rice'],
    categoryHint: 'Atta, Rice & Dal'
  },
  milk: {
    canonical: 'Milk',
    keywords: ['milk', 'doodh', 'dudh', 'dhudh', 'dhoodh', 'दूध', 'taaza', 'toned milk', 'cow milk', 'full cream', 'gold milk'],
    categoryHint: 'Dairy & Milk'
  },
  potato: {
    canonical: 'Potato',
    keywords: ['potato', 'potatoes', 'aloo', 'alu', 'aalu', 'allu', 'आलू', 'batata'],
    categoryHint: 'Fruits & Vegetables'
  },
  onion: {
    canonical: 'Onion',
    keywords: ['onion', 'onions', 'pyaz', 'pyaaz', 'piyaz', 'pyaj', 'प्याज', 'kanda'],
    categoryHint: 'Fruits & Vegetables'
  },
  tomato: {
    canonical: 'Tomato',
    keywords: ['tomato', 'tomatoes', 'tamatar', 'tamator', 'tamatr', 'टमाटर', 'tamato', 'tomatto'],
    categoryHint: 'Fruits & Vegetables'
  },
  curd: {
    canonical: 'Curd',
    keywords: ['curd', 'dahi', 'daahi', 'dayi', 'दही', 'yogurt', 'yoghurt'],
    categoryHint: 'Dairy & Milk'
  },
  water: {
    canonical: 'Water',
    keywords: ['water', 'paani', 'pani', 'paanji', 'पानी', 'mineral water', 'bisleri', 'aquafina', 'kinley'],
    categoryHint: 'Snacks & Beverages'
  },
  atta: {
    canonical: 'Atta',
    keywords: ['atta', 'aata', 'flour', 'wheat', 'wheat flour', 'gehun', 'aatta', 'आटा', 'chakki atta', 'maida', 'sooji', 'suji', 'rawa'],
    categoryHint: 'Atta, Rice & Dal'
  },
  dal: {
    canonical: 'Dal',
    keywords: ['dal', 'daal', 'dall', 'lentils', 'pulses', 'arhar', 'toor', 'moong', 'urad', 'masoor', 'chana dal', 'दाल'],
    categoryHint: 'Atta, Rice & Dal'
  },
  oil: {
    canonical: 'Oil',
    keywords: ['oil', 'tel', 'tail', 'cooking oil', 'mustard oil', 'sarson', 'refined oil', 'sunflower oil', 'soyabean oil', 'ghee', 'तेल'],
    categoryHint: 'Atta, Rice & Dal'
  },
  sugar: {
    canonical: 'Sugar',
    keywords: ['sugar', 'cheeni', 'chini', 'shakkar', 'shakar', 'bura', 'चीनी'],
    categoryHint: 'Atta, Rice & Dal'
  },
  salt: {
    canonical: 'Salt',
    keywords: ['salt', 'namak', 'nimak', 'tata salt', 'sendha namak', 'rock salt', 'नमक'],
    categoryHint: 'Masala & Spices'
  },
  tea: {
    canonical: 'Tea',
    keywords: ['tea', 'chai', 'chaay', 'chaye', 'chayi', 'patti', 'tea bag', 'green tea', 'चाय'],
    categoryHint: 'Snacks & Beverages'
  },
  coffee: {
    canonical: 'Coffee',
    keywords: ['coffee', 'koffee', 'cofy', 'nescafe', 'bru', 'instant coffee', 'कॉफी'],
    categoryHint: 'Snacks & Beverages'
  },
  biscuit: {
    canonical: 'Biscuits',
    keywords: ['biscuit', 'biscuits', 'biskit', 'biskut', 'cookie', 'cookies', 'parle g', 'marie', 'oreo', 'good day', 'बिस्कुट'],
    categoryHint: 'Snacks & Beverages'
  },
  banana: {
    canonical: 'Banana',
    keywords: ['banana', 'bananas', 'kela', 'kele', 'keila', 'kella', 'केला', 'elaichi banana', 'robusta'],
    categoryHint: 'Fruits & Vegetables'
  },
  apple: {
    canonical: 'Apple',
    keywords: ['apple', 'apples', 'seb', 'saeb', 'seba', 'kinnow', 'सेब', 'shimla apple', 'fuji apple'],
    categoryHint: 'Fruits & Vegetables'
  },
  bread: {
    canonical: 'Bread',
    keywords: ['bread', 'pav', 'paav', 'bun', 'buns', 'white bread', 'brown bread', 'sandwich bread', 'double roti', 'ब्रेड'],
    categoryHint: 'Dairy & Milk'
  },
  butter: {
    canonical: 'Butter',
    keywords: ['butter', 'makhan', 'makkhan', 'makhana', 'amul butter', 'white butter', 'मक्खन'],
    categoryHint: 'Dairy & Milk'
  },
  paneer: {
    canonical: 'Paneer',
    keywords: ['paneer', 'panir', 'cottage cheese', 'cheese cubes', 'tofu', 'पनीर'],
    categoryHint: 'Dairy & Milk'
  },
  egg: {
    canonical: 'Eggs',
    keywords: ['egg', 'eggs', 'anda', 'ande', 'andey', 'desi egg', 'white egg', 'अंडा'],
    categoryHint: 'Dairy & Milk'
  },
  maggi: {
    canonical: 'Maggi',
    keywords: ['maggi', 'maggie', 'meggi', 'meggie', 'noodles', 'noodle', 'yippee', 'instant noodles', 'wai wai', 'मैगी'],
    categoryHint: 'Snacks & Beverages'
  },
  ginger: {
    canonical: 'Ginger',
    keywords: ['ginger', 'adrak', 'aadrak', 'adrakh', 'अदरक'],
    categoryHint: 'Fruits & Vegetables'
  },
  garlic: {
    canonical: 'Garlic',
    keywords: ['garlic', 'lahsun', 'lehsun', 'lasan', 'लहसुन'],
    categoryHint: 'Fruits & Vegetables'
  },
  chilli: {
    canonical: 'Chilli',
    keywords: ['chilli', 'chili', 'mirch', 'mirchi', 'green chilli', 'hari mirch', 'lal mirch', 'मिर्च'],
    categoryHint: 'Fruits & Vegetables'
  },
  coriander: {
    canonical: 'Coriander',
    keywords: ['coriander', 'dhaniya', 'dhanya', 'kothmir', 'धनिया'],
    categoryHint: 'Fruits & Vegetables'
  },
  soap: {
    canonical: 'Soap',
    keywords: ['soap', 'sabun', 'saabun', 'body wash', 'bathing bar', 'dettol', 'lux', 'dove', 'lifebuoy', 'साबुन'],
    categoryHint: 'Personal Care'
  },
  shampoo: {
    canonical: 'Shampoo',
    keywords: ['shampoo', 'shampu', 'conditioner', 'hair wash', 'head & shoulders', 'pantene', 'sunsilk', 'शैम्पू'],
    categoryHint: 'Personal Care'
  },
  detergent: {
    canonical: 'Detergent',
    keywords: ['detergent', 'surf', 'washing powder', 'surf excel', 'ariel', 'tide', 'wheel', 'ghari', 'डिटर्जेंट'],
    categoryHint: 'Cleaning & Household'
  }
};

function normalizeText(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/[^\w\s\u0900-\u097F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export const searchService = {
  normalize: normalizeText,

  findSynonyms(query) {
    const norm = normalizeText(query);
    if (!norm) return null;

    for (const [key, item] of Object.entries(SYNONYM_DICTIONARY)) {
      if (item.keywords.some((kw) => kw.toLowerCase() === norm || norm.includes(kw.toLowerCase()))) {
        return {
          key,
          canonical: item.canonical,
          categoryHint: item.categoryHint,
          keywords: item.keywords
        };
      }
    }

    return null;
  },

  getSuggestions(partialQuery) {
    const norm = normalizeText(partialQuery);
    if (!norm || norm.length < 2) return [];

    const suggestions = new Set();

    for (const item of Object.values(SYNONYM_DICTIONARY)) {
      for (const kw of item.keywords) {
        if (kw.toLowerCase().startsWith(norm) || (kw.length > 3 && kw.toLowerCase().includes(norm))) {
          if (item.canonical.toLowerCase() !== kw.toLowerCase()) {
            suggestions.add(`${kw.charAt(0).toUpperCase() + kw.slice(1)} (${item.canonical})`);
          } else {
            suggestions.add(item.canonical);
          }
          break;
        }
      }
      if (suggestions.size >= 6) break;
    }

    return Array.from(suggestions);
  },

  getDidYouMean(query) {
    const norm = normalizeText(query);
    if (!norm || norm.length < 3) return null;

    let closest = null;
    let minDistance = 3;

    for (const item of Object.values(SYNONYM_DICTIONARY)) {
      for (const kw of item.keywords) {
        const dist = levenshtein(norm, kw.toLowerCase());
        if (dist > 0 && dist < minDistance) {
          minDistance = dist;
          closest = item.canonical;
        }
      }
    }

    return closest;
  },

  async executeSmartSearch({ query, sort, category, page = 1, limit = 40 }) {
    const rawQuery = (query || '').trim();
    const normalized = normalizeText(rawQuery);

    if (!normalized && !category) {
      return {
        products: [],
        topResult: null,
        categories: [],
        counts: { all: 0, products: 0, categories: 0 },
        didYouMean: null
      };
    }

    const synonymMatch = this.findSynonyms(normalized);
    const backendSearchTerm = synonymMatch ? synonymMatch.canonical : rawQuery;

    try {
      const [productRes, categoryRes] = await Promise.all([
        StorefrontAPI.getProducts({
          search: backendSearchTerm || undefined,
          sort: sort !== 'default' ? sort : undefined,
          category: category || undefined,
          page,
          limit
        }),
        StorefrontAPI.getCategories()
      ]);

      let products = productRes.data?.data || [];
      const allCategories = categoryRes.data?.data || [];

      let matchingCategories = [];
      if (normalized) {
        matchingCategories = allCategories.filter((cat) => {
          const catName = (cat.name || '').toLowerCase();
          return (
            catName.includes(normalized) ||
            (synonymMatch && catName.includes(synonymMatch.canonical.toLowerCase())) ||
            (synonymMatch?.categoryHint && catName.includes(synonymMatch.categoryHint.toLowerCase()))
          );
        });
      }

      if (products.length === 0 && synonymMatch) {
        const fallbackRes = await StorefrontAPI.getProducts({
          search: synonymMatch.key,
          sort: sort !== 'default' ? sort : undefined,
          limit
        });
        products = fallbackRes.data?.data || [];
      }

      const ranked = this.rankResults(products, rawQuery, synonymMatch?.canonical);

      const topResult = ranked.length > 0 ? ranked[0] : null;

      let didYouMean = null;
      if (ranked.length === 0) {
        didYouMean = this.getDidYouMean(rawQuery);
      }

      return {
        products: ranked,
        topResult,
        categories: matchingCategories,
        counts: {
          all: ranked.length + matchingCategories.length,
          products: ranked.length,
          categories: matchingCategories.length
        },
        didYouMean
      };
    } catch {
      return {
        products: [],
        topResult: null,
        categories: [],
        counts: { all: 0, products: 0, categories: 0 },
        didYouMean: this.getDidYouMean(rawQuery)
      };
    }
  },

  rankResults(products, query, canonical) {
    if (!products || products.length === 0) return [];
    const q = normalizeText(query);
    const c = canonical ? normalizeText(canonical) : '';

    return [...products].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();

      const scoreA = this._calcScore(nameA, q, c, a);
      const scoreB = this._calcScore(nameB, q, c, b);

      return scoreB - scoreA;
    });
  },

  _calcScore(name, query, canonical, product) {
    let score = 0;
    if (query && name === query) score += 100;
    if (canonical && name === canonical) score += 90;
    if (query && name.startsWith(query)) score += 60;
    if (canonical && name.startsWith(canonical)) score += 50;
    if (query && name.includes(query)) score += 30;
    if (canonical && name.includes(canonical)) score += 25;
    if (product.brand && query && product.brand.toLowerCase().includes(query)) score += 20;
    if (product.isFeatured) score += 5;
    if (product.totalOrders) score += Math.min(product.totalOrders, 10);
    return score;
  },

  async getRecentSearches() {
    try {
      if (Platform.OS === 'web') {
        const stored = typeof window !== 'undefined' ? window.localStorage.getItem(RECENT_SEARCHES_KEY) : null;
        return stored ? JSON.parse(stored) : memoryRecentSearches;
      }
      const stored = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
      if (stored) {
        memoryRecentSearches = JSON.parse(stored);
        return memoryRecentSearches;
      }
    } catch {}
    return memoryRecentSearches;
  },

  async addRecentSearch(term) {
    if (!term || !term.trim()) return memoryRecentSearches;
    const clean = term.trim();
    try {
      const existing = await this.getRecentSearches();
      const updated = [clean, ...existing.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      memoryRecentSearches = updated;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } else {
        await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return memoryRecentSearches;
    }
  },

  async removeRecentSearch(term) {
    try {
      const existing = await this.getRecentSearches();
      const updated = existing.filter((item) => item !== term);
      memoryRecentSearches = updated;
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } else {
        await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      }
      return updated;
    } catch {
      return memoryRecentSearches;
    }
  },

  async clearRecentSearches() {
    try {
      memoryRecentSearches = [];
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined') window.localStorage.removeItem(RECENT_SEARCHES_KEY);
      } else {
        await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
      }
      return [];
    } catch {
      return [];
    }
  }
};
