# 📌 Column Freezing Feature

## Overview
Professional column freezing/pinning functionality that allows users to keep selected columns visible during horizontal scrolling. Users can freeze multiple columns simultaneously.

## Features

### ✅ What's Included:

1. **Pin/Unpin Columns:**
   - Pin icon button next to each column in the Customize Panel
   - Toggle between frozen and unfrozen states
   - Visual indicator (blue background) for frozen columns

2. **Smart Positioning:**
   - Frozen columns stack from left to right
   - Automatic position calculation based on column widths
   - Only visible columns are included in calculations
   - Checkbox column is always frozen by default

3. **Visual Design:**
   - Sticky positioning keeps frozen columns in place during scroll
   - Subtle shadow on the last frozen column for visual separation
   - Smooth transitions and hover effects
   - Works perfectly in both light and dark modes

4. **Multi-Column Support:**
   - Freeze as many columns as needed
   - Dynamic positioning adjusts automatically
   - No limit on number of frozen columns

## How to Use

### From User Interface:

1. **Open Customize Panel**
   - Click the "התאמה אישית של טבלה" button in the table header
   - The customize panel opens on the right side

2. **Choose Columns to Freeze**
   - Look for the pin icon (📌) next to each column name
   - Click the pin icon to freeze a column
   - The icon turns blue when the column is frozen

3. **Unfreeze Columns**
   - Click the blue pin icon again to unfreeze
   - The column will return to normal scrolling behavior

4. **Test Horizontal Scrolling**
   - Scroll the table horizontally
   - Frozen columns remain visible on the left side
   - Non-frozen columns scroll normally

## Technical Implementation

### State Management:
```tsx
const [frozenColumns, setFrozenColumns] = useState<string[]>(['checkbox']);
// checkbox is frozen by default
```

### Toggle Function:
```tsx
const toggleColumnFreeze = (column: string) => {
  setFrozenColumns(prev => {
    if (prev.includes(column)) {
      return prev.filter(col => col !== column);
    } else {
      return [...prev, column];
    }
  });
};
```

### Position Calculation:
```tsx
const getColumnLeftPosition = (columnKey: string): number => {
  const columnOrder = ['checkbox', 'name', 'email', 'status', 'address', 'lastActivity', 'firstJoined'];
  const frozenBeforeThis = columnOrder.slice(0, columnOrder.indexOf(columnKey))
    .filter(col => {
      if (col === 'checkbox') return true;
      return frozenColumns.includes(col) && visibleColumns[col];
    });

  let left = 0;
  frozenBeforeThis.forEach(col => {
    if (col === 'checkbox') left += 64;
    else if (col === 'name') left += 200;
    else if (col === 'email') left += 240;
    else if (col === 'status') left += 140;
    else if (col === 'address') left += 220;
    else if (col === 'lastActivity') left += 180;
    else if (col === 'firstJoined') left += 160;
  });
  return left;
};
```

### Last Frozen Column Detection:
```tsx
const isLastFrozenColumn = (columnKey: string): boolean => {
  const columnOrder = ['checkbox', 'name', 'email', 'status', 'address', 'lastActivity', 'firstJoined'];
  const visibleFrozenColumns = columnOrder.filter(col => {
    if (col === 'checkbox') return true;
    return frozenColumns.includes(col) && visibleColumns[col];
  });
  return visibleFrozenColumns[visibleFrozenColumns.length - 1] === columnKey;
};
```

### Sticky Positioning:
```tsx
// Applied to both th and td elements
<th
  className={`px-6 py-4 ${frozenColumns.includes('name') && isLastFrozenColumn('name') ? 'frozen-column-shadow' : ''}`}
  style={frozenColumns.includes('name') ? {
    position: 'sticky',
    left: `${getColumnLeftPosition('name')}px`,
    zIndex: 20, // 20 for headers, 10 for cells
    backgroundColor: 'inherit'
  } : {}}
>
  שם מלא
</th>
```

## Column Widths

The following widths are used for position calculation:
- **checkbox**: 64px
- **name**: 200px
- **email**: 240px
- **status**: 140px
- **address**: 220px
- **lastActivity**: 180px
- **firstJoined**: 160px

