import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Gem, Palette, Shirt, ShieldCheck } from "lucide-react";
import { useAsync, useSEO } from "../../hooks";
import { shopService } from "../../services/shopService";
import { useSettings } from "../../store/settingsStore";
import { siteImages } from "../../config/siteImages";
import { assetUrl } from "../../utils/format";
import { Instagram } from "../../components/ui/SocialIcons";
import { SectionHeading, Skeleton } from "../../components/ui";
import { EASE, FadeUp, ImageReveal, ParallaxBg, StaggerContainer, StaggerItem } from "../../components/motion";
import ProductSection from "../components/ProductGrid";

/* ------------------------------------------------------------------ hero */
function Hero() {
  const [loaded, setLoaded] = useState(false);

  // The photo is a CSS background, so preload it off-DOM: start the entrance once it has loaded
  // (or after a short fallback) so it never pops in late.
  useEffect(() => {
    const img = new Image();
    img.onload = () => setLoaded(true);
    img.onerror = () => setLoaded(true);
    img.src = siteImages.hero.src;
    const t = setTimeout(() => setLoaded(true), 1500);
    return () => {
      clearTimeout(t);
      img.onload = null;
      img.onerror = null;
    };
  }, []);

  // Responsive focal point, driven by CSS variables so no JS is needed on resize.
  const pos = siteImages.hero.position;
  const bgVars = { "--hero-pos": pos.mobile, "--hero-pos-md": pos.tablet, "--hero-pos-lg": pos.desktop };

  const rise = (delay) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, ease: EASE, delay } });
  const line = (delay) => ({ initial: { y: "110%" }, animate: { y: 0 }, transition: { duration: 0.95, ease: EASE, delay } });

  return (
    <section className="relative isolate h-[78svh] min-h-[540px] max-h-[900px] overflow-hidden bg-brand-black md:h-[88svh] md:min-h-[600px] md:max-h-[1000px]" aria-label="CHOLAN WEAR">
      <ParallaxBg parallax={false}>
        <motion.div className="hero-bg h-full w-full bg-cover bg-no-repeat" style={{ backgroundImage: `url(${siteImages.hero.src})`, ...bgVars }} initial={{ opacity: 0, scale: 1.04 }} animate={loaded ? { opacity: 1, scale: 1 } : undefined} transition={{ duration: 1.8, ease: EASE }} role="img" aria-label="Model in a black oversized t-shirt standing against a concrete wall" />
      </ParallaxBg>

      {/* Light overlays only for text legibility - the photograph stays clearly visible. */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-black/65 via-brand-black/5 to-transparent max-md:from-brand-black/85 max-md:via-brand-black/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-black/55 via-brand-black/15 to-transparent md:from-brand-black/60 md:via-brand-black/10 md:to-transparent" />

      <div className="container-page relative z-10 flex h-full items-end pb-12 sm:pb-16 lg:pb-24">
        <div className="max-w-xl">
          <motion.p {...rise(0.6)} className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-brand-white">
            <span className="h-px w-8 bg-gold" aria-hidden="true" /> CHOLAN WEAR
          </motion.p>

          <h1 className="mt-4 font-display text-[2.4rem] font-semibold uppercase leading-[1.02] min-[380px]:text-[2.75rem] tracking-wide !text-brand-white sm:text-6xl lg:text-[5.5rem]">
            <span className="block overflow-hidden pb-1">
              <motion.span className="block" {...line(0.85)}>
                Own your
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-1">
              <motion.span className="block text-gold" {...line(1.0)}>
                Style.
              </motion.span>
            </span>
          </h1>

          <motion.p {...rise(1.3)} className="mt-5 max-w-sm text-sm leading-relaxed text-brand-white/85 sm:text-base">
            Premium streetwear made for those who stand apart.
          </motion.p>

          <motion.div {...rise(1.5)} className="mt-8">
            <Link to="/shop" className="btn-gold px-9 py-4">
              Shop collection <ArrowRight className="btn-arrow h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ categories */
function Categories() {
  const { data, loading } = useAsync(() => shopService.categories(), []);
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="Collections" title="Shop by category" subtitle="Three ways to wear it." link="/shop" />
        {loading && (
          <div className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="aspect-[5/4] sm:aspect-[3/4]" />
            ))}
          </div>
        )}
        {data && (
          <StaggerContainer className="grid gap-4 sm:grid-cols-3 sm:gap-6" stagger={0.14}>
            {data.slice(0, 3).map((c) => (
              <StaggerItem key={c._id}>
                <Link to={`/category/${c.slug}`} className="group relative block aspect-[5/4] overflow-hidden bg-surface-alt sm:aspect-[3/4]">
                  <ImageReveal className="absolute inset-0">
                    <img src={siteImages.categories[c.slug] || assetUrl(c.image)} alt={c.name} loading="lazy" decoding="async" className="h-full w-full object-cover object-top transition-transform duration-[1400ms] ease-out will-change-transform group-hover:scale-110" />
                  </ImageReveal>
                  <div className="absolute inset-0 bg-brand-black/20 transition-colors duration-700 group-hover:bg-brand-black/55" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-black/85 to-transparent p-5 pt-24 sm:p-7 sm:pt-32">
                    <h3 className="translate-y-2 font-display text-xl font-semibold uppercase tracking-wide !text-brand-white transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:text-2xl">{c.name}</h3>
                    <p className="mt-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                      Explore collection <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-out group-hover:translate-x-2" />
                    </p>
                  </div>
                </Link>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- brand story banner */
function StoryBanner() {
  return (
    <section className="relative isolate flex min-h-[72svh] items-center overflow-hidden bg-brand-black" aria-label="Brand story">
      <ParallaxBg distance={6}>
        <img src={siteImages.story.src} alt={siteImages.story.alt} loading="lazy" decoding="async" className="h-full w-full object-cover object-[78%_center]" />
      </ParallaxBg>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-brand-black/80 via-brand-black/35 to-brand-black/10" />
      <div className="container-page relative z-10 py-20 sm:py-28">
        <div className="max-w-lg">
          <FadeUp y={14}>
            <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.34em] text-brand-white">
              <span className="h-px w-8 bg-gold" aria-hidden="true" /> CHOLAN WEAR
            </p>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h2 className="mt-4 font-display text-4xl font-semibold uppercase leading-[1.05] tracking-wide !text-brand-white sm:text-6xl">
              Wear your
              <br />
              <span className="text-gold">identity.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.25}>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-white/85 sm:text-base">Designed for those who don't follow the crowd.</p>
          </FadeUp>
          <FadeUp delay={0.4}>
            <Link to="/about" className="btn-gold mt-8 px-9 py-4">
              Discover Cholan <ArrowRight className="btn-arrow h-4 w-4" />
            </Link>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------- why */
const WHY = [
  { icon: Gem, title: "Premium quality", text: "Heavyweight combed cotton with reinforced stitching that lasts wash after wash." },
  { icon: Palette, title: "Custom designs", text: "Bring your own artwork or name - printed with fade-resistant, soft-feel inks." },
  { icon: Shirt, title: "Comfortable fabric", text: "Breathable, skin-friendly fabric with a fit refined for everyday wear." },
  { icon: ShieldCheck, title: "Secure ordering", text: "Order without an account. Pay cash on delivery once your parcel arrives." },
];

function Why() {
  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading eyebrow="The difference" title="Why choose Cholan Wear" />
        <StaggerContainer className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
          {WHY.map(({ icon: Icon, title, text }) => (
            <StaggerItem key={title} className="group bg-surface p-8 transition-colors duration-500 hover:bg-brand-black">
              <Icon className="h-8 w-8 text-gold-deep transition-colors duration-500 group-hover:text-gold" strokeWidth={1.3} />
              <h3 className="mt-6 font-display text-lg uppercase tracking-wide transition-colors duration-500 group-hover:text-brand-white">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted transition-colors duration-500 group-hover:text-brand-white/70">{text}</p>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- gallery */
function Gallery() {
  const ig = useSettings((s) => s.settings.instagram);
  return (
    <section className="section bg-surface-alt">
      <div className="container-page">
        <SectionHeading eyebrow="@cholanwear" title="Styled by the community" />
        <StaggerContainer className="grid grid-cols-3 gap-1.5 sm:gap-3 lg:grid-cols-6" stagger={0.07}>
          {siteImages.gallery.map((src, i) => (
            <StaggerItem key={src + i}>
              <a href={ig || "/shop"} {...(ig ? { target: "_blank", rel: "noopener noreferrer" } : {})} className="group relative block aspect-square overflow-hidden bg-surface" aria-label="View CHOLAN WEAR on Instagram">
                <img src={src} alt="CHOLAN WEAR style" loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110" />
                <span className="absolute inset-0 flex items-center justify-center bg-brand-black/55 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                  <Instagram className="h-6 w-6 text-gold" />
                </span>
              </a>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}

export default function Home() {
  useSEO("", "CHOLAN WEAR - premium oversized, regular and customized t-shirts. Shop trending streetwear with cash on delivery across India.");
  return (
    <>
      <Hero />
      <Categories />
      <ProductSection eyebrow="Right now" title="Trending now" subtitle="Pieces everyone is talking about." params={{ flag: "trending", sort: "popular" }} link="/shop?sort=popular" tone="alt" />
      <ProductSection eyebrow="Just dropped" title="New arrivals" subtitle="Fresh from the studio." params={{ flag: "new" }} link="/shop?sort=newest" tone="dark" />
      <ProductSection eyebrow="Customer favourites" title="Best sellers" subtitle="The ones people come back for." params={{ flag: "bestseller", sort: "popular" }} link="/shop?sort=popular" />
      <StoryBanner />
      <Why />
      <Gallery />
    </>
  );
}
