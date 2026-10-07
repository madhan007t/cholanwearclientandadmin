/**
 * Development seed: admin (from .env), settings, sample categories + sample products.
 * Sample product images are SVG placeholders in /uploads/placeholders - replace them via the admin panel.
 * Usage:  npm run seed          (idempotent: skips existing slugs)
 *         npm run seed -- --reset   (wipes categories, products and orders first)
 */
import env from "../config/env.js";
import { connectDB, disconnectDB } from "../config/db.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Settings from "../models/Settings.js";
import { ensureAdmin } from "./seedAdmin.js";
import { slugify } from "../utils/helpers.js";

const P = (name) => `/uploads/placeholders/${name}.svg`;
const reset = process.argv.includes("--reset");

const COLORS = {
  Black: "#111111",
  White: "#F7F7F5",
  Charcoal: "#3A3A3C",
  Sand: "#CBBFA8",
  Maroon: "#5A1A24",
};
const colorKey = { Black: "black", White: "white", Charcoal: "charcoal", Sand: "sand", Maroon: "maroon" };

const categories = [
  { name: "Oversized T-Shirts", description: "Drop-shoulder, heavyweight streetwear silhouettes.", image: P("category-oversized") },
  { name: "Regular T-Shirts", description: "Everyday premium essentials in a clean regular fit.", image: P("category-regular") },
  { name: "Customized T-Shirts", description: "Your idea, our print. Made to order.", image: P("category-custom") },
];

// [name, category, fit, design, primaryColor, [color names], price, original, flags, short]
const products = [
  ["Black Lion Oversized T-Shirt", "Oversized T-Shirts", "oversized", "lion", "Black", ["Black", "Charcoal"], 999, 1499, { t: 1, b: 1 }, "Heavyweight drop-shoulder tee with a gold lion emblem."],
  ["Royal Crown Oversized T-Shirt", "Oversized T-Shirts", "oversized", "crown", "Maroon", ["Maroon", "Black", "White"], 1099, 1599, { t: 1, n: 1 }, "Statement crown print on a relaxed oversized body."],
  ["Sand Geometric Oversized T-Shirt", "Oversized T-Shirts", "oversized", "geo", "Sand", ["Sand", "Black"], 949, 1299, { n: 1 }, "Minimal geometric chest graphic in soft sand."],
  ["Wear Your Identity Oversized Tee", "Oversized T-Shirts", "oversized", "bold", "White", ["White", "Black"], 1049, 1449, { b: 1, t: 1 }, "Bold typographic print. Our signature statement piece."],
  ["Plain Black Oversized T-Shirt", "Oversized T-Shirts", "oversized", "plain", "Black", ["Black", "White", "Sand"], 799, 0, { b: 1 }, "Clean everyday oversized tee with a subtle chest mark."],
  ["Classic White Regular T-Shirt", "Regular T-Shirts", "regular", "bold", "White", ["White", "Black", "Charcoal"], 599, 799, { b: 1 }, "Soft combed cotton regular fit essential."],
  ["Charcoal Lion Regular T-Shirt", "Regular T-Shirts", "regular", "lion", "Charcoal", ["Charcoal", "Black"], 699, 999, { t: 1 }, "Regular fit tee with the CHOLAN lion crest."],
  ["Black Regular Plain T-Shirt", "Regular T-Shirts", "regular", "plain", "Black", ["Black", "White"], 549, 0, { n: 1 }, "Everyday black tee with a fine gold wordmark."],
  ["Maroon Crown Regular T-Shirt", "Regular T-Shirts", "regular", "crown", "Maroon", ["Maroon", "Black"], 749, 1049, { n: 1, t: 1 }, "Rich maroon with a gold crown print."],
  ["Custom Print T-Shirt - Charcoal", "Customized T-Shirts", "regular", "custom", "Charcoal", ["Charcoal", "Black", "White"], 799, 999, { n: 1 }, "Send us your design - we print it on a premium tee."],
  ["Custom Print Oversized T-Shirt", "Customized T-Shirts", "oversized", "custom", "Black", ["Black", "White", "Sand"], 1099, 1399, { t: 1, n: 1 }, "Your artwork on our heavyweight oversized body."],
  ["Custom Name Print T-Shirt", "Customized T-Shirts", "regular", "custom", "White", ["White", "Black"], 699, 0, { b: 1 }, "Add a name or short text. Perfect for gifting."],
];

async function main() {
  await connectDB();
  if (reset) {
    await Promise.all([Product.deleteMany({}), Category.deleteMany({}), Order.deleteMany({})]);
    console.log("[seed] Cleared categories, products and orders");
  }

  await ensureAdmin();

  const settings = await Settings.getStore();
  if (!settings.contactEmail) {
    Object.assign(settings, {
      contactEmail: "cholanwearofficial@gmail.com",
      contactPhone: "+91 72008 25741",
      whatsapp: "+91 72008 25741",
      address: "CHOLAN WEAR, Tamil Nadu, India",
      instagram: "https://www.instagram.com/cholanwear?stkn=NGF1ZG5kNTcyNTRn",
    });
    await settings.save();
  }

  const catDocs = {};
  for (const c of categories) {
    const slug = slugify(c.name);
    catDocs[c.name] = (await Category.findOne({ slug })) || (await Category.create({ ...c, slug }));
  }

  let created = 0;
  for (const [i, [name, cat, fit, design, main, colorNames, price, original, flags, short]] of products.entries()) {
    const slug = slugify(name);
    if (await Product.exists({ slug })) continue;
    const base = (c) => `${fit}-${colorKey[c]}-${design}`;
    const images = [P(`${base(main)}-front`), P(`${base(main)}-back`)];
    // include additional colour views as extra gallery images
    colorNames
      .filter((c) => c !== main)
      .slice(0, 1)
      .forEach((c) => images.push(P(`${base(c)}-front`)));
    await Product.create({
      name,
      slug,
      sku: `CW-${fit === "oversized" ? "OS" : "RG"}-${String(i + 1).padStart(3, "0")}`,
      category: catDocs[cat]._id,
      shortDescription: short,
      description: `${short}\n\nCut from premium combed cotton with a soft hand-feel, reinforced neckline and durable, wash-fast prints. Designed by CHOLAN WEAR for people who wear their identity.`,
      sellingPrice: price,
      originalPrice: original,
      stock: 20 + ((i * 7) % 30),
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: colorNames.map((n) => ({ name: n, hex: COLORS[n] })),
      images,
      primaryImage: images[0],
      fabric: fit === "oversized" ? "240 GSM 100% combed cotton" : "180 GSM 100% combed cotton",
      fit: fit === "oversized" ? "Oversized / drop shoulder" : "Regular fit",
      washCare: "Machine wash cold, inside out. Do not bleach. Tumble dry low.",
      isTrending: !!flags.t,
      isNewArrival: !!flags.n,
      isBestSeller: !!flags.b,
      isActive: true,
    });
    created += 1;
  }
  console.log(`[seed] Categories: ${categories.length}, new products: ${created}`);
  await disconnectDB();
}

main().catch(async (e) => {
  console.error(e);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