## UI Components

### Pin Button in Customize Panel:
- **Icon**: `push_pin` (Material Icons)
- **States**:
  - Unfrozen: Gray icon, hover effect
  - Frozen: Blue background, blue icon
- **Tooltip**: Shows "הקפא עמודה" or "בטל הקפאה"

### Visual Indicators:
- **Shadow**: Applied to last frozen column
- **z-index**: Headers at 20, cells at 10
- **Background**: Inherits from row background for seamless look

## CSS Styles

### Shadow Effect:
```css
.frozen-column-shadow {
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.1);
}

.dark .frozen-column-shadow {
  box-shadow: 2px 0 4px -2px rgba(0, 0, 0, 0.4);
}
```

## Smart Features

### Visibility Integration:
- Hidden columns don't affect frozen column positioning
- Only visible frozen columns are counted in calculations
- Unfreezing a hidden column has no visual effect

### Default Behavior:
- Checkbox column is always frozen by default
- Cannot be unfrozen (it's the selection column)
- Always positioned at left: 0

### Dynamic Calculations:
- Position recalculates when columns are shown/hidden
- Shadow moves to the new last frozen column
- Smooth transitions during changes

## User Experience

### Intuitive Controls:
- ✅ One-click freeze/unfreeze
- ✅ Visual feedback (blue highlight)
- ✅ Tooltip hints
- ✅ No page refresh needed

### Performance:
- ✅ CSS-only sticky positioning (no JavaScript scroll listeners)
- ✅ Efficient recalculation on state changes
- ✅ No performance impact on large tables

### Accessibility:
- ✅ Works with keyboard navigation
- ✅ Maintains table semantics
- ✅ Compatible with screen readers

## Examples

### Example 1: Freeze Name Column
1. Open Customize Panel
2. Click pin icon next to "שם מלא"
3. Name column stays visible when scrolling
4. Position: 64px from left (after checkbox)

### Example 2: Freeze Multiple Columns
1. Pin "שם מלא" (name)
2. Pin "אימייל" (email)
3. Pin "סטטוס" (status)
4. All three columns remain visible during scroll
5. Positions: name at 64px, email at 264px, status at 504px

### Example 3: Unfreeze All
1. Click pin icons to unpin all frozen columns
2. Only checkbox column remains frozen
3. All other columns scroll normally

## Files Modified

### `src/pages/Users.tsx`:
- Added `frozenColumns` state
- Added `toggleColumnFreeze()` function
- Added `getColumnLeftPosition()` function
- Added `isLastFrozenColumn()` function
- Updated Customize Panel with pin buttons
- Updated table headers with sticky positioning
- Updated table body cells with sticky positioning
- Updated skeleton loading cells with sticky positioning

### `src/index.css`:
- Added `.frozen-column-shadow` class
- Added dark mode variant

## Testing Checklist

- [x] Pin button toggles frozen state
- [x] Frozen columns stay visible during horizontal scroll
- [x] Position calculation is accurate
- [x] Multiple columns can be frozen
- [x] Last frozen column has shadow
- [x] Works with hidden columns
- [x] Works in dark mode
- [x] Visual feedback (blue highlight) works
- [x] Tooltip shows correct text
- [x] Checkbox column is always frozen
- [x] No console errors

## Future Enhancements

### Potential Additions:
1. **Drag-to-Reorder**
   - Allow dragging frozen columns to reorder them
   - Visual indicator during drag

2. **Freeze from Header**
   - Add pin button directly in column header
   - Quick access without opening Customize Panel

3. **Preset Configurations**
   - Save frozen column configurations
   - Quick presets: "Name only", "Name + Email", etc.

4. **Responsive Behavior**
   - Auto-unfreeze on mobile devices
   - Smart column selection for small screens

## 🎉 Result

Professional column freezing system with:
- Intuitive pin/unpin controls
- Accurate positioning
- Visual separation (shadow)
- Multi-column support
- Dark mode compatibility
- Zero performance impact
