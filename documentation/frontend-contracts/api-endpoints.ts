export const API_BASE_URL = 'http://localhost:3000';

export const AUTH_ENDPOINTS = {
  google: '/auth/google',
  googleCallback: '/auth/google/callback',
  me: '/auth/me',
} as const;

export const PRODUCT_ENDPOINTS = {
  query: '/api/products/query',
  filter: '/api/products/filter',
  categories: '/api/products/categories',
  all: '/api/products',
  deleted: '/api/products/deleted',
  create: '/api/products',
  update: (id: number) => `/api/products/${id}`,
  delete: (id: number) => `/api/products/${id}`,
  permanentDelete: (id: number) => `/api/products/${id}/permanent`,
  restore: (id: number) => `/api/products/${id}/restore`,
} as const;

export const ORDER_ENDPOINTS = {
  checkoutPage: '/api/orders/checkout',
  recommendations: '/api/orders/recommendations',
  current: '/api/orders/current',
  clearCurrentCart: '/api/orders/current/items',
  list: '/api/orders',
  adminList: '/api/orders/admin',
  adminDashboardSummary: '/api/orders/admin/dashboard-summary',
  validateCoupon: '/api/orders/coupons/validate',
  validate: (id: number) => `/api/orders/${id}/validate`,
  checkout: (id: number) => `/api/orders/${id}/checkout`,
  addItem: (id: number) => `/api/orders/${id}/items`,
  updateItem: (itemId: number) => `/api/orders/items/${itemId}`,
  deleteItem: (itemId: number) => `/api/orders/items/${itemId}`,
  updateFulfillment: (id: number) => `/api/orders/${id}/fulfillment`,
  complete: (id: number) => `/api/orders/${id}/complete`,
} as const;

export const BILLING_INFORMATION_ENDPOINTS = {
  list: '/api/billing-information',
  create: '/api/billing-information',
  getById: (id: number) => `/api/billing-information/${id}`,
  update: (id: number) => `/api/billing-information/${id}`,
  delete: (id: number) => `/api/billing-information/${id}`,
} as const;

export const DISCOUNT_ENDPOINTS = {
  create: '/api/discounts',
  list: '/api/discounts',
  deleted: '/api/discounts/deleted',
  update: (id: number) => `/api/discounts/${id}`,
  delete: (id: number) => `/api/discounts/${id}`,
} as const;

export const BUSINESS_SETTING_ENDPOINTS = {
  shippingCost: '/api/settings/shipping-cost',
  freeShippingThreshold: '/api/settings/free-shipping-threshold',
  monthlySalesTarget: '/api/settings/monthly-sales-target',
  timezone: '/api/settings/timezone',
} as const;
export const ANALYTICS_ENDPOINTS = {
  adminDashboard: '/api/analytics/admin/dashboard',
} as const;

export const HTTP_METHODS = { GET: 'GET', POST: 'POST', PUT: 'PUT', PATCH: 'PATCH', DELETE: 'DELETE', OPTIONS: 'OPTIONS' } as const;
export const STATUS_CODES = { OK: 200, CREATED: 201, BAD_REQUEST: 400, UNAUTHORIZED: 401, FORBIDDEN: 403, NOT_FOUND: 404, CONFLICT: 409, UNPROCESSABLE_ENTITY: 422, INTERNAL_SERVER_ERROR: 500, SERVICE_UNAVAILABLE: 503 } as const;

export function buildApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

export function createAuthHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export function createJsonHeader(): Record<string, string> {
  return { 'Content-Type': 'application/json' };
}

