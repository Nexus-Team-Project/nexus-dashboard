/**
 * BenefitsCatalogTeaser — full-viewport takeover shown when Benefits Catalog is inactive.
 *
 * Uses position:fixed inset:0 z-index:100 so the warm background covers the
 * entire screen including the dashboard sidebar and header — no white showing.
 *
 * Cards show the brand NAME as large bold text (always crisp) plus the PNG logo
 * at unconstrained width (height:40px width:auto) for maximum visual size.
 *
 * Mobile: CSS-keyframe infinite auto-scroll carousel.
 * Desktop: fan spread with float + tilt-on-hover.
 */
import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  onActivate: () => void;
  isActivating?: boolean;
}

const BG = '#faf7f2';
const BG_TOP = '#e8dccb';

// ─── Brand data ───────────────────────────────────────────────────────────────

const CARDS = [
  { logo: '/brands/samsung.png',      name: 'SAMSUNG',      offerEn: '20% off',    offerHe: '20% הנחה',  subEn: 'on selected products', subHe: 'על מוצרים נבחרים', bg: '#111',    light: false, rotate: -11, delay: '0s',   dur: '3.4s' },
  { logo: '/brands/mango.png',        name: 'MANGO',        offerEn: '20% off',    offerHe: '20% הנחה',  subEn: 'on new items',         subHe: 'על פריטים חדשים',  bg: '#ede8df', light: true,  rotate: -5,  delay: '0.5s', dur: '4.0s' },
  { logo: '/brands/carrefour.png',    name: 'Carrefour',    offerEn: '5% cashback',offerHe: '5% קאשבק',  subEn: 'on all purchases',     subHe: 'על כל קנייה',      bg: '#faf6ee', light: true,  rotate: -1,  delay: '1.0s', dur: '3.7s' },
  { logo: '/brands/foot-locker.png',  name: 'FOOT LOCKER',  offerEn: '10% off',    offerHe: '10% הנחה',  subEn: 'on full price items',  subHe: 'על מחיר מלא',     bg: '#1a1a1a', light: false, rotate: 3,   delay: '0.3s', dur: '3.5s' },
  { logo: '/brands/yves-rocher.png',  name: 'YVES ROCHER',  offerEn: '1+1',        offerHe: '1+1',       subEn: 'on selected items',    subHe: 'על מוצרים נבחרים', bg: '#3d5028', light: false, rotate: 7,   delay: '0.8s', dur: '4.2s' },
  { logo: '/brands/golf.png',         name: 'GOLF',         offerEn: '15% off',    offerHe: '15% הנחה',  subEn: 'on apparel',           subHe: 'על ביגוד',         bg: '#1b3254', light: false, rotate: 12,  delay: '0.2s', dur: '3.9s' },
  { logo: '/brands/rami-levy.png',    name: 'Rami Levy',    offerEn: '1+1',        offerHe: '1+1',       subEn: 'hundreds of items',    subHe: 'מאות פריטים',     bg: '#c0141e', light: false, rotate: 17,  delay: '1.2s', dur: '3.3s' },
] as const;

// ─── Shared card inner content ────────────────────────────────────────────────

/**
 * The card face — used in both desktop fan and mobile carousel.
 * Brand name rendered as large text (always crisp) + logo image unconstrained.
 */
