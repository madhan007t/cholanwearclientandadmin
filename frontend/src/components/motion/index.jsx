import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';

/**
 * Reusable animation primitives for the storefront.
 * - Only `transform` and `opacity` are animated (no layout properties) -> no layout shift.
 * - Scroll animations run once when the element enters the viewport.
 * - <MotionConfig reducedMotion="user"> in App.jsx strips transforms for users who prefer reduced motion.
 */
export const EASE = [0.22, 1, 0.36, 1];
const VIEWPORT = { once: true, amount: 0.15, margin: '0px 0px -50px 0px' };

/* ---------- variants ---------- */
export const fadeUpVariants = (y = 25, delay = 0, duration = 0.7) => ({
  hidden: { opacity: 0, y },
  visible: { opacity: 1, y: 0, transition: { duration, ease: EASE, delay } },
});
export const fadeInVariants = (delay = 0, duration = 0.6) => ({
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration, ease: 'easeOut', delay } },
});
export const staggerVariants = (stagger = 0.08, delayChildren = 0) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren } },
});

/* ---------- scroll-triggered components ---------- */
export function FadeUp({ children, y = 25, delay = 0, duration = 0.7, as = 'div', className, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeUpVariants(y, delay, duration)} {...rest}>
      {children}
    </Tag>
  );
}

export function FadeIn({ children, delay = 0, duration = 0.6, as = 'div', className, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} initial="hidden" whileInView="visible" viewport={VIEWPORT} variants={fadeInVariants(delay, duration)} {...rest}>
      {children}
    </Tag>
  );
}

/** Text/heading reveal: slides up from behind a mask. */
export function Reveal({ children, delay = 0, as = 'div', className = '', inline = false }) {
  const Tag = motion[as];
  // The IntersectionObserver must watch the STATIONARY clipping wrapper - the child starts translated
  // outside it, so it would never count as "in view" on its own.
  return (
    <motion.span className={`${inline ? 'inline-block' : 'block'} overflow-hidden ${className}`} initial="hidden" whileInView="visible" viewport={VIEWPORT}>
      <Tag
        className="block"
        variants={{ hidden: { y: '110%' }, visible: { y: 0, transition: { duration: 0.8, ease: EASE, delay } } }}
      >
        {children}
      </Tag>
    </motion.span>
  );
}

export function StaggerContainer({ children, stagger = 0.08, delayChildren = 0, className, as = 'div', amount = 0.08, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} initial="hidden" whileInView="visible" viewport={{ ...VIEWPORT, amount }} variants={staggerVariants(stagger, delayChildren)} {...rest}>
      {children}
    </Tag>
  );
}

export function StaggerItem({ children, y = 28, className, as = 'div', ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={fadeUpVariants(y, 0, 0.65)} {...rest}>
      {children}
    </Tag>
  );
}

/** Image that fades in while settling from a slight zoom. Wrapper clips the overflow. */
export function ImageReveal({ children, className = '', from = 1.12, duration = 1.1 }) {
  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="h-full w-full"
        initial={{ scale: from, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={VIEWPORT}
        transition={{ duration, ease: EASE }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/* ---------- parallax ---------- */
/** True only on larger, hover-capable devices (skip the effect on phones / low-power touch devices). */
function useParallaxEnabled() {
  const reduce = useReducedMotion();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px) and (hover: hover)');
    const on = () => setOk(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return ok && !reduce;
}

/**
 * Wraps a background image. The layer is 16% taller than its container and drifts slower than the page
 * as it scrolls (very subtle). Place inside a `relative overflow-hidden` section.
 */
export function ParallaxBg({ children, distance = 6, offset = ['start end', 'end start'], parallax = true, className = '' }) {
  const ref = useRef(null);
  const allowed = useParallaxEnabled();
  const enabled = allowed && parallax;
  const { scrollYProgress } = useScroll({ target: ref, offset });
  const y = useTransform(scrollYProgress, [0, 1], [`-${distance}%`, `${distance}%`]);
  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* parallax={false}: static layer exactly the size of the section (no cropping of the photo's top) */}
      <motion.div style={enabled ? { y } : undefined} className={`absolute inset-x-0 will-change-transform ${parallax ? '-inset-y-[8%]' : 'inset-y-0'} ${className}`}>
        {children}
      </motion.div>
    </div>
  );
}

/** Route-level enter transition (no exit animation, so navigation is never delayed). */
export function PageTransition({ children, routeKey, lift = true }) {
  return (
    <motion.div key={routeKey} initial={{ opacity: 0, y: lift ? 12 : 0 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
      {children}
    </motion.div>
  );
}
