/**
 * Modal guide shown before CSV import on the invite page.
 * Displays an animated visual of the Excel/CSV logo and Nexus logo connecting
 * via a drawn beam with travelling data dots. Explains the import steps,
 * lists key capabilities, and offers a language-aware example CSV download.
 * The hidden file input lives here to control the full upload trigger.
 */
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import excelLogo from '../../assets/logos/excel_logo.png';
import nexusLogo from '../../assets/logos/nexus_logo.png';

export interface CsvImportGuideProps {
  language: 'he' | 'en';
  /** Called with the chosen File so the parent can parse and open the mapper. */
  onFileSelected: (file: File) => void;
  onClose: () => void;
}

const COPY = {
  he: {
    title: 'ייבוא חברים מ-CSV',
    subtitle: 'הזמן חברים מכל קובץ גיליון אלקטרוני. אין פורמט קבוע.',
    step1: 'העלאה',
    step2: 'מיפוי עמודות',
    step3: 'ייבוא',
    f1: 'כל פורמט CSV. מיפוי עמודות מתבצע לאחר ההעלאה.',
    f2: 'עד 5,000 חברים בייבוא אחד.',
    f3: 'תפקיד לכל שורה. שורות ללא תפקיד מקבלות ברירת מחדל.',
    exampleLabel: 'צריך נקודת התחלה?',
    download: 'הורד CSV לדוגמה',
    cancel: 'ביטול',
    chooseFile: 'בחר קובץ CSV',
    csvAlt: 'Excel CSV',
    nexusAlt: 'Nexus',
  },
  en: {
    title: 'Import members from CSV',
    subtitle: 'Invite members from any spreadsheet. No special format required.',
    step1: 'Upload',
    step2: 'Map columns',
    step3: 'Import',
    f1: 'Any CSV format. Map your columns to fields after upload.',
    f2: 'Up to 5,000 members per import.',
    f3: 'Set a role per row. Rows without a role default to Member.',
    exampleLabel: 'Need a starting point?',
    download: 'Download example CSV',
    cancel: 'Cancel',
    chooseFile: 'Choose CSV file',
    csvAlt: 'Excel CSV',
    nexusAlt: 'Nexus',
  },
} as const;

/**
 * Language-specific example CSV rows.
 * Hebrew version uses Hebrew headers and role names.
 * Both versions include a UTF-8 BOM so Excel renders the file correctly.
 */
const EXAMPLE_ROWS: Record<'he' | 'en', string[]> = {
  en: [
    'Email Address,Role,Full Name,Department',
    'alice.cohen@example.com,admin,Alice Cohen,Engineering',
    'bob.levi@example.com,finance,Bob Levi,Finance',
    'carol.shapiro@example.com,operator,Carol Shapiro,Operations',
    'david.ben@example.com,member,David Ben,HR',
    'eva.mizrahi@example.com,analyst,Eva Mizrahi,Analytics',
  ],
  he: [
    'כתובת אימייל,תפקיד,שם מלא,מחלקה',
    'alice.cohen@example.com,מנהל,אליס כהן,הנדסה',
    'bob.levi@example.com,כספים,בוב לוי,כספים',
    'carol.shapiro@example.com,תפעול,קרול שפירו,תפעול',
    'david.ben@example.com,חבר,דוד בן,משאבי אנוש',
    'eva.mizrahi@example.com,אנליסט,אווה מזרחי,אנליטיקה',
  ],
};

/**
 * Generates and downloads a language-specific example CSV.
 * Prepends a UTF-8 BOM so Excel renders Hebrew (and all UTF-8) correctly.
 * Input: active dashboard language.
 */