const CardFace = ({ card, isHe, shadow }: {
  card: typeof CARDS[number]; isHe: boolean;
  shadow?: string;
}) => {
  const tc      = card.light ? '#111' : '#fff';
  const muted   = card.light ? 'rgba(0,0,0,0.42)' : 'rgba(255,255,255,0.5)';
  const logoF   = card.light ? 'none' : 'brightness(0) invert(1)';
  const tearC   = card.light ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.16)';

  return (
    <div style={{
      width: 204, height: 128, borderRadius: 14,
      background: card.bg,
      boxShadow: shadow ?? '0 10px 28px rgba(0,0,0,0.2), 0 3px 8px rgba(0,0,0,0.1)',
      position: 'relative', overflow: 'hidden',
      padding: '12px 30px 12px 14px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxSizing: 'border-box', flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Paper grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.45,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`,
      }} aria-hidden="true"/>
      {/* Dashed tear line */}
      <div style={{ position: 'absolute', right: 20, top: 8, bottom: 8, borderLeft: `1.5px dashed ${tearC}` }} aria-hidden="true"/>
      {/* Punch hole */}
      <div style={{
        position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)',
        width: 18, height: 18, borderRadius: '50%',
        background: BG, boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.28)',
      }} aria-hidden="true"/>

      {/* ── Top: brand identity ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Brand name — large, always readable */}
        <span style={{
          fontSize: 13, fontWeight: 800, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: tc, lineHeight: 1,
        }}>
          {card.name}
        </span>
        {/* Logo image — height:40px, width unconstrained, no objectFit needed */}
        <img
          src={card.logo}
          alt=""
          aria-hidden="true"
          style={{
            height: 28,
            width: 'auto',
            maxWidth: 130,
            display: 'block',
            filter: logoF,
            opacity: 0.85,
          }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>

      {/* ── Bottom: offer value ── */}
      <div>
        <div style={{
          fontSize: 28, fontWeight: 900, lineHeight: 1,
          letterSpacing: '-0.03em', color: tc,
        }}>
          {isHe ? card.offerHe : card.offerEn}
        </div>
        <div style={{ fontSize: 10, marginTop: 3, color: muted, lineHeight: 1.3 }}>
          {isHe ? card.subHe : card.subEn}
        </div>
      </div>
    </div>
  );
};

// ─── Desktop fan card ─────────────────────────────────────────────────────────

