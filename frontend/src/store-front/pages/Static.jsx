import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { useSEO } from '../../hooks';
import { useSettings } from '../../store/settingsStore';
import { Field } from '../../components/ui';
import { FadeUp, ImageReveal } from '../../components/motion';

const PageHero = ({ eyebrow, title }) => (
  <section className="bg-brand-black py-16 text-center sm:py-24">
    <div className="container-page">
      <FadeUp y={12}><p className="eyebrow-dark">{eyebrow}</p></FadeUp>
      <FadeUp delay={0.08}><h1 className="mt-4 font-display text-4xl font-semibold uppercase tracking-wide !text-brand-white sm:text-6xl">{title}</h1></FadeUp>
      <FadeUp y={0} delay={0.2}><span className="gold-rule mx-auto mt-6" /></FadeUp>
    </div>
  </section>
);

export function About() {
  useSEO('About us', 'The story behind CHOLAN WEAR - premium streetwear built on identity, quality and craft.');
  return (
    <>
      <PageHero eyebrow="Our story" title="About Cholan Wear" />
      <section className="section">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <ImageReveal className="aspect-[4/5] w-full max-w-md justify-self-center"><img src="/images/cat-oversized.jpg" alt="Model in a black oversized t-shirt" loading="lazy" className="h-full w-full object-cover" /></ImageReveal>
          <FadeUp>
            <p className="eyebrow">Wear your identity</p>
            <h2 className="heading mt-3 text-3xl">Streetwear with a crest</h2>
            <span className="gold-rule mt-5" />
            <div className="mt-6 space-y-4 leading-relaxed text-ink-soft">
              <p>CHOLAN WEAR was founded on a simple belief: what you wear should say who you are. The lion at the heart of our mark stands for courage, pride and a refusal to blend in.</p>
              <p>We design oversized, regular and fully customized t-shirts using heavyweight combed cotton, careful stitching and long-lasting prints. Every piece is made to feel as good on day one hundred as it does on day one.</p>
              <p>Want something that is yours alone? Our custom printing service turns your idea into a premium tee - no minimum drama, just clean craft.</p>
            </div>
            <Link to="/shop" className="btn-dark mt-8">Shop the collection <ArrowRight className="btn-arrow h-4 w-4" /></Link>
          </FadeUp>
        </div>
      </section>
      <section className="bg-brand-black py-16">
        <div className="container-page grid gap-8 text-center sm:grid-cols-3">
          {[['Quality first', 'Premium fabric, honest construction.'], ['Made for you', 'Custom prints and fits that feel personal.'], ['Pride in craft', 'A brand built on identity, not trends.']].map(([t, d]) => (
            <div key={t}><h3 className="font-display text-xl uppercase tracking-wide !text-gold">{t}</h3><p className="mt-3 text-sm text-brand-white/70">{d}</p></div>
          ))}
        </div>
      </section>
    </>
  );
}

export function Contact() {
  useSEO('Contact us', 'Get in touch with CHOLAN WEAR for orders, custom designs and support.');
  const s = useSettings((st) => st.settings);
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '';
  const [f, setF] = useState({ name: '', message: '' });
  const [err, setErr] = useState({});

  // No backend inbox: the form opens the customer's own WhatsApp / email app pre-filled.
  const send = (via) => (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Please enter your name';
    if (f.message.trim().length < 5) x.message = 'Please write a short message';
    setErr(x);
    if (Object.keys(x).length) return;
    const text = `Hi CHOLAN WEAR, I'm ${f.name.trim()}.\n\n${f.message.trim()}`;
    if (via === 'wa') window.open(`${wa}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
    else window.location.href = `mailto:${s.contactEmail}?subject=${encodeURIComponent('Enquiry from ' + f.name.trim())}&body=${encodeURIComponent(text)}`;
  };

  const info = [
    s.contactPhone && [Phone, 'Call us', s.contactPhone, `tel:${s.contactPhone.replace(/\s/g, '')}`],
    s.contactEmail && [Mail, 'Email', s.contactEmail, `mailto:${s.contactEmail}`],
    s.address && [MapPin, 'Visit', s.address, null],
  ].filter(Boolean);

  return (
    <>
      <PageHero eyebrow="We'd love to hear from you" title="Contact us" />
      <section className="section">
        <div className="container-page grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="heading text-2xl">Get in touch</h2>
            <span className="gold-rule mt-4" />
            <p className="mt-5 max-w-md text-ink-soft">Questions about an order, sizing or a custom design? Reach out and we'll reply quickly.</p>
            <ul className="mt-8 space-y-5">
              {info.map(([Icon, l, v, href]) => (
                <li key={l} className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold text-gold-deep"><Icon className="h-5 w-5" /></span>
                  <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">{l}</p>{href ? <a href={href} className="text-ink hover:text-gold-deep">{v}</a> : <p className="text-ink">{v}</p>}</div>
                </li>
              ))}
              {info.length === 0 && <li className="text-sm text-ink-muted">Contact details will be available soon.</li>}
            </ul>
          </div>

          <form className="border border-line bg-surface-alt p-6 sm:p-8" noValidate onSubmit={send(wa ? 'wa' : 'mail')}>
            <h2 className="heading text-xl">Send a message</h2>
            <div className="mt-6 space-y-4">
              <Field label="Your name" error={err.name} htmlFor="c-name" required><input id="c-name" className={`field ${err.name ? 'field-error' : ''}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
              <Field label="Message" error={err.message} htmlFor="c-msg" required><textarea id="c-msg" rows={5} className={`field ${err.message ? 'field-error' : ''}`} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {wa && <button type="submit" className="btn-gold"><MessageCircle className="h-4 w-4" /> Send on WhatsApp</button>}
              {s.contactEmail && <button type="button" onClick={send('mail')} className="btn-outline"><Mail className="h-4 w-4" /> Send by email</button>}
            </div>
            {!wa && !s.contactEmail && <p className="mt-4 text-xs text-ink-muted">Messaging is not configured yet.</p>}
          </form>
        </div>
      </section>
    </>
  );
}

export function NotFound() {
  useSEO('Page not found');
  return (
    <div className="container-page py-24 text-center">
      <p className="font-display text-8xl text-gold">404</p>
      <h1 className="heading mt-4 text-3xl">Page not found</h1>
      <p className="mx-auto mt-3 max-w-sm text-ink-muted">The page you're looking for doesn't exist or has moved.</p>
      <Link to="/" className="btn-dark mt-8">Back to home</Link>
    </div>
  );
}
