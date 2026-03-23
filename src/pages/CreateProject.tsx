import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const templates = [
  { id: 'blank', icon: 'web_asset', label: 'פרויקט ריק', description: 'התחל מאפס' },
  { id: 'business', icon: 'storefront', label: 'אתר עסקי', description: 'תבנית מוכנה לעסק' },
  { id: 'portfolio', icon: 'photo_library', label: 'תיק עבודות', description: 'הצג את העבודות שלך' },
  { id: 'landing', icon: 'rocket_launch', label: 'דף נחיתה', description: 'דף שיווקי ממוקד' },
  { id: 'ecommerce', icon: 'shopping_cart', label: 'חנות אונליין', description: 'מכירות ומוצרים' },
  { id: 'blog', icon: 'article', label: 'בלוג', description: 'תוכן ומאמרים' },
];

const CreateProject = () => {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('blank');
  const [projectDescription, setProjectDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!projectName.trim()) {
      setError('יש להזין שם לפרויקט');
      return;
    }

    // Navigate back to projects after creation
    navigate('/projects');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white dark:bg-card-dark border-b border-slate-200 dark:border-slate-800 px-8 py-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/projects')}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <span className="material-icons text-[20px]">arrow_forward</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">צור פרויקט חדש</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                בחר תבנית והגדר את הפרויקט שלך
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {/* Project Name */}
            <div>
              <label className="block text-sm font-semibold mb-2">שם הפרויקט</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="לדוגמה: האתר של החברה שלי"
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Project Description */}
            <div>
              <label className="block text-sm font-semibold mb-2">תיאור הפרויקט <span className="text-slate-400 font-normal">(אופציונלי)</span></label>
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="תאר בקצרה את מטרת הפרויקט..."
                rows={3}
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-semibold mb-4">בחר תבנית</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => setSelectedTemplate(template.id)}
                    className={`relative p-5 rounded-2xl border-2 text-center transition-all ${
                      selectedTemplate === template.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {selectedTemplate === template.id && (
                      <div className="absolute top-2.5 left-2.5">
                        <span className="material-icons text-primary text-[18px]">check_circle</span>
                      </div>
                    )}
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 ${
                      selectedTemplate === template.id
                        ? 'bg-primary/20'
                        : 'bg-slate-100 dark:bg-slate-700'
                    }`}>
                      <span className={`material-icons text-[22px] ${
                        selectedTemplate === template.id
                          ? 'text-primary'
                          : 'text-slate-400'
                      }`}>
                        {template.icon}
                      </span>
                    </div>
                    <p className="font-semibold text-sm">{template.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => navigate('/projects')}
                className="px-6 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
              >
                ביטול
              </button>
              <button
                type="submit"
                className="px-8 py-2.5 text-sm font-bold text-white bg-primary rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
              >
                <span className="material-icons text-[18px]">add</span>
                צור פרויקט
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateProject;