const FanCard = ({ card, idx, isHe, hovered, onEnter, onLeave }: {
  card: typeof CARDS[number]; idx: number; isHe: boolean;
  hovered: boolean; onEnter: () => void; onLeave: () => void;
}) => (
  <div
    onMouseEnter={onEnter}
    onMouseLeave={onLeave}
    style={{
      position: 'relative', flexShrink: 0,
      zIndex: hovered ? 20 : idx + 1,
      marginInlineStart: idx === 0 ? 0 : -38,
      transform: hovered
        ? 'rotate(0deg) translateY(-18px) scale(1.08)'
        : `rotate(${card.rotate}deg) translateY(0px) scale(1)`,
      transition: 'transform 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      cursor: 'pointer',
    }}
  >
    <div style={{
      animation: hovered ? 'none' : `nxs-float ${card.dur} ease-in-out ${card.delay} infinite`,
    }}>
      <CardFace
        card={card} isHe={isHe}
        shadow={hovered
          ? '0 28px 56px rgba(0,0,0,0.32), 0 6px 16px rgba(0,0,0,0.16)'
          : '0 10px 28px rgba(0,0,0,0.22), 0 3px 8px rgba(0,0,0,0.1)'}
      />
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────

const BenefitsCatalogTeaser = ({ onActivate, isActivating = false }: Props) => {
  const { language } = useLanguage();
  const isHe = language === 'he';
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    /* Start at top:48px so the teaser never physically overlaps the sticky navbar */
    <div
      dir={isHe ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed', top: 48, left: 0, right: 0, bottom: 0,
        zIndex: 49, overflowY: 'auto',
        background: `radial-gradient(ellipse 160% 50% at 50% 0%, ${BG_TOP} 0%, ${BG} 60%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '28px 24px 48px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
        textAlign: 'center', boxSizing: 'border-box',
      }}
    >
      <style>{`
        @keyframes nxs-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
        @keyframes nxs-carousel { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes nxs-spin     { to{transform:rotate(360deg)} }
        .nxs-fan   { display:flex; }
        .nxs-mob   { display:none; }
        @media(max-width:700px){
          .nxs-fan { display:none; }
          .nxs-mob { display:block; }
        }
        .nxs-track {
          display:flex; gap:14px; width:max-content;
          animation:nxs-carousel 26s linear infinite;
        }
        .nxs-track:hover { animation-play-state:paused; }
      `}</style>

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <h1 style={{
        fontSize: 'clamp(2rem, 4.5vw, 3.8rem)',
        fontWeight: 900, lineHeight: 1.06,
        letterSpacing: '-0.03em', color: '#1a1818',
        margin: '0 0 14px', maxWidth: 700,
      }}>
        {isHe ? (
          <>
            תנו לאנשים שלכם הטבות אמיתיות<br />
            ממותגים שהם{' '}
            <span style={{ color: '#f97316', position: 'relative', display: 'inline-block' }}>
              ממש אוהבים.
              <svg viewBox="0 0 200 10" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: -3, left: 0, width: '100%', height: 7 }}
                aria-hidden="true">
                <path d="M3 7 Q100 1 197 7" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </>
        ) : (
          <>
            Give your people real perks<br />
            from brands they{' '}
            <span style={{ color: '#f97316', position: 'relative', display: 'inline-block' }}>
              actually use.
              <svg viewBox="0 0 200 10" preserveAspectRatio="none"
                style={{ position: 'absolute', bottom: -3, left: 0, width: '100%', height: 7 }}
                aria-hidden="true">
                <path d="M3 7 Q100 1 197 7" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round"/>
              </svg>
            </span>
          </>
        )}
      </h1>

      <p style={{ fontSize: 15, color: '#888', maxWidth: 460, lineHeight: 1.65, margin: '0 0 36px' }}>
        {isHe
          ? 'הפעל את קטלוג ההטבות ואפשר לאנשי הארגון לגלות הצעות שיעניינו אותם באמת.'
          : "Activate the Benefits Catalog and let employees discover offers they'll actually care about."}
      </p>

      {/* ── Desktop fan ────────────────────────────────────────────────── */}
      <div className="nxs-fan" role="list" aria-label={isHe ? 'הטבות לדוגמה' : 'Sample offers'}
        style={{ alignItems: 'flex-end', justifyContent: 'center', marginBottom: 40, paddingBottom: 14 }}>
        {CARDS.map((card, idx) => (
          <div key={card.name} role="listitem">
            <FanCard card={card} idx={idx} isHe={isHe}
              hovered={hoveredIdx === idx}
              onEnter={() => setHoveredIdx(idx)}
              onLeave={() => setHoveredIdx(null)}
            />
          </div>
        ))}
      </div>

      {/* ── Mobile infinite carousel ────────────────────────────────────── */}
      <div className="nxs-mob" role="region" aria-label={isHe ? 'הטבות לדוגמה' : 'Sample offers'}
        style={{ width: '100vw', overflow: 'hidden', marginBottom: 32, position: 'relative' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: `linear-gradient(to right, ${BG} 0%, transparent 14%, transparent 86%, ${BG} 100%)`,
        }} aria-hidden="true"/>
        <div className="nxs-track" style={{ padding: '12px 0' }}>
          {[...CARDS, ...CARDS].map((card, i) => (
            <CardFace key={i} card={card} isHe={isHe}/>
          ))}
        </div>
      </div>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <button
        type="button" onClick={onActivate} disabled={isActivating}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          background: isActivating ? '#f9a86b' : '#f97316',
          color: '#fff', border: 'none', padding: '15px 38px', borderRadius: 50,
          fontSize: 15, fontWeight: 700, cursor: isActivating ? 'not-allowed' : 'pointer',
          boxShadow: '0 8px 28px rgba(249,115,22,0.38)',
          fontFamily: 'inherit', letterSpacing: '-0.01em',
          marginBottom: 24, transition: 'opacity 0.15s ease',
        }}
        onMouseEnter={e => { if (!isActivating)(e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        {isActivating ? (
          <>
            <svg style={{ animation: 'nxs-spin 0.8s linear infinite' }} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3"/>
              <path d="M12 2a10 10 0 0110 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            {isHe ? 'מפעיל...' : 'Activating...'}
          </>
        ) : (
          <>
            {isHe ? 'הפעל את השירות' : 'Activate the service'}
            <svg width="14" height="14" viewBox="0 0 16 16" fill="white" aria-hidden="true">
              <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z"/>
            </svg>
          </>
        )}
      </button>

      {/* ── Trust indicators ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {(isHe
          ? ['הפעלה מיידית', 'ביטול בכל עת', 'תמיכה מלאה']
          : ['Instant activation', 'Cancel anytime', 'Full support']
        ).map((label, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#b0a898' }}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="#b0a898" aria-hidden="true">
              {i === 0 && <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd"/>}
              {i === 1 && <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd"/>}
              {i === 2 && <path fillRule="evenodd" d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm8-3.75a.75.75 0 01.75.75v3.25h2.5a.75.75 0 010 1.5h-3.25A.75.75 0 019 11V7a.75.75 0 01.75-.75H10z" clipRule="evenodd"/>}
            </svg>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BenefitsCatalogTeaser;
