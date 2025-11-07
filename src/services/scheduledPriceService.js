import { createApiService, get, post, put, del } from './apiService';

const baseService = createApiService('item-price-schedules');

const scheduledPriceService = {
  ...baseService,

  // Get all schedules with pagination and filters
  getAllSchedules: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.status) searchParams.set('status', params.status);
    if (params.itemPriceId) searchParams.set('itemPriceId', params.itemPriceId);
    if (params.effectiveDateFrom) searchParams.set('effectiveDateFrom', params.effectiveDateFrom);
    if (params.effectiveDateTo) searchParams.set('effectiveDateTo', params.effectiveDateTo);

    return get(`/item-price-schedules?${searchParams.toString()}`);
  },

  // Search schedules
  searchSchedules: (query, page = 1, limit = 10, filters = {}) => {
    return post('/item-price-schedules/search', {
      query,
      page,
      limit,
      filters
    });
  },

  // Get schedule by ID
  getScheduleById: (id) => {
    return baseService.getById(id);
  },

  // Create new schedule
  createSchedule: (data) => {
    return baseService.create(data);
  },

  // Update schedule
  updateSchedule: (id, data) => {
    return baseService.update(id, data);
  },

  // Delete schedule
  deleteSchedule: (id) => {
    return baseService.delete(id);
  },

  // Cancel schedule
  cancelSchedule: (id, reason) => {
    return patch(`/item-price-schedules/${id}/cancel`, { reason });
  },

  // Get schedules by ItemPrice ID
  getSchedulesByItemPrice: (itemPriceId) => {
    return get(`/item-price-schedules/item-price/${itemPriceId}`);
  },

  // Get effective price for a specific date and inventory
  getEffectivePrice: (inventoryId, date) => {
    const dateStr = date instanceof Date ? date.toISOString() : date;
    return get('/item-price-schedules/effective-price', {
      inventoryId,
      date: dateStr
    });
  }
};

export default scheduledPriceService;
