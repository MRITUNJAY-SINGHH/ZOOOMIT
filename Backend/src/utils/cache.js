import NodeCache from 'node-cache';

// Initialize cache with standard TTL of 5 minutes. 
// We will manually invalidate it on critical mutations.
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });

export const clearReportsCache = () => {
  const keys = cache.keys();
  const reportKeys = keys.filter(k => k.startsWith('report_'));
  if (reportKeys.length > 0) {
    cache.del(reportKeys);
    console.log(`[CACHE] Invalidated ${reportKeys.length} report cache keys.`);
  }
};

export default cache;
