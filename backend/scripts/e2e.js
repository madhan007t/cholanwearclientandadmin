/**
 * End-to-end API check against a RUNNING server (default http://localhost:5000).
 *   npm run dev   (in one terminal)   then   npm run test:e2e
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD from .env. Creates and cleans up its own test data.
 */
import 'dotenv/config';

const BASE = process.env.API_URL || 'http://localhost:5000';
let cookie = '';
let failed = 0;

const api = async (method, url, body, { raw = false, auth = true } = {}) => {
  const headers = {};
  if (body && !raw) headers['Content-Type'] = 'application/json';
  if (auth && cookie) headers.Cookie = cookie;
  const res = await fetch(BASE + url, { method, headers, body: raw ? body : body ? JSON.stringify(body) : undefined });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  let data = null;
  try { data = await res.json(); } catch { /* no body */ }
  return { status: res.status, data, res };
};

const check = (name, cond, extra = '') => {
  if (cond) console.log(`  PASS  ${name}`);
  else { failed += 1; console.log(`  FAIL  ${name} ${extra}`); }
};

const customer = {
  name: 'Test Buyer', phone: '9876543210', alternatePhone: '', email: 'buyer@example.com',
};
const address = { addressLine1: '12 Temple Street', addressLine2: '', landmark: 'Near park', city: 'Madurai', district: 'Madurai', state: 'Tamil Nadu', pincode: '625001' };

console.log('PUBLIC');
let r = await api('GET', '/api/products?limit=50');
check('lists products', r.status === 200 && r.data.products.length > 0);
const products = r.data.products;
const p = products[0];
check('product has populated category', !!p.category?.slug);
r = await api('GET', `/api/products/${p.slug}`);
check('product by slug', r.status === 200 && r.data.product.slug === p.slug);
r = await api('GET', '/api/products/does-not-exist');
check('unknown slug -> 404', r.status === 404);
r = await api('GET', '/api/categories');
check('categories', r.status === 200 && r.data.categories.length >= 3);
r = await api('GET', '/api/products?category=oversized-t-shirts&sort=price-asc&size=M&color=black');
check('filter+sort query', r.status === 200 && r.data.products.every((x) => x.category.slug === 'oversized-t-shirts'));
const prices = r.data.products.map((x) => x.sellingPrice);
check('price-asc ordering', prices.every((v, i) => i === 0 || prices[i - 1] <= v));
r = await api('GET', '/api/products?search=lion');
check('search by name', r.data.products.length > 0 && r.data.products.every((x) => /lion/i.test(x.name)));
r = await api('GET', '/api/products?search=Regular%20T-Shirts');
check('search by category name', r.data.products.length > 0);
r = await api('GET', '/api/products?sort=bogus');
check('invalid query rejected', r.status === 400);

console.log('ORDER (guest, server-side pricing)');
const stockBefore = (await api('GET', `/api/products/${p.slug}`)).data.product.stock;
const size = p.sizes[0];
const color = p.colors[0].name;
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: p._id, size, color, quantity: 2 }], paymentMethod: 'COD', totalAmount: 1, items_price: 1 });
check('order created (201)', r.status === 201, JSON.stringify(r.data));
const order = r.data?.order;
check('price comes from DB, not client', order && order.subtotal === p.sellingPrice * 2 && order.items[0].unitPrice === p.sellingPrice);
check('total = subtotal + delivery', order && order.totalAmount === order.subtotal + order.deliveryCharge);
check('order number generated', /^CW-\d+$/.test(order?.orderNumber || ''));
const stockAfter = (await api('GET', `/api/products/${p.slug}`)).data.product.stock;
check('stock decremented', stockAfter === stockBefore - 2);
r = await api('POST', '/api/orders', { customer: { ...customer, phone: '123' }, shippingAddress: address, items: [{ productId: p._id, size, color, quantity: 1 }] });
check('bad phone rejected', r.status === 400 && r.data.errors?.['customer.phone']);
r = await api('POST', '/api/orders', { customer, shippingAddress: { ...address, pincode: '12' }, items: [{ productId: p._id, size, color, quantity: 1 }] });
check('bad pincode rejected', r.status === 400);
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: p._id, size: '', color, quantity: 1 }] });
check('missing size rejected', r.status === 400);
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: p._id, size: 'S', color: 'Nope', quantity: 1 }] });
check('invalid color rejected', r.status === 400);
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: p._id, size, color, quantity: 99999 }] });
check('absurd quantity rejected', r.status === 400);
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: '64b000000000000000000000', size, color, quantity: 1 }] });
check('unknown product rejected', r.status === 400);
r = await api('POST', '/api/orders', { customer, shippingAddress: address, items: [{ productId: p._id, size, color, quantity: stockAfter + 1 }] });
check('over-stock rejected (409)', r.status === 409 || r.status === 400, String(r.status));
const stockUnchanged = (await api('GET', `/api/products/${p.slug}`)).data.product.stock;
check('failed order leaves stock untouched', stockUnchanged === stockAfter);

