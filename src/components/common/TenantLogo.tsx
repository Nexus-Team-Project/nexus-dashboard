/**
 * TenantLogo - renders an organization's logo, or a colored initials tile when
 * the tenant has no logo. Shared by the header avatar, settings, and onboarding.
 * Only the Nexus ecosystem catalog uses the Nexus logo; real tenants without a
 * logo show initials here.
 */
import { tenantColor } from '../../lib/tenantColor';

/** Two-letter initials from a name (single word -> first two chars). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.trim().slice(0, 2).toUpperCase() || '?';
}

interface TenantLogoProps {
  /** Tenant name - used for the initials + the deterministic tile color. */
  name: string;
  /** Cloudinary logo URL, or null/undefined -> initials tile. */
  logoUrl?: string | null;
  /** Square size in px. */
  size?: number;
  /** Tailwind rounding class (default rounded-full). */
  rounded?: string;
  className?: string;
}

export default function TenantLogo({
  name,
  logoUrl,
  size = 28,
  rounded = 'rounded-full',
  className = '',
}: TenantLogoProps) {
  const dim = { width: size, height: size } as const;
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={dim}
        className={`${rounded} bg-white object-contain ${className}`}
      />
    );
  }
  return (
    <div
      style={{ ...dim, background: tenantColor(name) }}
      className={`${rounded} flex items-center justify-center font-bold leading-none text-white ${className}`}
      aria-label={name}
    >
      <span style={{ fontSize: Math.max(9, Math.round(size * 0.4)) }}>{initials(name)}</span>
    </div>
  );
}
