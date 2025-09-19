import { createApiService } from './apiService';

const customerService = createApiService('customers');

// The old search endpoint was /customers/search/:query
// The new generic one is /customers/search?q=:query
// The new factory already handles this, so no custom method is needed unless the URL was completely different.
// Let's assume the backend API is consistent with `/search?q=...`
// If not, we could add a custom method like this:
// customerService.addCustomMethod('search', (query, page, limit) => {
//   const api = require('./apiService').default;
//   return api.get(`/customers/search/${encodeURIComponent(query)}?page=${page}&limit=${limit}`);
// });

export default customerService;
