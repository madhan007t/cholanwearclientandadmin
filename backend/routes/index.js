import { Router } from 'express';
import * as pub from '../controllers/publicController.js';
import * as admin from '../controllers/adminController.js';
import {
  requireAdmin,
  validate,
  validateObjectId,
  upload,
  loginLimiter,
  orderLimiter,
} from '../middleware/index.js';
import {
  loginSchema,
  changePasswordSchema,
  categorySchema,
  productSchema,
  productPatchSchema,
  productQuerySchema,
  createOrderSchema,
  orderStatusSchema,
  orderQuerySchema,
  settingsSchema,
} from '../utils/schemas.js';

const router = Router();

/* ---------------- public ---------------- */
router.get('/health', (_req, res) => res.json({ ok: true }));
router.get('/products', validate(productQuerySchema, 'query'), pub.getProducts);
router.get('/products/meta', pub.getProductMeta);
router.get('/products/:slug', pub.getProductBySlug);
router.get('/categories', pub.getCategories);
router.get('/settings', pub.getSettings);
router.post('/cart/quote', pub.quoteCart);
router.post('/orders', orderLimiter, validate(createOrderSchema), pub.placeOrder);

/* ---------------- admin auth ---------------- */
router.post('/admin/login', loginLimiter, validate(loginSchema), admin.login);
router.post('/admin/logout', admin.logout);

/* ---------------- admin (protected) ---------------- */
const a = Router();
a.use(requireAdmin);

a.get('/me', admin.me);
a.put('/password', validate(changePasswordSchema), admin.changePassword);
a.get('/dashboard', admin.dashboard);

a.post('/uploads', upload.array('images', 12), admin.uploadImages);

a.get('/products', admin.adminListProducts);
a.post('/products', validate(productSchema), admin.createProduct);
a.get('/products/:id', validateObjectId(), admin.adminGetProduct);
a.put('/products/:id', validateObjectId(), validate(productSchema), admin.updateProduct);
a.patch('/products/:id', validateObjectId(), validate(productPatchSchema), admin.patchProduct);
a.delete('/products/:id', validateObjectId(), admin.deleteProduct);

a.get('/categories', admin.adminListCategories);
a.post('/categories', validate(categorySchema), admin.createCategory);
a.put('/categories/:id', validateObjectId(), validate(categorySchema), admin.updateCategory);
a.delete('/categories/:id', validateObjectId(), admin.deleteCategory);

a.get('/orders', validate(orderQuerySchema, 'query'), admin.adminListOrders);
a.get('/orders/:id', validateObjectId(), admin.adminGetOrder);
a.patch('/orders/:id/status', validateObjectId(), validate(orderStatusSchema), admin.updateOrderStatus);

a.get('/customers', admin.adminListCustomers);

a.get('/settings', admin.getAdminSettings);
a.put('/settings', validate(settingsSchema), admin.updateSettings);

router.use('/admin', a);

export default router;
