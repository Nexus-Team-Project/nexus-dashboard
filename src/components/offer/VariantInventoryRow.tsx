/**
 * VariantInventoryRow: a single inventory unit row (+ its inline validity editor)
 * for VariantInventoryManagerModal. Presentational - selection, edit, and delete
 * are driven entirely by callbacks owned by the parent modal. The only write it
 * performs itself is the inline single-unit validity save (the parent handles the
 * list refresh via onSaved).
 */
import { Fragment } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '../../i18n/LanguageContext';
import { updateUnitValidity, type InventoryUnitView } from '../../lib/api';
import { cn } from '../../lib/utils';
import { formatDmy } from '../../lib/voucherValidity';
import InventoryValidityEditor from './InventoryValidityEditor';
import { EditIcon, TrashIcon } from './inventoryIcons';

/** Formats a unit's validity for display (limit duration / window / "set at purchase"). */
function useUnitValidityText() {
  const { t } = useLanguage();
  return (u: InventoryUnitView): string => {
    if (u.validFrom && u.validUntil) {
      return `⁦${formatDmy(u.validFrom)} - ${formatDmy(u.validUntil)}⁩`;
    }
    if (u.validityValue && u.validityUnit) {
      const unit = u.validityUnit === 'days' ? t('co_validityUnitDays') : u.validityUnit === 'months' ? t('co_validityUnitMonths') : t('co_validityUnitYears');
      return `${u.validityValue} ${unit}`;
    }
    return t('im_noWindowYet');
  };
}

interface UnitRowProps {
  unit: InventoryUnitView; defaultType: 'limit' | 'from_until';
  selected: boolean; onToggle: () => void;
  editing: boolean; onEditStart: () => void; onEditCancel: () => void; onSaved: () => void;
  onDelete: () => void; offerId: string; variantId: string;
}

export default function UnitRow({ unit, defaultType, selected, onToggle, editing, onEditStart, onEditCancel, onSaved, onDelete, offerId, variantId }: UnitRowProps) {
  const { t } = useLanguage();
  const validityText = useUnitValidityText();
  const statusLabel = unit.status === 'available' ? t('im_statusAvailable') : unit.status === 'assigned' ? t('im_statusAssigned') : t('im_statusRedeemed');
  return (
    <Fragment>
    <tr className={cn('border-t border-slate-100 dark:border-slate-800', editing && 'bg-primary/5 dark:bg-primary/10')}>
      <td className="p-2"><input type="checkbox" checked={selected} onChange={onToggle} className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary" /></td>
      <td className="p-2 text-start font-mono text-xs text-slate-700 dark:text-slate-200">{unit.value}</td>
      <td className="p-2 text-start text-slate-600 dark:text-slate-300">{validityText(unit)}</td>
      <td className="p-2 text-start text-slate-500 dark:text-slate-400">{statusLabel}</td>
      <td className="p-2 text-start text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDmy(unit.createdAt)}</td>
      <td className="p-2 text-start text-slate-400 dark:text-slate-500 text-xs whitespace-nowrap">{formatDmy(unit.updatedAt)}</td>
      <td className="p-2 text-end whitespace-nowrap">
        <button type="button" onClick={onEditStart} aria-pressed={editing}
          className={cn('inline-flex h-7 w-7 items-center justify-center rounded-md',
            editing ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-800')}><EditIcon /></button>
        <button type="button" onClick={onDelete} aria-label={t('im_delete')}
          className="ms-1 inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20"><TrashIcon /></button>
      </td>
    </tr>
    {editing && (
      <tr><td colSpan={7} className="p-0"><div className="px-2 pb-3">
        <InventoryValidityEditor defaultType={defaultType} unit={unit} onCancel={onEditCancel}
          onSave={async (patch) => { await updateUnitValidity(offerId, variantId, unit.codeId, patch); toast.success(t('im_toastUpdated').replace('{n}', '1')); onSaved(); }} />
      </div></td></tr>
    )}
    </Fragment>
  );
}