console.log('ADMIN AUTH');
r = await api('GET', '/api/admin/orders', null, { auth: false });
check('admin route blocked without cookie', r.status === 401);
r = await api('POST', '/api/admin/login', { email: process.env.ADMIN_EMAIL, password: 'wrong-password' });
check('wrong password -> 401', r.status === 401);
r = await api('POST', '/api/admin/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
check('login ok + httpOnly cookie', r.status === 200 && /HttpOnly/i.test(r.res.headers.get('set-cookie') || ''));
r = await api('GET', '/api/admin/me');
check('/me', r.status === 200 && r.data.admin.email === process.env.ADMIN_EMAIL);
check('password never returned', !JSON.stringify(r.data).includes('password'));

console.log('ADMIN CATEGORIES / PRODUCTS / UPLOAD');
r = await api('POST', '/api/admin/categories', { name: 'E2E Category' });
check('create category', r.status === 201);
const cat = r.data.category;
r = await api('POST', '/api/admin/categories', { name: 'E2E Category' });
check('duplicate category name blocked', r.status === 409 || r.status === 201 && false);
// 1x1 png
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
let fd = new FormData();
fd.append('images', new Blob([png], { type: 'image/png' }), 'a.png');
r = await api('POST', '/api/admin/uploads', fd, { raw: true });
check('upload png', r.status === 201 && r.data.urls[0].startsWith('/uploads/products/'));
const imgUrl = r.data?.urls?.[0];
const img = await fetch(BASE + imgUrl);
check('uploaded image is served', img.status === 200);
fd = new FormData();
fd.append('images', new Blob(['<script>alert(1)</script>'], { type: 'image/png' }), 'evil.png');
r = await api('POST', '/api/admin/uploads', fd, { raw: true });
check('fake image (bad magic bytes) rejected', r.status === 400);
fd = new FormData();
fd.append('images', new Blob(['hello'], { type: 'text/plain' }), 'x.txt');
r = await api('POST', '/api/admin/uploads', fd, { raw: true });
check('non-image mimetype rejected', r.status === 400);

r = await api('POST', '/api/admin/products', { name: 'E2E Tee', category: cat._id, sellingPrice: 500, originalPrice: 400, stock: 3 });
check('originalPrice < sellingPrice rejected', r.status === 400);
r = await api('POST', '/api/admin/products', { name: 'E2E Tee', category: cat._id, sellingPrice: 500, originalPrice: 700, stock: 3, sizes: ['M', 'L'], colors: [{ name: 'Black', hex: '#000000' }], images: [imgUrl], primaryImage: imgUrl, sku: 'E2E-1', isTrending: true });
check('create product', r.status === 201, JSON.stringify(r.data));
const prod = r.data.product;
check('slug generated', prod?.slug === 'e2e-tee');
check('discount virtual', prod?.discountPercent === 29);
r = await api('POST', '/api/admin/products', { name: 'E2E Tee', category: cat._id, sellingPrice: 500, stock: 1, sku: 'E2E-1' });
check('duplicate SKU blocked', r.status === 409);
r = await api('PUT', `/api/admin/products/${prod._id}`, { name: 'E2E Tee Updated', category: cat._id, sellingPrice: 450, originalPrice: 700, stock: 3, sizes: ['M'], colors: [{ name: 'Black', hex: '#000' }], images: [imgUrl], primaryImage: imgUrl, sku: 'E2E-1' });
check('update product', r.status === 200 && r.data.product.sellingPrice === 450);
r = await api('PATCH', `/api/admin/products/${prod._id}`, { isActive: false });
check('toggle inactive', r.status === 200 && r.data.product.isActive === false);
r = await api('GET', `/api/products/${prod.slug}`, null, { auth: false });
check('inactive hidden from storefront', r.status === 404);
await api('PATCH', `/api/admin/products/${prod._id}`, { isActive: true });
r = await api('DELETE', `/api/admin/categories/${cat._id}`);
check('cannot delete category in use', r.status === 409);
r = await api('GET', '/api/admin/products/not-an-id');
check('invalid ObjectId -> 400', r.status === 400);

console.log('ADMIN ORDERS / DASHBOARD');
r = await api('GET', '/api/admin/orders?status=Pending&search=Test');
check('orders list + filter + search', r.status === 200 && r.data.orders.length > 0 && r.data.statusCounts.All > 0);
const dbOrder = r.data.orders.find((o) => o.orderNumber === order.orderNumber);
r = await api('GET', `/api/admin/orders/${dbOrder._id}`);
check('order detail', r.status === 200 && r.data.order.items.length === 1);
r = await api('PATCH', `/api/admin/orders/${dbOrder._id}/status`, { status: 'Bogus' });
check('invalid status rejected', r.status === 400);
for (const s of ['Confirmed', 'Processing', 'Shipped', 'Delivered']) {
  r = await api('PATCH', `/api/admin/orders/${dbOrder._id}/status`, { status: s });
  check(`status -> ${s}`, r.status === 200 && r.data.order.orderStatus === s);
}
check('COD marked paid on delivery', r.data.order.paymentStatus === 'Paid');
const beforeCancel = (await api('GET', `/api/products/${p.slug}`)).data.product.stock;
r = await api('PATCH', `/api/admin/orders/${dbOrder._id}/status`, { status: 'Cancelled' });
const stockRestored = (await api('GET', `/api/products/${p.slug}`)).data.product.stock;
check('cancel restores stock', stockRestored === beforeCancel + 2);
r = await api('GET', '/api/admin/dashboard');
check('dashboard stats', r.status === 200 && r.data.stats.totalOrders >= 1 && 'totalRevenue' in r.data.stats);
r = await api('GET', '/api/admin/customers');
check('customers list', r.status === 200 && r.data.customers.some((c) => c.phone === customer.phone));
r = await api('PUT', '/api/admin/settings', { deliveryCharge: 60 });
check('settings update', r.status === 200);

console.log('CLEANUP');
r = await api('DELETE', `/api/admin/products/${prod._id}`);
check('delete product', r.status === 200);
r = await api('DELETE', `/api/admin/categories/${cat._id}`);
check('delete category', r.status === 200);
r = await api('POST', '/api/admin/logout');
r = await api('GET', '/api/admin/me', null, { auth: false });
check('logout / no cookie => 401', r.status === 401);

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL CHECKS PASSED');
process.exit(failed ? 1 : 0);

