/**
 * MemberCatalogBackdrop - immersive backdrop for the /member-catalog page.
 *
 * Layers (bottom -> top):
 *  1. White base.
 *  2. Faint architectural grid (radial-masked at the edges).
 *  3. Constellation: gold connector lines linking nearby particles.
 *  4. Geometric particles (cubes, stars, diamonds, dots, rings) clustered
 *     into three zones with a slow gold shimmer animation.
 *
 * Pure presentation - no props, no interaction. The component renders an
 * absolute layer that fills its `relative` parent; siblings should bump
 * their z-index above 0 so they read on top.
 */

// ─── Static particle data ─────────────────────────────────────────────────────

/**
 * One backdrop particle. Position uses percentage coordinates so the
 * layout adapts to any viewport width.
 */
interface Particle {
  /** Horizontal position (0-100, percent). */
  x: number;
  /** Vertical position (0-100, percent). */
  y: number;
  /** Glyph rendered for this particle. */
  shape: 'star4' | 'star6' | 'cube' | 'diamond' | 'dot' | 'ring';
  /** Colour family - all-gold for a luxurious feel, with cool accents. */
  tone: 'gold' | 'goldDark' | 'silver';
  /** Glyph size in pixels. */
  size: number;
  /** Shimmer cycle duration in seconds. */
  duration: number;
  /** Shimmer animation delay. */
  delay: number;
  /** When true, particle hides on small viewports (<sm). Used for any
   *  particle that sits inside the mobile single-column content band, where
   *  the layout occupies the full width and decorations would collide with
   *  the title / search / cards. Default: false (always visible). */
  desktopOnly?: boolean;
}

/**
 * Three named clusters frame the page (Zone A header, Zone B mid-right,
 * Zone C bottom corners) plus a light scatter through the middle so the
 * eye reads them as a single constellation.
 */
const PARTICLES: Particle[] = [
  // Zone A - header / top-start
  { x: 6,  y: 6,  shape: 'cube',    tone: 'gold',     size: 34, duration: 6.5, delay: 0.0 },
  { x: 14, y: 14, shape: 'star4',   tone: 'gold',     size: 22, duration: 4.5, delay: 0.4 },
  { x: 3,  y: 20, shape: 'dot',     tone: 'gold',     size: 7,  duration: 5.5, delay: 0.8 },
  { x: 18, y: 4,  shape: 'star6',   tone: 'goldDark', size: 18, duration: 7.0, delay: 1.4, desktopOnly: true },
  { x: 10, y: 24, shape: 'diamond', tone: 'gold',     size: 14, duration: 6.0, delay: 0.2 },
  { x: 22, y: 18, shape: 'dot',     tone: 'goldDark', size: 6,  duration: 5.0, delay: 1.1, desktopOnly: true },
  { x: 2,  y: 32, shape: 'ring',    tone: 'gold',     size: 22, duration: 8.0, delay: 0.6 },
  { x: 28, y: 26, shape: 'star4',   tone: 'silver',   size: 12, duration: 5.6, delay: 1.0, desktopOnly: true },

  // Zone B - mid / end-side, bridging search and cards
  { x: 88, y: 22, shape: 'cube',    tone: 'gold',     size: 30, duration: 6.2, delay: 0.3 },
  { x: 94, y: 32, shape: 'star4',   tone: 'gold',     size: 22, duration: 4.8, delay: 0.9 },
  { x: 82, y: 38, shape: 'dot',     tone: 'gold',     size: 7,  duration: 5.5, delay: 1.2, desktopOnly: true },
  { x: 96, y: 46, shape: 'diamond', tone: 'goldDark', size: 16, duration: 7.0, delay: 0.0 },
  { x: 90, y: 52, shape: 'star6',   tone: 'gold',     size: 18, duration: 6.0, delay: 1.6 },
  { x: 86, y: 14, shape: 'ring',    tone: 'gold',     size: 18, duration: 8.5, delay: 0.5 },
  { x: 78, y: 28, shape: 'dot',     tone: 'silver',   size: 5,  duration: 5.4, delay: 0.7, desktopOnly: true },

  // Zone C - bottom corners
  { x: 4,  y: 86, shape: 'cube',    tone: 'gold',     size: 28, duration: 6.8, delay: 0.6 },
  { x: 12, y: 94, shape: 'star4',   tone: 'gold',     size: 18, duration: 4.6, delay: 0.2 },
  { x: 2,  y: 78, shape: 'dot',     tone: 'goldDark', size: 6,  duration: 5.4, delay: 1.0 },
  { x: 18, y: 88, shape: 'diamond', tone: 'gold',     size: 12, duration: 6.5, delay: 1.3, desktopOnly: true },
  { x: 92, y: 92, shape: 'cube',    tone: 'gold',     size: 26, duration: 6.5, delay: 0.0 },
  { x: 86, y: 80, shape: 'star6',   tone: 'gold',     size: 16, duration: 5.2, delay: 1.3 },
  { x: 96, y: 84, shape: 'diamond', tone: 'goldDark', size: 12, duration: 7.2, delay: 0.4 },

  // Light scatter so the constellation feels continuous. These all sit
  // inside the mobile content band (x ~ 30-65%) so they are desktop-only.
  { x: 52, y: 36, shape: 'dot',     tone: 'gold',     size: 5,  duration: 5.0, delay: 0.7, desktopOnly: true },
  { x: 64, y: 60, shape: 'dot',     tone: 'gold',     size: 6,  duration: 5.0, delay: 1.5, desktopOnly: true },
  { x: 36, y: 72, shape: 'star4',   tone: 'gold',     size: 14, duration: 5.8, delay: 0.9, desktopOnly: true },
];

