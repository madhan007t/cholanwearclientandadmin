import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Instagram, Facebook } from '../../components/ui/SocialIcons';
import { useSettings } from '../../store/settingsStore';
import { StaggerContainer, StaggerItem } from '../../components/motion';

export default function Footer() {
  const s = useSettings((st) => st.settings);
  const wa = s.whatsapp ? `https://wa.me/${s.whatsapp.replace(/\D/g, '')}` : '';
  return (
    <footer className="bg-brand-black text-brand-white/70">
      <StaggerContainer className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4" stagger={0.1}>
        <StaggerItem className="lg:pr-6">
          <img src="/logo.png" alt="CHOLAN WEAR" className="h-14 w-auto" loading="lazy" />
          <p className="mt-5 text-sm leading-relaxed">Premium oversized, regular and custom t-shirts. Designed with pride, made to be worn as your identity.</p>
          <div className="mt-6 flex gap-3">
            {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-10 w-10 items-center justify-center border border-line-dark text-brand-white transition-colors hover:border-gold hover:text-gold"><Instagram className="h-4 w-4" /></a>}
            {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-10 w-10 items-center justify-center border border-line-dark text-brand-white transition-colors hover:border-gold hover:text-gold"><Facebook className="h-4 w-4" /></a>}
          </div>
        </StaggerItem>

        <StaggerItem>
          <h3 className="eyebrow-dark">Shop</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[['/shop', 'All products'], ['/category/oversized-t-shirts', 'Oversized T-Shirts'], ['/category/regular-t-shirts', 'Regular T-Shirts'], ['/category/customized-t-shirts', 'Customized T-Shirts']].map(([to, l]) => (
              <li key={to}><Link to={to} className="transition-colors hover:text-gold">{l}</Link></li>
            ))}
          </ul>
        </StaggerItem>

        <StaggerItem>
          <h3 className="eyebrow-dark">Company</h3>
          <ul className="mt-5 space-y-3 text-sm">
            <li><Link to="/about" className="transition-colors hover:text-gold">About us</Link></li>
            <li><Link to="/contact" className="transition-colors hover:text-gold">Contact</Link></li>
            <li><Link to="/cart" className="transition-colors hover:text-gold">Your cart</Link></li>
          </ul>
        </StaggerItem>

        <StaggerItem>
          <h3 className="eyebrow-dark">Get in touch</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {s.contactPhone && <li className="flex gap-3"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={`tel:${s.contactPhone.replace(/\s/g, '')}`} className="hover:text-gold">{s.contactPhone}</a></li>}
            {s.contactEmail && <li className="flex gap-3"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><a href={`mailto:${s.contactEmail}`} className="break-all hover:text-gold">{s.contactEmail}</a></li>}
            {s.address && <li className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" /><span>{s.address}</span></li>}
            {wa && <li><a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline-light btn-sm mt-2">Chat on WhatsApp</a></li>}
          </ul>
        </StaggerItem>
      </StaggerContainer>
      <div className="border-t border-line-dark">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-6 text-xs sm:flex-row">
          <p>© {new Date().getFullYear()} CHOLAN WEAR. All rights reserved.</p>
          <p className="tracking-[0.2em] text-gold">WEAR YOUR IDENTITY</p>
        </div>
      </div>
    </footer>
  );
}

