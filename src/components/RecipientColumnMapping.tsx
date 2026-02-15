import { useState } from 'react';

interface ColumnMapping {
  excelColumn: string;
  systemColumn: string;
  sample: string;
  isMapped: boolean;
}

interface RecipientColumnMappingProps {
  onClose: () => void;
  onComplete: () => void;
  fileName?: string;
}

const RecipientColumnMapping = ({ onClose, onComplete, fileName }: RecipientColumnMappingProps) => {
  const [excludeFirstRow, setExcludeFirstRow] = useState(true);
  const [mappings, setMappings] = useState<ColumnMapping[]>([
    {
      excelColumn: 'Full Name',
      systemColumn: 'שם מלא',
      sample: 'יוסי כהן, שרה לוי',
      isMapped: true
    },
    {
      excelColumn: 'Email',
      systemColumn: 'אימייל',
      sample: 'example@email.com',
      isMapped: true
    },
    {
      excelColumn: 'Phone',
      systemColumn: '',
      sample: '050-1234567',
      isMapped: false
    },
    {
      excelColumn: 'Amount',
      systemColumn: '',
      sample: '250, 500',
      isMapped: false
    },
    {
      excelColumn: 'Message',
      systemColumn: '',
      sample: 'מזל טוב!',
      isMapped: false
    }
  ]);

  // Recipient-specific system columns
  const systemColumns = [
    { value: 'שם מלא', label: 'שם מלא', required: true },
    { value: 'אימייל', label: 'אימייל', required: false },
    { value: 'טלפון', label: 'טלפון', required: false },
    { value: 'סכום מתנה', label: 'סכום מתנה', required: false },
    { value: 'ברכה אישית', label: 'ברכה אישית', required: false },
  ];

  // Get already mapped system columns
  const getMappedColumns = () => {
    return mappings
      .filter(m => m.isMapped && m.systemColumn)
      .map(m => m.systemColumn);
  };

  // Get available columns for a specific mapping
  const getAvailableColumns = (currentIndex: number) => {
    const mappedColumns = getMappedColumns();
    const currentMapping = mappings[currentIndex].systemColumn;

    return systemColumns.filter(col =>
      !mappedColumns.includes(col.value) || col.value === currentMapping
    );
  };

  const handleMappingChange = (index: number, value: string) => {
    const newMappings = [...mappings];
    newMappings[index].systemColumn = value;
    newMappings[index].isMapped = value !== '';
    setMappings(newMappings);
  };

  const handleClearMapping = (index: number) => {
    const newMappings = [...mappings];
    newMappings[index].systemColumn = '';
    newMappings[index].isMapped = false;
    setMappings(newMappings);
  };

  const unmappedCount = mappings.filter(m => !m.isMapped).length;
  const hasRequiredFields = mappings.some(m => m.isMapped && m.systemColumn === 'שם מלא');
  const hasContactMethod = mappings.some(m =>
    m.isMapped && (m.systemColumn === 'אימייל' || m.systemColumn === 'טלפון')
  );
  const canProceed = hasRequiredFields && hasContactMethod;

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
                <span className="material-icons text-sm">chevron_left</span>
                <span className="text-xs font-medium uppercase tracking-wider">תהליך ייבוא נמענים</span>
              </div>
              <div className="flex items-center gap-6">
                <button
                  onClick={onClose}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors"
                >
                  <span className="material-icons text-base">close</span>
                  <span>סגור</span>
                </button>
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500">
                  שלב 2 מתוך 2
                </span>
              </div>
            </div>

            <h1 className="text-3xl font-semibold mb-2 tracking-tight">שיוך עמודות לנמענים</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              התאם את כותרות הטבלה שלך לשדות הנמענים במערכת.
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
                אל תייבא את השורה הראשונה (כותרות)
              </label>
            </div>

            {/* Column Mappings */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pl-4 -ml-4">
              <div className="grid grid-cols-2 gap-4 mb-4 text-[11px] font-bold uppercase tracking-widest text-slate-400 px-2">
                <div className="text-right">עמודות Excel</div>
                <div className="text-right">שדות נמענים</div>
              </div>

              <div className="space-y-4">
                {mappings.map((mapping, index) => {
                  const availableColumns = getAvailableColumns(index);

                  return (
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
                        <span className="text-xs text-slate-400">דוגמה: {mapping.sample}</span>
                      </div>
                      <span className="material-icons text-slate-300 dark:text-slate-600">
                        arrow_back
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
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
                            <option value="" className="text-slate-400">בחר שדה...</option>
                            {availableColumns.map((col) => (
                              <option key={col.value} value={col.value} className="text-slate-900 dark:text-white font-normal">
                                {col.label} {col.required && '*'}
                              </option>
                            ))}
                          </select>
                          <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-lg">
                            expand_more
                          </span>
                        </div>

                        {/* Clear Button */}
                        {mapping.isMapped && (
                          <button
                            onClick={() => handleClearMapping(index)}
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-lg transition-colors flex-shrink-0"
                            title="נקה שיוך"
                          >
                            <span className="material-icons text-lg">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              {!canProceed ? (
                <div className="flex items-center text-red-600 dark:text-red-500 gap-2">
                  <span className="material-icons text-lg">error</span>
                  <span className="text-sm font-medium">
                    נדרש שיוך שם מלא + אימייל או טלפון
                  </span>
                </div>
              ) : unmappedCount > 0 ? (
                <div className="flex items-center text-amber-600 dark:text-amber-500 gap-2">
                  <span className="material-icons text-lg">warning_amber</span>
                  <span className="text-sm font-medium">
                    {unmappedCount} עמודות ללא שיוך לא ייובאו
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-green-600 dark:text-green-500 gap-2">
                  <span className="material-icons text-lg">check_circle</span>
                  <span className="text-sm font-medium">כל העמודות משוייכות</span>
                </div>
              )}
              <div className="flex items-center gap-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                >
                  חזור
                </button>
                <button
                  onClick={onComplete}
                  disabled={!canProceed}
                  className={`px-10 py-2.5 font-semibold rounded-lg shadow-lg transition-all active:scale-95 ${
                    canProceed
                      ? 'bg-primary text-white shadow-primary/20 hover:bg-blue-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                  }`}
                >
                  ייבא נמענים
                </button>
              </div>
            </div>
          </div>

          {/* Right Side - Visual Illustration */}
          <div className="hidden md:flex w-2/5 bg-slate-50 dark:bg-slate-900/40 items-center justify-center p-12 border-r border-slate-200 dark:border-slate-800">
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
                    <div className="grid grid-cols-5 gap-2">
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded"></div>
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

                {/* Recipients System Visual */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-4 border border-slate-200 dark:border-slate-800 transform rotate-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                      <span className="material-icons text-xs">card_giftcard</span>
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
                  ייבוא נמענים חכם
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xs">
                  אנחנו מתאימים אוטומטית את שמות העמודות כדי לחסוך לך זמן.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipientColumnMapping;