// ─── Constellation graph ──────────────────────────────────────────────────────

/**
 * Pairs of particle indices to connect with a faint gold line. Picked by
 * hand so the lines feel composed rather than triangulated.
 */
const CONNECTIONS: readonly [number, number][] = [
  // Zone A connections (left of header)
  [0, 1], [1, 4], [1, 5], [4, 6], [1, 3], [5, 2], [0, 6],
  // Zone B connections (mid-right of header)
  [8, 9], [9, 11], [10, 12], [13, 8], [9, 12], [14, 10], [13, 14],
  // Zone C connections (bottom)
  [15, 16], [15, 17], [16, 18], [19, 20], [20, 21], [21, 19],
  // Bridges across zones via scatter particles. None enter the title
  // safe-zone (top-centre band y < 16% & 22% < x < 78%).
  [22, 13], [11, 23], [23, 19], [6, 24], [24, 18], [24, 23],
];

// ─── Colour helpers ───────────────────────────────────────────────────────────

/** Stroke + fill colours per tone. Gold-forward for a luxurious feel. */
const TONE = {
  gold:     { stroke: '#C9A24B', fill: '#E8C781', strokeW: 1.4 },
  goldDark: { stroke: '#A87A30', fill: '#D6A85B', strokeW: 1.4 },
  silver:   { stroke: '#A6B0BD', fill: '#D2D8E1', strokeW: 1.2 },
} as const;

// ─── Glyphs ───────────────────────────────────────────────────────────────────

/**
 * Renders one particle glyph. Wireframes (cube, ring, star6) use stroke;
 * solids (dot, star4, diamond) use fill. Sizes are intentionally larger
 * than the previous draft so the constellation reads at a glance.
 */
function Glyph({ shape, tone, size }: Pick<Particle, 'shape' | 'tone' | 'size'>) {
  const c = TONE[tone];
  switch (shape) {
    case 'cube':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth={c.strokeW} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M12 3 3 8v8l9 5 9-5V8l-9-5z" />
          <path d="M3 8l9 5 9-5" />
          <path d="M12 13v8" />
        </svg>
      );
    case 'star4':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={c.fill} stroke={c.stroke} strokeWidth={0.6} aria-hidden>
          <path d="M12 1 13.6 9.6 22 12l-8.4 2.4L12 23l-1.6-8.6L2 12l8.4-2.4L12 1z" />
        </svg>
      );
    case 'star6':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth={c.strokeW} strokeLinecap="round" aria-hidden>
          <path d="M12 2v20M3.34 7l17.32 10M3.34 17 20.66 7" />
        </svg>
      );
    case 'diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill={c.fill} stroke={c.stroke} strokeWidth={0.6} aria-hidden>
          <path d="M12 2l10 10-10 10L2 12z" />
        </svg>
      );
    case 'dot':
      return (
        <svg width={size} height={size} viewBox="0 0 10 10" fill={c.fill} aria-hidden>
          <circle cx="5" cy="5" r="5" />
        </svg>
      );
    case 'ring':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={c.stroke} strokeWidth={c.strokeW} aria-hidden>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Renders the full backdrop layer.
 * Place inside a `relative` wrapper at the top of the page so it sits
 * behind subsequent siblings (which should use a higher z-index).
 */