function downloadExampleCsv(language: 'he' | 'en') {
  const content = EXAMPLE_ROWS[language].join('\r\n');
    // String.fromCharCode(0xfeff) is the UTF-8 BOM Excel needs to open Hebrew CSV correctly.
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'nexus-invite-example.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** CSS keyframes injected once per modal mount for the logo float animation. */
const ANIMATION_CSS = `
  @keyframes csv-guide-float-a {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-7px); }
  }
  @keyframes csv-guide-float-b {
    0%, 100% { transform: translateY(-7px); }
    50% { transform: translateY(0px); }
  }
`;

/**
 * Renders the CSV import guide modal with animated logos and step overview.
 * Input: language, file-selected callback, and close callback.
 * Output: portal modal with visual guide, feature list, and file input trigger.
 */
export default function CsvImportGuide({ language, onFileSelected, onClose }: CsvImportGuideProps) {
  const copy = COPY[language];
  const isRTL = language === 'he';
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Inject float keyframes into <head> and clean up on unmount. */
  useEffect(() => {
    const style = document.createElement('style');
    style.setAttribute('data-csv-guide', '');
    style.textContent = ANIMATION_CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      onClose();
      onFileSelected(file);
    }
  };

  const features = [copy.f1, copy.f2, copy.f3];
  const steps = [copy.step1, copy.step2, copy.step3];

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal shell — fixed container holds an absolute scroll layer so iOS touch-scroll works */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        dir={isRTL ? 'rtl' : 'ltr'}
        className="fixed inset-0 z-50"
      >
        {/* Scroll layer: absolute (not fixed) + overflow-y scroll + webkit touch for iOS Safari */}
        <div
          className="absolute inset-0 overflow-y-scroll overscroll-contain"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex min-h-full items-center justify-center px-4 py-20">
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            <span className="material-icons text-xl">close</span>
          </button>

          {/* ── Animated hero ─────────────────────────────────────────── */}
          <div className="flex flex-col items-center px-8 pb-2 pt-12">

            {/* Logos + beam — always LTR so the CSV→Nexus flow is consistent */}
            <div dir="ltr" className="flex w-full items-center justify-center gap-0">

              {/* Excel / CSV logo */}
              <div
                style={{ animation: 'csv-guide-float-a 3s ease-in-out infinite' }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-2 shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <img src={excelLogo} alt={copy.csvAlt} className="h-full w-full object-contain" />
              </div>

              {/* SVG animated beam */}
              <div className="flex-1 px-2">
                <svg
                  viewBox="0 0 160 40"
                  className="w-full"
                  aria-hidden="true"
                  overflow="visible"
                >
                  <defs>
                    <path id="csv-guide-path" d="M 4 20 Q 80 8 156 20" />
                  </defs>

                  {/* Track line (faint) */}
                  <path
                    d="M 4 20 Q 80 8 156 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    className="text-slate-200 dark:text-slate-700"
                  />

                  {/* Animated draw-on line */}
                  <path
                    d="M 4 20 Q 80 8 156 20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="5 4"
                    strokeLinecap="round"
                    className="text-primary"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      values="200;0"
                      dur="0.9s"
                      fill="freeze"
                      calcMode="spline"
                      keySplines="0.4 0 0.2 1"
                    />
                  </path>

                  {/* Data packet 1 */}
                  <circle r="4" fill="currentColor" className="text-primary">
                    <animateMotion dur="1.8s" repeatCount="indefinite" begin="0.9s">
                      <mpath href="#csv-guide-path" />
                    </animateMotion>
                    <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.85;1" dur="1.8s" repeatCount="indefinite" begin="0.9s" />
                  </circle>

                  {/* Data packet 2 (offset) */}
                  <circle r="3" fill="currentColor" opacity="0.5" className="text-primary">
                    <animateMotion dur="1.8s" repeatCount="indefinite" begin="1.8s">
                      <mpath href="#csv-guide-path" />
                    </animateMotion>
                    <animate attributeName="opacity" values="0;0.5;0.5;0" keyTimes="0;0.1;0.85;1" dur="1.8s" repeatCount="indefinite" begin="1.8s" />
                  </circle>
                </svg>
              </div>

              {/* Nexus logo */}
              <div
                style={{ animation: 'csv-guide-float-b 3s ease-in-out infinite' }}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-slate-100 bg-white p-2 shadow-md dark:border-slate-700 dark:bg-slate-800"
              >
                <img src={nexusLogo} alt={copy.nexusAlt} className="h-full w-full object-contain" />
              </div>
            </div>

            {/* Step breadcrumb */}
            <div className="mt-5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              {steps.map((step, i) => (
                <span key={step} className="flex items-center gap-1.5">
                  <span className={i === 0 ? 'font-semibold text-primary' : ''}>
                    {i + 1}. {step}
                  </span>
                  {i < steps.length - 1 && (
                    <span className="material-icons text-sm text-slate-300 dark:text-slate-600">
                      {isRTL ? 'chevron_left' : 'chevron_right'}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* ── Content ──────────────────────────────────────────────── */}
          <div className="px-6 pb-1 pt-5">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{copy.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{copy.subtitle}</p>

            {/* Feature list */}
            <ul className="mt-4 space-y-2.5">
              {features.map((feat) => (
                <li key={feat} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <span className="material-icons text-sm text-primary">check</span>
                  </span>
                  <span className="text-sm leading-5 text-slate-700 dark:text-slate-300">{feat}</span>
                </li>
              ))}
            </ul>

            {/* Example download */}
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-300">{copy.exampleLabel}</span>
              <button
                type="button"
                onClick={() => downloadExampleCsv(language)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 sm:w-auto sm:py-1.5"
              >
                <span className="material-icons text-sm">download</span>
                {copy.download}
              </button>
            </div>
          </div>

          {/* ── Footer ───────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
            >
              <span className="material-icons text-base">upload_file</span>
              {copy.chooseFile}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="sr-only"
              aria-hidden="true"
            />
          </div>

        </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
