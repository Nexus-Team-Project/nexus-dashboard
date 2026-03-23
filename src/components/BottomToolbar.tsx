import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevMode } from '../contexts/DevModeContext';

interface ToolbarButton {
  icon: string;
  label: string;
  onClick?: () => void;
}

const BottomToolbar = () => {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();

  // Border highlight effect — direct DOM, no re-renders
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
  }, []);

  const rightButtons: ToolbarButton[] = [
    { icon: 'manage_search', label: 'API Explorer' },
    { icon: 'warning_amber', label: 'Warnings' },
    { icon: 'swap_vert', label: 'Logs' },
    { icon: 'hub', label: 'Integrations' },
    { icon: 'tune', label: 'Settings' },
  ];

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 h-12 bg-[#edf1fc] flex items-center justify-between px-4 select-none transition-transform duration-300 ease-in-out border-highlight-top ${
        isDevMode ? 'translate-y-0' : 'translate-y-full'
      }`}
      onMouseMove={handleMouseMove}
    >
      {/* Left: Developers label */}
      <button
        onClick={() => navigate('/api-docs')}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors text-[12px] font-medium"
      >
        <span className="material-symbols-rounded !text-[16px]">terminal</span>
        <span>Developers</span>
      </button>

      {/* Right: icon buttons */}
      <div className="flex items-center gap-0.5">
        {rightButtons.map((btn) => (
          <button
            key={btn.icon}
            onClick={btn.onClick}
            title={btn.label}
            className="w-9 h-9 flex items-center justify-center rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-rounded !text-[17px]">{btn.icon}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BottomToolbar;
