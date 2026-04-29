/**
 * Renders the authenticated dashboard home page and shows the current
 * website user profile as proof that cross-app login succeeded.
 */
import { useState, useRef, useEffect, type MouseEvent } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

// Reusable SVG Line Chart Component
interface LineChartProps {
  color: string;
  gradientId: string;
  data: number[];
  labels?: string[];
}

const LineChart = ({ color, gradientId, data, labels }: LineChartProps) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Convert data points to SVG path coordinates
  const width = 300;
  const height = 120;
  const padding = 20; // Increased padding from 10 to 20
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - minValue) / range) * (height - 2 * padding);
    return { x, y, value };
  });

  // Handle mouse move over the chart
  const handleMouseMove = (e: MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseXPos = ((e.clientX - rect.left) / rect.width) * width;

    // Find the closest point to the mouse
    let closestIndex = 0;
    let minDistance = Math.abs(points[0].x - mouseXPos);

    for (let i = 1; i < points.length; i++) {
      const distance = Math.abs(points[i].x - mouseXPos);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    setHoveredPoint(closestIndex);
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  // Create smooth curve path using quadratic bezier curves
  const createPath = () => {
    if (points.length < 2) return '';
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      path += ` Q${current.x + (midX - current.x) * 0.5},${current.y} ${midX},${(current.y + next.y) / 2}`;
      path += ` Q${midX + (next.x - midX) * 0.5},${next.y} ${next.x},${next.y}`;
    }
    return path;
  };

  // Create area path (same as line but closes to bottom)
  const createAreaPath = () => {
    const linePath = createPath();
    return `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
  };

  return (
    <svg
      ref={svgRef}
      className="w-full h-full cursor-crosshair"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid Lines */}
      {[0.25, 0.5, 0.75].map((ratio, i) => (
        <line
          key={i}
          x1="0"
          y1={height * ratio}
          x2={width}
          y2={height * ratio}
          stroke="#e2e8f0"
          strokeWidth="1"
          className="dark:stroke-slate-700"
        />
      ))}
      {/* Area Fill */}
      <path d={createAreaPath()} fill={`url(#${gradientId})`} />
      {/* Main Line */}
      <path
        d={createPath()}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Hover vertical line */}
      {hoveredPoint !== null && (
        <line
          x1={points[hoveredPoint].x}
          y1="0"
          x2={points[hoveredPoint].x}
          y2={height}
          stroke="#9ca3af"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
        />
      )}
      {/* Data Points */}
      {points.map((point, i) => (
        <circle
          key={i}
          cx={point.x}
          cy={point.y}
          r="4"
          fill={color}
          className={hoveredPoint === i ? "opacity-100" : "opacity-0"}
          style={{ transition: 'opacity 0.2s' }}
        />
      ))}
      {/* Visible points at key positions */}
      {[0, Math.floor(points.length / 2), points.length - 1].map((idx) => (
        <circle
          key={`visible-${idx}`}
          cx={points[idx].x}
          cy={points[idx].y}
          r="4"
          fill={color}
        />
      ))}
      {/* Tooltip */}
      {hoveredPoint !== null && (() => {
        const point = points[hoveredPoint];
        const tooltipWidth = 70;
        const tooltipHeight = 38;

        // Calculate tooltip position to prevent cutoff at edges
        let tooltipX = point.x - tooltipWidth / 2;

        // Adjust if too close to left edge
        if (tooltipX < 5) {
          tooltipX = 5;
        }
        // Adjust if too close to right edge
        if (tooltipX + tooltipWidth > width - 5) {
          tooltipX = width - tooltipWidth - 5;
        }

        // Position tooltip above the point, but below if too close to top
        let tooltipY = point.y - tooltipHeight - 8;
        if (tooltipY < 5) {
          tooltipY = point.y + 15;
        }

        return (
          <g>
            {/* Tooltip background */}
            <rect
              x={tooltipX}
              y={tooltipY}
              width={tooltipWidth}
              height={tooltipHeight}
              rx="6"
              fill="white"
              stroke="#e2e8f0"
              strokeWidth="1.5"
              filter="drop-shadow(0 2px 6px rgba(0,0,0,0.15))"
              className="dark:fill-slate-800 dark:stroke-slate-700"
            />
            {/* Tooltip date */}
            {labels && (
              <text
                x={tooltipX + tooltipWidth / 2}
                y={tooltipY + 13}
                textAnchor="middle"
                className="text-[9px] fill-slate-500 dark:fill-slate-400"
              >
                {labels[hoveredPoint]}
              </text>
            )}
            {/* Tooltip value */}
            <text
              x={tooltipX + tooltipWidth / 2}
              y={tooltipY + 28}
              textAnchor="middle"
              className="text-[12px] font-bold fill-slate-900 dark:fill-white"
            >
              {data[hoveredPoint]}
            </text>
          </g>
        );
      })()}
    </svg>
  );
};

