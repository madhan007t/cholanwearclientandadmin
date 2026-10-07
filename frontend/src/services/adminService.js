import api from './api';

const d = (r) => r.data;

export const adminService = {
  login: (body) => api.post('/admin/login', body).then(d),
  logout: () => api.post('/admin/logout').then(d),
  me: () => api.get('/admin/me').then(d),
  changePassword: (body) => api.put('/admin/password', body).then(d),
  dashboard: () => api.get('/admin/dashboard').then(d),

  products: (params) => api.get('/admin/products', { params }).then(d),
  product: (id) => api.get(`/admin/products/${id}`).then((r) => r.data.product),
  createProduct: (body) => api.post('/admin/products', body).then((r) => r.data.product),
  updateProduct: (id, body) => api.put(`/admin/products/${id}`, body).then((r) => r.data.product),
  patchProduct: (id, body) => api.patch(`/admin/products/${id}`, body).then((r) => r.data.product),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then(d),

  categories: () => api.get('/admin/categories').then((r) => r.data.categories),
  createCategory: (body) => api.post('/admin/categories', body).then((r) => r.data.category),
  updateCategory: (id, body) => api.put(`/admin/categories/${id}`, body).then((r) => r.data.category),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`).then(d),

  orders: (params) => api.get('/admin/orders', { params }).then(d),
  order: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data.order),
  setOrderStatus: (id, body) => api.patch(`/admin/orders/${id}/status`, body).then((r) => r.data.order),

  customers: (params) => api.get('/admin/customers', { params }).then((r) => r.data.customers),
  settings: () => api.get('/admin/settings').then((r) => r.data.settings),
  updateSettings: (body) => api.put('/admin/settings', body).then((r) => r.data.settings),

  upload: (files, folder = 'products') => {
    const fd = new FormData();
    [...files].forEach((f) => fd.append('images', f));
    return api.post(`/admin/uploads?folder=${folder}`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 }).then((r) => r.data.urls);
  },
};
