import { z } from 'zod';
import { SIZES } from '../models/Product.js';
import { DEFAULT_PAYMENT_METHOD, ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';

const trimmed = (max = 200) => z.string().trim().max(max);
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');
const bool = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean());
const num = (min = 0) => z.preprocess((v) => (v === '' || v === null || v === undefined ? undefined : Number(v)), z.number().min(min));

/* ---------- auth ---------- */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required').max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(200),
});

/* ---------- category ---------- */
export const categorySchema = z.object({
  name: trimmed(80).min(2, 'Category name is required'),
  slug: trimmed(100).optional(),
  image: trimmed(500).optional().default(''),
  description: trimmed(500).optional().default(''),
  isActive: bool.optional().default(true),
});

/* ---------- product ---------- */
const colorSchema = z.object({
  name: trimmed(40).min(1, 'Color name required'),
  hex: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Invalid hex').default('#000000'),
});

export const productSchema = z
  .object({
    name: trimmed(140).min(2, 'Product name is required'),
    slug: trimmed(160).optional(),
    sku: trimmed(40).optional().default(''),
    category: objectId,
    shortDescription: trimmed(300).optional().default(''),
    description: trimmed(5000).optional().default(''),
    sellingPrice: num(0),
    originalPrice: num(0).optional().default(0),
    stock: z.preprocess((v) => (v === '' || v == null ? 0 : Number(v)), z.number().int().min(0)),
    sizes: z.array(z.enum(SIZES)).optional().default([]),
    colors: z.array(colorSchema).optional().default([]),
    images: z.array(trimmed(600)).max(12, 'Maximum 12 images').optional().default([]),
    primaryImage: trimmed(600).optional().default(''),
    fabric: trimmed(200).optional().default(''),
    fit: trimmed(200).optional().default(''),
    washCare: trimmed(300).optional().default(''),
    isTrending: bool.optional().default(false),
    isNewArrival: bool.optional().default(false),
    isBestSeller: bool.optional().default(false),
    isActive: bool.optional().default(true),
  })
  .refine((d) => !d.originalPrice || d.originalPrice >= d.sellingPrice, {
    message: 'Original price must be greater than or equal to selling price',
    path: ['originalPrice'],
  });

export const productPatchSchema = z.object({ isActive: bool.optional(), isTrending: bool.optional(), isNewArrival: bool.optional(), isBestSeller: bool.optional() });

export const productQuerySchema = z.object({
  search: trimmed(80).optional(),
  category: trimmed(100).optional(),
  size: z.enum(SIZES).optional(),
  color: trimmed(40).optional(),
  minPrice: num(0).optional(),
  maxPrice: num(0).optional(),
  sort: z.enum(['newest', 'price-asc', 'price-desc', 'popular']).optional().default('newest'),
  flag: z.enum(['trending', 'new', 'bestseller']).optional(),
  exclude: objectId.optional(),
  page: z.preprocess((v) => Number(v) || 1, z.number().int().min(1)).default(1),
  limit: z.preprocess((v) => Number(v) || 12, z.number().int().min(1).max(60)).default(12),
});

/* ---------- order ---------- */
const phone = z.string().trim().regex(/^(\+91[\s-]?)?[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const createOrderSchema = z.object({
  customer: z.object({
    name: trimmed(80).min(2, 'Full name is required'),
    phone,
    alternatePhone: z.union([phone, z.literal('')]).optional().default(''),
    email: z.union([z.string().trim().toLowerCase().email('Enter a valid email'), z.literal('')]).optional().default(''),
  }),
  shippingAddress: z.object({
    addressLine1: trimmed(200).min(3, 'Address is required'),
    addressLine2: trimmed(200).optional().default(''),
    landmark: trimmed(120).optional().default(''),
    city: trimmed(80).min(2, 'City is required'),
    district: trimmed(80).min(2, 'District is required'),
    state: trimmed(80).min(2, 'State is required'),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  }),
  items: z
    .array(
      z.object({
        productId: objectId,
        size: trimmed(10).optional().default(''),
        color: trimmed(40).optional().default(''),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, 'Your cart is empty')
    .max(30),
  paymentMethod: z.enum(PAYMENT_METHODS).optional().default(DEFAULT_PAYMENT_METHOD), // checkout no longer sends this
});
// NOTE: prices/totals are deliberately NOT part of this schema - they are never read from the client.

export const orderStatusSchema = z.object({ status: z.enum(ORDER_STATUSES), paymentStatus: z.enum(['Pending', 'Paid', 'Failed', 'Refunded']).optional() });

export const orderQuerySchema = z.object({
  status: z.enum(['All', ...ORDER_STATUSES]).optional().default('All'),
  search: trimmed(80).optional(),
  page: z.preprocess((v) => Number(v) || 1, z.number().int().min(1)).default(1),
  limit: z.preprocess((v) => Number(v) || 15, z.number().int().min(1).max(100)).default(15),
});

/* ---------- settings ---------- */
export const settingsSchema = z.object({
  storeName: trimmed(80).optional(),
  announcement: trimmed(200).optional(),
  deliveryCharge: num(0).optional(),
  freeDeliveryAbove: num(0).optional(),
  contactEmail: z.union([z.string().trim().email(), z.literal('')]).optional(),
  contactPhone: trimmed(30).optional(),
  whatsapp: trimmed(30).optional(),
  address: trimmed(300).optional(),
  instagram: trimmed(200).optional(),
  facebook: trimmed(200).optional(),
});