// Mini chart for stat cards
const MiniChart = ({ color, gradientId, data }: LineChartProps) => {
  const width = 64;
  const height = 48;
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - minValue) / range) * height;
    return { x, y };
  });

  const createPath = () => {
    if (points.length < 2) return '';
    let path = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      path += ` Q${cpX},${prev.y} ${cpX},${(prev.y + curr.y) / 2} Q${cpX},${curr.y} ${curr.x},${curr.y}`;
    }
    return path;
  };

  const createAreaPath = () => {
    const linePath = createPath();
    return `${linePath} L${width},${height} L0,${height} Z`;
  };

  return (
    <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path d={createAreaPath()} fill={`url(#${gradientId})`} />
      <path d={createPath()} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

type DateRange = 'last30days' | 'lastWeek' | 'currentMonth' | 'currentWeek';

const Home = () => {
  const { isRTL, t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('last30days');
  const [showDateRangeMenu, setShowDateRangeMenu] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const dateRangeMenuRef = useRef<HTMLDivElement>(null);

  // Determine time of day and get appropriate styling
  const getTimeBasedTheme = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      return {
        period: t('home_goodMorning'),
        emoji: '☀️',
        textColor: 'text-amber-900',
        subTextColor: 'text-amber-700',
        bannerClass: 'morning-banner-bg border-amber-200/50',
        isDark: false,
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        period: t('home_goodAfternoon'),
        emoji: '🌤️',
        textColor: 'text-violet-900',
        subTextColor: 'text-violet-700',
        bannerClass: 'afternoon-banner-bg border-violet-200/50',
        isDark: false,
      };
    } else if (hour >= 17 && hour < 21) {
      return {
        period: t('home_goodEvening'),
        emoji: '🌆',
        textColor: 'text-purple-900',
        subTextColor: 'text-purple-700',
        bannerClass: 'evening-banner-bg border-purple-200/50',
        isDark: false,
      };
    } else {
      return {
        period: t('home_goodNight'),
        emoji: '🌙',
        textColor: 'text-white',
        subTextColor: 'text-slate-200',
        bannerClass: 'night-banner-bg border-slate-700/40',
        isDark: true,
      };
    }
  };

  const theme = getTimeBasedTheme();
  const userName = user?.fullName || t('home_userName');
  const userEmail = user?.email || '';
  const userImage = user?.avatarUrl;

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Sample data for mini charts
  const visitorsData = [140, 85, 120, 75, 160, 110, 145];
  const salesData = [80, 120, 95, 150, 110, 140, 130];
  const checkinsData = [50, 70, 60, 90, 75, 85, 80];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (dateRangeMenuRef.current && !dateRangeMenuRef.current.contains(event.target as Node)) {
        setShowDateRangeMenu(false);
      }
    };

    if (showDateRangeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDateRangeMenu]);

  // Generate labels based on date range
  const generateLabels = (range: DateRange) => {
    const today = new Date();

    switch (range) {
      case 'currentWeek': {
        // Get current week (Sunday to today)
        const dayOfWeek = today.getDay();
        const days = dayOfWeek + 1; // Include today
        return Array.from({ length: days }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (days - 1 - i));
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
      }
      case 'lastWeek': {
        // Last 7 days
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (6 - i));
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
      }
      case 'currentMonth': {
        // From day 1 of current month to today
        const dayOfMonth = today.getDate();
        return Array.from({ length: dayOfMonth }, (_, i) => {
          const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
      }
      case 'last30days':
      default: {
        // Last 30 days
        return Array.from({ length: 30 }, (_, i) => {
          const date = new Date(today);
          date.setDate(date.getDate() - (29 - i));
          return `${date.getDate()}/${date.getMonth() + 1}`;
        });
      }
    }
  };

  // Generate data based on date range
  const generateData = (range: DateRange) => {
    const labels = generateLabels(range);
    const dataLength = labels.length;

    // Generate random-ish data that looks good
    const storeVisits = Array.from({ length: dataLength }, (_, i) =>
      Math.floor(120 + Math.sin(i * 0.5) * 80 + Math.random() * 40)
    );
    const purchases = Array.from({ length: dataLength }, (_, i) =>
      Math.floor(90 + Math.sin(i * 0.6) * 60 + Math.random() * 50)
    );
    const userGrowth = Array.from({ length: dataLength }, (_, i) =>
      Math.floor(50 + i * (200 / dataLength) + Math.random() * 30)
    );

    return { labels, storeVisits, purchases, userGrowth };
  };

  const { labels, storeVisits, purchases, userGrowth } = generateData(dateRange);

  const dateRangeLabels: Record<DateRange, string> = {
    last30days: t('home_last30days'),
    lastWeek: t('home_lastWeek'),
    currentMonth: t('home_currentMonth'),
    currentWeek: t('home_currentWeek'),
  };

  if (loading) {
    return (
      <>
        {/* Skeleton Welcome Section */}
        <div className="flex items-center justify-between flex-wrap gap-4 animate-pulse">
          <div>
            <div className="h-9 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2"></div>
            <div className="h-5 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[180px]">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2"></div>
                    <div className="h-8 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-16 h-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              </div>
            ))}
            <div className="w-16 h-[88px] bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
          </div>
        </div>

        {/* Skeleton Analytics Section */}
        <section className="bg-accent-violet/40 dark:bg-primary/5 rounded-[2rem] p-8 border border-accent-violet dark:border-primary/20 animate-pulse">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              <div className="h-7 w-28 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
            </div>
            <div className="h-10 w-48 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                <div className="w-full h-32 bg-slate-200 dark:bg-slate-700 rounded-xl mb-6"></div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                    <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Skeleton Bottom Grid */}
        <div className="grid grid-cols-12 gap-6 animate-pulse">
          {/* Skeleton Donut Chart */}
          <div className="col-span-12 md:col-span-3 bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-6"></div>
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-full bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="h-4 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Categories & Products */}
          <div className="col-span-12 md:col-span-3 space-y-6">
            {[1, 2].map((cardIndex) => (
              <div key={cardIndex} className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton System Reports Table */}
          <div className="col-span-12 md:col-span-6 bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div className="h-6 w-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-slate-100 dark:border-slate-800 last:border-0">
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                  <div className="flex-1 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bannerEntrance {
          0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.95);
          }
          60% {
            transform: translateY(5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .banner-entrance {
          opacity: 0;
          animation: bannerEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
        }
        .morning-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .morning-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 251, 235, 0.75) 0%, rgba(254, 243, 199, 0.7) 100%);
        }
        .afternoon-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .afternoon-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(240, 249, 255, 0.8) 0%, rgba(224, 242, 254, 0.75) 100%);
        }
        .evening-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=2000&auto=format&fit=crop&ixlib=rb-4.0.3');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .evening-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(250, 245, 255, 0.8) 0%, rgba(252, 231, 243, 0.75) 100%);
        }
        .night-banner-bg {
          background-image: url('https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=2000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          position: relative;
          overflow: hidden;
        }
        .night-banner-bg::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.7) 0%, rgba(30, 41, 59, 0.6) 100%);
        }
      `}</style>

      {/* Time-based greeting banner */}
      {!bannerDismissed && (
        <div className="w-full mb-6 banner-entrance">
          <div className={`${theme.bannerClass} rounded-2xl px-8 py-6 shadow-xl border-2 transition-all duration-300 hover:shadow-2xl relative`}>
            {/* Close button */}
            <button
              onClick={() => setBannerDismissed(true)}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} w-8 h-8 rounded-full ${
                theme.isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-black/5 hover:bg-black/10'
              } flex items-center justify-center transition-all duration-200 group z-20`}
              aria-label="Close banner"
            >
              <svg
                className={`w-4 h-4 ${theme.isDark ? 'text-white/70 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center justify-center gap-6 relative z-10">
            {userImage && (
              <img
                src={userImage}
                alt={userName}
                className={`w-20 h-20 rounded-full border-3 shadow-md object-cover ${
                  theme.isDark ? 'border-white/20' : 'border-white/70'
                }`}
              />
            )}
            <div className="text-center space-y-2">
              <h1 className={`text-3xl font-bold ${theme.textColor} flex items-center justify-center gap-3`}>
                <span className="text-4xl">{theme.emoji}</span>
                <span>{theme.period}, {userName}</span>
              </h1>
              <p className={`text-base ${theme.subTextColor} font-medium`}>
                {t('home_happyToSeeYou')}
              </p>
              {userEmail && (
                <p className={`text-sm ${theme.subTextColor} font-semibold break-all`}>
                  {userEmail}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-1">{t('home_helloUser')}</h1>
          <p className="text-slate-500 dark:text-slate-400">{t('home_businessOverview')}</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[180px]">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">{t('home_visitors')}</p>
              <p className="text-2xl font-bold">223</p>
            </div>
            <div className="w-16 h-12">
              <MiniChart color="#0066cc" gradientId="visitorsGradient" data={visitorsData} />
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[180px]">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">{t('home_sales')}</p>
              <p className="text-2xl font-bold">156</p>
            </div>
            <div className="w-16 h-12">
              <MiniChart color="#22c55e" gradientId="salesGradient" data={salesData} />
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-card-dark p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm min-w-[180px]">
            <div>
              <p className="text-xs text-slate-500 uppercase font-semibold">{t('home_checkin')}</p>
              <p className="text-2xl font-bold">89</p>
            </div>
            <div className="w-16 h-12">
              <MiniChart color="#f97316" gradientId="checkinsGradient" data={checkinsData} />
            </div>
          </div>
          <button className="w-16 h-[88px] bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            <span className="material-icons text-slate-600 dark:text-slate-400">add_circle_outline</span>
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      <section className="bg-accent-violet/40 dark:bg-primary/5 rounded-[2rem] p-8 border border-accent-violet dark:border-primary/20">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{t('home_analytics')}</h2>
            <button className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
              {t('home_allAnalytics')}
            </button>
          </div>
          <div className="relative" ref={dateRangeMenuRef}>
            <button
              onClick={() => setShowDateRangeMenu(!showDateRangeMenu)}
              className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
            >
              <span className="material-icons text-slate-400 text-sm">calendar_today</span>
              <span className="text-sm font-medium">{dateRangeLabels[dateRange]}</span>
              <span className="material-icons text-slate-400 text-sm">
                {showDateRangeMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>
            {showDateRangeMenu && (
              <div className="absolute start-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-10">
                {(['last30days', 'lastWeek', 'currentMonth', 'currentWeek'] as DateRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => {
                      setDateRange(range);
                      setShowDateRangeMenu(false);
                    }}
                    className={`w-full text-start px-4 py-3 text-sm font-medium transition-colors first:rounded-t-xl last:rounded-b-xl ${
                      dateRange === range
                        ? 'bg-primary text-white'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    {dateRangeLabels[range]}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Store Visits Card */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">{t('home_storeVisits')}</h3>
            <div className="w-full h-32 mb-6 px-2">
              <LineChart color="#0066cc" gradientId="storeVisitsGradient" data={storeVisits} labels={labels} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_currentMonthLabel')}</span>
                <span className="font-bold text-green-500">+20%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full w-[80%] rounded-full"></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_previousMonthLabel')}</span>
                <span className="font-bold">+15%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-primary/40 h-full w-[65%] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Purchases Card */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">{t('home_purchases')}</h3>
            <div className="w-full h-32 mb-6 px-2">
              <LineChart color="#22c55e" gradientId="purchasesGradient" data={purchases} labels={labels} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_currentMonthLabel')}</span>
                <span className="font-bold text-green-500">+25%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-green-500 h-full w-[85%] rounded-full"></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_previousMonthLabel')}</span>
                <span className="font-bold">+18%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-green-500/40 h-full w-[70%] rounded-full"></div>
              </div>
            </div>
          </div>

          {/* User Growth Card */}
          <div className="bg-white dark:bg-card-dark p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">{t('home_userGrowth')}</h3>
            <div className="w-full h-32 mb-6 px-2">
              <LineChart color="#a855f7" gradientId="userGrowthGradient" data={userGrowth} labels={labels} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_currentMonthLabel')}</span>
                <span className="font-bold text-green-500">+32%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full w-[90%] rounded-full"></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">{t('home_previousMonthLabel')}</span>
                <span className="font-bold">+22%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div className="bg-purple-500/40 h-full w-[75%] rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Store Visitors Donut */}
        <div className="col-span-12 md:col-span-3 bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
          <h3 className="font-bold mb-6">{t('home_storeVisitors')}</h3>
          <div className="relative flex justify-center mb-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle className="stroke-slate-200 dark:stroke-slate-800" cx="80" cy="80" fill="transparent" r="70" strokeWidth="20"></circle>
              <circle cx="80" cy="80" fill="transparent" r="70" stroke="#0066cc" strokeDasharray="440" strokeDashoffset="110" strokeWidth="20"></circle>
              <circle cx="80" cy="80" fill="transparent" r="70" stroke="#334155" strokeDasharray="440" strokeDashoffset="330" strokeWidth="20"></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold">1,420</span>
              <span className="text-[10px] text-slate-500 font-medium">{t('home_total')}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span>
                <span className="text-slate-600 dark:text-slate-400">{t('home_facebook')}</span>
              </div>
              <span className="font-bold">45%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent-violet"></span>
                <span className="text-slate-600 dark:text-slate-400">{t('home_instagram')}</span>
              </div>
              <span className="font-bold">30%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                <span className="text-slate-600 dark:text-slate-400">{t('home_twitter')}</span>
              </div>
              <span className="font-bold">25%</span>
            </div>
          </div>
        </div>

        {/* Categories & Products */}
        <div className="col-span-12 md:col-span-3 space-y-6">
          <div className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t('home_topCategories')}</h3>
              <button className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase">{t('home_showAll')}</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{t('home_electronics')}</span>
                  <span>₪1,200</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[75%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>300 {t('home_orders')}</span>
                  <span>{t('home_target')}: 500</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{t('home_fashion')}</span>
                  <span>₪980</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[60%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>240 {t('home_orders')}</span>
                  <span>{t('home_target')}: 400</span>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t('home_topProducts')}</h3>
              <button className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase">{t('home_showAll')}</button>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{t('home_smartwatchX')}</span>
                  <span>₪1,200</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[85%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>300 {t('home_salesUnit')}</span>
                  <span>{t('home_target')}: 500</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span>{t('home_proHeadphones')}</span>
                  <span>₪450</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-primary h-full w-[45%] rounded-full"></div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-400">
                  <span>180 {t('home_salesUnit')}</span>
                  <span>{t('home_target')}: 400</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Reports Table */}
        <div className="col-span-12 md:col-span-6 bg-white dark:bg-card-dark p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold">{t('home_systemReports')}</h3>
            <button className="text-[10px] px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold uppercase">{t('home_showAll')}</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead>
                <tr className="text-slate-400 uppercase tracking-wider">
                  <th className="pb-4 font-semibold text-start">{t('home_category')}</th>
                  <th className="pb-4 font-semibold text-start">{t('home_message')}</th>
                  <th className="pb-4 font-semibold text-start">{t('home_statusCol')}</th>
                  <th className="pb-4 font-semibold text-start">{t('home_manager')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 rounded-full font-bold">{t('home_maintenance')}</span>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300">{t('home_dbOptNeeded')}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      <span>{t('home_inProgress')}</span>
                    </div>
                  </td>
                  <td className="py-4 font-medium">{t('home_danielR')}</td>
                </tr>
                <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-full font-bold">{t('home_security')}</span>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300">{t('home_sslExpiring')}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                      <span>{t('home_pendingStatus')}</span>
                    </div>
                  </td>
                  <td className="py-4 font-medium">{t('home_danielR')}</td>
                </tr>
                <tr className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-4">
                    <span className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full font-bold">{t('home_updatesCat')}</span>
                  </td>
                  <td className="py-4 text-slate-600 dark:text-slate-300">{t('home_versionUploaded')}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      <span>{t('home_completedStatus')}</span>
                    </div>
                  </td>
                  <td className="py-4 font-medium">{t('home_danielR')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