const MemberCatalogBackdrop = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden bg-white">
      {/* 3D perspective floor grid - two stacked planes rotated in 3D space
          so the lines fan toward a vanishing point in the centre. This
          replaces the flat orthogonal grid that read as a math notebook. */}
      <div
        className="absolute inset-0"
        style={{ perspective: '1000px', perspectiveOrigin: '50% 50%' }}
      >
        {/* Bottom plane - floor receding into the distance */}
        <div
          className="absolute inset-x-[-30%] bottom-0 h-[75%]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(201,162,75,0.28) 1px, transparent 1px),'
              + 'linear-gradient(to bottom, rgba(201,162,75,0.28) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            transform: 'rotateX(64deg)',
            transformOrigin: 'center top',
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 25%, #000 80%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 25%, #000 80%, transparent 100%)',
          }}
        />
        {/* Top plane - ceiling mirroring the floor for a tunnel-like depth */}
        <div
          className="absolute inset-x-[-30%] top-0 h-[55%]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(201,162,75,0.20) 1px, transparent 1px),'
              + 'linear-gradient(to bottom, rgba(201,162,75,0.20) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            transform: 'rotateX(-64deg)',
            transformOrigin: 'center bottom',
            maskImage:
              'linear-gradient(to top, transparent 0%, #000 30%, #000 85%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to top, transparent 0%, #000 30%, #000 85%, transparent 100%)',
          }}
        />
      </div>

      {/* Soft central spotlight so the cards float above the depth. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(900px 520px at 50% 45%, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0) 70%)',
        }}
      />

      {/* Constellation: gold connector lines between selected particle pairs.
          The SVG is stretched edge-to-edge via preserveAspectRatio="none" so
          (x, y) coordinates align with the particle layer's percentages. */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="mc-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#C9A24B" stopOpacity="0" />
            <stop offset="50%"  stopColor="#C9A24B" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#C9A24B" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g
          stroke="url(#mc-line)"
          strokeWidth="0.12"
          vectorEffect="non-scaling-stroke"
          className="mc-line-shimmer"
        >
          {CONNECTIONS.map(([a, b], i) => {
            const p1 = PARTICLES[a];
            const p2 = PARTICLES[b];
            if (!p1 || !p2) return null;
            // Hide the line on mobile when either endpoint is desktop-only,
            // so we never draw a stroke into an invisible node.
            const mobileHide = p1.desktopOnly || p2.desktopOnly;
            return (
              <line
                key={i}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                className={mobileHide ? 'hidden sm:inline' : undefined}
              />
            );
          })}
        </g>
      </svg>

      {/* Particles. Anything flagged desktopOnly hides on viewports < sm so
          the mobile content band (title / search / cards taking the full
          width) stays clean. */}
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className={`absolute ${p.desktopOnly ? 'hidden sm:block' : ''}`}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            transform: 'translate(-50%, -50%)',
            animation: `mc-shimmer ${p.duration}s ease-in-out ${p.delay}s infinite`,
            filter: 'drop-shadow(0 1px 8px rgba(201,162,75,0.25))',
          }}
        >
          <Glyph shape={p.shape} tone={p.tone} size={p.size} />
        </span>
      ))}

      {/* Keyframes + reduced-motion fallback */}
      <style>{`
        @keyframes mc-shimmer {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 1;    transform: translate(-50%, -50%) scale(1.06); }
        }
        @keyframes mc-line-shimmer {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.9; }
        }
        .mc-line-shimmer { animation: mc-line-shimmer 7s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          [style*="mc-shimmer"], .mc-line-shimmer { animation: none !important; }
        }
      `}</style>
    </div>
  );
};

export default MemberCatalogBackdrop;
