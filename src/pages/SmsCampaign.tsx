import { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const SmsCampaign = () => {
  const { t } = useLanguage();
  const [schedule, setSchedule] = useState<'now' | 'later'>('now');
  const [showBrandLogo, setShowBrandLogo] = useState(true);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  const recipientLists = [
    { id: 'vip', name: 'לקוחות VIP', count: 1240 },
    { id: 'new', name: 'נרשמים חדשים (30 יום)', count: 450 },
    { id: 'cart', name: 'עגלה נטושה', count: 89 },
  ];

  const toggleList = (id: string) => {
    setSelectedLists(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const totalRecipients = recipientLists
    .filter(l => selectedLists.includes(l.id))
    .reduce((sum, l) => sum + l.count, 0);

  return (
    <div>
      {/* Breadcrumbs & Header */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <span className="hover:text-primary cursor-pointer">{t('campaigns')}</span>
          <span className="material-symbols-rounded !text-xs">chevron_left</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium">{t('createNewCampaign')}</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('createNewCampaign')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
              הגדר את פרטי הקמפיין, קהל היעד ותזמון השליחה
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm">
              {t('saveDraft')}
            </button>
            <button className="px-4 py-2 text-sm font-semibold text-white bg-[#635bff] rounded-lg hover:opacity-90 transition-all shadow-sm">
              {t('saveAndContinue')}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Form Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Campaign Details */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-[#e3e8ee] dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-rounded text-[#635bff]">edit_note</span>
              <h3 className="text-lg font-semibold">{t('campaignDetails')}</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('campaignName')}</label>
                <input
                  type="text"
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#635bff]/50 focus:border-[#635bff] dark:bg-slate-800 outline-none"
                  placeholder="למשל: מבצע סוף שנה 2024"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('messageContent')}</label>
                <textarea
                  className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#635bff]/50 focus:border-[#635bff] dark:bg-slate-800 outline-none"
                  placeholder="הזן את תוכן ההודעה כאן..."
                  rows={4}
                />
              </div>
            </div>
          </section>

          {/* Recipient Selection */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-[#e3e8ee] dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-[#635bff]">groups</span>
                <h3 className="text-lg font-semibold">{t('recipientSelection')}</h3>
              </div>
              <button className="text-[#635bff] text-sm font-semibold hover:underline flex items-center gap-1">
                <span className="material-symbols-rounded !text-sm">add</span>
                {t('addList')}
              </button>
            </div>
            <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">{t('listName')}</th>
                    <th className="px-4 py-3">{t('recipients')}</th>
                    <th className="px-4 py-3 text-left">{t('select')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recipientLists.map(list => (
                    <tr key={list.id}>
                      <td className="px-4 py-3 font-medium">{list.name}</td>
                      <td className="px-4 py-3 text-slate-500">{list.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-left">
                        <input
                          type="checkbox"
                          className="rounded text-[#635bff] focus:ring-[#635bff]"
                          checked={selectedLists.includes(list.id)}
                          onChange={() => toggleList(list.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Scheduling */}
          <section className="bg-white dark:bg-slate-900 rounded-lg border border-[#e3e8ee] dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
              <span className="material-symbols-rounded text-[#635bff]">schedule</span>
              <h3 className="text-lg font-semibold">{t('sendScheduling')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer ${
                schedule === 'now' ? 'border-[#635bff] bg-[#635bff]/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="schedule"
                  checked={schedule === 'now'}
                  onChange={() => setSchedule('now')}
                  className="mt-1 text-[#635bff] focus:ring-[#635bff]"
                />
                <div className="ms-3">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{t('sendNow')}</span>
                  <span className="block text-xs text-slate-500 mt-1">{t('sendNowDesc')}</span>
                </div>
              </label>
              <label className={`relative flex items-start p-4 border-2 rounded-lg cursor-pointer ${
                schedule === 'later' ? 'border-[#635bff] bg-[#635bff]/5' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}>
                <input
                  type="radio"
                  name="schedule"
                  checked={schedule === 'later'}
                  onChange={() => setSchedule('later')}
                  className="mt-1 text-[#635bff] focus:ring-[#635bff]"
                />
                <div className="ms-3">
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{t('scheduleLater')}</span>
                  <span className="block text-xs text-slate-500 mt-1">{t('scheduleLaterDesc')}</span>
                </div>
              </label>
            </div>
            {schedule === 'later' && (
              <div className="mt-6 flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('date')}</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 !text-sm">calendar_today</span>
                    <input
                      type="date"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg pe-10 ps-3 py-2 text-sm focus:ring-2 focus:ring-[#635bff]/50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{t('time')}</label>
                  <div className="relative">
                    <span className="material-symbols-rounded absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 !text-sm">schedule</span>
                    <input
                      type="time"
                      className="w-full border border-slate-200 dark:border-slate-700 rounded-lg pe-10 ps-3 py-2 text-sm focus:ring-2 focus:ring-[#635bff]/50 dark:bg-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
          {/* Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#e3e8ee] dark:border-slate-700 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">{t('preview')}</h3>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-100 dark:border-slate-700 min-h-[400px] flex flex-col">
              <div className="w-full h-32 rounded-lg mb-4 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#635bff]/10 to-[#635bff]/30" />
              </div>
              <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded mb-1" />
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded mb-1" />
              <div className="h-3 w-4/5 bg-slate-100 dark:bg-slate-700 rounded mb-6" />
              <div className="mt-auto">
                <div className="h-10 w-full bg-[#635bff]/20 rounded-lg flex items-center justify-center text-[#635bff] text-xs font-bold">
                  {t('callToAction')}
                </div>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-sm font-semibold text-[#635bff] border border-[#635bff]/20 bg-[#635bff]/5 rounded-lg hover:bg-[#635bff]/10 transition-colors flex items-center justify-center gap-2">
              <span className="material-symbols-rounded !text-sm">send</span>
              {t('sendTest')}
            </button>
          </div>

          {/* Design Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-[#e3e8ee] dark:border-slate-700 p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">{t('designSettings')}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-2">{t('brandColor')}</label>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#635bff] cursor-pointer border-2 border-white ring-1 ring-slate-200" />
                  <div className="w-8 h-8 rounded-full bg-emerald-500 cursor-pointer hover:ring-1 hover:ring-slate-200" />
                  <div className="w-8 h-8 rounded-full bg-amber-500 cursor-pointer hover:ring-1 hover:ring-slate-200" />
                  <div className="w-8 h-8 rounded-full bg-slate-900 cursor-pointer hover:ring-1 hover:ring-slate-200" />
                  <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400">
                    <span className="material-symbols-rounded !text-sm">add</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('font')}</label>
                <select className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#635bff]/50 dark:bg-slate-800 outline-none">
                  <option>Inter (Default)</option>
                  <option>Public Sans</option>
                  <option>Roboto</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('showBrandLogo')}</span>
                  <input
                    type="checkbox"
                    checked={showBrandLogo}
                    onChange={(e) => setShowBrandLogo(e.target.checked)}
                    className="rounded text-[#635bff] focus:ring-[#635bff]"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Campaign Summary */}
          {selectedLists.length > 0 && (
            <div className="bg-blue-50 dark:bg-[#635bff]/10 border border-blue-100 dark:border-[#635bff]/20 rounded-lg p-4">
              <div className="flex gap-3">
                <span className="material-symbols-rounded text-blue-500">info</span>
                <div>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">{t('interimSummary')}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    נבחרו {selectedLists.length} רשימות תפוצה. סה"כ {totalRecipients.toLocaleString()} נמענים יקבלו את ההודעה.
                  </p>
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default SmsCampaign;
