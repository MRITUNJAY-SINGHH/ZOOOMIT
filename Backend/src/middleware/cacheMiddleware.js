import cache from '../utils/cache.js';

export const cacheMiddleware = (duration = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Construct a unique cache key based on the URL (cleaning out refresh param)
    const rawUrl = req.originalUrl || req.url;
    const cleanUrl = rawUrl.replace(/[?&]refresh=(true|false)/g, '').replace(/\?$/, '');
    const key = `report_${cleanUrl}`;

    // If client requested a fresh refresh, bypass cache and invalidate existing key
    const isRefresh = req.query.refresh === 'true' || req.headers['x-refresh'] === 'true';
    if (isRefresh) {
      cache.del(key);
      console.log(`[CACHE BYPASS & DEL] ${key}`);
    } else {
      const cachedResponse = cache.get(key);
      if (cachedResponse) {
        console.log(`[CACHE HIT] ${key}`);
        return res.json(cachedResponse);
      }
    }

    console.log(`[CACHE MISS] ${key}`);
    
    // Intercept res.json to cache the response before sending
    const originalJson = res.json;
    res.json = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration);
      }
      return originalJson.call(res, body);
    };

    next();
  };
};
