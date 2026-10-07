import api from './api';

// Public storefront endpoints
export const shopService = {
  products: (params = {}) => api.get('/products', { params: clean(params) }).then((r) => r.data),
  product: (slug) => api.get(`/products/${slug}`).then((r) => r.data.product),
  meta: () => api.get('/products/meta').then((r) => r.data),
  categories: () => api.get('/categories').then((r) => r.data.categories),
  settings: () => api.get('/settings').then((r) => r.data.settings),
  quote: (items) => api.post('/cart/quote', { items }).then((r) => r.data),
  placeOrder: (payload) => api.post('/orders', payload).then((r) => r.data.order),
};

function clean(params) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== false));
}