export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) searchParams.append(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export function buildUrlWithQuery(endpoint: string, params?: Record<string, unknown>): string {
  const url = buildApiUrl(endpoint);
  return params && Object.keys(params).length ? url + buildQueryString(params) : url;
}

export const ApiRoutes = {
  auth: {
    google: () => buildApiUrl(AUTH_ENDPOINTS.google),
    googleCallback: () => buildApiUrl(AUTH_ENDPOINTS.googleCallback),
    me: () => buildApiUrl(AUTH_ENDPOINTS.me),
  },
  products: {
    query: (params?: Record<string, unknown>) => buildUrlWithQuery(PRODUCT_ENDPOINTS.query, params),
    filter: () => buildApiUrl(PRODUCT_ENDPOINTS.filter),
    categories: () => buildApiUrl(PRODUCT_ENDPOINTS.categories),
    all: () => buildApiUrl(PRODUCT_ENDPOINTS.all),
    deleted: () => buildApiUrl(PRODUCT_ENDPOINTS.deleted),
    create: () => buildApiUrl(PRODUCT_ENDPOINTS.create),
    update: (id: number) => buildApiUrl(PRODUCT_ENDPOINTS.update(id)),
    delete: (id: number) => buildApiUrl(PRODUCT_ENDPOINTS.delete(id)),
    permanentDelete: (id: number) => buildApiUrl(PRODUCT_ENDPOINTS.permanentDelete(id)),
    restore: (id: number) => buildApiUrl(PRODUCT_ENDPOINTS.restore(id)),
  },
  orders: {
    checkoutPage: () => buildApiUrl(ORDER_ENDPOINTS.checkoutPage),
    recommendations: (params?: Record<string, unknown>) => buildUrlWithQuery(ORDER_ENDPOINTS.recommendations, params),
    current: () => buildApiUrl(ORDER_ENDPOINTS.current),
    clearCurrentCart: () => buildApiUrl(ORDER_ENDPOINTS.clearCurrentCart),
    list: () => buildApiUrl(ORDER_ENDPOINTS.list),
    adminList: () => buildApiUrl(ORDER_ENDPOINTS.adminList),
    adminDashboardSummary: () => buildApiUrl(ORDER_ENDPOINTS.adminDashboardSummary),
    validateCoupon: () => buildApiUrl(ORDER_ENDPOINTS.validateCoupon),
    validate: (id: number) => buildApiUrl(ORDER_ENDPOINTS.validate(id)),
    checkout: (id: number) => buildApiUrl(ORDER_ENDPOINTS.checkout(id)),
    addItem: (id: number) => buildApiUrl(ORDER_ENDPOINTS.addItem(id)),
    updateItem: (itemId: number) => buildApiUrl(ORDER_ENDPOINTS.updateItem(itemId)),
    deleteItem: (itemId: number) => buildApiUrl(ORDER_ENDPOINTS.deleteItem(itemId)),
    updateFulfillment: (id: number) => buildApiUrl(ORDER_ENDPOINTS.updateFulfillment(id)),
    complete: (id: number) => buildApiUrl(ORDER_ENDPOINTS.complete(id)),
  },
  billingInformation: {
    list: () => buildApiUrl(BILLING_INFORMATION_ENDPOINTS.list),
    create: () => buildApiUrl(BILLING_INFORMATION_ENDPOINTS.create),
    getById: (id: number) => buildApiUrl(BILLING_INFORMATION_ENDPOINTS.getById(id)),
    update: (id: number) => buildApiUrl(BILLING_INFORMATION_ENDPOINTS.update(id)),
    delete: (id: number) => buildApiUrl(BILLING_INFORMATION_ENDPOINTS.delete(id)),
  },
  discounts: {
    create: () => buildApiUrl(DISCOUNT_ENDPOINTS.create),
    list: () => buildApiUrl(DISCOUNT_ENDPOINTS.list),
    deleted: () => buildApiUrl(DISCOUNT_ENDPOINTS.deleted),
    update: (id: number) => buildApiUrl(DISCOUNT_ENDPOINTS.update(id)),
    delete: (id: number) => buildApiUrl(DISCOUNT_ENDPOINTS.delete(id)),
  },
  settings: {
    shippingCost: () => buildApiUrl(BUSINESS_SETTING_ENDPOINTS.shippingCost),
    freeShippingThreshold: () => buildApiUrl(BUSINESS_SETTING_ENDPOINTS.freeShippingThreshold),
    monthlySalesTarget: () => buildApiUrl(BUSINESS_SETTING_ENDPOINTS.monthlySalesTarget),
    timezone: () => buildApiUrl(BUSINESS_SETTING_ENDPOINTS.timezone),
  },
  analytics: {
    adminDashboard: (params: { from: string; to: string }) => buildUrlWithQuery(ANALYTICS_ENDPOINTS.adminDashboard, params),
  },
} as const;
