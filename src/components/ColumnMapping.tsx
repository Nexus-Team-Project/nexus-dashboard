import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ColumnMapping {
  excelColumn: string;
  systemColumn: string;
  sample: string;
  isMapped: boolean;
}

interface ColumnMappingProps {
  onClose: () => void;
  onComplete: () => void;
  fileName?: string;
}

const ColumnMapping = ({ onClose, onComplete }: ColumnMappingProps) => {
  const { t } = useLanguage();
  const [excludeFirstRow, setExcludeFirstRow] = useState(true);
  const [mappings, setMappings] = useState<ColumnMapping[]>([
    {
      excelColumn: 'Full Name',
      systemColumn: 'Person Name',
      sample: 'Jane Doe, John Smith',
      isMapped: true
    },
    {
      excelColumn: 'Work Email',
      systemColumn: '',
      sample: 'office@example.com',
      isMapped: false
    },
    {
      excelColumn: 'Department',
      systemColumn: 'Team / Group',
      sample: 'Engineering, Sales',
      isMapped: true
    },
    {
      excelColumn: 'Start Date',
      systemColumn: 'Timeline',
      sample: '2023-01-15',
      isMapped: true
    }
  ]);

  const systemColumns = [
    'Person Name',
    'Email Address',
    'Contact Info',
    'Team / Group',
    'Timeline',
    'User ID',
    'Status',
    'Address',
    'Phone Number'
  ];

  const handleMappingChange = (index: number, value: string) => {
    const newMappings = [...mappings];
    newMappings[index].systemColumn = value;
    newMappings[index].isMapped = value !== '';
    setMappings(newMappings);
  };

  const unmappedCount = mappings.filter(m => !m.isMapped).length;

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-50 overflow-hidden backdrop-blur-sm">
      <div className="h-full flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-6xl bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] animate-in fade-in zoom-in duration-300">
          {/* Main Content */}
          <div className="flex-1 p-8 lg:p-12 flex flex-col relative overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
              <div className="flex items-center gap-2 text-slate-400">
                <span className="material-icons text-lg">table_view</span>
                <span className="material-icons text-sm rtl:rotate-180">chevron_left</span>
                <span className="text-xs font-medium uppercase tracking-wider">{t('cm_importProcess')}</span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-icons text-base">close</span>
                  <span>{t('cm_close')}</span>
                </button>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
                  {t('cm_step3of4')}
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold mb-2 tracking-tight">{t('cm_columnMappingTitle')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              {t('cm_columnMappingDesc')}
            </p>

            {/* Exclude First Row Checkbox */}
            <div className="flex items-center gap-3 mb-10">
              <input
                checked={excludeFirstRow}
                onChange={(e) => setExcludeFirstRow(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary transition-all cursor-pointer"
                id="exclude-row"
                type="checkbox"
              />
              <label
                className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer"
                htmlFor="exclude-row"
              >
                {t('cm_excludeFirstRow')}
              </label>
            </div>

            {/* Column Mappings */}
            <div className="flex-1 overflow-y-auto custom-scrollbar ps-4 -ms-4">
              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 px-2">
                <div className="text-start">{t('cm_excelColumns')}</div>
                <div className="text-start">{t('cm_systemColumns')}</div>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => (
                  <div
                    key={index}
                    className={`group flex items-center gap-6 p-4 rounded-xl border transition-all duration-200 ${
                      mapping.isMapped
                        ? 'border-slate-200 dark:border-slate-800 hover:border-primary/30 dark:hover:border-primary/50 bg-white dark:bg-slate-900/50'
                        : 'border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/30 bg-white/40 dark:bg-transparent'
                    }`}
                  >
                    <div className="flex-1 flex flex-col">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {mapping.excelColumn}
                      </span>
                      <span className="text-xs text-slate-400">{t('cm_example')}: {mapping.sample}</span>
                    </div>
                    <span className="material-icons text-slate-300 dark:text-slate-600">
                      arrow_back
                    </span>
                    <div className="flex-1">
                      <div className="relative">
                        <select
                          value={mapping.systemColumn}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                          className={`w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary/40 focus:border-primary py-3 px-4 pr-10 transition-all cursor-pointer hover:shadow-md ${
                            !mapping.isMapped ? 'text-slate-400 italic' : 'text-slate-900 dark:text-white font-medium'
                          }`}
                          style={{
                            appearance: 'none',
                            backgroundImage: 'none'
                          }}
                        >
                          <option value="" className="text-slate-400">{t('cm_chooseColumn')}</option>
                          {systemColumns.map((col) => (
                            <option key={col} value={col} className="text-slate-900 dark:text-white font-normal">
                              {col}
                            </option>
                          ))}
                        </select>
                        <span className="material-icons absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                          expand_more
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              {unmappedCount > 0 ? (
                <div className="flex items-center text-amber-600 dark:text-amber-500 gap-2">
                  <span className="material-icons text-lg">warning_amber</span>
                  <span className="text-sm font-medium">
                    {unmappedCount} {t('cm_unmappedWarning')}
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-green-600 dark:text-green-500 gap-2">
                  <span className="material-icons text-lg">check_circle</span>
                  <span className="text-sm font-medium">{t('cm_allMapped')}</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  {t('cm_back')}
                </button>
                <button
                  onClick={onComplete}
                  className="bg-primary text-white px-10 py-2.5 font-semibold rounded-lg shadow-lg shadow-primary/20 hover:bg-violet-700 transition-all active:scale-95"
                >
                  {t('cm_next')}
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Illustration */}
          <div className="hidden md:flex w-2/5 bg-slate-50 dark:bg-slate-900/40 items-center justify-center p-12 border-e border-slate-200 dark:border-slate-800">
            <div className="relative w-full max-w-sm flex flex-col items-center">
              <div className="w-full space-y-8">
                {/* Excel File Visual */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 transform -rotate-1">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-[10px] text-white font-bold">
                      X
                    </div>
                    <div className="h-2 w-20 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>
                    </div>
                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded w-full"></div>
                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded w-3/4"></div>
                  </div>
                </div>

                {/* Arrow Down */}
                <div className="flex justify-center">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white shadow-lg">
                    <span className="material-icons">south</span>
                  </div>
                </div>

                {/* System Board Visual */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 transform rotate-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      <span className="material-icons text-xs">dashboard</span>
                    </div>
                    <div className="h-2 w-24 bg-slate-100 dark:bg-slate-700 rounded"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                      <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-sm"></div>
                      <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-amber-400 rounded-sm"></div>
                      <div className="h-2 w-full bg-slate-50 dark:bg-slate-900 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                  {t('cm_seamlessIntegration')}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                  {t('cm_autoMatchDesc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMapping;
